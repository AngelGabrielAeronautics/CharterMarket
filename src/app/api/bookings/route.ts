import { NextRequest, NextResponse } from 'next/server';
import {
  createBooking,
  getClientBookings,
  getClientBookingsDebug,
  getOperatorBookings,
  getBookingById,
  getBookingByDocId,
  getBookingByBookingId,
} from '@/lib/booking';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication for protected API
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const adminAuth = getAdminAuth();
        await adminAuth.verifyIdToken(token);
        console.log('API call authenticated successfully');
      } catch (authError) {
        console.error('Authentication failed:', authError);
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }
    } else {
      console.log('No authorization header provided, proceeding without auth verification');
    }

    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');
    const operatorUserCode =
      url.searchParams.get('operatorUserCode') || url.searchParams.get('operatorId'); // Support both for backward compatibility
    const bookingId = url.searchParams.get('bookingId');
    const docId = url.searchParams.get('docId'); // For legacy document ID support

    let data;

    if (bookingId) {
      console.log(`Retrieving booking by bookingId (server-side Admin SDK): ${bookingId}`);
      const adminDb = getAdminDb();
      if (!adminDb) {
        return NextResponse.json({ error: 'Server database unavailable' }, { status: 500 });
      }

      // Try direct document ID first
      let docSnap = await adminDb.collection('bookings').doc(bookingId).get();

      if (!docSnap.exists) {
        // Fallback: query by bookingId field (legacy)
        const qSnap = await adminDb
          .collection('bookings')
          .where('bookingId', '==', bookingId)
          .limit(1)
          .get();
        if (qSnap.empty) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }
        docSnap = qSnap.docs[0];
      }

      data = { id: docSnap.id, ...docSnap.data() };
    } else if (docId) {
      console.log(`Retrieving booking by document ID: ${docId}`);
      // Legacy support for document IDs
      data = await getBookingByDocId(docId);
      if (!data) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
    } else if (clientId) {
      console.log(`Retrieving bookings for client (server-side with Admin SDK): ${clientId}`);

      // Use Firebase Admin SDK on the server to bypass security-rule auth issues
      const adminDb = getAdminDb();
      if (!adminDb) {
        console.error('Firebase Admin DB not available');
        return NextResponse.json({ error: 'Server database unavailable' }, { status: 500 });
      }

      const snapshot = await adminDb
        .collection('bookings')
        .where('clientId', '==', clientId)
        .orderBy('createdAt', 'desc')
        .get();

      data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } else if (operatorUserCode) {
      console.log(`Retrieving bookings for operator: ${operatorUserCode}`);
      data = await getOperatorBookings(operatorUserCode);
    } else {
      return NextResponse.json(
        { error: 'Missing required parameter: clientId, operatorUserCode, bookingId, or docId' },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('APIGET /api/bookings error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { request, quote } = body;
    const bookingId = await createBooking(request, quote);
    return NextResponse.json({ id: bookingId, bookingId }, { status: 201 });
  } catch (error: any) {
    console.error('APIPOST /api/bookings error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
