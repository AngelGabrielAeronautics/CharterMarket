import { NextRequest, NextResponse } from 'next/server';
import { createPassengerServer } from '@/lib/passenger-server';
import { getAdminDb } from '@/lib/firebase-admin';
import type { PassengerFormData } from '@/types/passenger';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId parameter' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Server database unavailable' }, { status: 500 });
    }

    const snapshot = await adminDb
      .collection('passengers')
      .where('bookingId', '==', bookingId)
      .get();

    const passengers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(passengers);
  } catch (error: any) {
    console.error('APIGET /api/passengers error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingId,
      userCode,
      firstName,
      lastName,
      dateOfBirth,
      nationality,
      passportNumber,
      passportExpiry,
      specialRequirements,
      contactEmail,
      contactPhone,
      emergencyContactName,
      emergencyContactPhone,
    } = body;

    if (!bookingId || !userCode) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, userCode' },
        { status: 400 }
      );
    }

    const requiredFields: Array<keyof PassengerFormData> = [
      'firstName',
      'lastName',
      'dateOfBirth',
      'nationality',
      'passportNumber',
      'passportExpiry',
      'contactEmail',
      'contactPhone',
    ];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required passenger fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects
    const parsedDateOfBirth = new Date(dateOfBirth);
    const parsedPassportExpiry = new Date(passportExpiry);

    const passengerData: PassengerFormData = {
      firstName,
      lastName,
      dateOfBirth: parsedDateOfBirth,
      nationality,
      passportNumber,
      passportExpiry: parsedPassportExpiry,
      specialRequirements,
      contactEmail,
      contactPhone,
      emergencyContactName,
      emergencyContactPhone,
    };

    const id = await createPassengerServer(bookingId, userCode, passengerData);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error: any) {
    console.error('APIPOST /api/passengers error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
