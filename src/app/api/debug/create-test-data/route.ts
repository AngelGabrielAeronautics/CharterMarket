import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not available' }, { status: 500 });
    }

    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userCode = decodedToken.userCode;

    if (!userCode) {
      return NextResponse.json({ error: 'User code not found in token' }, { status: 400 });
    }

    // Create test bookings
    const testBookings = [
      {
        bookingId: `BK-TEST-${Date.now()}-001`,
        clientId: userCode,
        operatorId: 'OP-SKYBIRD-001',
        requestId: `REQ-${Date.now()}-001`,
        requestCode: `QR-${userCode}-${Date.now()}`,
        quoteId: `QT-${Date.now()}-001`,
        routing: {
          departureAirport: 'FACT', // Cape Town
          arrivalAirport: 'FAOR', // OR Tambo
          departureDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
          flexibleDates: false,
        },
        passengerCount: 2,
        cabinClass: 'economy',
        price: 8500,
        totalPrice: 9775,
        status: 'confirmed',
        flightNumber: 'CH001',
        operatorName: 'Skybird Aviation',
        isPaid: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        bookingId: `BK-TEST-${Date.now()}-002`,
        clientId: userCode,
        operatorId: 'OP-JETSTREAM-002',
        requestId: `REQ-${Date.now()}-002`,
        requestCode: `QR-${userCode}-${Date.now() + 1}`,
        quoteId: `QT-${Date.now()}-002`,
        routing: {
          departureAirport: 'FAOR', // OR Tambo
          arrivalAirport: 'FALA', // Lanseria
          departureDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 14 days from now
          flexibleDates: false,
        },
        passengerCount: 4,
        cabinClass: 'business',
        price: 15000,
        totalPrice: 17250,
        status: 'pending',
        flightNumber: 'CH002',
        operatorName: 'Jetstream Charter',
        isPaid: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
    ];

    const batch = adminDb.batch();
    const createdBookings = [];

    for (const booking of testBookings) {
      const docRef = adminDb.collection('bookings').doc();
      batch.set(docRef, booking);
      createdBookings.push({
        id: docRef.id,
        bookingId: booking.bookingId,
        status: booking.status,
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Created ${testBookings.length} test bookings for user ${userCode}`,
      bookings: createdBookings,
    });
  } catch (error: any) {
    console.error('Error creating test data:', error);
    return NextResponse.json(
      {
        error: 'Failed to create test data',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
