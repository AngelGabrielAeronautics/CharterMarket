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
} from 'firebase/firestore';
import { generateInvoiceId } from '@/lib/serials';
import { Invoice } from '@/types/invoice';

/**
 * Create a new invoice for a booking
 */
export const createInvoice = async (
  bookingId: string,
  clientId: string,
  flightCode: string,
  amount: number
): Promise<string> => {
  try {
    console.log('createInvoice called with params:', { bookingId, clientId, flightCode, amount });

    // Validate required parameters
    if (!bookingId || !clientId || !flightCode || amount == null) {
      const missingFields = [];
      if (!bookingId) missingFields.push('bookingId');
      if (!clientId) missingFields.push('clientId');
      if (!flightCode) missingFields.push('flightCode');
      if (amount == null) missingFields.push('amount');

      throw new Error(`Missing required fields for invoice creation: ${missingFields.join(', ')}`);
    }

    // Validate amount is a valid number
    const validatedAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(validatedAmount) || validatedAmount <= 0) {
      throw new Error('Invalid amount for invoice creation');
    }

    const invoiceCode = generateInvoiceId(flightCode);
    console.log('Generated invoice code:', invoiceCode);

    const invoiceData: Omit<Invoice, 'id'> = {
      invoiceId: invoiceCode,
      bookingId,
      clientId,
      amount: validatedAmount,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    console.log('Invoice data to be saved:', invoiceData);

    // Use setDoc with custom invoiceCode as document ID instead of addDoc
    const invoiceRef = doc(db, 'invoices', invoiceCode);
    await setDoc(invoiceRef, invoiceData);
    console.log('Invoice created successfully with custom ID:', invoiceCode);

    // Return the custom invoice ID instead of auto-generated document ID
    return invoiceCode;
  } catch (error) {
    console.error('Error creating invoice:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      name: error instanceof Error ? error.name : undefined,
    });

    // Provide more specific error message
    if (error instanceof Error) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }
    throw new Error('Failed to create invoice due to an unknown error');
  }
};

// Add helper to fetch invoices for a given booking
export const getInvoicesForBooking = async (bookingId: string): Promise<Invoice[]> => {
  try {
    console.log(`getInvoicesForBooking called with bookingId: ${bookingId}`);

    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('bookingId', '==', bookingId),
      orderBy('createdAt', 'desc')
    );

    console.log('Executing Firestore query for invoices...');
    const snapshot = await getDocs(invoicesQuery);
    console.log(
      `Query returned ${snapshot.docs.length} invoice documents for booking ${bookingId}`
    );

    const invoices = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Invoice
    );

    console.log('Successfully fetched invoices for booking:', invoices);
    return invoices;
  } catch (error) {
    console.error('Error fetching invoices for booking:', error);
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
          `Permission denied: Cannot access invoices for booking ${bookingId}. Please check your authentication.`
        );
      } else if (error.message.includes('index') || error.message.includes('requires an index')) {
        throw new Error(
          `Database index required: Please create a composite index for bookingId and createdAt fields in invoices collection.`
        );
      } else if (error.message.includes('network') || error.message.includes('offline')) {
        throw new Error(
          'Network error: Unable to connect to the database. Please check your internet connection.'
        );
      }
      throw new Error(`Failed to fetch invoices for booking: ${error.message}`);
    }

    throw new Error('Failed to fetch invoices for booking due to an unknown error');
  }
};

/**
 * Fetch invoices for a booking (debug version without orderBy)
 * This is a temporary function to isolate composite index issues
 */
export const getInvoicesForBookingDebug = async (bookingId: string): Promise<Invoice[]> => {
  try {
    console.log('getInvoicesForBookingDebug called with bookingId:', bookingId);

    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    // Try without orderBy first to see if it's a composite index issue
    const invoicesQuery = query(collection(db, 'invoices'), where('bookingId', '==', bookingId));

    console.log('Executing Firestore query for invoices (without orderBy)...');
    const snapshot = await getDocs(invoicesQuery);
    console.log(
      `Query returned ${snapshot.docs.length} invoice documents for booking ${bookingId}`
    );

    const invoices = snapshot.docs.map((doc) => {
      const data = doc.data();
      console.log('Invoice document data:', { id: doc.id, ...data });
      return {
        id: doc.id,
        ...data,
      } as Invoice;
    });

    // Sort manually by createdAt if needed
    invoices.sort((a, b) => {
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

    console.log('Successfully fetched and sorted invoices for booking:', invoices);
    return invoices;
  } catch (error) {
    console.error('Error fetching invoices for booking (debug):', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      name: error instanceof Error ? error.name : undefined,
    });

    throw error; // Re-throw the original error for debugging
  }
};

// Add helper to fetch invoice by document ID (keep for backward compatibility)
export const getInvoiceByDocId = async (invoiceDocId: string): Promise<Invoice | null> => {
  try {
    const invoiceRef = doc(db, 'invoices', invoiceDocId);
    const invoiceSnap = await getDoc(invoiceRef);
    if (!invoiceSnap.exists()) {
      return null;
    }
    return { id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice;
  } catch (error) {
    console.error('Error fetching invoice by doc ID:', error);
    throw new Error('Failed to fetch invoice by document ID');
  }
};

// Update to fetch invoice by custom invoice ID (this is now the primary method)
export const getInvoiceById = async (invoiceId: string): Promise<Invoice | null> => {
  try {
    // Since we're now using custom invoiceId as document ID, we can directly reference it
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const invoiceSnap = await getDoc(invoiceRef);
    if (!invoiceSnap.exists()) {
      return null;
    }
    return { id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice;
  } catch (error) {
    console.error('Error fetching invoice by ID:', error);
    throw new Error('Failed to fetch invoice by ID');
  }
};

// Add helper to fetch invoice by the invoiceId field (for legacy data)
export const getInvoiceByInvoiceId = async (invoiceId: string): Promise<Invoice | null> => {
  try {
    // First try to get it directly by document ID (new method)
    const directResult = await getInvoiceById(invoiceId);
    if (directResult) {
      return directResult;
    }

    // Fallback: search by invoiceId field (for legacy data)
    const invoicesQuery = query(collection(db, 'invoices'), where('invoiceId', '==', invoiceId));
    const snapshot = await getDocs(invoicesQuery);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Invoice;
  } catch (error) {
    console.error('Error fetching invoice by invoice ID:', error);
    throw new Error('Failed to fetch invoice by invoice ID');
  }
};

export const getInvoicesByClientId = async (clientId: string): Promise<Invoice[]> => {
  try {
    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(invoicesQuery);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Invoice
    );
  } catch (error) {
    console.error('Error fetching invoices by client ID:', error);
    // Preserve the original Firestore error message for debugging
    const origMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch invoices by client ID: ${origMsg}`);
  }
};
