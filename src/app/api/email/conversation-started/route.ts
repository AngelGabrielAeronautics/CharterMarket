import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { ConversationEmailData } from '@/lib/messaging-email';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request: Request) {
  try {
    const emailData: ConversationEmailData = await request.json();

    const {
      initiatorName,
      participantName,
      participantEmail,
      conversationTitle,
      conversationUrl,
      contextType,
      quoteRequestCode,
      bookingReference,
      initialMessage,
    } = emailData;

    if (!participantEmail || !initiatorName || !participantName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('Required SendGrid configuration is missing');
    }

    // Determine email subject based on context
    let subject = `${initiatorName} started a conversation with you`;
    if (contextType === 'quote' && quoteRequestCode) {
      subject = `${initiatorName} wants to discuss Quote ${quoteRequestCode}`;
    } else if (contextType === 'booking' && bookingReference) {
      subject = `${initiatorName} wants to discuss Booking ${bookingReference}`;
    }

    // Create context description
    let contextDescription = '';
    if (contextType === 'quote' && quoteRequestCode) {
      contextDescription = `<p style="background-color: #f8f9fa; padding: 12px; border-left: 4px solid #1A2B3C; margin: 16px 0;">
        <strong>Quote Request:</strong> ${quoteRequestCode}<br/>
        This conversation is about your flight quote request.
      </p>`;
    } else if (contextType === 'booking' && bookingReference) {
      contextDescription = `<p style="background-color: #f8f9fa; padding: 12px; border-left: 4px solid #1A2B3C; margin: 16px 0;">
        <strong>Booking:</strong> ${bookingReference}<br/>
        This conversation is about your flight booking.
      </p>`;
    }

    const msg = {
      to: participantEmail,
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
              🗨️ New Conversation Started
            </h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hello <strong>${participantName}</strong>,
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${initiatorName}</strong> has started a new conversation with you on Charter: <strong>${conversationTitle}</strong>
            </p>

            ${contextDescription}

            ${initialMessage ? `
            <!-- Initial Message -->
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #7CB9E8;">
              <p style="margin: 0; font-style: italic; color: #666; font-size: 14px;">Initial message:</p>
              <p style="margin: 8px 0 0 0; font-size: 16px; color: #333;">
                ${initialMessage.length > 200 ? initialMessage.substring(0, 200) + '...' : initialMessage}
              </p>
            </div>
            ` : ''}

            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${conversationUrl}" 
                 style="background-color: #1A2B3C; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                Join Conversation
              </a>
            </div>

            <!-- Benefits -->
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1A2B3C; margin-top: 0; margin-bottom: 12px; font-size: 16px;">Why use Charter messaging?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li>Direct communication with ${contextType === 'quote' ? 'operators' : 'clients'}</li>
                <li>All conversation history in one place</li>
                <li>Automatic sync across web and mobile</li>
                <li>Context-aware discussions about your ${contextType || 'requests'}</li>
              </ul>
            </div>

            <!-- Footer Info -->
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 14px; color: #666; margin: 0;">
                You're receiving this email because a conversation was started with you. 
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
      // Plain text version
      text: `
        New Conversation Started
        
        Hello ${participantName},
        
        ${initiatorName} has started a new conversation with you on Charter: ${conversationTitle}
        
        ${contextType === 'quote' && quoteRequestCode ? `Quote Request: ${quoteRequestCode}` : ''}
        ${contextType === 'booking' && bookingReference ? `Booking: ${bookingReference}` : ''}
        
        ${initialMessage ? `Initial message: ${initialMessage}` : ''}
        
        Join the conversation at: ${conversationUrl}
        
        Why use Charter messaging?
        - Direct communication with ${contextType === 'quote' ? 'operators' : 'clients'}
        - All conversation history in one place
        - Automatic sync across web and mobile
        - Context-aware discussions about your ${contextType || 'requests'}
        
        You're receiving this email because a conversation was started with you.
        Manage your notification preferences at: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile
        
        Charter Aviation Platform
        Making private jet travel accessible and efficient
      `,
    };

    await sgMail.send(msg);
    console.log(`Conversation started email sent to ${participantEmail}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending conversation started email:', error?.response?.body || error);
    return NextResponse.json(
      {
        error: 'Failed to send conversation started email',
        details: error?.response?.body?.errors || error.message,
      },
      { status: 500 }
    );
  }
} 