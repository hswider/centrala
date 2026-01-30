import { getGmailPoomfurnitureTokens, saveGmailPoomfurnitureTokens, clearGmailPoomfurnitureTokens } from './db';

const GMAIL_API_URL = 'https://gmail.googleapis.com/gmail/v1';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Get environment variables
const getCredentials = () => ({
  clientId: process.env.GMAIL_POOMFURNITURE_CLIENT_ID || process.env.GMAIL_CLIENT_ID,
  clientSecret: process.env.GMAIL_POOMFURNITURE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET,
  redirectUri: process.env.GMAIL_POOMFURNITURE_REDIRECT_URI || 'https://centrala-poom.vercel.app/api/gmail-poomfurniture/callback'
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
    throw new Error(`Missing Gmail POOMFURNITURE credentials: clientId=${!!clientId}, clientSecret=${!!clientSecret}`);
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
  await saveGmailPoomfurnitureTokens(data.access_token, data.refresh_token, expiresAt, user.email);

  return { ...data, email: user.email };
}

// Refresh access token
export async function refreshAccessToken() {
  const tokens = await getGmailPoomfurnitureTokens();
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
    // If refresh token is revoked/expired, clear tokens so user can re-authenticate
    if (error.includes('invalid_grant') || error.includes('Token has been expired or revoked')) {
      console.error('Gmail POOMFURNITURE refresh token expired/revoked, clearing tokens');
      await clearGmailPoomfurnitureTokens();
    }
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();

  // Save new tokens (refresh_token might not be returned, keep existing)
  const expiresAt = Date.now() + (data.expires_in * 1000);
  await saveGmailPoomfurnitureTokens(
    data.access_token,
    data.refresh_token || tokens.refresh_token,
    expiresAt,
    tokens.email
  );

  return data;
}

// Get valid access token (refresh if needed)
export async function getValidAccessToken() {
  let tokens = await getGmailPoomfurnitureTokens();

  if (!tokens?.access_token) {
    throw new Error('Not authenticated with Gmail POOMFURNITURE');
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

// Encode subject for non-ASCII characters (RFC 2047 MIME encoded-word)
function encodeEmailSubject(subject) {
  if (!/[^\x00-\x7F]/.test(subject)) {
    return subject;
  }
  const encoded = Buffer.from(subject, 'utf-8').toString('base64');
  return `=?UTF-8?B?${encoded}?=`;
}

// Send reply to thread
export async function sendReply(threadId, to, subject, body, messageId = null) {
  const tokens = await getGmailPoomfurnitureTokens();
  const fromEmail = tokens.email;

  const replyToId = messageId || threadId;
  const replySubject = 'Re: ' + subject.replace(/^(Re|Odp|AW|SV|Fwd|FW):\s*/gi, '').replace(/^(Re|Odp|AW|SV|Fwd|FW):\s*/gi, '');

  const emailLines = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${encodeEmailSubject(replySubject)}`,
    `In-Reply-To: ${replyToId}`,
    `References: ${replyToId}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(body, 'utf-8').toString('base64')
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
export async function sendReplyWithAttachments(threadId, to, subject, body, attachments = [], messageId = null) {
  const tokens = await getGmailPoomfurnitureTokens();
  const from = tokens?.email || 'me';

  const replyToId = messageId || threadId;
  const replySubject = 'Re: ' + subject.replace(/^(Re|Odp|AW|SV|Fwd|FW):\s*/gi, '').replace(/^(Re|Odp|AW|SV|Fwd|FW):\s*/gi, '');
  const boundary = `boundary_${Date.now()}`;

  const emailParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeEmailSubject(replySubject)}`,
    `In-Reply-To: ${replyToId}`,
    `References: ${replyToId}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(body, 'utf-8').toString('base64')
  ];

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

// Send new email (not a reply - creates new thread)
export async function sendNewEmail(to, subject, body) {
  const tokens = await getGmailPoomfurnitureTokens();
  const fromEmail = tokens.email;

  const emailLines = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${encodeEmailSubject(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(body, 'utf-8').toString('base64')
  ];

  const rawEmail = emailLines.join('\r\n');
  const encodedEmail = Buffer.from(rawEmail).toString('base64url');

  return gmailFetch('/users/me/messages/send', {
    method: 'POST',
    body: JSON.stringify({
      raw: encodedEmail
    })
  });
}

// Send new email with attachments (not a reply - creates new thread)
export async function sendNewEmailWithAttachments(to, subject, body, attachments = []) {
  const tokens = await getGmailPoomfurnitureTokens();
  const from = tokens?.email || 'me';

  const boundary = `boundary_${Date.now()}`;

  const emailParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeEmailSubject(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(body, 'utf-8').toString('base64')
  ];

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
      raw: encodedEmail
    })
  });
}

// Trash a thread (move to trash)
export async function trashThread(threadId) {
  return gmailFetch(`/users/me/threads/${threadId}/trash`, {
    method: 'POST'
  });
}

// ========== USER API ==========

// Get current user info
export async function getCurrentUser() {
  const tokens = await getGmailPoomfurnitureTokens();
  return { email: tokens?.email };
}

// Check if authenticated
export async function isAuthenticated() {
  try {
    const tokens = await getGmailPoomfurnitureTokens();
    return !!(tokens?.access_token && tokens?.refresh_token);
  } catch {
    return false;
  }
}

// ========== HELPERS ==========

