import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Compute status based on updated_time within last 30 minutes (UTC)
    const participants = db
      .prepare(
        `SELECT 
           id,
           'PC' || id AS nama,
           ipaddres,
           updated_time,
           CASE 
             WHEN datetime(updated_time) >= datetime('now', '-30 minutes') THEN 'online'
             ELSE 'offline'
           END AS status
         FROM participants`
      )
      .all();
    return NextResponse.json(participants);
  } catch (error) {
    console.error('Failed to fetch participants:', error);
    return NextResponse.json({ message: 'Failed to fetch participants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ipaddres } = body as { ipaddres?: string };

    if (!ipaddres) {
      return NextResponse.json({ message: 'Missing required field: ipaddres' }, { status: 400 });
    }

    // If IP exists, only refresh updated_time (UTC)
    const existing = db.prepare('SELECT id FROM participants WHERE ipaddres = ?').get(ipaddres) as { id: number } | undefined;

    if (existing) {
      const upd = db.prepare("UPDATE participants SET updated_time = datetime('now') WHERE id = ?");
      upd.run(existing.id);
      return NextResponse.json({ message: 'Participant updated_time refreshed', id: existing.id }, { status: 200 });
    }

    // Insert new participant. Name will be displayed as PC{id} by GET, so store a placeholder
    try {
      const insert = db.prepare(
        "INSERT INTO participants (nama, ipaddres, status, updated_time) VALUES (?, ?, ?, datetime('now'))"
      );
      const result = insert.run('PC', ipaddres, 'online');

      return NextResponse.json(
        { message: 'Participant created', id: Number(result.lastInsertRowid) },
        { status: 201 }
      );
    } catch (e: any) {
      // If UNIQUE index on ipaddres caused a race, fall back to refresh logic
      if (e && String(e.code) === 'SQLITE_CONSTRAINT') {
        const row = db.prepare('SELECT id FROM participants WHERE ipaddres = ?').get(ipaddres) as { id: number } | undefined;
        if (row) {
          const upd = db.prepare("UPDATE participants SET updated_time = datetime('now') WHERE id = ?");
          upd.run(row.id);
          return NextResponse.json({ message: 'Participant updated_time refreshed', id: row.id }, { status: 200 });
        }
      }
      throw e;
    }
  } catch (error) {
    console.error('Failed to upsert participant by IP:', error);
    return NextResponse.json({ message: 'Failed to process participant' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ipaddres, newIp, status } = body as { id?: number; ipaddres?: string; newIp?: string; status?: 'online' | 'offline' };

    // Refresh by id or ip
    if (!id && !ipaddres) {
      return NextResponse.json({ message: 'Provide id or ipaddres to update' }, { status: 400 });
    }

    if (id) {
      // Optional: update ip and/or status explicitly, but always refresh updated_time (UTC)
      const stmt = db.prepare(
        "UPDATE participants SET ipaddres = COALESCE(?, ipaddres), status = COALESCE(?, status), updated_time = datetime('now') WHERE id = ?"
      );
      const res = stmt.run(newIp ?? null, status ?? null, id);
      if (res.changes === 0) return NextResponse.json({ message: 'Participant not found' }, { status: 404 });
      return NextResponse.json({ message: 'Participant updated' });
    }

    // Update by current IP
    if (ipaddres) {
      const stmt = db.prepare(
        "UPDATE participants SET ipaddres = COALESCE(?, ipaddres), status = COALESCE(?, status), updated_time = datetime('now') WHERE ipaddres = ?"
      );
      const res = stmt.run(newIp ?? null, status ?? null, ipaddres);
      if (res.changes === 0) return NextResponse.json({ message: 'Participant not found' }, { status: 404 });
      return NextResponse.json({ message: 'Participant updated' });
    }

    return NextResponse.json({ message: 'No changes applied' });
  } catch (error) {
    console.error('Failed to update participant:', error);
    return NextResponse.json({ message: 'Failed to update participant' }, { status: 500 });
  }
}
