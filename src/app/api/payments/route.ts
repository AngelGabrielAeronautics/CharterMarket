import { NextRequest, NextResponse } from 'next/server';
import {
  createPaymentServer,
  getPaymentsForBookingServer,
  getPaymentByIdServer,
  getPendingPaymentsServer,
  getAllPaymentsServer,
} from '@/lib/payment-server';
import type { PaymentFormData } from '@/types/payment';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get('bookingId');
    const paymentId = url.searchParams.get('paymentId');
    const pending = url.searchParams.get('pending');
    const fetchAll = url.searchParams.get('all');

    let data;

    if (paymentId) {
      data = await getPaymentByIdServer(paymentId);
      if (!data) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
    } else if (bookingId) {
      data = await getPaymentsForBookingServer(bookingId);
    } else if (pending === 'true') {
      // Admin-only endpoint to fetch pending payments
      data = await getPendingPaymentsServer();
    } else if (fetchAll === 'true') {
      // Admin-only endpoint to fetch all payments
      data = await getAllPaymentsServer();
    } else {
      return NextResponse.json(
        {
          error:
            'Missing or invalid query parameters. Provide bookingId, paymentId, pending=true, or all=true.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('APIGET /api/payments error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, invoiceId, amount, paymentMethod, paymentReference, notes, paymentDate } =
      body;

    if (!bookingId || !invoiceId) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, invoiceId' },
        { status: 400 }
      );
    }
    const missing: string[] = [];
    if (amount == null) missing.push('amount');
    if (!paymentMethod) missing.push('paymentMethod');
    if (missing.length) {
      return NextResponse.json(
        { error: `Missing required payment fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // Convert paymentDate string to Date, if provided
    const parsedPaymentDate = paymentDate ? new Date(paymentDate) : undefined;
    const paymentData: PaymentFormData = {
      amount,
      paymentMethod,
      paymentReference,
      notes,
      paymentDate: parsedPaymentDate,
    };

    const id = await createPaymentServer(bookingId, invoiceId, paymentData);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error: any) {
    console.error('APIPOST /api/payments error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
