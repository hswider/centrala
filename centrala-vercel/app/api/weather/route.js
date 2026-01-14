import { NextResponse } from 'next/server';
import { initDatabase, getWeather } from '../../../lib/db';

export async function GET() {
  try {
    await initDatabase();

    const weather = await getWeather();

    return NextResponse.json({
      success: true,
      weather
    });
  } catch (error) {
    console.error('Get weather error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
