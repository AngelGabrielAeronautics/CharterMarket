import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { buildOperatorQuoteNotification } from '@/emails/operatorQuoteNotificationTemplate';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const {
      operatorEmail,
      operatorFirstName,
      quoteRequestCode,
      departureAirport,
      arrivalAirport,
      departureDate,
      passengerCount,
      tripType,
      requestId,
    } = await request.json();

    if (!operatorEmail || !operatorFirstName || !quoteRequestCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('Required SendGrid configuration is missing');
    }

    // Format departure date string (if provided as timestamp)
    const formattedDate = departureDate
      ? new Date(
          (departureDate.seconds ? departureDate.seconds * 1000 : departureDate)
        ).toLocaleDateString()
      : 'Not specified';

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const { subject, html, text } = buildOperatorQuoteNotification({
      operatorFirstName,
      quoteRequestCode,
      departureAirport,
      arrivalAirport,
      departureDate: formattedDate,
      passengerCount,
      tripType,
      requestId,
      baseUrl,
    });

    const msg = {
      to: operatorEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL as string,
        name: 'Charter',
      },
      subject,
      html,
      text,
    };

    await sgMail.send(msg);
    console.log('Operator quote notification sent successfully to:', operatorEmail);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending operator quote notification:', error?.response?.body || error);
    return NextResponse.json(
      {
        error: 'Failed to send operator quote notification',
        details: error?.response?.body?.errors || error.message,
      },
      { status: 500 }
    );
  }
} 