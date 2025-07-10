import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { MessageEmailData } from '@/lib/messaging-email';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request: Request) {
  try {
    const emailData: MessageEmailData = await request.json();

    const {
      senderName,
      recipientName,
      recipientEmail,
      messageContent,
      conversationTitle,
      conversationUrl,
      unreadCount,
      contextType,
      quoteRequestCode,
      bookingReference,
    } = emailData;

    if (!recipientEmail || !senderName || !messageContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('Required SendGrid configuration is missing');
    }

    // Determine email subject based on context
    let subject = `New message from ${senderName}`;
    if (contextType === 'quote' && quoteRequestCode) {
      subject = `New message about Quote ${quoteRequestCode}`;
    } else if (contextType === 'booking' && bookingReference) {
      subject = `New message about Booking ${bookingReference}`;
    }

    // Create context description
    let contextDescription = '';
    if (contextType === 'quote' && quoteRequestCode) {
      contextDescription = `<p style="background-color: #f8f9fa; padding: 12px; border-left: 4px solid #1A2B3C; margin: 16px 0;">
        <strong>Quote Request:</strong> ${quoteRequestCode}<br/>
        This message is about your flight quote request.
      </p>`;
    } else if (contextType === 'booking' && bookingReference) {
      contextDescription = `<p style="background-color: #f8f9fa; padding: 12px; border-left: 4px solid #1A2B3C; margin: 16px 0;">
        <strong>Booking:</strong> ${bookingReference}<br/>
        This message is about your flight booking.
      </p>`;
    }

    // Create unread badge
    const unreadBadge = unreadCount > 1 
      ? `<span style="background-color: #dc3545; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px;">${unreadCount} unread</span>`
      : '';

    const msg = {
      to: recipientEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: 'Charter Aviation Platform'
      },
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${process.env.NEXT_PUBLIC_APP_URL}/branding/logos/dark/charter%20logo%20-%20light%20mode.png" alt="Charter" style="height: 40px;" />
          </div>

          <!-- Main Content -->
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1A2B3C; margin-top: 0; margin-bottom: 20px;">
              New Message${unreadBadge}
            </h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hello <strong>${recipientName}</strong>,
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              You have received a new message from <strong>${senderName}</strong> in your Charter conversation: <strong>${conversationTitle}</strong>
            </p>

            ${contextDescription}

            <!-- Message Content -->
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #7CB9E8;">
              <p style="margin: 0; font-style: italic; color: #666; font-size: 14px;">Message:</p>
              <p style="margin: 8px 0 0 0; font-size: 16px; color: #333;">
                ${messageContent.length > 200 ? messageContent.substring(0, 200) + '...' : messageContent}
              </p>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${conversationUrl}" 
                 style="background-color: #1A2B3C; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                View Conversation
              </a>
            </div>

            <!-- Footer Info -->
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 14px; color: #666; margin: 0;">
                You're receiving this email because you have message notifications enabled. 
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile" style="color: #1A2B3C;">Manage your notification preferences</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #666;">
            <p style="margin: 0;">
              Charter Aviation Platform<br/>
              Making private jet travel accessible and efficient
            </p>
            <p style="margin: 10px 0 0 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #1A2B3C;">Visit Charter</a> | 
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/messages" style="color: #1A2B3C;">View All Messages</a>
            </p>
          </div>
        </body>
        </html>
      `,
      // Plain text version for email clients that don't support HTML
      text: `
        New Message from ${senderName}
        
        Hello ${recipientName},
        
        You have received a new message from ${senderName} in your Charter conversation: ${conversationTitle}
        
        ${contextType === 'quote' && quoteRequestCode ? `Quote Request: ${quoteRequestCode}` : ''}
        ${contextType === 'booking' && bookingReference ? `Booking: ${bookingReference}` : ''}
        
        Message: ${messageContent}
        
        View the full conversation at: ${conversationUrl}
        
        You're receiving this email because you have message notifications enabled.
        Manage your notification preferences at: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile
        
        Charter Aviation Platform
        Making private jet travel accessible and efficient
      `,
    };

    await sgMail.send(msg);
    console.log(`Message notification email sent to ${recipientEmail}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending message notification email:', error?.response?.body || error);
    return NextResponse.json(
      {
        error: 'Failed to send message notification email',
        details: error?.response?.body?.errors || error.message,
      },
      { status: 500 }
    );
  }
} 