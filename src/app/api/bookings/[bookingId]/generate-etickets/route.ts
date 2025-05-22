import { NextResponse } from 'next/server';
import { getBookingById } from '@/lib/booking';
import { getPassengersForBooking } from '@/lib/passenger';
import { getAirportByICAO } from '@/lib/airport';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, getDownloadURL, StringFormat, uploadBytes } from 'firebase/storage';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { generateETicketNumber } from '@/lib/serials';

// Helper function to generate E-Ticket HTML (simplified example)
async function generateETicketHTML(
  booking: any,
  passenger: any,
  airportDetails: any,
  eTicketNumber: string
): Promise<string> {
  const depAirport = await getAirportByICAO(booking.routing.departureAirport);
  const arrAirport = await getAirportByICAO(booking.routing.arrivalAirport);
  const departureDateTime = booking.routing.departureDate.toDate();

  return `
    <html>
      <head><title>E-Ticket: ${eTicketNumber}</title></head>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { color: #1A2B3C; /* Deep Navy */ border-bottom: 2px solid #C4A962; /* Gold Accent */ padding-bottom: 10px; }
        h2 { color: #1A2B3C; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        p { line-height: 1.6; }
        strong { color: #0A0A0A; /* Rich Black */ }
        .container { border: 1px solid #ddd; padding: 20px; border-radius: 8px; background-color: #f9f9f9; }
        .header { text-align: center; margin-bottom: 20px; }
        .logo { width: 150px; /* Adjust as needed */ margin-bottom: 10px; }
        .footer { margin-top: 40px; text-align: center; font-size: 0.9em; color: #777; }
        hr { border: 0; border-top: 1px dashed #ccc; margin: 20px 0; }
      </style>
      <body>
        <div class="container">
          <div class="header">
            {/* Replace with your actual logo path or base64 image */}
            {/* <img src="/charter-logo.png" alt="Charter Logo" class="logo" /> */}
            <h1>Charter E-Ticket</h1>
          </div>
          <p><strong>E-Ticket Number:</strong> ${eTicketNumber}</p>
          <p><strong>Booking Reference:</strong> ${booking.bookingId}</p>
          <p><strong>Date of Issue:</strong> ${format(new Date(), 'dd MMM yyyy')}</p>
          
          <h2>Passenger Details</h2>
          <p><strong>Name:</strong> ${passenger.firstName} ${passenger.lastName}</p>
          <p><strong>Passport:</strong> ${passenger.passportNumber} (Expires: ${format(passenger.passportExpiry.toDate(), 'dd MMM yyyy')})</p>
          <p><strong>Nationality:</strong> ${passenger.nationality}</p>
          
          <h2>Flight Details</h2>
          <p><strong>Operated by:</strong> ${booking.operatorName || 'N/A'}</p>
          <p><strong>Flight Number:</strong> ${booking.flightNumber || 'N/A'}</p>
          <p>
            <strong>From:</strong> ${depAirport?.name || booking.routing.departureAirport} (${depAirport?.iata || 'N/A'} / ${booking.routing.departureAirport})
            <br/><i>${depAirport?.city || 'N/A'}, ${depAirport?.country || 'N/A'}</i>
          </p>
          <p>
            <strong>To:</strong> ${arrAirport?.name || booking.routing.arrivalAirport} (${arrAirport?.iata || 'N/A'} / ${booking.routing.arrivalAirport})
            <br/><i>${arrAirport?.city || 'N/A'}, ${arrAirport?.country || 'N/A'}</i>
          </p>
          <p><strong>Departure:</strong> ${format(departureDateTime, 'dd MMM yyyy, HH:mm zzz')}</p>
          
          ${passenger.specialRequirements ? `<p><strong>Special Requirements:</strong> ${passenger.specialRequirements}</p>` : ''}

          <div class="footer">
            <p>Thank you for choosing Charter. For assistance, please contact us at support@charter.com.</p>
            <p>&copy; ${new Date().getFullYear()} Charter Aviation Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function POST(req: Request, context: any) {
  const bookingId = context.params.bookingId as string; // Firestore document ID of the booking

  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  console.log(`E-ticket generation requested for booking ID: ${bookingId}`);

  try {
    const booking = await getBookingById(bookingId);
    if (!booking) {
      console.error(`Booking not found for ID: ${bookingId}`);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    console.log(`Booking ${bookingId} found. Status: ${booking.status}, Paid: ${booking.isPaid}`);

    if (booking.status !== 'confirmed' || !booking.isPaid) {
      console.warn(
        `Booking ${bookingId} not ready for e-ticket generation. Status: ${booking.status}, Paid: ${booking.isPaid}`
      );
      return NextResponse.json(
        { error: 'Booking not paid or not confirmed yet for e-ticket generation.' },
        { status: 400 }
      );
    }

    const passengers = await getPassengersForBooking(booking.id);
    console.log(
      `Found ${passengers.length} passengers for booking ${bookingId}. Expected: ${booking.passengerCount}`
    );

    if (passengers.length === 0 || passengers.length < booking.passengerCount) {
      console.warn(
        `Passenger manifest for booking ${bookingId} is incomplete. Found: ${passengers.length}, Expected: ${booking.passengerCount}`
      );
      return NextResponse.json(
        { error: 'Passenger manifest is not complete for e-ticket generation.' },
        { status: 400 }
      );
    }

    const generatedTicketsInfo = [];
    let browser;

    try {
      console.log('Launching Puppeteer browser...');
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Common for Docker/serverless environments
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          //'--single-process', // Disables sandbox, use with caution
          '--disable-gpu',
        ],
      });
      const page = await browser.newPage();
      console.log('Puppeteer page created.');

      for (const passenger of passengers) {
        console.log(
          `Generating e-ticket for passenger: ${passenger.firstName} ${passenger.lastName} (ID: ${passenger.id})`
        );
        const eTicketNumber = generateETicketNumber(booking.bookingId, passenger.passengerId);
        console.log(`Generated E-Ticket Number: ${eTicketNumber}`);

        const htmlContent = await generateETicketHTML(booking, passenger, {}, eTicketNumber);

        console.log(`Setting HTML content for PDF generation for ${eTicketNumber}`);
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        console.log(`Generating PDF for ${eTicketNumber}`);
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        console.log(`PDF buffer created for ${eTicketNumber}. Size: ${pdfBuffer.length} bytes`);

        const storagePath = `etickets/${booking.id}/${eTicketNumber}.pdf`;
        const pdfStorageRef = ref(storage, storagePath);

        console.log(`Uploading PDF to Firebase Storage at ${storagePath}`);
        await uploadBytes(pdfStorageRef, pdfBuffer, {
          contentType: 'application/pdf',
        });
        const downloadURL = await getDownloadURL(pdfStorageRef);
        console.log(`PDF uploaded. Download URL: ${downloadURL}`);

        const eticketDocRef = await addDoc(collection(db, 'bookings', booking.id, 'etickets'), {
          passengerId: passenger.id,
          passengerCode: passenger.passengerId,
          eTicketNumber,
          storagePath,
          downloadURL,
          generatedAt: Timestamp.now(),
        });
        console.log(`E-ticket record stored in Firestore with ID: ${eticketDocRef.id}`);

        generatedTicketsInfo.push({
          passengerId: passenger.id,
          eTicketNumber,
          downloadURL,
        });
      }
    } finally {
      if (browser) {
        console.log('Closing Puppeteer browser.');
        await browser.close();
      }
    }

    await updateDoc(doc(db, 'bookings', booking.id), {
      eTicketsGeneratedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`Booking ${booking.id} updated with eTicketsGeneratedAt timestamp.`);

    return NextResponse.json(
      {
        message: 'E-tickets generated successfully.',
        tickets: generatedTicketsInfo,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`E-ticket generation failed for booking ${bookingId}:`, error, error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to generate e-tickets' },
      { status: 500 }
    );
  }
}
