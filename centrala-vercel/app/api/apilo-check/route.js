import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.APILO_CLIENT_ID;
  const clientSecret = process.env.APILO_CLIENT_SECRET;
  const baseUrl = process.env.APILO_BASE_URL;

  return NextResponse.json({
    baseUrl,
    clientId,
    clientSecretLength: clientSecret?.length,
    clientSecretStart: clientSecret?.substring(0, 8),
    clientSecretEnd: clientSecret?.substring(clientSecret.length - 4)
  });
}
