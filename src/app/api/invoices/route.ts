import { NextRequest, NextResponse } from 'next/server';
import {
  createInvoice,
  getInvoicesForBooking,
  getInvoicesForBookingDebug,
  getInvoiceById,
  getInvoiceByDocId,
  getInvoiceByInvoiceId,
  getInvoicesByClientId,
} from '@/lib/invoice';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get('bookingId');
    const invoiceId = url.searchParams.get('invoiceId');
    const docId = url.searchParams.get('docId'); // For legacy document ID support
    const clientId = url.searchParams.get('clientId');

    let data;

    if (invoiceId) {
      console.log(`Retrieving invoice by invoiceId (Admin SDK): ${invoiceId}`);
      const adminDb = getAdminDb();
      if (!adminDb) {
        return NextResponse.json({ error: 'Server database unavailable' }, { status: 500 });
      }

      // Direct document ID attempt
      let docSnap = await adminDb.collection('invoices').doc(invoiceId).get();
      if (!docSnap.exists) {
        // Fallback search by invoiceId field (legacy)
        const qSnap = await adminDb
          .collection('invoices')
          .where('invoiceId', '==', invoiceId)
          .limit(1)
          .get();
        if (qSnap.empty) {
          return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }
        docSnap = qSnap.docs[0];
      }

      data = { id: docSnap.id, ...docSnap.data() };
    } else if (docId) {
      console.log(`Retrieving invoice by document ID: ${docId}`);
      // Legacy support for document IDs
      data = await getInvoiceByDocId(docId);
      if (!data) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
    } else if (bookingId) {
      console.log(`Retrieving invoices for booking (Admin SDK): ${bookingId}`);
      const adminDb = getAdminDb();
      if (!adminDb) {
        return NextResponse.json({ error: 'Server database unavailable' }, { status: 500 });
      }

      const snapshot = await adminDb
        .collection('invoices')
        .where('bookingId', '==', bookingId)
        .orderBy('createdAt', 'desc')
        .get();

      data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log(`Found ${data.length} invoices for booking ${bookingId}`);
    } else if (clientId) {
      const adminDb = getAdminDb();
      if (!adminDb) {
        return NextResponse.json({ error: 'Server database unavailable' }, { status: 500 });
      }

      const snapshot = await adminDb
        .collection('invoices')
        .where('clientId', '==', clientId)
        .orderBy('createdAt', 'desc')
        .get();

      data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } else {
      return NextResponse.json(
        { error: 'Missing required parameter: bookingId, invoiceId, docId, or clientId' },
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
    const invoiceId = await createInvoice(bookingId, clientId, flightCode, amount);
    console.log('Invoice created successfully, id:', invoiceId);
    return NextResponse.json({ id: invoiceId, invoiceId }, { status: 201 });
  } catch (error: any) {
    console.error('APIPOST /api/invoices error:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
