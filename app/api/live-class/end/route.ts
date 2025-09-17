import { NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { roomName } = await req.json();

    if (!roomName) {
      return NextResponse.json({ error: 'roomName is required' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const host = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !host) {
      return NextResponse.json({ error: 'LiveKit server environment variables are not configured' }, { status: 500 });
    }

    const roomService = new RoomServiceClient(host, apiKey, apiSecret);

    // Try to remove participants; ignore room not found error
    try {
      const participants = await roomService.listParticipants(roomName);
      await Promise.all(participants.map(p => roomService.removeParticipant(roomName, p.identity)));
    } catch (err: any) {
      if (!String(err?.message || '').includes('room not found')) {
        // Other errors should bubble up
        throw err;
      }
    }

    // Mark room inactive in DB
    try {
      db.prepare('UPDATE rooms SET is_active = 0 WHERE room_name = ?').run(roomName);
    } catch {}

    return NextResponse.json({ success: true, message: `Class '${roomName}' ended for all participants.` });

  } catch (err: any) {
    // If the room doesn't exist, listParticipants throws an error. We can treat this as a success.
    if (err.message?.includes('room not found')) {
      try { db.prepare('UPDATE rooms SET is_active = 0 WHERE room_name = ?').run(String((await req.json())?.roomName)); } catch {}
      return NextResponse.json({ success: true, message: 'Room already closed.' });
    }
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
