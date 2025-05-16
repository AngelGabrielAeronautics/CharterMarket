import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { generateInvoiceId } from '@/lib/serials';
import { Invoice } from '@/types/invoice';

/**
 * Create a new invoice for a booking
 */
export const createInvoice = async (
  bookingId: string,
  flightCode: string,
  amount: number
): Promise<string> => {
  try {
    const invoiceCode = generateInvoiceId(flightCode);
    const invoiceData = {
      invoiceId: invoiceCode,
      bookingId,
      amount,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'invoices'), invoiceData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw new Error('Failed to create invoice');
  }
};

// Add helper to fetch invoices for a given booking
export const getInvoicesForBooking = async (
  bookingId: string
): Promise<Invoice[]> => {
  try {
    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('bookingId', '==', bookingId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(invoicesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw new Error('Failed to fetch invoices');
  }
}; 