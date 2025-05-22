import { NextRequest, NextResponse } from 'next/server';
import {
  createBooking,
  getClientBookings,
  getOperatorBookings,
  getBookingById,
} from '@/lib/booking';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');
    const operatorId = url.searchParams.get('operatorId');
    const bookingId = url.searchParams.get('bookingId');

    console.log(
      `[API /api/bookings GET] Received request with: clientId=${clientId}, operatorId=${operatorId}, bookingId=${bookingId}`
    );

    let data;
    if (bookingId) {
      console.log(`[API /api/bookings GET] Fetching by bookingId: ${bookingId}`);
      data = await getBookingById(bookingId);
      if (!data) {
        console.log(`[API /api/bookings GET] Booking not found for bookingId: ${bookingId}`);
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
    } else if (clientId) {
      console.log(`[API /api/bookings GET] Fetching by clientId: ${clientId}`);
      data = await getClientBookings(clientId);
      console.log(
        `[API /api/bookings GET] Data for clientId ${clientId}:`,
        JSON.stringify(data, null, 2)
      );
    } else if (operatorId) {
      console.log(`[API /api/bookings GET] Fetching by operatorId: ${operatorId}`);
      data = await getOperatorBookings(operatorId);
      console.log(
        `[API /api/bookings GET] Data for operatorId ${operatorId}:`,
        JSON.stringify(data, null, 2)
      );
    } else {
      console.log('[API /api/bookings GET] Missing query parameter');
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    console.log(`[API /api/bookings GET] Sending response:`, JSON.stringify(data, null, 2));
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API /api/bookings GET] Error:', error.message, error.stack);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { request, quote } = body;
    const id = await createBooking(request, quote);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error: any) {
    console.error('APIPOST /api/bookings error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
