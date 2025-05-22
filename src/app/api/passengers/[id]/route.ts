import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { Passenger } from '@/types/passenger';

// GET a specific passenger by ID
export async function GET(req: NextRequest, context: any) {
  try {
    const passengerId = context.params.id as string;
    if (!passengerId) {
      return NextResponse.json({ error: 'Passenger ID is required' }, { status: 400 });
    }
    const passengerRef = doc(db, 'passengers', passengerId);
    const passengerSnap = await getDoc(passengerRef);

    if (!passengerSnap.exists()) {
      return NextResponse.json({ error: 'Passenger not found' }, { status: 404 });
    }

    const passengerData = passengerSnap.data() as Passenger;
    return NextResponse.json({ ...passengerData, id: passengerSnap.id });
  } catch (error) {
    console.error('Error fetching passenger:', error);
    return NextResponse.json({ error: 'Failed to fetch passenger' }, { status: 500 });
  }
}

// UPDATE a specific passenger by ID
export async function PUT(req: NextRequest, context: any) {
  try {
    const passengerId = context.params.id as string;
    if (!passengerId) {
      return NextResponse.json({ error: 'Passenger ID is required' }, { status: 400 });
    }
    const passengerData = await req.json();
    const passengerRef = doc(db, 'passengers', passengerId);

    // Ensure updatedAt is set
    passengerData.updatedAt = new Date();

    await updateDoc(passengerRef, passengerData);
    return NextResponse.json({ message: 'Passenger updated successfully', id: passengerId });
  } catch (error) {
    console.error('Error updating passenger:', error);
    return NextResponse.json({ error: 'Failed to update passenger' }, { status: 500 });
  }
}

// DELETE a specific passenger by ID
export async function DELETE(req: NextRequest, context: any) {
  try {
    const passengerId = context.params.id as string;
    if (!passengerId) {
      return NextResponse.json({ error: 'Passenger ID is required' }, { status: 400 });
    }
    const passengerRef = doc(db, 'passengers', passengerId);
    await deleteDoc(passengerRef);
    return NextResponse.json({ message: 'Passenger deleted successfully' });
  } catch (error) {
    console.error('Error deleting passenger:', error);
    return NextResponse.json({ error: 'Failed to delete passenger' }, { status: 500 });
  }
}
