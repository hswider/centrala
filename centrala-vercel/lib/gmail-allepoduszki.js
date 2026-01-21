import { getGmailAllepoduszkiTokens, saveGmailAllepoduszkiTokens } from './db';

const GMAIL_API_URL = 'https://gmail.googleapis.com/gmail/v1';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Get environment variables
const getCredentials = () => ({
  clientId: process.env.GMAIL_ALLEPODUSZKI_CLIENT_ID,
  clientSecret: process.env.GMAIL_ALLEPODUSZKI_CLIENT_SECRET,
  redirectUri: process.env.GMAIL_ALLEPODUSZKI_REDIRECT_URI || 'https://centrala-poom.vercel.app/api/gmail-allepoduszki/callback'
});

// Generate authorization URL
export function getAuthorizationUrl() {
  const { clientId, redirectUri } = getCredentials();

  const scopes = [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email'
  ].join(' ');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent'
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code) {
  const { clientId, clientSecret, redirectUri } = getCredentials();

  if (!clientId || !clientSecret) {
    throw new Error(`Missing Gmail ALLEPODUSZKI credentials: clientId=${!!clientId}, clientSecret=${!!clientSecret}`);
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data = await response.json();

  // Get user email
  const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { 'Authorization': `Bearer ${data.access_token}` }
  });
  const user = await userInfo.json();

  // Save tokens to database
  const expiresAt = Date.now() + (data.expires_in * 1000);
  await saveGmailAllepoduszkiTokens(data.access_token, data.refresh_token, expiresAt, user.email);

  return { ...data, email: user.email };
}

// Refresh access token
export async function refreshAccessToken() {
  const tokens = await getGmailAllepoduszkiTokens();
  if (!tokens?.refresh_token) {
    throw new Error('No refresh token available');
  }

  const { clientId, clientSecret } = getCredentials();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();

  // Save new tokens (refresh_token might not be returned, keep existing)
  const expiresAt = Date.now() + (data.expires_in * 1000);
  await saveGmailAllepoduszkiTokens(
    data.access_token,
    data.refresh_token || tokens.refresh_token,
    expiresAt,
    tokens.email
  );

  return data;
}

// Get valid access token (refresh if needed)
export async function getValidAccessToken() {
  let tokens = await getGmailAllepoduszkiTokens();

  if (!tokens?.access_token) {
    throw new Error('Not authenticated with Gmail ALLEPODUSZKI');
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

// Make authenticated API request to Gmail
async function gmailFetch(endpoint, options = {}) {
  const accessToken = await getValidAccessToken();

  const response = await fetch(`${GMAIL_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error (${response.status}): ${error}`);
  }

  return response.json();
}

// ========== THREADS API ==========

// Get list of threads from inbox
export async function getThreadsList(maxResults = 20, pageToken = null) {
  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
    labelIds: 'INBOX'
  });

  if (pageToken) {
    params.append('pageToken', pageToken);
  }

  return gmailFetch(`/users/me/threads?${params.toString()}`);
}

// Get single thread with all messages
export async function getThread(threadId) {
  return gmailFetch(`/users/me/threads/${threadId}?format=full`);
}

// Mark thread as read
export async function markThreadAsRead(threadId) {
  return gmailFetch(`/users/me/threads/${threadId}/modify`, {
    method: 'POST',
    body: JSON.stringify({
      removeLabelIds: ['UNREAD']
    })
  });
}

// ========== MESSAGES API ==========

// Send reply to thread
export async function sendReply(threadId, to, subject, body) {
  const tokens = await getGmailAllepoduszkiTokens();
  const fromEmail = tokens.email;

  // Build email in RFC 2822 format
  const emailLines = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: Re: ${subject}`,
    `In-Reply-To: ${threadId}`,
    `References: ${threadId}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body
  ];

  const rawEmail = emailLines.join('\r\n');
  const encodedEmail = Buffer.from(rawEmail).toString('base64url');

  return gmailFetch('/users/me/messages/send', {
    method: 'POST',
    body: JSON.stringify({
      raw: encodedEmail,
      threadId: threadId
    })
  });
}

// ========== USER API ==========

// Get current user info
export async function getCurrentUser() {
  const tokens = await getGmailAllepoduszkiTokens();
  return { email: tokens?.email };
}

// Check if authenticated
export async function isAuthenticated() {
  try {
    const tokens = await getGmailAllepoduszkiTokens();
    return !!(tokens?.access_token && tokens?.refresh_token);
  } catch {
    return false;
  }
}

// ========== HELPERS ==========

// Parse email message to extract useful data
export function parseMessage(message) {
  const headers = message.payload?.headers || [];
  const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  // Extract body
  let bodyText = '';
  let bodyHtml = '';

  const extractBody = (part) => {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8');
    }
    if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
    }
    if (part.parts) {
      part.parts.forEach(extractBody);
    }
  };

  if (message.payload) {
    extractBody(message.payload);

    // If no parts, check body directly
    if (!bodyText && !bodyHtml && message.payload.body?.data) {
      const decoded = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      if (message.payload.mimeType === 'text/html') {
        bodyHtml = decoded;
      } else {
        bodyText = decoded;
      }
    }
  }

  // Parse From header to get name and email
  const fromHeader = getHeader('From');
  let fromName = '';
  let fromEmail = fromHeader;

  const fromMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/);
  if (fromMatch) {
    fromName = fromMatch[1].replace(/"/g, '').trim();
    fromEmail = fromMatch[2];
  }

  return {
    id: message.id,
    threadId: message.threadId,
    from: fromHeader,
    fromName,
    fromEmail,
    to: getHeader('To'),
    subject: getHeader('Subject'),
    date: getHeader('Date'),
    snippet: message.snippet,
    bodyText,
    bodyHtml,
    internalDate: message.internalDate,
    labelIds: message.labelIds || []
  };
}

// Check if message is from us (outgoing)
export async function isOutgoingMessage(message) {
  const tokens = await getGmailAllepoduszkiTokens();
  const ourEmail = tokens?.email?.toLowerCase();
  const parsed = parseMessage(message);
  return parsed.fromEmail.toLowerCase() === ourEmail;
}
