import { NextRequest, NextResponse } from 'next/server';
import { createBooking, getClientBookings, getOperatorBookings, getBookingById } from '@/lib/booking';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');
    const operatorId = url.searchParams.get('operatorId');
    const bookingId = url.searchParams.get('bookingId');

    let data;
    if (bookingId) {
      data = await getBookingById(bookingId);
      if (!data) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
    } else if (clientId) {
      data = await getClientBookings(clientId);
    } else if (operatorId) {
      data = await getOperatorBookings(operatorId);
    } else {
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
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
    const id = await createBooking(request, quote);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error: any) {
    console.error('APIPOST /api/bookings error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
} 