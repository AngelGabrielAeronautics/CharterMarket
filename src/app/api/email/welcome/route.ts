import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, firstName } = await request.json();

    if (!email || !firstName) {
      return NextResponse.json(
        { error: 'Email and firstName are required' },
        { status: 400 }
      );
    }

    if (!process.env.SENDGRID_FROM_EMAIL || !process.env.SENDGRID_WELCOME_TEMPLATE_ID) {
      throw new Error('Required SendGrid configuration is missing');
    }

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      templateId: process.env.SENDGRID_WELCOME_TEMPLATE_ID,
      dynamicTemplateData: {
        firstName,
        loginLink: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      },
    };

    await sgMail.send(msg);
    console.log('Welcome email sent successfully to:', email);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending welcome email:', error?.response?.body || error);
    return NextResponse.json(
      { 
        error: 'Failed to send welcome email',
        details: error?.response?.body?.errors || error.message
      },
      { status: 500 }
    );
  }
} 