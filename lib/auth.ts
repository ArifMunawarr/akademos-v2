import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export type UserRole = 'teacher' | 'student';

export interface AuthClaims extends JWTPayload {
  sub: string; // user id as string
  role: UserRole;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: AuthClaims, expiresIn = '1d'): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const expSeconds = parseExpiry(expiresIn);
  const token = await new SignJWT({ ...payload, iat })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(iat)
    .setExpirationTime(iat + expSeconds)
    .sign(getSecretKey());
  return token;
}

export async function verifyAuthToken(token: string): Promise<AuthClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256'],
    });
    // Basic shape check
    if (!payload || typeof payload.sub !== 'string' || typeof payload.role !== 'string') {
      return null;
    }
    return payload as AuthClaims;
  } catch {
    return null;
  }
}

export async function getAuthFromRequest(req: NextRequest): Promise<AuthClaims | null> {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}

export async function getAuthFromCookies(): Promise<AuthClaims | null> {
  const store = await cookies();
  const token = store.get('token')?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}

function parseExpiry(input: string): number {
  // Supports formats like '1d', '12h', '30m', '60s'
  const match = input.match(/^(\d+)([smhd])$/);
  if (!match) return 60 * 60 * 24; // default 1 day
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 60 * 60 * 24;
  }
}
