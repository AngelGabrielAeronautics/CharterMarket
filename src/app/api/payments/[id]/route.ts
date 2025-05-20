import { NextRequest, NextResponse } from 'next/server';
import { getPaymentById, processPayment } from '@/lib/payment';
import { PaymentStatus } from '@/types/payment';

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const paymentId = context.params.id;
    const payment = await getPaymentById(paymentId);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error: any) {
    console.error(`APIGET /api/payments/${context.params.id} error:`, error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = await Promise.resolve(context.params);
    const paymentId = id;

    const { status, adminUserCode, notes } = await req.json();

    // Validate status
    if (!status || !['pending', 'processing', 'completed', 'failed', 'refunded'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
    }

    // Validate admin user code
    if (!adminUserCode) {
      return NextResponse.json({ error: 'Admin user code is required' }, { status: 400 });
    }

    // Process payment
    await processPayment(paymentId, adminUserCode, status as PaymentStatus, notes);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const idForErrorLog = context.params?.id ? context.params.id : 'unknown_id';
    console.error(`APIPUT /api/payments/${idForErrorLog} error:`, error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
