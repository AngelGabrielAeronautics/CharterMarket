import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

// Set the API key for SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const {
      operatorEmail,
      operatorFirstName,
      quoteRequestCode,
      departureAirport,
      arrivalAirport,
      departureDate,
      passengerCount,
      tripType,
      requestId,
    } = await request.json();

    if (!operatorEmail || !operatorFirstName || !quoteRequestCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('Required SendGrid configuration is missing');
    }

    // Format departure date
    const formattedDate = departureDate 
      ? new Date(departureDate.seconds ? departureDate.seconds * 1000 : departureDate).toLocaleDateString()
      : 'Not specified';

    const msg = {
      to: operatorEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: 'Charter Aviation Platform'
      },
      subject: `New Quote Request: ${quoteRequestCode}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Quote Request - ${quoteRequestCode}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${process.env.NEXT_PUBLIC_APP_URL}/branding/logos/dark/charter%20logo%20-%20light%20mode.png" alt="Charter" style="height: 40px;" />
          </div>

          <!-- Main Content -->
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1A2B3C; margin-top: 0; margin-bottom: 20px;">
              🛩️ New Quote Request Available
            </h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hello <strong>${operatorFirstName}</strong>,
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              A new quote request has been submitted on Charter and is ready for your response.
            </p>

            <!-- Request Details -->
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #1A2B3C;">
              <h3 style="color: #1A2B3C; margin-top: 0; margin-bottom: 15px;">Request Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #666;">Request Code:</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #1A2B3C;">${quoteRequestCode}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Route:</td>
                  <td style="padding: 8px 0;">${departureAirport} → ${arrivalAirport}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Departure:</td>
                  <td style="padding: 8px 0;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Passengers:</td>
                  <td style="padding: 8px 0;">${passengerCount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Trip Type:</td>
                  <td style="padding: 8px 0; text-transform: capitalize;">${tripType}</td>
                </tr>
              </table>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/quotes/incoming?openRequest=${requestId}" 
                 style="background-color: #1A2B3C; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                Submit Your Quote
              </a>
            </div>

            <!-- Benefits -->
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1A2B3C; margin-top: 0; margin-bottom: 12px; font-size: 16px;">Why respond quickly?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li>Early quotes get more visibility</li>
                <li>Build strong relationships with clients</li>
                <li>Increase your booking conversion rate</li>
                <li>Grow your operator rating and reputation</li>
              </ul>
            </div>

            <!-- Footer Info -->
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 14px; color: #666; margin: 0;">
                You're receiving this email because you're registered as an aircraft operator on Charter. 
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile" style="color: #1A2B3C;">Manage your notification preferences</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #666;">
            <p style="margin: 0;">
              Charter Aviation Platform<br/>
              Making private jet travel accessible and efficient
            </p>
            <p style="margin: 10px 0 0 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #1A2B3C;">Visit Charter</a> | 
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/quotes/incoming" style="color: #1A2B3C;">View All Quote Requests</a>
            </p>
          </div>
        </body>
        </html>
      `,
      // Plain text version
      text: `
        New Quote Request Available - ${quoteRequestCode}
        
        Hello ${operatorFirstName},
        
        A new quote request has been submitted on Charter and is ready for your response.
        
        Request Details:
        - Request Code: ${quoteRequestCode}
        - Route: ${departureAirport} → ${arrivalAirport}
        - Departure: ${formattedDate}
        - Passengers: ${passengerCount}
        - Trip Type: ${tripType}
        
        Submit your quote at: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/quotes/incoming?openRequest=${requestId}
        
        Why respond quickly?
        - Early quotes get more visibility
        - Build strong relationships with clients
        - Increase your booking conversion rate
        - Grow your operator rating and reputation
        
        You're receiving this email because you're registered as an aircraft operator on Charter.
        Manage your notification preferences at: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile
        
        Charter Aviation Platform
        Making private jet travel accessible and efficient
      `,
    };

    await sgMail.send(msg);
    console.log('Operator quote notification sent successfully to:', operatorEmail);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending operator quote notification:', error?.response?.body || error);
    return NextResponse.json(
      {
        error: 'Failed to send operator quote notification',
        details: error?.response?.body?.errors || error.message,
      },
      { status: 500 }
    );
  }
} 