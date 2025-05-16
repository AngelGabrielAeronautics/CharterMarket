import { NextRequest, NextResponse } from 'next/server';
import { createInvoice, getInvoicesForBooking } from '@/lib/invoice';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get('bookingId');
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId parameter' }, { status: 400 });
    }
    const invoices = await getInvoicesForBooking(bookingId);
    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('APIGET /api/invoices error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, flightCode, amount } = body;
    if (!bookingId || !flightCode || amount == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const id = await createInvoice(bookingId, flightCode, amount);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error: any) {
    console.error('APIPOST /api/invoices error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
} 