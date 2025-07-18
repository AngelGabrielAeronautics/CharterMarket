import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { buildQuoteSubmittedNotification } from '@/emails/quoteSubmittedNotificationTemplate';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const {
      passengerEmail,
      passengerFirstName,
      quoteRequestCode,
      departureAirport,
      arrivalAirport,
      departureDate,
      passengerCount,
      tripType,
      requestId,
    } = await request.json();

    if (!passengerEmail || !passengerFirstName || !quoteRequestCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('SENDGRID_FROM_EMAIL is not set');
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const { subject, html, text } = buildQuoteSubmittedNotification({
      passengerFirstName,
      quoteRequestCode,
      departureAirport,
      arrivalAirport,
      departureDate,
      passengerCount,
      tripType,
      requestId,
      baseUrl,
    });

    const msg = {
      to: passengerEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL as string,
        name: 'Charter',
      },
      subject,
      html,
      text,
    } as sgMail.MailDataRequired;

    await sgMail.send(msg);
    console.log('Quote submitted notification sent successfully to:', passengerEmail);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending quote submitted notification:', error?.response?.body || error);
    return NextResponse.json(
      { error: 'Failed to send quote submitted notification', details: error?.message },
      { status: 500 }
    );
  }
} 