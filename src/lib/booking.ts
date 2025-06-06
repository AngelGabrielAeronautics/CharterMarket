import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  setDoc,
  doc,
  Timestamp,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { generateBookingId } from '@/lib/serials';
import { Booking } from '@/types/booking';
import { QuoteRequest, Offer as Quote } from '@/types/flight';

/**
 * Create a new booking based on a quote request and quote
 */
export const createBooking = async (request: QuoteRequest, quote: Quote): Promise<string> => {
  try {
    console.log('createBooking called with:', {
      requestId: request.id,
      requestCode: request.requestCode,
      quoteId: quote.offerId,
      operatorId: quote.operatorId,
      clientUserCode: request.clientUserCode,
    });

    // Validate required fields
    if (
      !request.id ||
      !request.requestCode ||
      !quote.offerId ||
      !quote.operatorId ||
      !request.clientUserCode
    ) {
      const missingFields = [];
      if (!request.id) missingFields.push('request.id');
      if (!request.requestCode) missingFields.push('request.requestCode');
      if (!quote.offerId) missingFields.push('quote.offerId');
      if (!quote.operatorId) missingFields.push('quote.operatorId');
      if (!request.clientUserCode) missingFields.push('request.clientUserCode');

      throw new Error(`Missing required fields for booking creation: ${missingFields.join(', ')}`);
    }

    const bookingCode = generateBookingId(quote.operatorId);
    console.log('Generated booking code:', bookingCode);

    // Ensure all numeric fields are properly parsed
    const price = typeof quote.price === 'number' ? quote.price : parseFloat(quote.price);
    const totalPrice =
      typeof quote.totalPrice === 'number' ? quote.totalPrice : parseFloat(quote.totalPrice);
    const passengerCount =
      typeof request.passengerCount === 'number'
        ? request.passengerCount
        : parseInt(request.passengerCount);

    if (isNaN(price) || isNaN(totalPrice) || isNaN(passengerCount)) {
      throw new Error('Invalid numeric values in booking data');
    }

    const bookingData: Omit<Booking, 'id'> = {
      bookingId: bookingCode,
      requestId: request.id,
      requestCode: request.requestCode,
      quoteId: quote.offerId,
      operatorId: quote.operatorId,
      clientId: request.clientUserCode, // This matches the Firestore rules expectation
      routing: request.routing,
      passengerCount: passengerCount,
      cabinClass: request.cabinClass,
      price: price,
      totalPrice: totalPrice,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    console.log('Booking data to be saved:', bookingData);

    // Use setDoc with custom bookingCode as document ID instead of addDoc
    const bookingRef = doc(db, 'bookings', bookingCode);
    await setDoc(bookingRef, bookingData);
    console.log('Booking created successfully with custom ID:', bookingCode);

    // Return the custom booking ID instead of auto-generated document ID
    return bookingCode;
  } catch (error) {
    console.error('Error creating booking:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
    });

    // Provide more specific error message
    if (error instanceof Error) {
      throw new Error(`Failed to create booking: ${error.message}`);
    }
    throw new Error('Failed to create booking due to an unknown error');
  }
};

/**
 * Fetch all bookings for a given client
 */
export const getClientBookings = async (clientId: string): Promise<Booking[]> => {
  try {
    console.log('getClientBookings called with clientId:', clientId);

    if (!clientId) {
      throw new Error('Client ID is required');
    }

    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );

    console.log('Executing Firestore query for client bookings...');
    const snapshot = await getDocs(bookingsQuery);
    console.log(`Query returned ${snapshot.docs.length} booking documents for client ${clientId}`);

    const bookings = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Booking
    );

    console.log('Successfully fetched client bookings:', bookings);
    return bookings;
  } catch (error) {
    console.error('Error fetching client bookings:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      name: error instanceof Error ? error.name : undefined,
    });

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('permission') || error.message.includes('denied')) {
        throw new Error(
          `Permission denied: Cannot access bookings for client ${clientId}. Please check your authentication.`
        );
      } else if (error.message.includes('index') || error.message.includes('requires an index')) {
        throw new Error(
          `Database index required: Please create a composite index for clientId and createdAt fields.`
        );
      } else if (error.message.includes('network') || error.message.includes('offline')) {
        throw new Error(
          'Network error: Unable to connect to the database. Please check your internet connection.'
        );
      }
      throw new Error(`Failed to fetch client bookings: ${error.message}`);
    }

    throw new Error('Failed to fetch client bookings due to an unknown error');
  }
};

/**
 * Fetch all bookings for a given operator
 */
export const getOperatorBookings = async (operatorId: string): Promise<Booking[]> => {
  try {
    console.log('getOperatorBookings called with operatorId:', operatorId);

    if (!operatorId) {
      throw new Error('Operator ID is required');
    }

    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('operatorId', '==', operatorId),
      orderBy('createdAt', 'desc')
    );

    console.log('Executing Firestore query for operator bookings...');
    const snapshot = await getDocs(bookingsQuery);
    console.log(
      `Query returned ${snapshot.docs.length} booking documents for operator ${operatorId}`
    );

    const bookings = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Booking
    );

    console.log('Successfully fetched operator bookings:', bookings);
    return bookings;
  } catch (error: any) {
    console.error('Error fetching operator bookings:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      name: error instanceof Error ? error.name : undefined,
    });

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('permission') || error.message.includes('denied')) {
        throw new Error(
          `Permission denied: Cannot access bookings for operator ${operatorId}. Please check your authentication.`
        );
      } else if (error.message.includes('index') || error.message.includes('requires an index')) {
        throw new Error(
          `Database index required: Please create a composite index for operatorId and createdAt fields.`
        );
      } else if (error.message.includes('network') || error.message.includes('offline')) {
        throw new Error(
          'Network error: Unable to connect to the database. Please check your internet connection.'
        );
      }
      throw new Error(`Failed to fetch operator bookings: ${error.message}`);
    }

    throw new Error(error.message || 'Failed to fetch operator bookings due to an unknown error');
  }
};

