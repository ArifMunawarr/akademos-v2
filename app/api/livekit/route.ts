import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { db } from '@/lib/db';
import type { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { joinKey, userName } = await req.json();

    if (!joinKey || !userName) {
      return NextResponse.json({ error: 'joinKey and userName are required' }, { status: 400 });
    }

    // Authenticate user
    const claims = await getAuthFromRequest(req);
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve room by joinKey
    const room = db
      .prepare(
        `SELECT id, room_name as roomName, created_by as createdBy, is_active as isActive
         FROM rooms WHERE join_key = ?`
      )
      .get(joinKey) as { id: number; roomName: string; createdBy: number; isActive: number } | undefined;

    if (!room) {
      return NextResponse.json({ error: 'Invalid join key' }, { status: 404 });
    }

    // Authorization rules
    if (claims.role === 'teacher') {
      // Teacher may only start/join rooms they created
      if (String(room.createdBy) !== String(claims.sub)) {
        return NextResponse.json({ error: 'Not allowed to start this room' }, { status: 403 });
      }
    } else if (claims.role === 'student') {
      // Students can only join active rooms
      if (!room.isActive) {
        return NextResponse.json({ error: 'Class is not active' }, { status: 403 });
      }
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET' }, { status: 500 });
    }

    if (!wsUrl) {
      return NextResponse.json({ error: 'Missing NEXT_PUBLIC_LIVEKIT_URL or LIVEKIT_URL' }, { status: 500 });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: String(userName),
      name: String(userName),
      ttl: 60 * 60, // 1 hour
    });

    at.addGrant({
      roomJoin: true,
      room: String(room.roomName),
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({ token, roomName: room.roomName });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}