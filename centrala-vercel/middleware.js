import { NextResponse } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
  '/login',
  '/api/auth',
  '/api/sync',           // Cron job
  '/api/sync-historical', // Historical sync
  '/api/init-users',     // User initialization
  '/api/fix-hswider',    // Fix hswider permissions
  '/api/allegro/sync',   // Allegro Dobrelegowiska messages cron
  '/api/allegro/debug',  // Allegro debug
  '/api/allegro-meblebox/sync',   // Allegro Meblebox messages cron
  '/api/allegro-meblebox/callback', // Allegro Meblebox OAuth callback
  '/api/gmail/sync',     // Gmail (Shopify) messages cron
  '/api/gmail/callback', // Gmail OAuth callback
  '/api/gmail-amazon-de/auth',    // Gmail Amazon DE auth
  '/api/gmail-amazon-de/sync',    // Gmail Amazon DE messages cron
  '/api/gmail-amazon-de/callback', // Gmail Amazon DE OAuth callback
  '/api/gmail-amazon-de/debug',   // Gmail Amazon DE debug
  '/api/gmail-poomfurniture/auth',    // Gmail poom-furniture.com auth
  '/api/gmail-poomfurniture/sync',    // Gmail poom-furniture.com messages cron
  '/api/gmail-poomfurniture/callback', // Gmail poom-furniture.com OAuth callback
  '/api/gmail-poomkids/auth',     // Gmail POOMKIDS auth
  '/api/gmail-poomkids/sync',     // Gmail POOMKIDS messages cron
  '/api/gmail-poomkids/callback', // Gmail POOMKIDS OAuth callback
  '/api/gmail-allepoduszki/auth', // Gmail Allepoduszki auth
  '/api/gmail-allepoduszki/sync', // Gmail Allepoduszki messages cron
  '/api/gmail-allepoduszki/callback', // Gmail Allepoduszki OAuth callback
  '/api/kaufland/sync',  // Kaufland tickets cron
  '/api/kaufland/debug', // Kaufland debug
  '/api/baselinker/debug', // Baselinker debug
  '/api/debug',          // Apilo debug
  '/api/integrations/status', // Integrations status (for dashboard)
  '/api/weather/sync',   // Weather sync cron
  '/api/dms/init'        // DMS table initialization
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow requests with Vercel Cron secret header
  const cronSecret = request.headers.get('authorization');
  if (pathname.startsWith('/api/') && cronSecret) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.get('poom_auth');

  if (!authCookie) {
    // Redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
