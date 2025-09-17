import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

function generateJoinKey() {
  // Short alphanumeric key (A–Z, 0–9), 8 chars, uppercase
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // remove ambiguous chars: I, O, 0, 1
  const len = 8;
  let key = '';
  for (let i = 0; i < len; i++) {
    key += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return key;
}

export async function POST(req: NextRequest) {
  try {
    const claims = await getAuthFromRequest(req);
    if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (claims.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { className, teacherName } = await req.json();
    if (!className || !teacherName) {
      return NextResponse.json({ error: 'className and teacherName are required' }, { status: 400 });
    }

    // Room name can be a slug with creator id to ensure uniqueness
    const base = `${className}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let roomName = `${base}-${claims.sub}`;

    // Ensure unique room_name
    let suffix = 1;
    while (db.prepare('SELECT 1 FROM rooms WHERE room_name = ?').get(roomName)) {
      suffix += 1;
      roomName = `${base}-${claims.sub}-${suffix}`;
    }

    // Generate unique join key
    let joinKey = generateJoinKey();
    while (db.prepare('SELECT 1 FROM rooms WHERE join_key = ?').get(joinKey)) {
      joinKey = generateJoinKey();
    }

    const stmt = db.prepare(
      'INSERT INTO rooms (room_name, join_key, created_by, is_active) VALUES (?, ?, ?, 0)'
    );
    const res = stmt.run(roomName, joinKey, Number(claims.sub));

    return NextResponse.json({ id: Number(res.lastInsertRowid), roomName, joinKey });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal Server Error' }, { status: 500 });
  }
}
