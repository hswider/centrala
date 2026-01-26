import { getGmailTokens, saveGmailTokens } from './db';

const GMAIL_API_URL = 'https://gmail.googleapis.com/gmail/v1';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Get environment variables
const getCredentials = () => ({
  clientId: process.env.GMAIL_CLIENT_ID,
  clientSecret: process.env.GMAIL_CLIENT_SECRET,
  redirectUri: process.env.GMAIL_REDIRECT_URI || 'https://centrala-poom.vercel.app/api/gmail/callback'
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
    throw new Error(`Missing Gmail credentials: clientId=${!!clientId}, clientSecret=${!!clientSecret}`);
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
  await saveGmailTokens(data.access_token, data.refresh_token, expiresAt, user.email);

  return { ...data, email: user.email };
}

// Refresh access token
export async function refreshAccessToken() {
  const tokens = await getGmailTokens();
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
  await saveGmailTokens(
    data.access_token,
    data.refresh_token || tokens.refresh_token,
    expiresAt,
    tokens.email
  );

  return data;
}

// Get valid access token (refresh if needed)
export async function getValidAccessToken() {
  let tokens = await getGmailTokens();

  if (!tokens?.access_token) {
    throw new Error('Not authenticated with Gmail');
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

// Get attachment data from Gmail
export async function getAttachment(messageId, attachmentId) {
  return gmailFetch(`/users/me/messages/${messageId}/attachments/${attachmentId}`);
}

// Send reply to thread
export async function sendReply(threadId, to, subject, body) {
  const tokens = await getGmailTokens();
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

// Send reply with attachments
export async function sendReplyWithAttachments(threadId, to, subject, body, attachments = []) {
  const tokens = await getGmailTokens();
  const from = tokens?.email || 'me';

  // Generate boundary for multipart message
  const boundary = `boundary_${Date.now()}`;

  // Build multipart email
  const emailParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: Re: ${subject}`,
    `In-Reply-To: ${threadId}`,
    `References: ${threadId}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body
  ];

  // Add attachments
  for (const attachment of attachments) {
    emailParts.push(`--${boundary}`);
    emailParts.push(`Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`);
    emailParts.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
    emailParts.push('Content-Transfer-Encoding: base64');
    emailParts.push('');
    emailParts.push(attachment.data);
  }

  emailParts.push(`--${boundary}--`);

  const rawEmail = emailParts.join('\r\n');
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
  const tokens = await getGmailTokens();
  return { email: tokens?.email };
}

// Check if authenticated
export async function isAuthenticated() {
  try {
    const tokens = await getGmailTokens();
    return !!(tokens?.access_token && tokens?.refresh_token);
  } catch {
    return false;
  }
}

// ========== HELPERS ==========

// Strip quoted reply content from email body
function stripQuotedReply(text) {
  if (!text) return '';

  // Patterns that indicate start of quoted content
  const quotePatterns = [
    // Ukrainian date format with email in angle brackets (can span multiple lines)
    // e.g. "нд, 25 січ. 2026 р. о 22:43 dobrelegowiska <\nstore+xxx@t.shopifyemail.com> пише:"
    /\n*[а-яА-Яa-zA-Z]{2,3},\s*\d{1,2}\s+[а-яА-Яa-zA-Z]+\.?\s*\d{4}\s*р?\.?\s*о\s*\d{1,2}:\d{2}[\s\S]*?пише:[\s\S]*/i,
    // Polish
    /\n*W dniu \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} użytkownik .+ napisał:[\s\S]*/i,
    /\n*Dnia \d{4}-\d{2}-\d{2} .+ napisał[\s\S]*/i,
    /\n*Dnia .+ napisał[\s\S]*/i,
    // English
    /\n*On .+ wrote:[\s\S]*/i,
    /\n*On \d{4}-\d{2}-\d{2} .+ wrote:[\s\S]*/i,
    // German
    /\n*Am .+ schrieb .+:[\s\S]*/i,
    // French
    /\n*Le .+ a écrit\s*:[\s\S]*/i,
    // Ukrainian (simple patterns)
    /\n*[\s\S]*?>\s*пише:[\s\S]*/i,
    /\n*[\s\S]*?>\s*написав:[\s\S]*/i,
    // Russian
    /\n*[\s\S]*?>\s*написал:[\s\S]*/i,
    /\n*[\s\S]*?>\s*пишет:[\s\S]*/i,
    // Spanish
    /\n*El .+ escribió:[\s\S]*/i,
    // Italian
    /\n*Il .+ ha scritto:[\s\S]*/i,
    // Dutch
    /\n*Op .+ schreef .+:[\s\S]*/i,
    // Generic separators
    /\n*[-_]{3,}[\s]*Original Message[\s]*[-_]{3,}[\s\S]*/i,
    /\n*[-_]{3,}[\s]*Oryginalna wiadomość[\s]*[-_]{3,}[\s\S]*/i,
    /\n*From:.*\nSent:.*\nTo:.*\nSubject:[\s\S]*/i,
    // Gmail quote markers (lines starting with >)
    /\n(?:>.*\n?){3,}[\s\S]*/,
    // Shopify-style image markers followed by order content
    /\n*\[image:[^\]]*\]\s*Zamówienie\s*#\d+[\s\S]*/i,
  ];

  let cleanText = text;
  for (const pattern of quotePatterns) {
    cleanText = cleanText.replace(pattern, '');
  }

  return cleanText.trim();
}

// Extract plain text from HTML
function htmlToPlainText(html) {
  if (!html) return '';

  // Remove style and script tags and their content
  let text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Replace <br>, <p>, <div> with newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/tr>/gi, '\n');
  text = text.replace(/<\/li>/gi, '\n');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/&amp;/gi, '&');
  text = text.replace(/&lt;/gi, '<');
  text = text.replace(/&gt;/gi, '>');
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&#39;/gi, "'");
  text = text.replace(/&apos;/gi, "'");

  // Clean up whitespace
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.split('\n').map(line => line.trim()).join('\n');
  text = text.trim();

  return text;
}

