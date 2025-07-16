import { NextResponse } from 'next/server';
import { SYSTEM_EMAIL_TEMPLATES, SystemEmailTemplate } from '@/types/email';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Read all email template files to extract current content
    const templatesWithContent = await Promise.all(
      SYSTEM_EMAIL_TEMPLATES.map(async (template) => {
        try {
          const filePath = path.join(process.cwd(), template.filePath);
          const fileContent = await fs.readFile(filePath, 'utf8');
          
          // Extract HTML and text content from the route file
          const htmlMatch = fileContent.match(/html:\s*`([^`]+)`/s);
          const textMatch = fileContent.match(/text:\s*`([^`]+)`/s);
          const subjectMatch = fileContent.match(/subject:\s*['"`]([^'"`]+)['"`]/);
          
          return {
            ...template,
            currentHtml: htmlMatch ? htmlMatch[1] : '',
            currentText: textMatch ? textMatch[1] : '',
            currentSubject: subjectMatch ? subjectMatch[1] : template.name,
            fileContent,
            lastModified: new Date().toISOString(), // In real implementation, get from file stats
          };
        } catch (error) {
          console.error(`Error reading template file ${template.filePath}:`, error);
          return {
            ...template,
            currentHtml: '',
            currentText: '',
            currentSubject: template.name,
            fileContent: '',
            lastModified: new Date().toISOString(),
            error: 'Unable to read template file'
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      templates: templatesWithContent
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
} 