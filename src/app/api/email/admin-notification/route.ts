import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request: Request) {
  try {
    const { newUserEmail, newUserFirstName, newUserLastName, newUserRole, newUserCode, company } = await request.json();

    if (!newUserEmail || !newUserFirstName || !newUserLastName || !newUserRole || !newUserCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('Required SendGrid configuration is missing');
    }

    const msg = {
      to: 'noreply@chartermarket.app',
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'New User Registration - Charter Platform',
      html: `
        <h2>New User Registration</h2>
        <p>A new user has registered on the Charter platform:</p>
        <ul>
          <li><strong>Name:</strong> ${newUserFirstName} ${newUserLastName}</li>
          <li><strong>Email:</strong> ${newUserEmail}</li>
          <li><strong>Role:</strong> ${newUserRole}</li>
          <li><strong>User Code:</strong> ${newUserCode}</li>
          ${company ? `<li><strong>Company:</strong> ${company}</li>` : ''}
        </ul>
        <p>Please review this registration if necessary.</p>
      `,
    };

    await sgMail.send(msg);
    console.log('Admin notification sent successfully for new user:', newUserCode);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending admin notification:', error?.response?.body || error);
    return NextResponse.json(
      { 
        error: 'Failed to send admin notification',
        details: error?.response?.body?.errors || error.message
      },
      { status: 500 }
    );
  }
} 