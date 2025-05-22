import { NextResponse } from 'next/server';
import { markOperatorAsPaid } from '@/lib/payment';
import { doc, updateDoc } from 'firebase/firestore';

// Ensure this route is protected and only accessible by admins

export async function POST(req: Request, context: any) {
  try {
    const paymentId = context.params.paymentId as string;
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const { adminUserCode, notes } = body;

    if (!adminUserCode) {
      return NextResponse.json({ error: 'Missing adminUserCode' }, { status: 400 });
    }

    await markOperatorAsPaid(paymentId, adminUserCode, notes);

    return NextResponse.json({ message: 'Operator marked as paid successfully' });
  } catch (error: any) {
    console.error(
      `API Error POST /api/admin/payments/${context.params.paymentId}/mark-operator-paid:`,
      error
    );
    return NextResponse.json(
      { error: error.message || 'Failed to mark operator as paid' },
      { status: 500 }
    );
  }
}
