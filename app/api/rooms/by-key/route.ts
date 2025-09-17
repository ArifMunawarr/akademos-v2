import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const claims = await getAuthFromRequest(req);
    if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { joinKey } = await req.json();
    if (!joinKey) return NextResponse.json({ error: 'joinKey is required' }, { status: 400 });

    const room = db
      .prepare(
        `SELECT id, room_name as roomName, created_by as createdBy, is_active as isActive, created_at as createdAt
         FROM rooms WHERE join_key = ?`
      )
      .get(joinKey) as { id: number; roomName: string; createdBy: number; isActive: number; createdAt: string } | undefined;

    if (!room) return NextResponse.json({ error: 'Invalid join key' }, { status: 404 });

    return NextResponse.json(room);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal Server Error' }, { status: 500 });
  }
}
