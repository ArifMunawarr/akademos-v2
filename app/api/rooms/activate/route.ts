import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const claims = await getAuthFromRequest(req);
    if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (claims.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { joinKey, active } = await req.json();
    if (!joinKey || typeof active !== 'boolean') {
      return NextResponse.json({ error: 'joinKey and active(boolean) are required' }, { status: 400 });
    }

    const room = db
      .prepare('SELECT id, created_by as createdBy FROM rooms WHERE join_key = ?')
      .get(joinKey) as { id: number; createdBy: number } | undefined;

    if (!room) return NextResponse.json({ error: 'Invalid join key' }, { status: 404 });
    if (String(room.createdBy) !== String(claims.sub)) {
      return NextResponse.json({ error: 'Not owner of this room' }, { status: 403 });
    }

    const stmt = db.prepare('UPDATE rooms SET is_active = ? WHERE id = ?');
    stmt.run(active ? 1 : 0, room.id);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal Server Error' }, { status: 500 });
  }
}
