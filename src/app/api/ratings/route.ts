import { NextRequest, NextResponse } from 'next/server';
import { createRating, getRatingForBooking } from '@/lib/rating';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get('bookingId');
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId parameter' }, { status: 400 });
    }
    const rating = await getRatingForBooking(bookingId);
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
