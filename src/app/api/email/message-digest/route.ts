import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

interface MessageDigestData {
  userCode: string;
  userName: string;
  userEmail: string;
  period: 'hourly' | 'daily';
  totalUnreadCount: number;
  conversationCount: number;
  conversations: Array<{
    conversation: {
      id: string;
      title: string;
      contextType?: string;
      contextId?: string;
      lastMessage?: {
        content: string;
        senderId: string;
        timestamp: any;
      };
    };
    unreadCount: number;
  }>;
  dashboardUrl: string;
}

export async function POST(request: Request) {
  try {
    const digestData: MessageDigestData = await request.json();

    const {
      userName,
      userEmail,
      period,
      totalUnreadCount,
      conversationCount,
      conversations,
      dashboardUrl,
    } = digestData;

    if (!userEmail || !userName || !conversations) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('Required SendGrid configuration is missing');
    }

    // Create subject line
    const periodText = period === 'hourly' ? 'Hourly' : 'Daily';
    const subject = `${periodText} Message Summary - ${totalUnreadCount} unread message${totalUnreadCount === 1 ? '' : 's'}`;

    // Generate conversation summaries
    const conversationSummaries = conversations.map(({ conversation, unreadCount }) => {
      const contextBadge = conversation.contextType 
        ? `<span style="background-color: #7CB9E8; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 8px;">${conversation.contextType.toUpperCase()}</span>`
        : '';

      const lastMessagePreview = conversation.lastMessage?.content 
        ? conversation.lastMessage.content.substring(0, 100) + (conversation.lastMessage.content.length > 100 ? '...' : '')
        : 'No preview available';

      return `
        <div style="border: 1px solid #e9ecef; border-radius: 6px; padding: 16px; margin-bottom: 16px; background-color: #ffffff;">
          <h4 style="margin: 0 0 8px 0; color: #1A2B3C;">
            ${conversation.title || 'Charter Conversation'}${contextBadge}
            <span style="background-color: #dc3545; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 8px;">
              ${unreadCount} unread
            </span>
          </h4>
          <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.4;">
            ${lastMessagePreview}
          </p>
        </div>
      `;
    }).join('');

    const msg = {
      to: userEmail,
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
            <!-- Header -->
            <h2 style="color: #1A2B3C; margin-top: 0; margin-bottom: 8px;">
              📧 ${periodText} Message Summary
            </h2>
            <p style="color: #666; margin-bottom: 24px; font-size: 14px;">
              ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hello <strong>${userName}</strong>,
            </p>
            
            <!-- Summary Stats -->
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
              <div style="display: inline-block; margin: 0 20px;">
                <div style="font-size: 32px; font-weight: bold; color: #1A2B3C;">${totalUnreadCount}</div>
                <div style="font-size: 14px; color: #666;">Unread Messages</div>
              </div>
              <div style="display: inline-block; margin: 0 20px;">
                <div style="font-size: 32px; font-weight: bold; color: #7CB9E8;">${conversationCount}</div>
                <div style="font-size: 14px; color: #666;">Active Conversations</div>
              </div>
            </div>

            <p style="font-size: 16px; margin-bottom: 24px;">
              You have <strong>${totalUnreadCount} unread message${totalUnreadCount === 1 ? '' : 's'}</strong> 
              across <strong>${conversationCount} conversation${conversationCount === 1 ? '' : 's'}</strong> 
              on your Charter platform.
            </p>

            <!-- Conversations -->
            <h3 style="color: #1A2B3C; margin-bottom: 16px;">Recent Conversations</h3>
            ${conversationSummaries}

            ${conversations.length > 10 ? `
            <p style="text-align: center; font-style: italic; color: #666; margin: 20px 0;">
              ... and ${conversations.length - 10} more conversation${conversations.length - 10 === 1 ? '' : 's'}
            </p>
            ` : ''}

            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background-color: #1A2B3C; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                View All Messages
              </a>
            </div>

            <!-- Tips -->
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h4 style="color: #1A2B3C; margin-top: 0; margin-bottom: 12px; font-size: 16px;">💡 Pro Tips</h4>
              <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px;">
                <li>Reply quickly to maintain good communication with your ${period === 'hourly' ? 'clients' : 'partners'}</li>
                <li>Use the mobile app for instant notifications and faster responses</li>
                <li>Set up conversation filters to prioritize urgent messages</li>
              </ul>
            </div>

            <!-- Footer Info -->
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 14px; color: #666; margin: 0;">
                You're receiving this ${period} digest because you have message notifications enabled. 
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
              <a href="${dashboardUrl}" style="color: #1A2B3C;">View Messages</a> | 
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile" style="color: #1A2B3C;">Preferences</a>
            </p>
          </div>
        </body>
        </html>
      `,
      // Plain text version
      text: `
        ${periodText} Message Summary - ${totalUnreadCount} unread messages
        
        Hello ${userName},
        
        You have ${totalUnreadCount} unread message${totalUnreadCount === 1 ? '' : 's'} across ${conversationCount} conversation${conversationCount === 1 ? '' : 's'} on your Charter platform.
        
        Recent Conversations:
        ${conversations.map(({ conversation, unreadCount }) => 
          `- ${conversation.title || 'Charter Conversation'} (${unreadCount} unread)
             ${conversation.lastMessage?.content ? conversation.lastMessage.content.substring(0, 100) + '...' : ''}`
        ).join('\n')}
        
        View all messages: ${dashboardUrl}
        
        Pro Tips:
        - Reply quickly to maintain good communication
        - Use the mobile app for instant notifications
        - Set up conversation filters to prioritize urgent messages
        
        You're receiving this ${period} digest because you have message notifications enabled.
        Manage your notification preferences: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile
        
        Charter Aviation Platform
        Making private jet travel accessible and efficient
      `,
    };

    await sgMail.send(msg);
    console.log(`Message digest email sent to ${userEmail}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending message digest email:', error?.response?.body || error);
    return NextResponse.json(
      {
        error: 'Failed to send message digest email',
        details: error?.response?.body?.errors || error.message,
      },
      { status: 500 }
    );
  }
} 