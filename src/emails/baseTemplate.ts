export const EMAIL_COLORS = {
  PRIMARY: '#0b3847',
  SECONDARY: '#C4A962',
  ACCENT: '#7CB9E8',
  BG: '#F2F0E7',
};

/**
 * Wrap inner HTML (rows) in standard Charter e-mail frame.
 */
export function wrapEmail({ subject, innerRowsHtml, baseUrl }: {
  subject: string;
  innerRowsHtml: string; // <tr>...</tr> rows ready to insert
  baseUrl: string;
}) {
  const { PRIMARY, SECONDARY, BG } = EMAIL_COLORS;

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:${BG};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};">
      <tr>
        <td align="center" style="padding:24px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;box-shadow:0 2px 12px rgba(26,43,60,.06);">
            <!-- Hero image -->
            <tr>
              <td style="padding:0;border-radius:8px 8px 0 0;">
                <img src="${baseUrl}/images/login/login_modal.png" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border-radius:8px 8px 0 0;" />
              </td>
            </tr>
            <!-- Logo & tagline (separate row – better client support) -->
            <tr>
              <td align="center" style="padding:24px 24px 0 24px;background:#ffffff;">
                <img src="${baseUrl}/branding/logos/light/charter-logo-dark-mode.png" alt="Charter" width="140" height="40" style="display:block;margin:0 auto 12px auto;max-width:140px;height:auto;" />
                <div style="color:${PRIMARY};font-size:20px;font-weight:600;margin-bottom:6px;">Welcome to Charter</div>
                <div style="color:${PRIMARY};font-size:14px;opacity:0.85;">Your premier private jet charter marketplace</div>
              </td>
            </tr>
            ${innerRowsHtml}
            <!-- App download CTA -->
            <tr>
              <td align="center" style="padding:24px;">
                <a href="${baseUrl}/download" style="text-decoration:none;display:inline-block;margin:0 4px;">
                  <img src="${baseUrl}/images/mobile/app-store-badge.png" alt="Download on the App Store" width="140" style="display:block;border:0;outline:none;text-decoration:none;" />
                </a>
                <a href="${baseUrl}/images/mobile/google-play-badge.png" style="text-decoration:none;display:inline-block;margin:0 4px;">
                  <img src="${baseUrl}/images/mobile/google-play-badge.png" alt="Get it on Google Play" width="140" style="display:block;border:0;outline:none;text-decoration:none;" />
                </a>
                <div style="font-size:12px;color:#666666;margin-top:8px;">Manage your flights on the go with the Charter mobile app</div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:${PRIMARY};color:#ffffff;padding:16px 24px;border-radius:0 0 8px 8px;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} Charter Aviation Platform ·
                <a href="${baseUrl}/privacy" style="color:${SECONDARY};text-decoration:none;">Privacy</a> ·
                <a href="${baseUrl}/terms" style="color:${SECONDARY};text-decoration:none;">Terms</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
} 