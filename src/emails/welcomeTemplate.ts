import { wrapEmail, EMAIL_COLORS } from '@/emails/baseTemplate';

export interface BuildWelcomeEmailParams {
  firstName: string;
  email: string;
  userCode: string;
  role?: 'operator' | 'agent' | 'passenger';
  company?: string | null;
  baseUrl: string;
}

/**
 * Benefits, steps & CTA copy per role – kept close to web-app language.
 */
const roleContent = {
  operator: {
    benefits: [
      'Expand your client base with passengers actively seeking charter flights',
      'Increase revenue – receive quote requests with zero marketing spend',
      'Manage your fleet in one place and showcase aircraft details',
      'Performance insights help you track bookings and revenue',
      'Respond quickly to win more deals',
    ],
    steps: [
      { title: 'Verify your e-mail', desc: 'Click the verification link we just sent you.' },
      { title: 'Add your aircraft', desc: 'Upload fleet details and availability.' },
      { title: 'Complete company profile', desc: 'Add certificates and contact info.' },
      { title: 'Start receiving requests', desc: 'Get notified of new quote opportunities.' },
    ],
    cta: { text: 'Set up my fleet', url: '/dashboard/aircraft' },
  },
  agent: {
    benefits: [
      'Compare multiple operator quotes with a single request',
      'Manage clients and bookings from one dashboard',
      'Handle complex itineraries with ease',
      'Professional invoicing & analytics tools',
      'All operators are licensed and vetted',
    ],
    steps: [
      { title: 'Verify your e-mail', desc: 'Click the verification link we just sent you.' },
      { title: 'Add your first client', desc: 'Create a client profile for smoother bookings.' },
      { title: 'Complete your profile', desc: 'Tell us about your agency.' },
      { title: 'Request a quote', desc: 'Start booking flights for clients.' },
    ],
    cta: { text: 'Request my first quote', url: '/dashboard/quotes/request' },
  },
  passenger: {
    benefits: [
      'Request and compare multiple private-jet quotes instantly',
      'All operators are certified professionals',
      'Transparent pricing – no hidden fees',
      'Manage trips and communicate in one place',
      'Dedicated support along your journey',
    ],
    steps: [
      { title: 'Verify your e-mail', desc: 'Click the verification link we just sent you.' },
      { title: 'Request a quote', desc: 'Tell us where you want to fly.' },
      { title: 'Compare & choose', desc: 'Pick the operator that suits you best.' },
      { title: 'Book & fly', desc: 'Complete payment and enjoy your flight.' },
    ],
    cta: { text: 'Request my first quote', url: '/dashboard/quotes/request' },
  },
} as const;

type RoleKey = keyof typeof roleContent;

/**
 * Build subject, HTML, and plain-text for Charter welcome email.
 */
export function buildWelcomeEmail(params: BuildWelcomeEmailParams) {
  const {
    firstName,
    email,
    userCode,
    role = 'passenger',
    company = null,
    baseUrl,
  } = params;

  const content = roleContent[role as RoleKey];

  const subject = `Welcome to Charter, ${firstName}! ✈️`;

  // Basic colours / fonts for consistency with web app
  const { PRIMARY, SECONDARY, ACCENT } = EMAIL_COLORS;
  const BG = '#F2F0E7';

  // Generate list items
  const benefitsHtml = content.benefits
    .map((b) => `<tr><td style="padding:4px 0; font-size:14px; line-height:20px;">• ${b}</td></tr>`)  
    .join('');

  const stepsHtml = content.steps
    .map(
      (s, i) => `
      <tr>
        <td style="padding:8px 0; font-size:14px;">
          <strong style="color:${SECONDARY};">${i + 1}. ${s.title}</strong><br/>
          <span style="color:${PRIMARY}; opacity:0.8;">${s.desc}</span>
        </td>
      </tr>`
    )
    .join('');

  const ctaUrl = `${baseUrl}${content.cta.url}`;

  const innerRows = `
      <!-- Greeting & intro -->
      <tr>
        <td style="padding:32px 24px;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:${PRIMARY};">
          <h1 style="margin:0 0 16px 0;font-size:24px;">Hi ${firstName}, welcome to Charter!</h1>
          <p style="margin:0 0 24px 0;font-size:16px;line-height:24px;">${company ? `We’re thrilled to have <strong>${company}</strong> join our community.` : 'We’re thrilled you chose us for your private-aviation needs.'}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${ACCENT};border-radius:6px;">
            <tr><td style="padding:12px 16px;font-size:14px;">
              <strong>User code:</strong> ${userCode}<br/>
              <strong>Account type:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}<br/>
              <strong>E-mail:</strong> ${email}${company ? `<br/><strong>Company:</strong> ${company}` : ''}
            </td></tr>
          </table>
        </td>
      </tr>
      <!-- Benefits -->
      <tr>
        <td style="padding:0 24px 24px 24px;background:#f2f0e7;border-radius:6px;">
          <h2 style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:${PRIMARY};font-size:18px;margin:0 0 12px 0;">Why you’ll love Charter</h2>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${benefitsHtml}</table>
        </td>
      </tr>
      <!-- Steps -->
      <tr>
        <td style="padding:0 24px 24px 24px;background:#f2f0e7;border-radius:6px;">
          <h2 style="font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:${PRIMARY};font-size:18px;margin:0 0 12px 0;">Get started in 4 easy steps</h2>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${stepsHtml}</table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td align="center" style="padding:0 24px 32px 24px;">
          <a href="${ctaUrl}" style="background:${SECONDARY};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:4px;font-size:16px;display:inline-block;">${content.cta.text}</a>
        </td>
      </tr>`;

  const html = wrapEmail({ subject, innerRowsHtml: innerRows, baseUrl });

  // Plain-text (60-72 char lines for readability)
  const text = `Welcome to Charter, ${firstName}!

User code: ${userCode}
Account type: ${role}
E-mail: ${email}${company ? `\nCompany: ${company}` : ''}

Why you’ll love Charter:
${content.benefits.map((b) => `• ${b}`).join('\n')}

Get started:
${content.steps.map((s, i) => `${i + 1}. ${s.title} – ${s.desc}`).join('\n')}

${content.cta.text}: ${ctaUrl}

Need help? Reply to this e-mail any time.
`;

  return { subject, html, text };
} 