import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  orderBy,
  getDocs,
  doc,
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
    console.log('Creating invoice with params:', { bookingId, clientId, flightCode, amount });
    const invoiceCode = generateInvoiceId(flightCode);
    const invoiceData: Omit<Invoice, 'id'> = {
      invoiceId: invoiceCode,
      bookingId,
      clientId,
      amount,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    console.log('Invoice data to be saved:', invoiceData);
    const docRef = await addDoc(collection(db, 'invoices'), invoiceData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating invoice:', error);
    console.error('Error details:', JSON.stringify(error));
    throw new Error('Failed to create invoice');
  }
};

// Add helper to fetch invoices for a given booking
export const getInvoicesForBooking = async (bookingId: string): Promise<Invoice[]> => {
  try {
    console.log(`Building query for invoices with bookingId: ${bookingId}`);

    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('bookingId', '==', bookingId),
      orderBy('createdAt', 'desc')
    );

    console.log('Executing Firestore query for invoices...');
    const snapshot = await getDocs(invoicesQuery);
    console.log(`Query returned ${snapshot.docs.length} invoice documents`);

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Invoice);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    // Add more details to the error
    const enhancedError = new Error(
      `Failed to fetch invoices: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    if (error instanceof Error) {
      enhancedError.stack = error.stack;
      (enhancedError as any).code = (error as any).code;
      (enhancedError as any).original = error;
    }
    throw enhancedError;
  }
};

export const getInvoiceById = async (invoiceDocId: string): Promise<Invoice | null> => {
  try {
    const invoiceRef = doc(db, 'invoices', invoiceDocId);
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

export const getInvoicesByClientId = async (clientId: string): Promise<Invoice[]> => {
  try {
    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(invoicesQuery);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Invoice);
  } catch (error) {
    console.error('Error fetching invoices by client ID:', error);
    // Preserve the original Firestore error message for debugging
    const origMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch invoices by client ID: ${origMsg}`);
  }
};
