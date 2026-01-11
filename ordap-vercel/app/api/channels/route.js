import { NextResponse } from 'next/server';
import { getChannels, initDatabase } from '@/lib/db';

export async function GET() {
  try {
    await initDatabase();
    const channels = await getChannels();

    return NextResponse.json({ channels });
  } catch (error) {
    console.error('[API] Error fetching channels:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
