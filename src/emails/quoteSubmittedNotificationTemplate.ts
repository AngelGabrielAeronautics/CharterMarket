import { wrapEmail, EMAIL_COLORS } from '@/emails/baseTemplate';

export interface BuildQuoteSubmittedEmailParams {
  passengerFirstName: string;
  quoteRequestCode: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string; // formatted string
  passengerCount: number;
  tripType: string;
  requestId: string;
  baseUrl: string;
}

export function buildQuoteSubmittedNotification({
  passengerFirstName,
  quoteRequestCode,
  departureAirport,
  arrivalAirport,
  departureDate,
  passengerCount,
  tripType,
  requestId,
  baseUrl,
}: BuildQuoteSubmittedEmailParams) {
  const { PRIMARY } = EMAIL_COLORS;

  const subject = `New Quote Available: ${quoteRequestCode}`;

  const innerRowsHtml = `
    <!-- Greeting -->
    <tr>
      <td style="padding:32px 24px 16px;font-family:Arial,Helvetica,sans-serif;font-size:18px;color:${PRIMARY};">
        Hi <strong>${passengerFirstName}</strong>,
      </td>
    </tr>

    <!-- Intro -->
    <tr>
      <td style="padding:0 24px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:${PRIMARY};">
        An operator has submitted a quote for your request. Review it any time in your dashboard.
      </td>
    </tr>

    <!-- Details -->
    <tr>
      <td style="padding:0 24px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f0e7;border-radius:6px;">
          <tr>
            <td style="padding:20px;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:${PRIMARY};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;color:${PRIMARY};opacity:0.8;">Request Code:</td>
                  <td style="padding:4px 0;font-weight:600;color:${PRIMARY};">${quoteRequestCode}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:${PRIMARY};opacity:0.8;">Route:</td>
                  <td style="padding:4px 0;">${departureAirport} → ${arrivalAirport}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:${PRIMARY};opacity:0.8;">Departure:</td>
                  <td style="padding:4px 0;">${departureDate}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:${PRIMARY};opacity:0.8;">Passengers:</td>
                  <td style="padding:4px 0;">${passengerCount}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:${PRIMARY};opacity:0.8;">Trip Type:</td>
                  <td style="padding:4px 0;text-transform:capitalize;">${tripType}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td align="center" style="padding:24px;">
        <a href="${baseUrl}/dashboard/my-quotes?openRequest=${requestId}"
           style="background:${PRIMARY};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;display:inline-block;">
           View Quote
        </a>
      </td>
    </tr>
  `;

  const html = wrapEmail({ subject, innerRowsHtml, baseUrl });

  const text = `New Quote Submitted - ${quoteRequestCode}\n\n` +
    `Hi ${passengerFirstName},\n\n` +
    `An operator has submitted a quote for your request.\n\n` +
    `Request Details:\n` +
    `- Request Code: ${quoteRequestCode}\n` +
    `- Route: ${departureAirport} -> ${arrivalAirport}\n` +
    `- Departure: ${departureDate}\n` +
    `- Passengers: ${passengerCount}\n` +
    `- Trip Type: ${tripType}\n\n` +
    `View quote: ${baseUrl}/dashboard/my-quotes?openRequest=${requestId}\n`;

  return { subject, html, text };
} 