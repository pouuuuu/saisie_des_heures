import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';

const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes: allow without auth
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Protected routes: check token
  // Try to get token from cookies first, then from Authorization header
  let accessToken = request.cookies.get('accessToken')?.value;

  if (!accessToken) {
    const authHeader = request.headers.get('Authorization');
    accessToken = extractTokenFromHeader(authHeader) || undefined;
  }

  if (!accessToken) {
    // If trying to access API route, return 401
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If trying to access app route, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  const payload = await verifyAccessToken(accessToken);

  if (!payload) {
    // Token expired or invalid
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Attach user info to request headers for use in route handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.id);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-client', payload.client_id);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Include all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
