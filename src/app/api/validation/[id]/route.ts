import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';

/**
 * PATCH /api/validation/[id]
 * Approuve ou rejette une entrée d'heures
 * Body: { action: 'approve' | 'reject', notes?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify token
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }

    // Check if user is TEAM_LEAD or HR
    if (payload.role !== 'TEAM_LEAD' && payload.role !== 'HR') {
      return NextResponse.json(
        { error: 'Accès réservé aux chefs et RH' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, notes } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action requise: approve ou reject' },
        { status: 400 }
      );
    }

    // Get heure
    const heure = await prisma.heure.findFirst({
      where: {
        id: params.id,
        client_id: payload.client_id,
        status: 'PENDING',
      },
      include: {
        user: true,
        chantier: true,
      },
    });

    if (!heure) {
      return NextResponse.json(
        { error: 'Entrée non trouvée ou déjà traitée' },
        { status: 404 }
      );
    }

    // If TEAM_LEAD, verify user is in their team
    if (payload.role === 'TEAM_LEAD') {
      const currentUser = await prisma.user.findUnique({
        where: { id: payload.id },
      });

      // Check if heure user is in the team lead's team
      const heureUser = await prisma.user.findUnique({
        where: { id: heure.user_id },
      });

      if (currentUser?.team_id !== heureUser?.team_id) {
        return NextResponse.json(
          { error: 'Vous ne pouvez valider que les heures de votre équipe' },
          { status: 403 }
        );
      }
    }

    // Update heure status
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const updatedHeure = await prisma.heure.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        notes: notes ? (heure.notes ? `${heure.notes}\n---\n${notes}` : notes) : heure.notes,
      },
      include: {
        chantier: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        client_id: payload.client_id,
        user_id: payload.id,
        action: newStatus === 'APPROVED' ? 'APPROVE' : 'REJECT',
        resource: 'HEURE',
        resource_id: params.id,
        changes: {
          status: {
            from: 'PENDING',
            to: newStatus,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedHeure,
        message: `Entrée ${newStatus === 'APPROVED' ? 'approuvée' : 'rejetée'}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH /api/validation/[id] error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
