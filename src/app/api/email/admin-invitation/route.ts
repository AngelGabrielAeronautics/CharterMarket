import { NextResponse } from 'next/server';
import { sendGridClient } from '@/lib/sendgrid';

export async function POST(request: Request) {
  try {
    const { email, firstName, invitationId } = await request.json();

    if (!email || !firstName || !invitationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email using SendGrid
    await sendGridClient.send({
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: 'Charter Aviation Platform'
      },
      templateId: process.env.SENDGRID_ADMIN_INVITATION_TEMPLATE_ID!,
      dynamicTemplateData: {
        firstName,
        invitationLink: `${process.env.NEXT_PUBLIC_APP_URL}/admin/register?invitation=${invitationId}`,
        expiryDays: 7
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending admin invitation email:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation email' },
      { status: 500 }
    );
  }
} 