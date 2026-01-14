import { NextResponse } from 'next/server';
import { initDatabase, getWeather, getWeatherForecast } from '../../../lib/db';

export async function GET() {
  try {
    await initDatabase();

    const weather = await getWeather();
    const forecast = await getWeatherForecast();

    return NextResponse.json({
      success: true,
      weather,
      forecast
    });
  } catch (error) {
    console.error('Get weather error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
