import { SignJWT, jwtVerify } from 'jose';
import { jwtDecode } from 'jose';
import { JWTPayload, User } from '@/types';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-key-32-chars-minimum-12345');
const refreshSecret = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key-32-chars-minimum'
);

/**
 * Sign an access token (short-lived)
 */
export async function signAccessToken(user: User): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    client_id: user.client_id,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '15m')
    .sign(secret);

  return token;
}

/**
 * Sign a refresh token (long-lived)
 */
export async function signRefreshToken(userId: string): Promise<string> {
  const token = await new SignJWT({ id: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRES_IN || '7d')
    .sign(refreshSecret);

  return token;
}

/**
 * Verify an access token
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as JWTPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Verify a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<{ id: string } | null> {
  try {
    const verified = await jwtVerify(token, refreshSecret);
    return verified.payload as { id: string };
  } catch (err) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}
