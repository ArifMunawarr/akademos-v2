import { NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';

export async function POST(req: Request) {
  try {
    const { roomName, identity } = await req.json();

    if (!roomName || !identity) {
      return NextResponse.json({ error: 'roomName and identity are required' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const host = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !host) {
      return NextResponse.json({ error: 'LiveKit server environment variables are not configured' }, { status: 500 });
    }

    const roomService = new RoomServiceClient(host, apiKey, apiSecret);

    await roomService.removeParticipant(roomName, identity);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
