import { NextRequest, NextResponse } from 'next/server';
import {
  createBooking,
  getClientBookings,
  getClientBookingsDebug,
  getOperatorBookings,
  getBookingById,
  getBookingByDocId,
  getBookingByBookingId,
} from '@/lib/booking';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');
    const operatorId = url.searchParams.get('operatorId');
    const bookingId = url.searchParams.get('bookingId');
    const docId = url.searchParams.get('docId'); // For legacy document ID support

    let data;

    if (bookingId) {
      console.log(`Retrieving booking by bookingId: ${bookingId}`);
      // Try custom booking ID first, then fallback methods
      data = await getBookingByBookingId(bookingId);
      if (!data) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
    } else if (docId) {
      console.log(`Retrieving booking by document ID: ${docId}`);
      // Legacy support for document IDs
      data = await getBookingByDocId(docId);
      if (!data) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
    } else if (clientId) {
      console.log(`Retrieving bookings for client: ${clientId}`);
      // Temporarily use debug function to isolate composite index issues
      try {
        data = await getClientBookingsDebug(clientId);
      } catch (debugError) {
        console.error('Debug function failed, trying regular function:', debugError);
        // If debug function fails, fall back to regular function
        data = await getClientBookings(clientId);
      }
    } else if (operatorId) {
      console.log(`Retrieving bookings for operator: ${operatorId}`);
      data = await getOperatorBookings(operatorId);
    } else {
      return NextResponse.json(
        { error: 'Missing required parameter: clientId, operatorId, bookingId, or docId' },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('APIGET /api/bookings error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { request, quote } = body;
    const bookingId = await createBooking(request, quote);
    return NextResponse.json({ id: bookingId, bookingId }, { status: 201 });
  } catch (error: any) {
    console.error('APIPOST /api/bookings error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
