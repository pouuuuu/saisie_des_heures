import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';

/**
 * GET /api/equipe
 * Récupère l'équipe du chef de chantier authentifié
 * Retourne les utilisateurs + leurs heures du mois courant
 */
export async function GET(request: NextRequest) {
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

    // Get team members
    let teamMembers;

    if (payload.role === 'TEAM_LEAD') {
      // Team lead sees their own team
      const currentUser = await prisma.user.findUnique({
        where: { id: payload.id },
      });

      if (!currentUser?.team_id) {
        return NextResponse.json(
          {
            success: true,
            data: [],
          },
          { status: 200 }
        );
      }

      teamMembers = await prisma.user.findMany({
        where: {
          team_id: currentUser.team_id,
          active: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
    } else {
      // HR sees all team members
      teamMembers = await prisma.user.findMany({
        where: {
          client_id: payload.client_id,
          role: 'WORKER',
          active: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
    }

    // Get current month start and end
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get heures for each team member this month
    const teamWithHeures = await Promise.all(
      teamMembers.map(async (member) => {
        const heures = await prisma.heure.findMany({
          where: {
            user_id: member.id,
            client_id: payload.client_id,
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          select: {
            id: true,
            date: true,
            hours: true,
            status: true,
            type: true,
            chantier: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        });

        return {
          ...member,
          heures,
          totalHours: heures.reduce((sum, h) => sum + Number(h.hours), 0),
          pendingCount: heures.filter((h) => h.status === 'PENDING').length,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: teamWithHeures,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/equipe error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
