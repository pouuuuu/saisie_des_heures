import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signAccessToken, signRefreshToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      include: { client: true },
    });

    if (!user || !user.active) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = await signAccessToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      client_id: user.client_id,
      active: user.active,
      created_at: user.created_at,
    });

    const refreshToken = await signRefreshToken(user.id);

    // Save refresh token to DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: refreshToken,
        expires_at: expiresAt,
      },
    });

    // Return response with httpOnly cookie
    const response = NextResponse.json(
      {
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          client_id: user.client_id,
        },
      },
      { status: 200 }
    );

    // Set cookies (httpOnly for refresh token, regular for access)
    response.cookies.set('accessToken', accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
