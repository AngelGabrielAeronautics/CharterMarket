import { NextRequest, NextResponse } from 'next/server';
import { getBookingById } from '@/lib/booking';
import { getPassengersForBooking } from '@/lib/passenger';
import { generateETicketNumber } from '@/lib/serials';
import { getAirportByICAO } from '@/lib/airport';
import { db } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

export async function GET(_req: NextRequest, context: any) {
  try {
    const bookingId = context.params.bookingId as string;

    // Get booking data
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const passengers = await getPassengersForBooking(bookingId);
    if (!passengers.length) {
      return NextResponse.json({ error: 'No passengers found for this booking' }, { status: 404 });
    }

    // Resolve airport details
    const depInfo = await getAirportByICAO(booking.routing.departureAirport);
    const arrInfo = await getAirportByICAO(booking.routing.arrivalAirport);

    // Format departure date and time
    let departureDateTime = 'N/A';
    if (
      booking.routing.departureDate &&
      typeof booking.routing.departureDate.toDate === 'function'
    ) {
      departureDateTime = format(booking.routing.departureDate.toDate(), 'dd MMM yyyy, HH:mm');
    } else if ((booking.routing.departureDate as any).seconds) {
      departureDateTime = format(
        new Date((booking.routing.departureDate as any).seconds * 1000),
        'dd MMM yyyy, HH:mm'
      );
    }

    const issueDate = format(new Date(), 'dd MMM yyyy');

    // Format date from Firestore timestamp
    const formatDate = (timestamp: any) => {
      if (!timestamp) return 'N/A';
      if (typeof timestamp.toDate === 'function') {
        return format(timestamp.toDate(), 'dd MMM yyyy');
      }
      if (timestamp.seconds) {
        return format(new Date(timestamp.seconds * 1000), 'dd MMM yyyy');
      }
      return format(new Date(timestamp), 'dd MMM yyyy');
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
          <p><strong>E-Ticket Issue Date:</strong> ${issueDate}</p>
        </div>
        
        <div class="flight-info">
          <h2>Flight Details</h2>
          <p><strong>Operated by:</strong> ${booking.operatorName || 'N/A'}</p>
          <p><strong>Flight Number:</strong> ${booking.flightNumber || 'N/A'}</p>
          <p>
            <strong>From:</strong> ${depInfo?.name || booking.routing.departureAirport} 
            (${depInfo?.iata || ''}/${booking.routing.departureAirport})<br/>
            <em>${depInfo?.city || ''}, ${depInfo?.country || ''}</em>
          </p>
          <p>
            <strong>To:</strong> ${arrInfo?.name || booking.routing.arrivalAirport} 
            (${arrInfo?.iata || ''}/${booking.routing.arrivalAirport})<br/>
            <em>${arrInfo?.city || ''}, ${arrInfo?.country || ''}</em>
          </p>
          <p><strong>Departure:</strong> ${departureDateTime}</p>
          <p><strong>Status:</strong> ${booking.status.toUpperCase()}</p>
          <p><strong>Booking Date:</strong> ${formatDate(booking.createdAt)}</p>
        </div>
        
        <h2>Passenger Information</h2>
        ${passengers
          .map(
            (passenger, i) => `
          <div class="passenger-info">
            <h3>Passenger ${i + 1}: ${passenger.firstName} ${passenger.lastName}</h3>
            <p><strong>E-Ticket Number:</strong> ${generateETicketNumber(booking.bookingId, passenger.passengerId)}</p>
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