// Add helper to fetch a single booking by document ID (keep for backward compatibility)
export const getBookingByDocId = async (bookingDocId: string): Promise<Booking | null> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingDocId);
    const bookingSnap = await getDoc(bookingRef);
    if (!bookingSnap.exists()) {
      return null;
    }
    return { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
  } catch (error) {
    console.error('Error fetching booking by doc ID:', error);
    throw new Error('Failed to fetch booking by document ID');
  }
};

// Add helper to fetch a single booking by custom booking ID (this is now the primary method)
export const getBookingById = async (bookingId: string): Promise<Booking | null> => {
  try {
    console.log('getBookingById called with bookingId:', bookingId);

    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    // Since we're now using custom bookingId as document ID, we can directly reference it
    const bookingRef = doc(db, 'bookings', bookingId);
    console.log('Attempting to fetch booking document directly...');
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      console.log('Booking document does not exist for ID:', bookingId);
      return null;
    }

    const bookingData = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
    console.log('Successfully fetched booking:', bookingData);
    return bookingData;
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      name: error instanceof Error ? error.name : undefined,
    });

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('permission') || error.message.includes('denied')) {
        throw new Error(
          `Permission denied: Cannot access booking ${bookingId}. Please check your authentication.`
        );
      } else if (error.message.includes('network') || error.message.includes('offline')) {
        throw new Error(
          'Network error: Unable to connect to the database. Please check your internet connection.'
        );
      }
      throw new Error(`Failed to fetch booking: ${error.message}`);
    }

    throw new Error('Failed to fetch booking due to an unknown error');
  }
};

// Add helper to fetch booking by the bookingId field (for legacy data)
export const getBookingByBookingId = async (bookingId: string): Promise<Booking | null> => {
  try {
    console.log('getBookingByBookingId called with bookingId:', bookingId);

    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    // First try to get it directly by document ID (new method)
    console.log('Attempting to fetch booking directly by document ID...');
    const directResult = await getBookingById(bookingId);
    if (directResult) {
      console.log('Successfully found booking by direct document ID:', directResult);
      return directResult;
    }

    console.log('Direct fetch failed, trying fallback query by bookingId field...');
    // Fallback: search by bookingId field (for legacy data)
    const bookingsQuery = query(collection(db, 'bookings'), where('bookingId', '==', bookingId));
    const snapshot = await getDocs(bookingsQuery);

    if (snapshot.empty) {
      console.log('No booking found with bookingId:', bookingId);
      return null;
    }

    const doc = snapshot.docs[0];
    const bookingData = { id: doc.id, ...doc.data() } as Booking;
    console.log('Found booking via fallback query:', bookingData);
    return bookingData;
  } catch (error) {
    console.error('Error fetching booking by booking ID:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      name: error instanceof Error ? error.name : undefined,
    });

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('permission') || error.message.includes('denied')) {
        throw new Error(
          `Permission denied: Cannot access booking ${bookingId}. Please check your authentication.`
        );
      } else if (error.message.includes('network') || error.message.includes('offline')) {
        throw new Error(
          'Network error: Unable to connect to the database. Please check your internet connection.'
        );
      }
      throw new Error(`Failed to fetch booking by booking ID: ${error.message}`);
    }

    throw new Error('Failed to fetch booking by booking ID due to an unknown error');
  }
};

/**
 * Update the status of a booking
 */
export const updateBookingStatus = async (
  bookingId: string,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
): Promise<void> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }

    await updateDoc(bookingRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw new Error('Failed to update booking status');
  }
};

/**
 * Fetch all bookings for a given client (debug version without orderBy)
 * This is a temporary function to isolate composite index issues
 */
export const getClientBookingsDebug = async (clientId: string): Promise<Booking[]> => {
  try {
    console.log('getClientBookingsDebug called with clientId:', clientId);

    if (!clientId) {
      throw new Error('Client ID is required');
    }

    // Try without orderBy first to see if it's a composite index issue
    const bookingsQuery = query(collection(db, 'bookings'), where('clientId', '==', clientId));

    console.log('Executing Firestore query for client bookings (without orderBy)...');
    const snapshot = await getDocs(bookingsQuery);
    console.log(`Query returned ${snapshot.docs.length} booking documents for client ${clientId}`);

    const bookings = snapshot.docs.map((doc) => {
      const data = doc.data();
      console.log('Booking document data:', { id: doc.id, ...data });
      return {
        id: doc.id,
        ...data,
      } as Booking;
    });

    // Sort manually by createdAt if needed
    bookings.sort((a, b) => {
      const aTime =
        a.createdAt && typeof a.createdAt.toDate === 'function'
          ? a.createdAt.toDate().getTime()
          : 0;
      const bTime =
        b.createdAt && typeof b.createdAt.toDate === 'function'
          ? b.createdAt.toDate().getTime()
          : 0;
      return bTime - aTime; // desc order
    });

    console.log('Successfully fetched and sorted client bookings:', bookings);
    return bookings;
  } catch (error) {
    console.error('Error fetching client bookings (debug):', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      name: error instanceof Error ? error.name : undefined,
    });

    throw error; // Re-throw the original error for debugging
  }
};
