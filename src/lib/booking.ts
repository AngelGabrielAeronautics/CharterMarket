import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { generateBookingId } from '@/lib/serials';
import { Booking } from '@/types/booking';
import { FlightRequest } from '@/types/flight';
import { Quote } from '@/types/quote';

/**
 * Create a new booking based on a flight request and quote
 */
export const createBooking = async (
  request: FlightRequest,
  quote: Quote
): Promise<string> => {
  try {
    const bookingCode = generateBookingId(request.operatorId);
    const bookingData: Omit<Booking, 'id'> = {
      bookingId: bookingCode,
      requestId: request.id,
      requestCode: request.requestCode,
      quoteId: quote.id,
      operatorId: request.operatorId,
      clientId: request.clientId,
      routing: request.routing,
      passengerCount: request.passengerCount,
      cabinClass: request.cabinClass,
      price: quote.price,
      totalPrice: quote.totalPrice,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'bookings'), bookingData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw new Error('Failed to create booking');
  }
};

/**
 * Fetch all bookings for a given client
 */
export const getClientBookings = async (
  clientId: string
): Promise<Booking[]> => {
  try {
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(bookingsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
  } catch (error) {
    console.error('Error fetching client bookings:', error);
    throw new Error('Failed to fetch client bookings');
  }
};

/**
 * Fetch all bookings for a given operator
 */
export const getOperatorBookings = async (
  operatorId: string
): Promise<Booking[]> => {
  try {
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('operatorId', '==', operatorId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(bookingsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
  } catch (error) {
    console.error('Error fetching operator bookings:', error);
    throw new Error('Failed to fetch operator bookings');
  }
};

// Add helper to fetch a single booking by document ID
export const getBookingById = async (
  bookingDocId: string
): Promise<Booking | null> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingDocId);
    const bookingSnap = await getDoc(bookingRef);
    if (!bookingSnap.exists()) {
      return null;
    }
    return { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw new Error('Failed to fetch booking');
  }
}; 