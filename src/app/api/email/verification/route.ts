import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!process.env.SENDGRID_FROM_EMAIL || !process.env.SENDGRID_VERIFICATION_TEMPLATE_ID) {
      throw new Error('Required SendGrid configuration is missing');
    }

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      templateId: process.env.SENDGRID_VERIFICATION_TEMPLATE_ID,
      dynamicTemplateData: {
        verificationLink: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?email=${encodeURIComponent(email)}`,
      },
    };

    await sgMail.send(msg);
    console.log('Verification email sent successfully to:', email);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending verification email:', error?.response?.body || error);
    return NextResponse.json(
      { 
        error: 'Failed to send verification email',
        details: error?.response?.body?.errors || error.message
      },
      { status: 500 }
    );
  }
} 