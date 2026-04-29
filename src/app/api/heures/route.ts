import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';
import type { CreateHeureRequest } from '@/types';

interface CreateHeureRequestWithUser extends CreateHeureRequest {
  user_id?: string;
}

/**
 * GET /api/heures
 * Récupère les heures de l'utilisateur authentifié
 * Query params: ?page=1&pageSize=20&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {
      user_id: payload.id,
      client_id: payload.client_id,
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
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
    console.error('GET /api/heures error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/heures
 * Crée une nouvelle entrée d'heures
 * Les chefs/RH peuvent créer des heures pour leurs ouvriers en passant user_id
 */
export async function POST(request: NextRequest) {
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

    const body: CreateHeureRequestWithUser = await request.json();
    let { chantier_id, date, hours, type, notes, user_id } = body;

    // If user_id is provided, verify that the authenticated user can create for this user
    if (user_id) {
      // Only TEAM_LEAD and HR can create for others
      if (payload.role !== 'TEAM_LEAD' && payload.role !== 'HR') {
        return NextResponse.json(
          { error: 'Seuls les chefs et RH peuvent créer des heures pour d\'autres' },
          { status: 403 }
        );
      }

      // Verify that the target user exists and belongs to the same client
      const targetUser = await prisma.user.findFirst({
        where: {
          id: user_id,
          client_id: payload.client_id,
        },
      });

      if (!targetUser) {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        );
      }

      // For TEAM_LEAD, verify the user is in their team
      if (payload.role === 'TEAM_LEAD') {
        const currentUser = await prisma.user.findUnique({
          where: { id: payload.id },
        });

        if (currentUser?.team_id !== targetUser.team_id) {
          return NextResponse.json(
            { error: 'Vous ne pouvez créer des heures que pour votre équipe' },
            { status: 403 }
          );
        }
      }
    } else {
      // If no user_id provided, use the authenticated user
      user_id = payload.id;
    }

    // Validation
    if (!chantier_id || !date || !hours || !type) {
      return NextResponse.json(
        { error: 'Champs requis: chantier_id, date, hours, type' },
        { status: 400 }
      );
    }

    if (hours <= 0 || hours > 24) {
      return NextResponse.json(
        { error: 'Heures doit être entre 0 et 24' },
        { status: 400 }
      );
    }

    // Verify chantier belongs to user's client
    const chantier = await prisma.chantier.findFirst({
      where: {
        id: chantier_id,
        client_id: payload.client_id,
      },
    });

    if (!chantier) {
      return NextResponse.json(
        { error: 'Chantier non trouvé' },
        { status: 404 }
      );
    }

    // Check for duplicate entry (same user, same chantier, same day)
    const existingHeure = await prisma.heure.findUnique({
      where: {
        user_id_chantier_id_date: {
          user_id: payload.id,
          chantier_id,
          date: new Date(date),
        },
      },
    });

    if (existingHeure) {
      return NextResponse.json(
        { error: 'Une entrée existe déjà pour ce jour et ce chantier' },
        { status: 409 }
      );
    }

    // Create heure
    const heure = await prisma.heure.create({
      data: {
        user_id: payload.id,
        client_id: payload.client_id,
        chantier_id,
        date: new Date(date),
        hours: parseFloat(hours.toString()),
        type,
        notes,
        status: 'PENDING',
        created_by: payload.id,
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
        data: heure,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/heures error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
