// Gmail API Integration for Amazon DE messages
// Uses OAuth 2.0 for authentication

import { getGmailAmazonDeTokens, saveGmailAmazonDeTokens } from './db';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify'
].join(' ');

// Get OAuth URL for login
export function getAuthUrl() {
  const clientId = process.env.GMAIL_AMAZON_DE_CLIENT_ID;
  const redirectUri = process.env.GMAIL_AMAZON_DE_REDIRECT_URI;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code) {
  const clientId = process.env.GMAIL_AMAZON_DE_CLIENT_ID;
  const clientSecret = process.env.GMAIL_AMAZON_DE_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_AMAZON_DE_REDIRECT_URI;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

// Refresh access token
export async function refreshAccessToken(refreshToken) {
  const clientId = process.env.GMAIL_AMAZON_DE_CLIENT_ID;
  const clientSecret = process.env.GMAIL_AMAZON_DE_CLIENT_SECRET;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

// Get valid access token (refresh if needed)
export async function getValidAccessToken() {
  const tokens = await getGmailAmazonDeTokens();

  if (!tokens?.refresh_token) {
    throw new Error('Not authenticated with Gmail Amazon DE');
  }

  const now = Date.now();

  // Check if token is still valid (with 5 min buffer)
  if (tokens.access_token && tokens.expires_at && tokens.expires_at > now + 300000) {
    return tokens.access_token;
  }

  // Refresh the token
  const newTokens = await refreshAccessToken(tokens.refresh_token);
  const expiresAt = now + (newTokens.expires_in * 1000);

  await saveGmailAmazonDeTokens(
    newTokens.access_token,
    tokens.refresh_token,
    expiresAt,
    tokens.email
  );

  return newTokens.access_token;
}

// Check if authenticated
export async function isAuthenticated() {
  try {
    const tokens = await getGmailAmazonDeTokens();
    return !!(tokens?.refresh_token);
  } catch (e) {
    return false;
  }
}

// Make Gmail API request
async function gmailRequest(endpoint, options = {}) {
  const accessToken = await getValidAccessToken();

  const response = await fetch(`${GMAIL_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Get user profile (email address)
export async function getUserProfile() {
  return gmailRequest('/users/me/profile');
}

// Get threads list
export async function getThreadsList(maxResults = 20) {
  // Search for emails from Amazon marketplace
  const query = 'from:@marketplace.amazon';
  return gmailRequest(`/users/me/threads?maxResults=${maxResults}&q=${encodeURIComponent(query)}`);
}

// Get single thread with messages
export async function getThread(threadId) {
  return gmailRequest(`/users/me/threads/${threadId}?format=full`);
}

// Get single message
export async function getMessage(messageId) {
  return gmailRequest(`/users/me/messages/${messageId}?format=full`);
}

// Mark thread as read
export async function markThreadAsRead(threadId) {
  return gmailRequest(`/users/me/threads/${threadId}/modify`, {
    method: 'POST',
    body: JSON.stringify({
      removeLabelIds: ['UNREAD']
    })
  });
}

// Send reply
export async function sendReply(threadId, to, subject, body) {
  const tokens = await getGmailAmazonDeTokens();
  const from = tokens?.email || 'me';

  // Create email with proper headers for reply
  const emailLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: Re: ${subject}`,
    `In-Reply-To: ${threadId}`,
    `References: ${threadId}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body
  ];

  const email = emailLines.join('\r\n');
  const encodedEmail = Buffer.from(email).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return gmailRequest('/users/me/messages/send', {
    method: 'POST',
    body: JSON.stringify({
      raw: encodedEmail,
      threadId: threadId
    })
  });
}

// Parse message to extract useful info
export function parseMessage(message) {
  const headers = message.payload?.headers || [];
  const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const from = getHeader('From');
  const to = getHeader('To');
  const subject = getHeader('Subject');
  const date = getHeader('Date');
  const messageId = getHeader('Message-ID');

  // Extract email from "Name <email>" format
  const fromMatch = from.match(/<(.+)>/) || [null, from];
  const fromEmail = fromMatch[1] || from;
  const fromName = from.replace(/<.+>/, '').trim() || fromEmail;

  // Extract Order ID from subject or body (Amazon format: XXX-XXXXXXX-XXXXXXX)
  const orderIdMatch = subject.match(/(\d{3}-\d{7}-\d{7})/) ||
    (message.snippet || '').match(/(\d{3}-\d{7}-\d{7})/);
  const orderId = orderIdMatch ? orderIdMatch[1] : null;

  // Get body text
  let bodyText = '';
  let bodyHtml = '';

  const extractBody = (parts) => {
    if (!parts) return;
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.parts) {
        extractBody(part.parts);
      }
    }
  };

  if (message.payload?.body?.data) {
    bodyText = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  } else if (message.payload?.parts) {
    extractBody(message.payload.parts);
  }

  return {
    id: message.id,
    threadId: message.threadId,
    from,
    fromEmail,
    fromName,
    to,
    subject,
    date,
    messageId,
    orderId,
    bodyText,
    bodyHtml,
    snippet: message.snippet,
    labelIds: message.labelIds,
    internalDate: new Date(parseInt(message.internalDate)).toISOString()
  };
}
