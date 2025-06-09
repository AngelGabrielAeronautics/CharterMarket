import { NextRequest, NextResponse } from 'next/server';
import { markOperatorAsPaidServer } from '@/lib/payment-server';

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
    const { adminUserCode, notes } = body;

    if (!adminUserCode) {
      return NextResponse.json({ error: 'Missing adminUserCode' }, { status: 400 });
    }

    await markOperatorAsPaidServer(paymentId, adminUserCode, notes);

    return NextResponse.json({ message: 'Operator marked as paid successfully' });
  } catch (error: any) {
    console.error(
      `API Error POST /api/admin/payments/${paymentId || '[unknown]'}/mark-operator-paid:`,
      error
    );
    return NextResponse.json(
      { error: error.message || 'Failed to mark operator as paid' },
      { status: 500 }
    );
  }
}
