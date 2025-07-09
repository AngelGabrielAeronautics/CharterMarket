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
import { generateBookingId, generateFlightId } from '@/lib/serials';
import {
  Booking,
  LegacyBooking,
  BookingStatus,
  OperatorDetails,
  AircraftDetails,
  ClientPreferences,
  PaymentSummary,
  FlightDetails,
  BookingDocuments,
  PassengerDetails,
} from '@/types/booking';
import { QuoteRequest, Offer as Quote } from '@/types/flight';

/**
 * Helper function to fetch operator details
 */
async function fetchOperatorDetails(operatorUserCode: string): Promise<OperatorDetails> {
  try {
    const userDoc = await getDoc(doc(db, 'users', operatorUserCode));
    if (!userDoc.exists()) {
      throw new Error(`Operator ${operatorUserCode} not found`);
    }

    const userData = userDoc.data();
    return {
      operatorUserCode,
      operatorName: userData.company || `${userData.firstName} ${userData.lastName}`,
      contactPerson: `${userData.firstName} ${userData.lastName}`,
      contactEmail: userData.email,
      // Additional fields can be added as they become available
    };
  } catch (error) {
    console.error('Error fetching operator details:', error);
    // Return minimal operator details as fallback
    return {
      operatorUserCode,
      operatorName: operatorUserCode,
    };
  }
}

/**
 * Helper function to fetch aircraft details from operator's fleet
 */
async function fetchAircraftDetails(
  operatorUserCode: string,
  quoteId: string
): Promise<AircraftDetails> {
  try {
    // Try to get aircraft details from the quote first
    const quoteDoc = await getDoc(doc(db, 'quotes', quoteId));
    let aircraftId = null;

    if (quoteDoc.exists()) {
      const quoteData = quoteDoc.data();
      aircraftId = quoteData.aircraftId || quoteData.selectedAircraft;
    }

    // If we have an aircraft ID, fetch the full details
    if (aircraftId) {
      const aircraftDoc = await getDoc(
        doc(db, 'operators', operatorUserCode, 'aircraft', aircraftId)
      );
      if (aircraftDoc.exists()) {
        const aircraftData = aircraftDoc.data();
        return {
          id: aircraftDoc.id,
          registration: aircraftData.registration,
          make: aircraftData.make,
          model: aircraftData.model,
          year: aircraftData.year,
          maxPassengers: aircraftData.specifications?.maxPassengers || aircraftData.maxPassengers || 0,
          category: aircraftData.category,
          homeBase: aircraftData.homeBase,
          specifications: aircraftData.specifications,
        };
      }
    }

    // Fallback: return basic aircraft info
    return {
      id: 'unknown',
      registration: 'TBD',
      make: 'TBD',
      model: 'TBD',
      year: new Date().getFullYear(),
      maxPassengers: 0,
      category: 'TBD',
      homeBase: 'TBD',
      specifications: {},
    };
  } catch (error) {
    console.error('Error fetching aircraft details:', error);
    return {
      id: 'unknown',
      registration: 'TBD',
      make: 'TBD',
      model: 'TBD',
      year: new Date().getFullYear(),
      maxPassengers: 0,
      category: 'TBD',
      homeBase: 'TBD',
      specifications: {},
    };
  }
}

/**
 * Helper function to extract client preferences from quote request
 */
function extractClientPreferences(request: QuoteRequest): ClientPreferences {
  return {
    specialRequirements: request.specialRequirements,
    twinEngineMin: request.twinEngineMin,
    preferredCabinClass: 'standard', // Default since cabinClass was removed from requests
    // Additional preferences can be added as they become available
  };
}

/**
 * Helper function to create payment summary from quote
 */
function createPaymentSummary(quote: Quote): PaymentSummary {
  const commission = quote.commission || quote.price * 0.03;

  return {
    subtotal: quote.price,
    commission: commission,
    totalAmount: quote.totalPrice,
    amountPaid: 0, // No payment made yet
    amountPending: quote.totalPrice,
    currency: 'USD', // Default currency
  };
}