// Parse email message to extract useful data
export function parseMessage(message) {
  const headers = message.payload?.headers || [];
  const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  // Extract body and attachments
  let bodyText = '';
  let bodyHtml = '';
  const attachments = [];

  const extractBodyAndAttachments = (part) => {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      const decoded = Buffer.from(part.body.data, 'base64').toString('utf-8');
      // Only use if not empty/whitespace only
      if (decoded.trim()) {
        bodyText = decoded;
      }
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
    } else if (part.filename && part.body?.attachmentId) {
      // This is an attachment
      attachments.push({
        id: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size || 0
      });
    }
    if (part.parts) {
      part.parts.forEach(extractBodyAndAttachments);
    }
  };

  if (message.payload) {
    extractBodyAndAttachments(message.payload);

    // If no parts, check body directly
    if (!bodyText && !bodyHtml && message.payload.body?.data) {
      const decoded = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      if (message.payload.mimeType === 'text/html') {
        bodyHtml = decoded;
      } else {
        bodyText = decoded;
      }
    }

    // Check for inline attachments at top level
    if (message.payload.filename && message.payload.body?.attachmentId) {
      attachments.push({
        id: message.payload.body.attachmentId,
        filename: message.payload.filename,
        mimeType: message.payload.mimeType,
        size: message.payload.body.size || 0
      });
    }

    // FALLBACK: If bodyText is still empty but we have HTML, extract text from HTML
    if (!bodyText && bodyHtml) {
      bodyText = htmlToPlainText(bodyHtml);
    }

    // Strip quoted reply content (previous messages in thread)
    bodyText = stripQuotedReply(bodyText);
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
    attachments,
    hasAttachments: attachments.length > 0,
    internalDate: message.internalDate,
    labelIds: message.labelIds || []
  };
}

// Check if message is from us (outgoing)
export async function isOutgoingMessage(message) {
  const tokens = await getGmailTokens();
  const ourEmail = tokens?.email?.toLowerCase();
  const parsed = parseMessage(message);
  return parsed.fromEmail.toLowerCase() === ourEmail;
}
