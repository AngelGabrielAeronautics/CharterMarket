import { NextResponse } from 'next/server';
import { processPayment } from '@/lib/payment';
import { PaymentStatus } from '@/types/payment';

// Ensure this route is protected and only accessible by admins

export async function POST(req: Request, context: any) {
  try {
    const paymentId = context.params.paymentId as string;
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const { adminUserCode, status, notes } = body;

    if (!adminUserCode || !status) {
      return NextResponse.json({ error: 'Missing adminUserCode or status' }, { status: 400 });
    }

    // Validate status if necessary (e.g., ensure it's a valid PaymentStatus)
    const validStatuses: PaymentStatus[] = ['pending', 'completed', 'failed', 'processing', 'refunded'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid payment status: ${status}` }, { status: 400 });
    }

    await processPayment(paymentId, adminUserCode, status as PaymentStatus, notes);

    return NextResponse.json({ message: 'Payment status updated successfully' });
  } catch (error: any) {
    console.error(`API Error POST /api/admin/payments/${context.params.paymentId}/verify:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to update payment status' },
      { status: 500 }
    );
  }
}
