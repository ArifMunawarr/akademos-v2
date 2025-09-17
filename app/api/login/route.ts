// app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signAuthToken } from '@/lib/auth';

// Define the structure of a user record from the database
interface User {
  id: number;
  username: string;
  password: string;
  role: 'teacher' | 'student';
}

export async function POST(req: NextRequest) {
  try {
    const start = Date.now();
    const url = req.nextUrl;
    const forwardedProto = req.headers.get('x-forwarded-proto');
    const forwardedFor = req.headers.get('x-forwarded-for');
    const userAgent = req.headers.get('user-agent');
    console.log('[LOGIN][START]', {
      time: new Date().toISOString(),
      method: 'POST',
      url: url.toString(),
      pathname: url.pathname,
      protocol: url.protocol,
      forwardedProto,
      forwardedFor,
      userAgent,
      nodeEnv: process.env.NODE_ENV,
    });

    const { username, password } = await req.json();
    console.log('[LOGIN] Body received', {
      hasUsername: Boolean(username),
      hasPassword: Boolean(password), // do not log actual password
    });

    if (!username || !password) {
      console.warn('[LOGIN][ABORT] Missing username or password');
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find the user in the database
    console.log('[LOGIN] Querying user from DB', { username });
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as User | undefined;
    console.log('[LOGIN] DB lookup result', { found: Boolean(user) });

    if (!user) {
      console.warn('[LOGIN][ABORT] Invalid credentials - user not found');
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare the provided password with the stored hash
    console.log('[LOGIN] Comparing password hash');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('[LOGIN] Password comparison result', { valid: isPasswordValid });

    if (!isPasswordValid) {
      console.warn('[LOGIN][ABORT] Invalid credentials - wrong password');
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Issue JWT and set as HttpOnly cookie
    console.log('[LOGIN] Credentials valid, issuing token');
    const token = await signAuthToken({ sub: String(user.id), role: user.role }, '1d');

    const res = NextResponse.json({ role: user.role }, { status: 200 });

    // Determine whether to set the cookie as Secure
    // - If COOKIE_SECURE is explicitly set, use that ("true"/"false")
    // - Else, in production use Secure only when the request is actually HTTPS
    //   (checks x-forwarded-proto for proxies and nextUrl.protocol as fallback)
    const cookieSecureEnv = process.env.COOKIE_SECURE;
    const isHttps = (forwardedProto?.includes('https')) || req.nextUrl.protocol === 'https:';
    const defaultSecure = process.env.NODE_ENV === 'production' ? isHttps : false;
    const cookieSecure = typeof cookieSecureEnv === 'string' ? cookieSecureEnv === 'true' : defaultSecure;

    console.log('[LOGIN] Cookie flags computed', {
      cookieSecureEnv,
      forwardedProto,
      protocol: req.nextUrl.protocol,
      isHttps,
      defaultSecure,
      cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAgeSeconds: 60 * 60 * 24,
    });

    res.cookies.set('token', token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    console.log('[LOGIN][SUCCESS]', {
      userId: user.id,
      role: user.role,
      durationMs: Date.now() - start,
    });

    return res;
  } catch (error) {
    console.error('[LOGIN][ERROR]', {
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    return NextResponse.json(
      { message: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
