import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';

/**
 * GET /api/heures/[id]
 * Récupère une entrée d'heure spécifique
 */
export async function GET(
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

    // Get heure
    const heure = await prisma.heure.findFirst({
      where: {
        id: params.id,
        client_id: payload.client_id,
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

    if (!heure) {
      return NextResponse.json(
        { error: 'Entrée non trouvée' },
        { status: 404 }
      );
    }

    // Check authorization (user can only see their own heures, or team leads/HR can see team heures)
    const isOwnEntry = heure.user_id === payload.id;
    const isTeamLead = payload.role === 'TEAM_LEAD';
    const isHR = payload.role === 'HR';

    if (!isOwnEntry && !isTeamLead && !isHR) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: heure,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/heures/[id] error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/heures/[id]
 * Modifie une entrée d'heure
 */
export async function PUT(
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

    // Get heure
    const heure = await prisma.heure.findFirst({
      where: {
        id: params.id,
        client_id: payload.client_id,
      },
    });

    if (!heure) {
      return NextResponse.json(
        { error: 'Entrée non trouvée' },
        { status: 404 }
      );
    }

    // Check authorization
    const isOwnEntry = heure.user_id === payload.id;
    if (!isOwnEntry) {
      return NextResponse.json(
        { error: 'Seul l\'auteur peut modifier cette entrée' },
        { status: 403 }
      );
    }

    // Can only modify PENDING entries
    if (heure.status !== 'PENDING' && heure.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Impossible de modifier une entrée ${heure.status}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { hours, type, notes, chantier_id } = body;

    // Validate hours if provided
    if (hours !== undefined && (hours <= 0 || hours > 24)) {
      return NextResponse.json(
        { error: 'Heures doit être entre 0 et 24' },
        { status: 400 }
      );
    }

    // Update heure
    const updatedHeure = await prisma.heure.update({
      where: { id: params.id },
      data: {
        ...(hours !== undefined && { hours: parseFloat(hours.toString()) }),
        ...(type && { type }),
        ...(notes !== undefined && { notes }),
        ...(chantier_id && { chantier_id }),
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

    return NextResponse.json(
      {
        success: true,
        data: updatedHeure,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/heures/[id] error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/heures/[id]
 * Supprime une entrée d'heure
 */
export async function DELETE(
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

    // Get heure
    const heure = await prisma.heure.findFirst({
      where: {
        id: params.id,
        client_id: payload.client_id,
      },
    });

    if (!heure) {
      return NextResponse.json(
        { error: 'Entrée non trouvée' },
        { status: 404 }
      );
    }

    // Check authorization
    const isOwnEntry = heure.user_id === payload.id;
    if (!isOwnEntry) {
      return NextResponse.json(
        { error: 'Seul l\'auteur peut supprimer cette entrée' },
        { status: 403 }
      );
    }

    // Can only delete PENDING or DRAFT entries
    if (heure.status !== 'PENDING' && heure.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Impossible de supprimer une entrée ${heure.status}` },
        { status: 400 }
      );
    }

    // Delete heure
    await prisma.heure.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Entrée supprimée',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/heures/[id] error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
