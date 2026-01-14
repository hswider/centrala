import { NextResponse } from 'next/server';
import { initDatabase, saveWeather, saveWeatherForecast } from '../../../../lib/db';

// Countries with their capitals and coordinates
const COUNTRIES = [
  { code: 'PL', name: 'Polska', city: 'Warszawa', lat: 52.23, lon: 21.01 },
  { code: 'DE', name: 'Niemcy', city: 'Berlin', lat: 52.52, lon: 13.41 },
  { code: 'FR', name: 'Francja', city: 'Paryż', lat: 48.85, lon: 2.35 },
  { code: 'IT', name: 'Włochy', city: 'Rzym', lat: 41.90, lon: 12.50 },
  { code: 'ES', name: 'Hiszpania', city: 'Madryt', lat: 40.42, lon: -3.70 },
  { code: 'BE', name: 'Belgia', city: 'Bruksela', lat: 50.85, lon: 4.35 },
  { code: 'NL', name: 'Holandia', city: 'Amsterdam', lat: 52.37, lon: 4.90 },
  { code: 'SE', name: 'Szwecja', city: 'Sztokholm', lat: 59.33, lon: 18.07 },
];

export async function GET(request) {
  return handleSync(request);
}

export async function POST(request) {
  return handleSync(request);
}

async function handleSync(request) {
  try {
    await initDatabase();

    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const results = [];
    const forecastResults = [];
    const errors = [];

    for (const country of COUNTRIES) {
      try {
        // Use Open-Meteo API (free, no API key required)
        // Fetch current weather and 14-day forecast
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${country.lat}&longitude=${country.lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Europe%2FWarsaw&forecast_days=14`;

        const response = await fetch(url);
        const data = await response.json();

        // Save current weather
        if (data.current) {
          const temperature = data.current.temperature_2m;
          const weatherCode = data.current.weather_code;

          await saveWeather(
            country.code,
            country.name,
            country.city,
            temperature,
            weatherCode
          );

          results.push({
            country: country.name,
            city: country.city,
            temperature,
            weatherCode
          });
        }

        // Save 14-day forecast
        if (data.daily && data.daily.time) {
          for (let i = 0; i < data.daily.time.length; i++) {
            await saveWeatherForecast(
              country.code,
              data.daily.time[i],
              data.daily.temperature_2m_max[i],
              data.daily.temperature_2m_min[i],
              data.daily.weather_code[i]
            );
          }
          forecastResults.push({
            country: country.name,
            days: data.daily.time.length
          });
        }
      } catch (err) {
        errors.push(`${country.name}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      synced: results.length,
      results,
      forecast: forecastResults,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Weather sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
