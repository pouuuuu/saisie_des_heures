import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';

/**
 * GET /api/equipe/workers
 * Récupère la liste des ouvriers que l'utilisateur peut superviser
 * Pour TEAM_LEAD: ouvriers de son équipe
 * Pour HR: tous les ouvriers
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

    let workers;

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

      workers = await prisma.user.findMany({
        where: {
          team_id: currentUser.team_id,
          active: true,
          role: 'WORKER',
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    } else {
      // HR sees all workers
      workers = await prisma.user.findMany({
        where: {
          client_id: payload.client_id,
          role: 'WORKER',
          active: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: workers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/equipe/workers error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
