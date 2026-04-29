import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';

/**
 * GET /api/validation
 * Récupère les heures en attente de validation
 * Pour les chefs: heures de leur équipe
 * Pour RH: toutes les heures en attente
 * Query params: ?page=1&pageSize=20&weekOf=YYYY-MM-DD
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const weekOf = searchParams.get('weekOf');

    const skip = (page - 1) * pageSize;

    // Build where clause
    let where: any = {
      status: 'PENDING',
      client_id: payload.client_id,
    };

    // If weekOf is provided, filter by week
    if (weekOf) {
      const date = new Date(weekOf);
      const dayOfWeek = date.getDay();
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - dayOfWeek);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      where.date = {
        gte: weekStart,
        lte: weekEnd,
      };
    }

    // If TEAM_LEAD, filter by team
    if (payload.role === 'TEAM_LEAD') {
      const currentUser = await prisma.user.findUnique({
        where: { id: payload.id },
      });

      if (currentUser?.team_id) {
        // Get team members
        const teamMembers = await prisma.user.findMany({
          where: {
            team_id: currentUser.team_id,
          },
          select: { id: true },
        });

        const memberIds = teamMembers.map((m) => m.id);
        where.user_id = { in: memberIds };
      } else {
        // No team, return empty
        return NextResponse.json(
          {
            success: true,
            data: [],
            total: 0,
            page,
            pageSize,
            hasMore: false,
          },
          { status: 200 }
        );
      }
    }

    // Get total count
    const total = await prisma.heure.count({ where });

    // Get heures
    const heures = await prisma.heure.findMany({
      where,
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
      orderBy: {
        date: 'desc',
      },
      skip,
      take: pageSize,
    });

    const hasMore = skip + pageSize < total;

    return NextResponse.json(
      {
        success: true,
        data: heures,
        total,
        page,
        pageSize,
        hasMore,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/validation error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
