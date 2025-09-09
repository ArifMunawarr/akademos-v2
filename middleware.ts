import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // Allow public assets and api routes to pass unless they are specifically matched
  // by config.matcher. We rely on matcher for targeting.

  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  const claims = await verifyAuthToken(token);
  if (!claims) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  // Role based access
  if (pathname.startsWith('/teacher') && claims.role !== 'teacher') {
    return NextResponse.redirect(new URL('/login', origin));
  }
  if (pathname.startsWith('/student') && claims.role !== 'student') {
    return NextResponse.redirect(new URL('/login', origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/teacher/:path*', '/student/:path*'],
};
