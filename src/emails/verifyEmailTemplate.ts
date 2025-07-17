import { wrapEmail, EMAIL_COLORS } from '@/emails/baseTemplate';

export interface BuildVerifyEmailParams {
  email: string;
  verificationLink: string;
  firstName?: string;
  baseUrl: string;
}

/**
 * Build subject, HTML and plaintext for e-mail-verification message.
 */
export function buildVerifyEmail({
  email,
  verificationLink,
  firstName,
  baseUrl,
}: BuildVerifyEmailParams) {
  const namePart = firstName ? `, ${firstName}` : '';
  const subject = `Confirm your e-mail address${namePart}`;

  const { PRIMARY, SECONDARY } = EMAIL_COLORS;

  const innerRowsHtml = `
      <tr>
        <td style="padding:32px 24px;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:${PRIMARY};">
          <h1 style="margin:0 0 16px 0;font-size:24px;">Verify your e-mail${namePart}</h1>
          <p style="margin:0 0 24px 0;font-size:16px;line-height:24px;">Thanks for creating a Charter account. Before you can start using the platform we need to confirm this address belongs to you.</p>
          <p style="margin:0 0 32px 0;font-size:16px;line-height:24px;">Please click the button below to verify <strong>${email}</strong>.</p>
          <div style="text-align:center;margin-bottom:40px;">
            <a href="${verificationLink}" style="background:${SECONDARY};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:4px;font-size:16px;display:inline-block;">Verify my e-mail</a>
          </div>
          <p style="margin:0 0 8px 0;font-size:14px;color:${PRIMARY};opacity:0.8;">If you didn’t create a Charter account you can safely ignore this message.</p>
        </td>
      </tr>`;

  const html = wrapEmail({ subject, innerRowsHtml, baseUrl });

  const text = `Verify your Charter account

Hello${namePart || ''},

Please confirm your e-mail address by visiting the link below:
${verificationLink}

If you didn’t create a Charter account you can safely ignore this e-mail.
`;

  return { subject, html, text };
} 