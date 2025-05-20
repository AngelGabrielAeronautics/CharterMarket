import { NextRequest, NextResponse } from 'next/server';
import { getBookingById } from '@/lib/booking';
import { getPassengersForBooking } from '@/lib/passenger';

export async function GET(_req: NextRequest, { params }: { params: { bookingId: string } }) {
  try {
    const { bookingId } = await Promise.resolve(params);

    // Get booking data
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const passengers = await getPassengersForBooking(bookingId);
    if (!passengers.length) {
      return NextResponse.json({ error: 'No passengers found for this booking' }, { status: 404 });
    }

    // Format date from Firestore timestamp
    const formatDate = (timestamp: any) => {
      if (!timestamp) return 'N/A';
      if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString();
      }
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
      }
      return new Date(timestamp).toLocaleDateString();
    };

    // Create HTML ticket
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>E-Ticket for Booking ${booking.bookingId}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 8px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .flight-info {
          margin-bottom: 30px;
        }
        .passenger-info {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 4px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
        h1 {
          color: #1a365d;
        }
        h2 {
          color: #2a4365;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>E-Ticket</h1>
          <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
        </div>
        
        <div class="flight-info">
          <h2>Flight Details</h2>
          <p><strong>Route:</strong> ${booking.routing.departureAirport} → ${booking.routing.arrivalAirport}</p>
          <p><strong>Date:</strong> ${formatDate(booking.routing.departureDate)}</p>
          <p><strong>Status:</strong> ${booking.status.toUpperCase()}</p>
          <p><strong>Booking Date:</strong> ${formatDate(booking.createdAt)}</p>
        </div>
        
        <h2>Passenger Information</h2>
        ${passengers
          .map(
            (passenger, i) => `
          <div class="passenger-info">
            <h3>Passenger ${i + 1}: ${passenger.firstName} ${passenger.lastName}</h3>
            <p><strong>Passport:</strong> ${passenger.passportNumber}</p>
            <p><strong>Nationality:</strong> ${passenger.nationality}</p>
            ${passenger.specialRequirements ? `<p><strong>Special Requirements:</strong> ${passenger.specialRequirements}</p>` : ''}
          </div>
        `
          )
          .join('')}
        
        <div class="footer">
          <p>This is an electronic ticket. Please present this document along with a valid ID at check-in.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Return the HTML as the response
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    console.error('Error generating e-ticket:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate ticket',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
