import { NextRequest, NextResponse } from 'next/server';
import { createRating } from '@/lib/rating';
import { getAdminDb } from '@/lib/firebase-admin';

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
      .collection('ratings')
      .where('bookingId', '==', bookingId)
      .limit(1)
      .get();

    const rating = snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };

    return NextResponse.json(rating);
  } catch (error: any) {
    console.error('APIGET /api/ratings error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, operatorId, customerUserCode, ratingValue, comments } = body;
    if (!bookingId || !operatorId || !customerUserCode || ratingValue == null) {
      return NextResponse.json({ error: 'Missing required rating fields' }, { status: 400 });
    }
    const id = await createRating(bookingId, operatorId, customerUserCode, ratingValue, comments);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error: any) {
    console.error('APIPOST /api/ratings error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
