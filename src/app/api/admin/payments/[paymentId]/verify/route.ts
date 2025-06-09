import { NextRequest, NextResponse } from 'next/server';
import { processPaymentServer } from '@/lib/payment-server';
import { PaymentStatus } from '@/types/payment';

// Ensure this route is protected and only accessible by admins

export async function POST(req: NextRequest, context: any) {
  let paymentId: string | undefined;
  try {
    const params = await context.params;
    paymentId = params.paymentId;
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const { adminUserCode, status, notes } = body;

    if (!adminUserCode || !status) {
      return NextResponse.json({ error: 'Missing adminUserCode or status' }, { status: 400 });
    }

    // Validate status if necessary (e.g., ensure it's a valid PaymentStatus)
    const validStatuses: PaymentStatus[] = [
      'pending',
      'completed',
      'failed',
      'processing',
      'refunded',
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid payment status: ${status}` }, { status: 400 });
    }

    await processPaymentServer(paymentId, adminUserCode, status as PaymentStatus, notes);

    return NextResponse.json({ message: 'Payment status updated successfully' });
  } catch (error: any) {
    console.error(`API Error POST /api/admin/payments/${paymentId || '[unknown]'}/verify:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to update payment status' },
      { status: 500 }
    );
  }
}
