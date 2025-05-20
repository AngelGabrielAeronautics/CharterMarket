import { NextRequest, NextResponse } from 'next/server';
import {
  createInvoice,
  getInvoicesForBooking,
  getInvoiceById,
  getInvoicesByClientId,
} from '@/lib/invoice';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get('bookingId');
    const invoiceId = url.searchParams.get('invoiceId');
    const clientId = url.searchParams.get('clientId');

    let data;

    if (invoiceId) {
      data = await getInvoiceById(invoiceId);
      if (!data) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
    } else if (bookingId) {
      console.log(`Retrieving invoices for booking: ${bookingId}`);
      try {
        data = await getInvoicesForBooking(bookingId);
        console.log(`Found ${data.length} invoices for booking ${bookingId}`);
      } catch (err) {
        console.error(`Error retrieving invoices for booking ${bookingId}:`, err);
        return NextResponse.json(
          {
            error: err instanceof Error ? err.message : 'Failed to fetch invoices',
            details: err instanceof Error ? err.stack : undefined,
          },
          { status: 500 }
        );
      }
    } else if (clientId) {
      try {
        data = await getInvoicesByClientId(clientId);
      } catch (err) {
        console.error(`Error retrieving invoices for client ${clientId}:`, err);
        return NextResponse.json(
          {
            error: err instanceof Error ? err.message : 'Failed to fetch client invoices',
            details: err instanceof Error ? err.stack : undefined,
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Missing bookingId, invoiceId, or clientId parameter' },
        { status: 400 }
      );
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('APIGET /api/invoices error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal error',
        stack: error.stack,
        code: error.code,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Invoice POST request body:', body);
    const { bookingId, clientId, flightCode, amount } = body;

    if (!bookingId || !clientId || !flightCode || amount == null) {
      console.error('Missing required fields for invoice creation:', {
        bookingId,
        clientId,
        flightCode,
        amount,
      });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Calling createInvoice with params:', { bookingId, clientId, flightCode, amount });
    const id = await createInvoice(bookingId, clientId, flightCode, amount);
    console.log('Invoice created successfully, id:', id);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error: any) {
    console.error('APIPOST /api/invoices error:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
