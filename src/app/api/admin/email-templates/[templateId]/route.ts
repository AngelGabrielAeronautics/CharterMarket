import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_EMAIL_TEMPLATES } from '@/types/email';
import fs from 'fs/promises';
import path from 'path';
import { buildWelcomeEmail } from '@/emails/welcomeTemplate';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const template = SYSTEM_EMAIL_TEMPLATES.find(t => t.id === templateId);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Read the template file content
    const filePath = path.join(process.cwd(), template.filePath);
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // Extract HTML and text content from the route file
    const htmlMatch = fileContent.match(/html:\s*`([^`]*)`/s);
    const textMatch = fileContent.match(/text:\s*`([^`]*)`/s);
    const subjectMatch = fileContent.match(/subject:\s*['"`]([^'"`]+)['"`]/);
    
    return NextResponse.json({
      success: true,
      template: {
        ...template,
        currentHtml: htmlMatch ? htmlMatch[1] : '',
        currentText: textMatch ? textMatch[1] : '',
        currentSubject: subjectMatch ? subjectMatch[1] : template.name,
        fileContent,
        lastModified: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error fetching email template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const { htmlContent, textContent, subject } = await request.json();
    
    const template = SYSTEM_EMAIL_TEMPLATES.find(t => t.id === templateId);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Read current file content
    const filePath = path.join(process.cwd(), template.filePath);
    let fileContent = await fs.readFile(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.backup.${Date.now()}`;
    await fs.writeFile(backupPath, fileContent);
    
    // Update the file content
    if (subject) {
      // Update subject
      fileContent = fileContent.replace(
        /subject:\s*['"`][^'"`]*['"`]/,
        `subject: \`${subject}\``
      );
    }
    
    if (htmlContent) {
      // Update HTML content
      fileContent = fileContent.replace(
        /html:\s*`[^`]*`/s,
        `html: \`${htmlContent}\``
      );
    }
    
    if (textContent) {
      // Update text content
      fileContent = fileContent.replace(
        /text:\s*`[^`]*`/s,
        `text: \`${textContent}\``
      );
    }
    
    // Write updated content back to file
    await fs.writeFile(filePath, fileContent);
    
    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
      backupPath
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const { sampleData } = await request.json();
    
    const template = SYSTEM_EMAIL_TEMPLATES.find(t => t.id === templateId);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Special handling for welcome email template
    if (templateId === 'welcome') {
      return await generateWelcomeEmailPreview(sampleData);
    }

    // Read the template file content
    const filePath = path.join(process.cwd(), template.filePath);
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // Extract HTML and text content
    const htmlMatch = fileContent.match(/html:\s*`([^`]*)`/s);
    const textMatch = fileContent.match(/text:\s*`([^`]*)`/s);
    
    let htmlContent = htmlMatch ? htmlMatch[1] : '';
    let textContent = textMatch ? textMatch[1] : '';
    
    // Replace variables with sample data
    if (sampleData) {
      Object.entries(sampleData).forEach(([key, value]) => {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        htmlContent = htmlContent.replace(regex, String(value));
        textContent = textContent.replace(regex, String(value));
      });
    }
    
    return NextResponse.json({
      success: true,
      preview: {
        html: htmlContent,
        text: textContent,
        sampleData
      }
    });
  } catch (error) {
    console.error('Error generating template preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate template preview' },
      { status: 500 }
    );
  }
}

async function generateWelcomeEmailPreview(sampleData: any) {
  try {
    const { firstName = 'John', email = 'john@example.com', userCode = 'USR001', role = 'passenger', company = 'Example Corp' } = sampleData || {};

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const { html, text } = buildWelcomeEmail({
      firstName,
      email,
      userCode,
      role,
      company,
      baseUrl,
    });

    return NextResponse.json({
      success: true,
      preview: {
        html,
        text,
        sampleData: sampleData || {},
      },
    });
  } catch (error) {
    console.error('Error generating welcome email preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate welcome email preview' },
      { status: 500 }
    );
  }
} 