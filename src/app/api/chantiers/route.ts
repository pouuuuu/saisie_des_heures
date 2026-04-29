import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';

/**
 * GET /api/chantiers
 * Récupère tous les chantiers actifs du client de l'utilisateur
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
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Get chantiers
    const chantiers = await prisma.chantier.findMany({
      where: {
        client_id: payload.client_id,
        ...(includeInactive ? {} : { active: true }),
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: chantiers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/chantiers error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
