import { wrapEmail, EMAIL_COLORS } from '@/emails/baseTemplate';

export interface BuildOperatorQuoteEmailParams {
  operatorFirstName: string;
  quoteRequestCode: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string; // already formatted string
  passengerCount: number;
  tripType: 'one-way' | 'round-trip' | string;
  requestId: string;
  baseUrl: string;
}

export function buildOperatorQuoteNotification({
  operatorFirstName,
  quoteRequestCode,
  departureAirport,
  arrivalAirport,
  departureDate,
  passengerCount,
  tripType,
  requestId,
  baseUrl,
}: BuildOperatorQuoteEmailParams) {
  const { PRIMARY } = EMAIL_COLORS;

  const subject = `New Quote Request: ${quoteRequestCode}`;

  const innerRowsHtml = `
    <!-- Greeting -->
    <tr>
      <td style="padding:32px 24px 16px;font-family:Arial,Helvetica,sans-serif;font-size:18px;color:${PRIMARY};">
        Hello <strong>${operatorFirstName}</strong>,
      </td>
    </tr>

    <!-- Introduction -->
    <tr>
      <td style="padding:0 24px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:${PRIMARY};">
        A new quote request has been submitted and is waiting for your response.
      </td>
    </tr>

    <!-- Details card -->
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

    <!-- CTA Button -->
    <tr>
      <td align="center" style="padding:24px;">
        <a href="${baseUrl}/dashboard/quotes/incoming?openRequest=${requestId}"
           style="background:${PRIMARY};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;display:inline-block;">
           Submit Your Quote
        </a>
      </td>
    </tr>

    <!-- Benefits -->
    <tr>
      <td style="padding:0 24px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f0e7;border-radius:6px;">
          <tr>
            <td style="padding:20px;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:${PRIMARY};">
              <strong>Why respond quickly?</strong>
              <ul style="margin:8px 0 0 20px;padding:0;color:${PRIMARY};opacity:0.9;font-size:14px;">
                <li>Early quotes get more visibility</li>
                <li>Build strong relationships with clients</li>
                <li>Increase your booking conversion rate</li>
                <li>Grow your operator rating and reputation</li>
              </ul>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  const html = wrapEmail({ subject, innerRowsHtml, baseUrl });

  // Text version
  const text = `New Quote Request Available - ${quoteRequestCode}\n\n` +
    `Hello ${operatorFirstName},\n\n` +
    `A new quote request has been submitted and is ready for your response.\n\n` +
    `Request Details:\n` +
    `- Request Code: ${quoteRequestCode}\n` +
    `- Route: ${departureAirport} -> ${arrivalAirport}\n` +
    `- Departure: ${departureDate}\n` +
    `- Passengers: ${passengerCount}\n` +
    `- Trip Type: ${tripType}\n\n` +
    `Submit your quote: ${baseUrl}/dashboard/quotes/incoming?openRequest=${requestId}\n\n` +
    `Why respond quickly?\n` +
    `• Early quotes get more visibility\n` +
    `• Build strong relationships with clients\n` +
    `• Increase your booking conversion rate\n` +
    `• Grow your operator rating and reputation\n`;

  return { subject, html, text };
} 