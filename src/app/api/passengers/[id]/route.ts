import { NextRequest, NextResponse } from 'next/server';
import { getPassengerById, updatePassenger, deletePassenger } from '@/lib/passenger';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const passengerId = params.id;
    const passenger = await getPassengerById(passengerId);

    if (!passenger) {
      return NextResponse.json({ error: 'Passenger not found' }, { status: 404 });
    }

    return NextResponse.json(passenger);
  } catch (error: any) {
    console.error(`APIGET /api/passengers/${params.id} error:`, error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const passengerId = params.id;
    const passengerData = await req.json();

    // Check if passenger exists
    const passenger = await getPassengerById(passengerId);
    if (!passenger) {
      return NextResponse.json({ error: 'Passenger not found' }, { status: 404 });
    }

    await updatePassenger(passengerId, passengerData);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`APIPUT /api/passengers/${params.id} error:`, error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const passengerId = params.id;

    // Check if passenger exists
    const passenger = await getPassengerById(passengerId);
    if (!passenger) {
      return NextResponse.json({ error: 'Passenger not found' }, { status: 404 });
    }

    await deletePassenger(passengerId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`APIDELETE /api/passengers/${params.id} error:`, error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
