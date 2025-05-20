import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, firstName, role, reminderNumber, nextStep } = await request.json();

    if (!email || !firstName || !role || !reminderNumber || !nextStep) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('Required SendGrid configuration is missing');
    }

    // Customize message based on reminder number
    let subject, urgencyMessage;
    switch (reminderNumber) {
      case 1: // 24 hours
        subject = 'Complete Your Charter Registration';
        urgencyMessage = "We noticed you haven't completed your registration yet.";
        break;
      case 2: // 3 days
        subject = "Don't Miss Out - Complete Your Charter Registration";
        urgencyMessage = "You're missing out on connecting with potential clients.";
        break;
      case 3: // 7 days
        subject = 'Final Reminder - Charter Registration';
        urgencyMessage = 'This is your final reminder to complete your registration.';
        break;
      default:
        subject = 'Complete Your Charter Registration';
        urgencyMessage = 'Please complete your registration.';
    }

    const roleSpecificMessage =
      role === 'operator'
        ? 'Start receiving quote requests and growing your business.'
        : 'Start booking private flights with ease.';

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html: `
        <h2>Hello ${firstName},</h2>
        <p>${urgencyMessage}</p>
        <p>Your next step is to: <strong>${nextStep}</strong></p>
        <p>${roleSpecificMessage}</p>
        <p>It only takes a few minutes to complete your registration and start using Charter.</p>
        <div style="margin: 20px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background-color: #1A2B3C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            COMPLETE REGISTRATION
          </a>
        </div>
        ${reminderNumber === 3 ? '<p><em>Note: This will be your final reminder. After 24 hours, your registration will become dormant.</em></p>' : ''}
        <p>If you need any assistance, please don't hesitate to contact our support team.</p>
      `,
    };

    await sgMail.send(msg);
    console.log(`Registration reminder ${reminderNumber} sent successfully to:`, email);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending registration reminder:', error?.response?.body || error);
    return NextResponse.json(
      {
        error: 'Failed to send registration reminder',
        details: error?.response?.body?.errors || error.message,
      },
      { status: 500 }
    );
  }
}
