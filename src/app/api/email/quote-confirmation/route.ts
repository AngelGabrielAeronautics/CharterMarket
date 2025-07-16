import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request: Request) {
  try {
    const {
      passengerEmail,
      passengerFirstName,
      quoteRequestCode,
      departureAirport,
      arrivalAirport,
      departureDate,
      returnDate,
      passengerCount,
      tripType,
      additionalInfo,
      requestId,
    } = await request.json();

    if (!passengerEmail || !passengerFirstName || !quoteRequestCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('Required SendGrid configuration is missing');
    }

    // Format departure date
    const formattedDepartureDate = departureDate 
      ? new Date(departureDate.seconds ? departureDate.seconds * 1000 : departureDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'Not specified';

    // Format return date if it exists
    const formattedReturnDate = returnDate 
      ? new Date(returnDate.seconds ? returnDate.seconds * 1000 : returnDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : null;

    const msg = {
      to: passengerEmail,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `Quote Request Confirmation - ${quoteRequestCode}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Quote Request Confirmation</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #1A2B3C 0%, #2c4757 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
            .header p { color: #C4A962; margin: 10px 0 0 0; font-size: 16px; }
            .content { padding: 40px 30px; }
            .confirmation-badge { background-color: #e8f5e8; color: #2e7d32; padding: 12px 20px; border-radius: 25px; display: inline-block; font-weight: 600; margin-bottom: 30px; }
            .quote-details { background-color: #f8f9fa; border-left: 4px solid #1A2B3C; padding: 25px; margin: 25px 0; border-radius: 0 8px 8px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { font-weight: 600; color: #555; }
            .detail-value { color: #1A2B3C; font-weight: 500; }
            .route-highlight { background: linear-gradient(135deg, #7CB9E8 0%, #4a9eff 100%); color: white; padding: 15px 20px; border-radius: 8px; text-align: center; margin: 20px 0; font-size: 18px; font-weight: 600; }
            .button { background: linear-gradient(135deg, #C4A962 0%, #d4bb72 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e0e0e0; }
            .logo { font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -1px; }
            .benefits { background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .benefits h3 { color: #1A2B3C; margin-top: 0; }
            .benefits ul { color: #555; line-height: 1.6; }
            .next-steps { background-color: #fff8e7; border: 1px solid #C4A962; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .next-steps h3 { color: #C4A962; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">charter.</div>
              <p>Quote Request Confirmation</p>
            </div>
            
            <div class="content">
              <div class="confirmation-badge">
                ✅ Quote Request Submitted Successfully
              </div>
              
              <h2>Hello ${passengerFirstName},</h2>
              
              <p>Thank you for choosing Charter for your private jet travel needs. Your quote request has been successfully submitted and is now being reviewed by our network of certified operators.</p>
              
              <div class="route-highlight">
                ${departureAirport} → ${arrivalAirport}
              </div>
              
              <div class="quote-details">
                <h3 style="margin-top: 0; color: #1A2B3C;">Your Quote Request Details</h3>
                
                <div class="detail-row">
                  <span class="detail-label">Request Code:</span>
                  <span class="detail-value">${quoteRequestCode}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Route:</span>
                  <span class="detail-value">${departureAirport} → ${arrivalAirport}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Departure Date:</span>
                  <span class="detail-value">${formattedDepartureDate}</span>
                </div>
                
                ${formattedReturnDate ? `
                <div class="detail-row">
                  <span class="detail-label">Return Date:</span>
                  <span class="detail-value">${formattedReturnDate}</span>
                </div>
                ` : ''}
                
                <div class="detail-row">
                  <span class="detail-label">Passengers:</span>
                  <span class="detail-value">${passengerCount}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Trip Type:</span>
                  <span class="detail-value">${tripType === 'one-way' ? 'One Way' : 'Round Trip'}</span>
                </div>
                
                ${additionalInfo ? `
                <div class="detail-row">
                  <span class="detail-label">Additional Information:</span>
                  <span class="detail-value">${additionalInfo}</span>
                </div>
                ` : ''}
              </div>
              
              <div class="next-steps">
                <h3>What Happens Next?</h3>
                <ol>
                  <li><strong>Operator Review</strong> - Our certified operators are now reviewing your request</li>
                  <li><strong>Quote Generation</strong> - You'll receive personalized quotes within 24 hours</li>
                  <li><strong>Compare & Choose</strong> - Review all quotes and select your preferred option</li>
                  <li><strong>Book & Fly</strong> - Complete your booking and enjoy your flight</li>
                </ol>
              </div>
              
              <div class="benefits">
                <h3>Why Charter?</h3>
                <ul>
                  <li><strong>Multiple Quotes:</strong> Compare prices from different operators</li>
                  <li><strong>Certified Operators:</strong> All aircraft are operated by licensed professionals</li>
                  <li><strong>Transparent Pricing:</strong> No hidden fees or surprises</li>
                  <li><strong>24/7 Support:</strong> Our team is here to help throughout your journey</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/quotes/request?id=${requestId}" class="button">
                  View Request Details
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                <strong>Questions?</strong> Our customer support team is ready to assist you. Simply reply to this email or contact us through your Charter dashboard.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>Charter Aviation Platform</strong></p>
              <p>Making private jet travel accessible and efficient</p>
              <p style="margin-top: 20px;">
                You're receiving this email because you submitted a quote request on Charter. 
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile" style="color: #1A2B3C;">Manage your notification preferences</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      // Plain text version
      text: `
        Quote Request Confirmation - ${quoteRequestCode}
        
        Hello ${passengerFirstName},
        
        Thank you for choosing Charter for your private jet travel needs. Your quote request has been successfully submitted and is now being reviewed by our network of certified operators.
        
        Your Quote Request Details:
        - Request Code: ${quoteRequestCode}
        - Route: ${departureAirport} → ${arrivalAirport}
        - Departure Date: ${formattedDepartureDate}
        ${formattedReturnDate ? `- Return Date: ${formattedReturnDate}` : ''}
        - Passengers: ${passengerCount}
        - Trip Type: ${tripType === 'one-way' ? 'One Way' : 'Round Trip'}
        ${additionalInfo ? `- Additional Information: ${additionalInfo}` : ''}
        
        What Happens Next?
        1. Operator Review - Our certified operators are now reviewing your request
        2. Quote Generation - You'll receive personalized quotes within 24 hours
        3. Compare & Choose - Review all quotes and select your preferred option
        4. Book & Fly - Complete your booking and enjoy your flight
        
        Why Charter?
        - Multiple Quotes: Compare prices from different operators
        - Certified Operators: All aircraft are operated by licensed professionals
        - Transparent Pricing: No hidden fees or surprises
        - 24/7 Support: Our team is here to help throughout your journey
        
        View your request details at: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/quotes/request?id=${requestId}
        
        Questions? Our customer support team is ready to assist you. Simply reply to this email or contact us through your Charter dashboard.
        
        Charter Aviation Platform
        Making private jet travel accessible and efficient
        
        You're receiving this email because you submitted a quote request on Charter.
        Manage your notification preferences at: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile
      `,
    };

    await sgMail.send(msg);
    console.log('Quote confirmation email sent successfully to:', passengerEmail);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending quote confirmation email:', error?.response?.body || error);
    return NextResponse.json(
      {
        error: 'Failed to send quote confirmation email',
        details: error?.response?.body?.errors || error.message,
      },
      { status: 500 }
    );
  }
} 