// Strip HTML tags from plain text that may contain them (e.g., Judge.me notifications)
function stripHtmlFromPlainText(text) {
  if (!text) return '';

  // Check if text contains HTML tags
  if (!/<[^>]+>/.test(text)) {
    return text;
  }

  // Remove HTML tags but preserve structure
  let result = text;

  // Replace <br>, <p>, <div> with newlines first
  result = result.replace(/<br\s*\/?>/gi, '\n');
  result = result.replace(/<\/p>/gi, '\n\n');
  result = result.replace(/<\/div>/gi, '\n');
  result = result.replace(/<\/li>/gi, '\n');

  // Remove all remaining HTML tags
  result = result.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  result = result.replace(/&nbsp;/gi, ' ');
  result = result.replace(/&amp;/gi, '&');
  result = result.replace(/&lt;/gi, '<');
  result = result.replace(/&gt;/gi, '>');
  result = result.replace(/&quot;/gi, '"');
  result = result.replace(/&#39;/gi, "'");
  result = result.replace(/&apos;/gi, "'");

  // Clean up whitespace
  result = result.replace(/\n{3,}/g, '\n\n');
  result = result.replace(/[ \t]+/g, ' ');
  result = result.split('\n').map(line => line.trim()).join('\n');

  return result.trim();
}

// Strip quoted reply content from email body
function stripQuotedReply(text) {
  if (!text) return '';

  const quotePatterns = [
    // Email ending with "> пише:" (closing angle bracket + пише:) - common in Ukrainian replies
    />\s*пише:\s*[\s\S]*/i,
    />\s*написав:\s*[\s\S]*/i,
    />\s*написал:\s*[\s\S]*/i,
    />\s*пишет:\s*[\s\S]*/i,
    // Polish
    /\n*W dniu \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} użytkownik .+ napisał:[\s\S]*/i,
    /\n*Dnia \d{4}-\d{2}-\d{2} .+ napisał[\s\S]*/i,
    /\n*Dnia .+ napisał:[\s\S]*/i,
    // Polish format with napisał(a): - matches "niedziela, 25 stycznia 2026 22:53, email napisał(a):"
    /\n*.+\d{4}.+napisał\(a\):[\s\S]*/i,
    // Proton Mail signatures
    /\n*Wysłana przez bezpieczną pocztę \[Proton Mail\].*$/im,
    /\n*Sent with Proton Mail.*$/im,
    // English
    /\n*On .+ wrote:[\s\S]*/i,
    /\n*On \d{4}-\d{2}-\d{2} .+ wrote:[\s\S]*/i,
    // German
    /\n*Am .+ schrieb .+:[\s\S]*/i,
    // French
    /\n*Le .+ a écrit\s*:[\s\S]*/i,
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
    /\n(?:>.*\n?){2,}[\s\S]*/,
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

// Decode buffer using the specified charset
function decodeBufferWithCharset(buffer, charset) {
  const cs = charset.toLowerCase().replace(/^iso-/, 'iso').replace(/^iso/, 'iso-');
  if (cs === 'utf-8' || cs === 'utf8') {
    return buffer.toString('utf-8');
  }
  try {
    const decoder = new TextDecoder(charset);
    return decoder.decode(buffer);
  } catch {
    return buffer.toString('utf-8');
  }
}

// Decode MIME encoded-word (RFC 2047) in headers like Subject
function decodeMimeHeader(text) {
  if (!text) return '';

  // Pattern for encoded-word: =?charset?encoding?encoded_text?=
  const encodedWordPattern = /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g;

  const result = text.replace(encodedWordPattern, (match, charset, encoding, encodedText) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        // Base64 encoding
        const decoded = Buffer.from(encodedText, 'base64');
        return decodeBufferWithCharset(decoded, charset);
      } else if (encoding.toUpperCase() === 'Q') {
        // Quoted-Printable encoding - decode to raw bytes
        const bytes = [];
        for (let i = 0; i < encodedText.length; i++) {
          if (encodedText[i] === '_') {
            bytes.push(0x20);
          } else if (encodedText[i] === '=' && i + 2 < encodedText.length && /[0-9A-Fa-f]{2}/.test(encodedText.substr(i + 1, 2))) {
            bytes.push(parseInt(encodedText.substr(i + 1, 2), 16));
            i += 2;
          } else {
            bytes.push(encodedText.charCodeAt(i));
          }
        }
        return decodeBufferWithCharset(Buffer.from(bytes), charset);
      }
    } catch (e) {
      // If decoding fails, return original
      return match;
    }
    return match;
  });

  // Remove whitespace between adjacent encoded-words (RFC 2047)
  return result.replace(/\?=\s+=\?/g, '?==?');
}

// Parse email message to extract useful data
export function parseMessage(message) {
  const headers = message.payload?.headers || [];
  const getHeader = (name) => decodeMimeHeader(headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '');

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

    if (!bodyText && !bodyHtml && message.payload.body?.data) {
      const decoded = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      if (message.payload.mimeType === 'text/html') {
        bodyHtml = decoded;
      } else {
        bodyText = decoded;
      }
    }

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

    // Strip HTML tags from plain text (e.g., Judge.me notifications sent as text/plain with HTML)
    bodyText = stripHtmlFromPlainText(bodyText);

    // Strip quoted reply content (previous messages in thread)
    bodyText = stripQuotedReply(bodyText);
  }

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
  const tokens = await getGmailPoomfurnitureTokens();
  const ourEmail = tokens?.email?.toLowerCase();
  const parsed = parseMessage(message);
  return parsed.fromEmail.toLowerCase() === ourEmail;
}
