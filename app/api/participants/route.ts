import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const participants = db.prepare('SELECT * FROM participants').all();
    return NextResponse.json(participants);
  } catch (error) {
    console.error('Failed to fetch participants:', error);
    return NextResponse.json({ message: 'Failed to fetch participants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { nama, ipaddres, status } = await request.json();
    if (!nama || !ipaddres || !status) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const insert = db.prepare(
      'INSERT INTO participants (nama, ipaddres, status) VALUES (?, ?, ?)'
    );
    const result = insert.run(nama, ipaddres, status);

    return NextResponse.json({ message: 'Participant added', id: result.lastInsertRowid }, { status: 201 });
  } catch (error) {
    console.error('Failed to add participant:', error);
    return NextResponse.json({ message: 'Failed to add participant' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ipaddres, status } = await request.json();
    if (!id || !ipaddres || !status) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const update = db.prepare(
      'UPDATE participants SET ipaddres = ?, status = ? WHERE id = ?'
    );
    const result = update.run(ipaddres, status, id);

    if (result.changes === 0) {
      return NextResponse.json({ message: 'Participant not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Participant updated' });
  } catch (error) {
    console.error('Failed to update participant:', error);
    return NextResponse.json({ message: 'Failed to update participant' }, { status: 500 });
  }
}
