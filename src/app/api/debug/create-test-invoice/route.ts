import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { generateInvoiceId } from '@/lib/serials';

export async function GET(req: NextRequest) {
  try {
    // Create a test invoice directly using Firestore
    const testInvoiceData = {
      invoiceId: generateInvoiceId('TEST-FLIGHT'),
      bookingId: 'test-booking-id',
      clientId: 'test-client-id',
      amount: 100.0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    console.log('Creating test invoice with data:', testInvoiceData);

    // Try to add the document to the invoices collection
    const docRef = await addDoc(collection(db, 'invoices'), testInvoiceData);

    return NextResponse.json({
      success: true,
      message: 'Test invoice created successfully',
      invoiceId: docRef.id,
      invoiceData: testInvoiceData,
    });
  } catch (error: any) {
    console.error('Error creating test invoice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        stack: error.stack,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
