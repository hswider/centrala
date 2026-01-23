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

// Get attachment data from Gmail
export async function getAttachment(messageId, attachmentId) {
  return gmailRequest(`/users/me/messages/${messageId}/attachments/${attachmentId}`);
}

// Send reply with attachments
export async function sendReplyWithAttachments(threadId, to, subject, body, attachments = []) {
  const tokens = await getGmailAmazonDeTokens();
  const from = tokens?.email || 'me';

  // Generate boundary for multipart message
  const boundary = `boundary_${Date.now()}`;

  let emailParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: Re: ${subject}`,
    `In-Reply-To: ${threadId}`,
    `References: ${threadId}`,
    `MIME-Version: 1.0`,
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
    emailParts.push(attachment.data); // base64 encoded data
  }

  emailParts.push(`--${boundary}--`);

  const email = emailParts.join('\r\n');
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

// Strip quoted reply content from email body
function stripQuotedReply(text) {
  if (!text) return '';

  const quotePatterns = [
    /\n*W dniu \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} użytkownik .+ napisał:[\s\S]*/i,
    /\n*Dnia \d{4}-\d{2}-\d{2} .+ napisał[\s\S]*/i,
    /\n*On .+ wrote:[\s\S]*/i,
    /\n*On \d{4}-\d{2}-\d{2} .+ wrote:[\s\S]*/i,
    /\n*Am .+ schrieb .+:[\s\S]*/i,
    /\n*Le .+ a écrit\s*:[\s\S]*/i,
    /\n*[-_]{3,}[\s]*Original Message[\s]*[-_]{3,}[\s\S]*/i,
    /\n*[-_]{3,}[\s]*Oryginalna wiadomość[\s]*[-_]{3,}[\s\S]*/i,
    /\n*From:.*\nSent:.*\nTo:.*\nSubject:[\s\S]*/i,
    /\n(?:>.*\n?){3,}[\s\S]*/,
  ];

  let cleanText = text;
  for (const pattern of quotePatterns) {
    cleanText = cleanText.replace(pattern, '');
  }

  return cleanText.trim();
}

// Extract clean customer message from Amazon email template
function extractAmazonMessage(bodyText) {
  if (!bodyText) return { cleanMessage: '', asin: null, productName: null };

  let cleanMessage = bodyText;
  let asin = null;
  let productName = null;

  // Extract ASIN
  const asinMatch = bodyText.match(/ASIN:\s*([A-Z0-9]{10})/i);
  if (asinMatch) {
    asin = asinMatch[1];
  }

  // Try to extract message between various language markers
  const messagePatterns = [
    // German
    /[-]+\s*Nachricht:\s*[-]+\s*([\s\S]*?)\s*[-]+\s*Ende der Nachricht\s*[-]+/i,
    // French
    /[-]+\s*Message\s*:\s*[-]+\s*([\s\S]*?)\s*[-]+\s*Fin du message\s*[-]+/i,
    // Spanish
    /[-]+\s*Mensaje:\s*[-]+\s*([\s\S]*?)\s*[-]+\s*Fin del mensaje\s*[-]+/i,
    // Italian
    /[-]+\s*Messaggio:\s*[-]+\s*([\s\S]*?)\s*[-]+\s*Fine del messaggio\s*[-]+/i,
    // English
    /[-]+\s*Message:\s*[-]+\s*([\s\S]*?)\s*[-]+\s*End of message\s*[-]+/i,
    // Polish
    /[-]+\s*Wiadomość:\s*[-]+\s*([\s\S]*?)\s*[-]+\s*Koniec wiadomości\s*[-]+/i,
  ];

  for (const pattern of messagePatterns) {
    const match = bodyText.match(pattern);
    if (match && match[1]) {
      cleanMessage = match[1].trim();
      break;
    }
  }

  // If no pattern matched, try to remove common Amazon footer
  if (cleanMessage === bodyText) {
    // Remove everything after "War diese E-Mail hilfreich?" or similar
    const footerPatterns = [
      /War diese E-Mail hilfreich\?[\s\S]*/i,
      /Cette e-mail vous a-t-il été utile[\s\S]*/i,
      /¿Le ha resultado útil este correo[\s\S]*/i,
      /Questa email ti è stata utile[\s\S]*/i,
      /Was this email helpful[\s\S]*/i,
      /Fall lösen[\s\S]*/i,
      /Résoudre le problème[\s\S]*/i,
      /Resolver caso[\s\S]*/i,
    ];

    for (const pattern of footerPatterns) {
      cleanMessage = cleanMessage.replace(pattern, '').trim();
    }

    // Remove header like "Du hast eine Nachricht erhalten"
    const headerPatterns = [
      /^.*Du hast eine Nachricht erhalten\.?\s*/i,
      /^.*Vous avez reçu un message\.?\s*/i,
      /^.*Has recibido un mensaje\.?\s*/i,
      /^.*Hai ricevuto un messaggio\.?\s*/i,
      /^.*You have received a message\.?\s*/i,
    ];

    for (const pattern of headerPatterns) {
      cleanMessage = cleanMessage.replace(pattern, '').trim();
    }

    // Remove ASIN line from the beginning
    cleanMessage = cleanMessage.replace(/^ASIN:\s*[A-Z0-9]{10}\s*/i, '').trim();

    // Remove order number line
    cleanMessage = cleanMessage.replace(/^#?\s*\d{3}-\d{7}-\d{7}:?\s*/m, '').trim();
    cleanMessage = cleanMessage.replace(/^Bestellnummer\s*\d{3}-\d{7}-\d{7}:?\s*/mi, '').trim();
  }

  // Clean up excessive whitespace
  cleanMessage = cleanMessage.replace(/\n{3,}/g, '\n\n').trim();

  return { cleanMessage, asin, productName };
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

  // Get body text and attachments
  let bodyText = '';
  let bodyHtml = '';
  const attachments = [];

  const extractBodyAndAttachments = (parts) => {
    if (!parts) return;
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8');
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
      } else if (part.parts) {
        extractBodyAndAttachments(part.parts);
      }
    }
  };

  if (message.payload?.body?.data) {
    bodyText = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  } else if (message.payload?.parts) {
    extractBodyAndAttachments(message.payload.parts);
  }

  // Also check for inline attachments at the top level
  if (message.payload?.filename && message.payload?.body?.attachmentId) {
    attachments.push({
      id: message.payload.body.attachmentId,
      filename: message.payload.filename,
      mimeType: message.payload.mimeType,
      size: message.payload.body.size || 0
    });
  }

  // FALLBACK: If bodyText is still empty but we have HTML, extract text from HTML
  if ((!bodyText || !bodyText.trim()) && bodyHtml) {
    bodyText = htmlToPlainText(bodyHtml);
  }

  // Strip quoted reply content (previous messages in thread)
  bodyText = stripQuotedReply(bodyText);

  // Extract clean message and ASIN from Amazon template
  const { cleanMessage, asin } = extractAmazonMessage(bodyText);

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
    asin,
    bodyText: cleanMessage || bodyText, // Use cleaned message if available
    bodyTextOriginal: bodyText, // Keep original for reference
    bodyHtml,
    attachments,
    hasAttachments: attachments.length > 0,
    snippet: message.snippet,
    labelIds: message.labelIds,
    internalDate: new Date(parseInt(message.internalDate)).toISOString()
  };
}
