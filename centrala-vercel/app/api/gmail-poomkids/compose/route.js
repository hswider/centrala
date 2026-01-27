import { NextResponse } from 'next/server';
import {
  sendNewEmail,
  sendNewEmailWithAttachments,
  isAuthenticated,
  getThread,
  parseMessage
} from '../../../../lib/gmail-poomkids';
import {
  initDatabase,
  saveGmailPoomkidsThread,
  saveGmailPoomkidsMessage,
  getGmailPoomkidsTokens
} from '../../../../lib/db';

// POST - Send a new email (create new thread)
export async function POST(request) {
  try {
    await initDatabase();

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Gmail POOMKIDS',
        requiresAuth: true
      }, { status: 401 });
    }

    const body = await request.json();
    const { to, subject, text, attachments } = body;

    if (!to) {
      return NextResponse.json({
        success: false,
        error: 'Recipient email is required'
      }, { status: 400 });
    }

    if (!subject) {
      return NextResponse.json({
        success: false,
        error: 'Subject is required'
      }, { status: 400 });
    }

    if ((!text || text.trim() === '') && (!attachments || attachments.length === 0)) {
      return NextResponse.json({
        success: false,
        error: 'Message text or attachments required'
      }, { status: 400 });
    }

    // Send new email via Gmail API
    let sentMessage;
    if (attachments && attachments.length > 0) {
      sentMessage = await sendNewEmailWithAttachments(to, subject, text?.trim() || '', attachments);
    } else {
      sentMessage = await sendNewEmail(to, subject, text.trim());
    }

    // Get the thread ID of the sent message to save it
    const threadId = sentMessage.threadId;

    if (threadId) {
      // Refresh and save the new thread
      try {
        const gmailThread = await getThread(threadId);
        const tokens = await getGmailPoomkidsTokens();
        const ourEmail = tokens?.email?.toLowerCase();

        if (gmailThread && gmailThread.messages) {
          const firstMessage = parseMessage(gmailThread.messages[0]);
          const lastMessage = parseMessage(gmailThread.messages[gmailThread.messages.length - 1]);

          // Save thread with 'sent' status
          await saveGmailPoomkidsThread({
            id: threadId,
            subject: firstMessage.subject,
            snippet: gmailThread.snippet,
            fromEmail: firstMessage.fromEmail,
            fromName: firstMessage.fromName,
            lastMessageAt: lastMessage.internalDate,
            unread: false,
            messagesCount: gmailThread.messages.length,
            labels: lastMessage.labelIds,
            status: 'sent'
          });

          // Save messages
          for (const msg of gmailThread.messages) {
            const parsed = parseMessage(msg);
            const isOutgoing = parsed.fromEmail.toLowerCase() === ourEmail;

            await saveGmailPoomkidsMessage({
              id: parsed.id,
              fromEmail: parsed.fromEmail,
              fromName: parsed.fromName,
              to: parsed.to,
              subject: parsed.subject,
              bodyText: parsed.bodyText,
              bodyHtml: parsed.bodyHtml,
              sentAt: parsed.internalDate,
              isOutgoing,
              hasAttachments: parsed.hasAttachments,
              attachments: parsed.attachments
            }, threadId);
          }
        }
      } catch (saveError) {
        console.error('Failed to save new thread:', saveError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: sentMessage,
      threadId: threadId
    });
  } catch (error) {
    console.error('Send new Gmail POOMKIDS email error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
