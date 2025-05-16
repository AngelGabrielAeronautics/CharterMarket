import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import sgMail from '@sendgrid/mail';

export async function POST(request: Request) {
  // Validate SendGrid API key at request time
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (!sendgridKey) {
    return NextResponse.json(
      { error: 'SENDGRID_API_KEY is not set in environment variables' },
      { status: 500 }
    );
  }
  sgMail.setApiKey(sendgridKey);

  // Initialize Firebase Admin auth on demand
  const adminAuth = getAdminAuth();

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate verification link
    const verificationLink = await adminAuth.generateEmailVerificationLink(email);

    if (!process.env.SENDGRID_FROM_EMAIL || !process.env.SENDGRID_VERIFICATION_TEMPLATE_ID) {
      throw new Error('Required SendGrid configuration is missing');
    }

    // Send email using SendGrid
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      templateId: process.env.SENDGRID_VERIFICATION_TEMPLATE_ID,
      dynamicTemplateData: {
        verificationLink
      },
    };

    await sgMail.send(msg);
    console.log('Verification email sent successfully to:', email);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error handling verification email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to handle verification email',
        details: error?.response?.body?.errors || error.message
      },
      { status: 500 }
    );
  }
} 