/**
 * Create a comprehensive booking based on a quote request and accepted quote
 */
export const createComprehensiveBooking = async (
  request: QuoteRequest,
  quote: Quote,
  options?: {
    invoiceId?: string;
    passengers?: PassengerDetails[];
  }
): Promise<string> => {
  try {
    console.log('Creating comprehensive booking with:', {
      requestId: request.id,
      quoteId: quote.offerId,
      operatorUserCode: quote.operatorUserCode,
      clientUserCode: request.clientUserCode,
    });

    // Validate required fields
    if (!request.id || !quote.offerId || !quote.operatorUserCode || !request.clientUserCode) {
      throw new Error('Missing required fields for booking creation');
    }

    const bookingCode = generateBookingId(quote.operatorUserCode);
    // Generate a flight grouping ID for this booking
    const flightId = generateFlightId(quote.operatorUserCode);

    // Fetch comprehensive data
    const [operatorDetails, aircraftDetails] = await Promise.all([
      fetchOperatorDetails(quote.operatorUserCode),
      fetchAircraftDetails(quote.operatorUserCode, quote.offerId),
    ]);

    // Create comprehensive booking data
    const bookingData: Omit<Booking, 'id'> = {
      // Core Identification
      bookingId: bookingCode,
      flightId,

      // References (removed duplication)
      requestId: request.id,
      quoteId: quote.offerId,

      // Status & Lifecycle
      status: 'pending-payment' as BookingStatus, // New default status
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),

      // Core Flight Information
      routing: request.routing,
      flightDetails: {
        // Initialize with empty flight details
      } as FlightDetails,

      // Parties Involved
      clientId: request.clientUserCode,
      operator: operatorDetails,

      // Aircraft & Preferences
      aircraft: aircraftDetails,
      clientPreferences: extractClientPreferences(request),
      cabinClass: 'standard', // Default cabin class

      // Passengers
      passengerCount: request.passengerCount,
      passengers: options?.passengers || [], // Empty array until manifest is provided

      // Financial
      payment: createPaymentSummary(quote),

      // Documents & References: only include invoiceId if provided
      documents: {
        ...(options?.invoiceId ? { invoiceId: options.invoiceId } : {}),
      } as BookingDocuments,

      // Original Request & Quote Data (embedded for historical reference)
      originalRequest: {
        requestCode: request.requestCode,
        submittedAt: request.createdAt,
        specialRequirements: request.specialRequirements,
        flexibleDates: request.routing.flexibleDates,
      },

      acceptedQuote: {
        offerId: quote.offerId,
        submittedAt: quote.createdAt,
        // Only include optional quote metadata if defined
        ...((quote as any).validUntil ? { validUntil: (quote as any).validUntil } : {}),
        ...((quote as any).notes ? { notes: (quote as any).notes } : {}),
        ...((quote as any).termsAndConditions
          ? { termsAndConditions: (quote as any).termsAndConditions }
          : {}),
      },

      // Operational
      checklistsCompleted: {
        operatorChecklist: false,
        clientChecklist: false,
        documentChecklist: false,
        paymentChecklist: false,
      },
    };

    console.log('Comprehensive booking data created:', {
      bookingId: bookingCode,
      status: bookingData.status,
      operatorName: bookingData.operator.operatorName,
      aircraftRegistration: bookingData.aircraft.registration,
      totalAmount: bookingData.payment.totalAmount,
    });

    // Save booking to Firestore
    const bookingRef = doc(db, 'bookings', bookingCode);
    await setDoc(bookingRef, bookingData);

    // Create flight record grouping bookings
    const flightRef = doc(db, 'flights', flightId);
    await setDoc(flightRef, {
      flightId,
      operatorUserCode: quote.operatorUserCode,
      routing: request.routing,
      departureDate: request.routing.departureDate,
      bookings: [bookingCode],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log('Flight created successfully with ID:', flightId);

    return bookingCode;
  } catch (error) {
    console.error('Error creating comprehensive booking:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create comprehensive booking: ${error.message}`);
    }
    throw new Error('Failed to create comprehensive booking due to an unknown error');
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
export const getOperatorBookings = async (operatorUserCode: string): Promise<Booking[]> => {
  try {
    console.log('getOperatorBookings called with operatorUserCode:', operatorUserCode);

    if (!operatorUserCode) {
      throw new Error('Operator user code is required');
    }

    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('operator.operatorUserCode', '==', operatorUserCode),
      orderBy('createdAt', 'desc')
    );

    console.log('Executing Firestore query for operator bookings...');
    const snapshot = await getDocs(bookingsQuery);
    console.log(
      `Query returned ${snapshot.docs.length} booking documents for operator ${operatorUserCode}`
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
          `Permission denied: Cannot access bookings for operator ${operatorUserCode}. Please check your authentication.`
        );
      } else if (error.message.includes('index') || error.message.includes('requires an index')) {
        throw new Error(
          `Database index required: Please create a composite index for operatorUserCode and createdAt fields.`
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
 * Fetch all bookings for a given client (debug version without orderBy)
 * This is a temporary function to isolate composite index issues
 *
 * NOTE: This function uses direct Firestore access on the server-side only.
 * Client-side code should use the API routes instead.
 */
export const getClientBookingsDebug = async (clientId: string): Promise<Booking[]> => {
  try {
    console.log('getClientBookingsDebug called with clientId:', clientId);

    if (!clientId) {
      throw new Error('Client ID is required');
    }

    // Check if we're running on the server side (where Firebase Admin SDK should be used)
    // If this is being called from client-side, throw an error
    if (typeof window !== 'undefined') {
      throw new Error(
        'getClientBookingsDebug should only be called server-side. Use API routes from client-side.'
      );
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

/**
 * Legacy booking creation (for backward compatibility)
 * @deprecated Use createComprehensiveBooking instead
 */
export const createBooking = async (request: QuoteRequest, quote: Quote): Promise<string> => {
  console.warn('createBooking is deprecated. Use createComprehensiveBooking instead.');
  return createComprehensiveBooking(request, quote);
};

/**
 * Update booking status with automatic progression logic
 */
export const updateBookingStatus = async (
  bookingId: string,
  newStatus: BookingStatus,
  options?: {
    paymentAmount?: number;
    notes?: string;
  }
): Promise<void> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }

    const booking = bookingSnap.data() as Booking;
    const updateData: any = {
      status: newStatus,
      updatedAt: Timestamp.now(),
    };

    // Handle payment status updates
    if (options?.paymentAmount && newStatus === 'deposit-paid') {
      updateData['payment.amountPaid'] = options.paymentAmount;
      updateData['payment.amountPending'] = booking.payment.totalAmount - options.paymentAmount;
      updateData['payment.lastPaymentDate'] = Timestamp.now();
    } else if (newStatus === 'confirmed') {
      updateData['payment.amountPaid'] = booking.payment.totalAmount;
      updateData['payment.amountPending'] = 0;
      updateData['payment.lastPaymentDate'] = Timestamp.now();
    }

    // Update checklists based on status
    if (newStatus === 'confirmed') {
      updateData['checklistsCompleted.paymentChecklist'] = true;
    } else if (newStatus === 'client-ready') {
      updateData['checklistsCompleted.clientChecklist'] = true;
      updateData['checklistsCompleted.documentChecklist'] = true;
    } else if (newStatus === 'flight-ready') {
      updateData['checklistsCompleted.operatorChecklist'] = true;
    }

    // Add notes if provided
    if (options?.notes) {
      updateData.notes = options.notes;
    }

    await updateDoc(bookingRef, updateData);
    console.log(`Booking ${bookingId} status updated to ${newStatus}`);
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw new Error('Failed to update booking status');
  }
};

/**
 * Add passengers to a booking
 */
export const addPassengersToBooking = async (
  bookingId: string,
  passengers: PassengerDetails[]
): Promise<void> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }

    const booking = bookingSnap.data() as Booking;

    // Validate passenger count
    if (passengers.length !== booking.passengerCount) {
      throw new Error(
        `Expected ${booking.passengerCount} passengers, received ${passengers.length}`
      );
    }

    await updateDoc(bookingRef, {
      passengers: passengers,
      updatedAt: Timestamp.now(),
    });

    console.log(`Added ${passengers.length} passengers to booking ${bookingId}`);
  } catch (error) {
    console.error('Error adding passengers to booking:', error);
    throw new Error('Failed to add passengers to booking');
  }
};

/**
 * Update flight details for a booking
 */
export const updateFlightDetails = async (
  bookingId: string,
  flightDetails: Partial<FlightDetails>
): Promise<void> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }

    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    // Update flight details
    Object.keys(flightDetails).forEach((key) => {
      updateData[`flightDetails.${key}`] = flightDetails[key as keyof FlightDetails];
    });

    await updateDoc(bookingRef, updateData);
    console.log(`Flight details updated for booking ${bookingId}`);
  } catch (error) {
    console.error('Error updating flight details:', error);
    throw new Error('Failed to update flight details');
  }
};

