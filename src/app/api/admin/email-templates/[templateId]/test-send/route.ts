import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_EMAIL_TEMPLATES } from '@/types/email';
import sgMail from '@sendgrid/mail';
import { buildWelcomeEmail } from '@/emails/welcomeTemplate';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const { adminEmail, sampleData } = await request.json();
    
    const template = SYSTEM_EMAIL_TEMPLATES.find(t => t.id === templateId);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Admin email is required' },
        { status: 400 }
      );
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('SENDGRID_FROM_EMAIL is not set in environment variables');
    }

    // Generate email content based on template
    let htmlContent = '';
    let textContent = '';
    let subject = `[TEST] ${template.name}`;

    if (templateId === 'welcome') {
      const {
        firstName = 'John',
        email: sampleEmail = 'john@example.com',
        userCode = 'USR001',
        role = 'passenger',
        company = 'Example Corp',
      } = sampleData || {};

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

      const { subject: subj, html, text } = buildWelcomeEmail({
        firstName,
        email: sampleEmail,
        userCode,
        role,
        company,
        baseUrl,
      });
      subject = `[TEST] ${subj}`;
      htmlContent = html;
      textContent = text;
    } else {
      // For other templates, use simple variable replacement
      const fs = require('fs/promises');
      const path = require('path');
      const filePath = path.join(process.cwd(), template.filePath);
      const fileContent = await fs.readFile(filePath, 'utf8');
      
      // Extract HTML and text content
      const htmlMatch = fileContent.match(/html:\s*`([^`]*)`/s);
      const textMatch = fileContent.match(/text:\s*`([^`]*)`/s);
      const subjectMatch = fileContent.match(/subject:\s*['"`]([^'"`]+)['"`]/);
      
      htmlContent = htmlMatch ? htmlMatch[1] : '';
      textContent = textMatch ? textMatch[1] : '';
      subject = subjectMatch ? `[TEST] ${subjectMatch[1]}` : `[TEST] ${template.name}`;
      
      // Add test header to HTML
      if (htmlContent) {
        htmlContent = `
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%); color: white; padding: 16px 24px; text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
            🧪 TEST EMAIL - This is a preview of the ${template.name} template
          </div>
        ` + htmlContent;
      }
      
      if (textContent) {
        textContent = `[TEST EMAIL] - This is a preview of the ${template.name} template\n\n` + textContent;
      }
      
      // Replace variables with sample data
      if (sampleData) {
        Object.entries(sampleData).forEach(([key, value]) => {
          const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
          htmlContent = htmlContent.replace(regex, String(value));
          textContent = textContent.replace(regex, String(value));
          subject = subject.replace(regex, String(value));
        });
      }
    }

    // Send the email
    const msg = {
      to: adminEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      html: htmlContent,
      text: textContent || undefined,
    };

    await sgMail.send(msg);
    console.log('Test email sent successfully to:', adminEmail);

    return NextResponse.json({ 
      success: true, 
      message: `Test email sent successfully to ${adminEmail}` 
    });
  } catch (error: any) {
    console.error('Error sending test email:', error?.response?.body || error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error?.response?.body?.errors || error.message
      },
      { status: 500 }
    );
  }
} 