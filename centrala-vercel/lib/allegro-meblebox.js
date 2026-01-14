import { getAllegroMebleboxTokens, saveAllegroMebleboxTokens } from './db';

const ALLEGRO_API_URL = 'https://api.allegro.pl';
const ALLEGRO_AUTH_URL = 'https://allegro.pl/auth/oauth';
const ALLEGRO_TOKEN_URL = 'https://allegro.pl/auth/oauth/token';

// Get environment variables for Meblebox
const getCredentials = () => ({
  clientId: process.env.ALLEGRO_MEBLEBOX_CLIENT_ID,
  clientSecret: process.env.ALLEGRO_MEBLEBOX_CLIENT_SECRET,
  redirectUri: process.env.ALLEGRO_MEBLEBOX_REDIRECT_URI || 'https://centrala-poom.vercel.app/api/allegro-meblebox/callback'
});

// Generate authorization URL
export function getAuthorizationUrl() {
  const { clientId, redirectUri } = getCredentials();
  const scopes = [
    'allegro:api:messaging',
    'allegro:api:orders:read',
    'allegro:api:profile:read',
    'allegro:api:sale:offers:read',
    'allegro:api:shipments:read'
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    prompt: 'confirm'
  });
  return `${ALLEGRO_AUTH_URL}/authorize?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code) {
  const { clientId, clientSecret, redirectUri } = getCredentials();

  if (!clientId || !clientSecret) {
    throw new Error(`Missing Meblebox credentials: clientId=${!!clientId}, clientSecret=${!!clientSecret}`);
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(ALLEGRO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data = await response.json();

  // Save tokens to database
  const expiresAt = Date.now() + (data.expires_in * 1000);
  await saveAllegroMebleboxTokens(data.access_token, data.refresh_token, expiresAt);

  return data;
}

// Refresh access token
export async function refreshAccessToken() {
  const tokens = await getAllegroMebleboxTokens();
  if (!tokens?.refresh_token) {
    throw new Error('No refresh token available');
  }

  const { clientId, clientSecret } = getCredentials();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(ALLEGRO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();

  // Save new tokens
  const expiresAt = Date.now() + (data.expires_in * 1000);
  await saveAllegroMebleboxTokens(data.access_token, data.refresh_token, expiresAt);

  return data;
}

// Get valid access token (refresh if needed)
export async function getValidAccessToken() {
  let tokens = await getAllegroMebleboxTokens();

  if (!tokens?.access_token) {
    throw new Error('Not authenticated with Allegro Meblebox');
  }

  // Check if token is expired or will expire in next 5 minutes
  const now = Date.now();
  const expiresAt = parseInt(tokens.expires_at) || 0;

  if (expiresAt - now < 5 * 60 * 1000) {
    // Token expired or will expire soon, refresh it
    const refreshed = await refreshAccessToken();
    return refreshed.access_token;
  }

  return tokens.access_token;
}

// Make authenticated API request
async function allegroFetch(endpoint, options = {}) {
  const accessToken = await getValidAccessToken();

  const response = await fetch(`${ALLEGRO_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.allegro.public.v1+json',
      'Content-Type': 'application/vnd.allegro.public.v1+json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Allegro API error (${response.status}): ${error}`);
  }

  return response.json();
}

// ========== MESSAGING API ==========

// Get message threads list
export async function getMessageThreads(limit = 20, offset = 0) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  });
  return allegroFetch(`/messaging/threads?${params.toString()}`);
}

// Get single thread with messages
export async function getThreadMessages(threadId, limit = 20, before = null) {
  const params = new URLSearchParams({
    limit: limit.toString()
  });
  if (before) {
    params.append('before', before);
  }
  return allegroFetch(`/messaging/threads/${threadId}/messages?${params.toString()}`);
}

// Send message to thread
export async function sendMessage(threadId, text, attachmentIds = []) {
  const body = {
    text: text
  };

  if (attachmentIds.length > 0) {
    body.attachments = attachmentIds.map(id => ({ id }));
  }

  return allegroFetch(`/messaging/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

// Mark thread as read
export async function markThreadAsRead(threadId) {
  return allegroFetch(`/messaging/threads/${threadId}/read`, {
    method: 'PUT'
  });
}

// Get thread details
export async function getThread(threadId) {
  return allegroFetch(`/messaging/threads/${threadId}`);
}

// ========== ORDERS API ==========

// Get order details by checkout form ID
export async function getOrder(orderId) {
  return allegroFetch(`/order/checkout-forms/${orderId}`);
}

// ========== USER API ==========

// Get current user info
export async function getCurrentUser() {
  return allegroFetch('/me');
}

// Check if authenticated
export async function isAuthenticated() {
  try {
    const tokens = await getAllegroMebleboxTokens();
    return !!(tokens?.access_token && tokens?.refresh_token);
  } catch {
    return false;
  }
}