/**
 * Link invoice to booking
 */
export const linkInvoiceToBooking = async (
  bookingId: string,
  invoiceId: string,
  invoiceType: 'invoiceId' | 'proformaInvoiceId' = 'invoiceId'
): Promise<void> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);

    await updateDoc(bookingRef, {
      [`documents.${invoiceType}`]: invoiceId,
      updatedAt: Timestamp.now(),
    });

    console.log(`Linked ${invoiceType} ${invoiceId} to booking ${bookingId}`);
  } catch (error) {
    console.error('Error linking invoice to booking:', error);
    throw new Error('Failed to link invoice to booking');
  }
};

/**
 * Archive bookings that have passed their flight date
 */
export const archiveCompletedBookings = async (): Promise<number> => {
  try {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    // Query for bookings that should be archived
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('status', 'in', ['confirmed', 'client-ready', 'flight-ready']),
      where('routing.departureDate', '<=', Timestamp.fromDate(cutoffDate))
    );

    const snapshot = await getDocs(bookingsQuery);
    let archivedCount = 0;

    for (const docSnap of snapshot.docs) {
      try {
        await updateDoc(docSnap.ref, {
          status: 'archived' as BookingStatus,
          archivedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        archivedCount++;
      } catch (error) {
        console.error(`Error archiving booking ${docSnap.id}:`, error);
      }
    }

    console.log(`Archived ${archivedCount} completed bookings`);
    return archivedCount;
  } catch (error) {
    console.error('Error archiving completed bookings:', error);
    throw new Error('Failed to archive completed bookings');
  }
};

/**
 * Get booking status statistics
 */
export const getBookingStatusStats = async (
  operatorUserCode?: string
): Promise<Record<BookingStatus, number>> => {
  try {
    let bookingsQuery = query(collection(db, 'bookings'));

    if (operatorUserCode) {
      bookingsQuery = query(
        collection(db, 'bookings'),
        where('operator.operatorUserCode', '==', operatorUserCode)
      );
    }

    const snapshot = await getDocs(bookingsQuery);
    const stats: Record<BookingStatus, number> = {
      'pending-payment': 0,
      'deposit-paid': 0,
      confirmed: 0,
      'client-ready': 0,
      'flight-ready': 0,
      cancelled: 0,
      credited: 0,
      refunded: 0,
      archived: 0,
    };

    snapshot.docs.forEach((doc) => {
      const booking = doc.data() as Booking;
      if (booking.status in stats) {
        stats[booking.status]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting booking status stats:', error);
    throw new Error('Failed to get booking status stats');
  }
};
