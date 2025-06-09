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
import { generateInvoiceId, generateLegacyInvoiceId, generatePaymentId } from '@/lib/serials';
import { Invoice, LegacyInvoice, InvoiceStatus, PaymentRecord } from '@/types/invoice';

/**
 * Create a comprehensive invoice for a booking
 */
export const createComprehensiveInvoice = async (
  bookingId: string,
  clientId: string,
  operatorUserCode: string,
  offerId: string,
  amount: number,
  options?: {
    requestId?: string;
    description?: string;
    dueDate?: Date;
    notes?: string;
    clientNotes?: string;
  }
): Promise<string> => {
  try {
    console.log('Creating comprehensive invoice with:', {
      bookingId,
      clientId,
      operatorUserCode,
      offerId,
      amount,
    });

    // Validate required parameters
    if (!bookingId || !clientId || !operatorUserCode || !offerId || amount == null) {
      const missingFields = [];
      if (!bookingId) missingFields.push('bookingId');
      if (!clientId) missingFields.push('clientId');
      if (!operatorUserCode) missingFields.push('operatorUserCode');
      if (!offerId) missingFields.push('offerId');
      if (amount == null) missingFields.push('amount');

      throw new Error(`Missing required fields for invoice creation: ${missingFields.join(', ')}`);
    }

    // Validate amount is a valid number
    const validatedAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(validatedAmount) || validatedAmount <= 0) {
      throw new Error('Invalid amount for invoice creation');
    }

    const invoiceCode = generateInvoiceId(offerId);
    console.log('Generated invoice code:', invoiceCode);

    const rawInvoiceData: Omit<Invoice, 'id'> & Record<string, any> = {
      invoiceId: invoiceCode,
      bookingId,
      clientId,
      operatorUserCode,

      // Financial Details
      amount: validatedAmount,
      currency: 'USD',

      // Payment Tracking
      status: 'open' as InvoiceStatus,
      amountPaid: 0,
      amountPending: validatedAmount,
      payments: [],

      // References
      offerId,
      ...(options?.requestId ? { requestId: options.requestId } : {}),

      // Invoice Details
      description: options?.description || `Flight service for booking ${bookingId}`,
      ...(options?.dueDate ? { dueDate: Timestamp.fromDate(options.dueDate) } : {}),

      // Timestamps
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),

      // Notes
      ...(options?.notes ? { notes: options.notes } : {}),
      ...(options?.clientNotes ? { clientNotes: options.clientNotes } : {}),
    };

    // Remove any undefined values that may have slipped in (double-safety)
    const invoiceData = Object.fromEntries(
      Object.entries(rawInvoiceData).filter(([, value]) => value !== undefined)
    ) as Omit<Invoice, 'id'>;

    console.log('Comprehensive invoice data to be saved:', invoiceData);

    // Use setDoc with custom invoiceCode as document ID
    const invoiceRef = doc(db, 'invoices', invoiceCode);
    await setDoc(invoiceRef, invoiceData);
    console.log('Comprehensive invoice created successfully with ID:', invoiceCode);

    return invoiceCode;
  } catch (error) {
    console.error('Error creating comprehensive invoice:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create comprehensive invoice: ${error.message}`);
    }
    throw new Error('Failed to create comprehensive invoice due to an unknown error');
  }
};

/**
 * Legacy invoice creation (for backward compatibility)
 * @deprecated Use createComprehensiveInvoice instead
 */
export const createInvoice = async (
  bookingId: string,
  clientId: string,
  flightCode: string,
  amount: number
): Promise<string> => {
  console.warn('createInvoice is deprecated. Use createComprehensiveInvoice instead.');

  // For backward compatibility, create a legacy invoice but with basic payment tracking
  try {
    const invoiceCode = generateLegacyInvoiceId(flightCode);
    const validatedAmount = typeof amount === 'number' ? amount : parseFloat(amount);

    if (isNaN(validatedAmount) || validatedAmount <= 0) {
      throw new Error('Invalid amount for invoice creation');
    }

    const invoiceData: Omit<Invoice, 'id'> = {
      invoiceId: invoiceCode,
      bookingId,
      clientId,
      operatorUserCode: 'LEGACY-UNKNOWN', // Default for legacy invoices

      // Financial Details
      amount: validatedAmount,
      currency: 'USD',

      // Payment Tracking
      status: 'open' as InvoiceStatus,
      amountPaid: 0,
      amountPending: validatedAmount,
      payments: [],

      // Invoice Details
      description: `Legacy flight service for ${flightCode}`,

      // Timestamps
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const invoiceRef = doc(db, 'invoices', invoiceCode);
    await setDoc(invoiceRef, invoiceData);

    return invoiceCode;
  } catch (error) {
    console.error('Error creating legacy invoice:', error);
    throw new Error('Failed to create legacy invoice');
  }
};

/**
 * Record a payment against an invoice
 */
export const recordInvoicePayment = async (
  invoiceId: string,
  paymentAmount: number,
  options?: {
    paymentMethod?: string;
    reference?: string;
    notes?: string;
  }
): Promise<void> => {
  try {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const invoiceSnap = await getDoc(invoiceRef);

    if (!invoiceSnap.exists()) {
      throw new Error('Invoice not found');
    }

    const invoice = invoiceSnap.data() as Invoice;

    // Validate payment amount
    if (paymentAmount <= 0 || paymentAmount > invoice.amountPending) {
      throw new Error(`Invalid payment amount. Must be between 0 and ${invoice.amountPending}`);
    }

    // Create payment record
    const paymentRecord: PaymentRecord = {
      id: generatePaymentId(invoiceId),
      amount: paymentAmount,
      paymentDate: Timestamp.now(),
      paymentMethod: options?.paymentMethod,
      reference: options?.reference,
      notes: options?.notes,
    };

    // Calculate new payment status
    const newAmountPaid = invoice.amountPaid + paymentAmount;
    const newAmountPending = invoice.amount - newAmountPaid;

    let newStatus: InvoiceStatus;
    let paidAt: Timestamp | undefined;

    if (newAmountPending === 0) {
      newStatus = 'paid';
      paidAt = Timestamp.now();
    } else if (newAmountPaid > 0) {
      newStatus = 'balance-due';
    } else {
      newStatus = 'open';
    }

    // Update invoice
    const updateData: any = {
      status: newStatus,
      amountPaid: newAmountPaid,
      amountPending: newAmountPending,
      payments: [...invoice.payments, paymentRecord],
      updatedAt: Timestamp.now(),
    };

    if (paidAt) {
      updateData.paidAt = paidAt;
    }

    await updateDoc(invoiceRef, updateData);
    console.log(
      `Recorded payment of ${paymentAmount} for invoice ${invoiceId}. New status: ${newStatus}`
    );
  } catch (error) {
    console.error('Error recording invoice payment:', error);
    throw new Error('Failed to record invoice payment');
  }
};

/**
 * Update invoice status
 */
export const updateInvoiceStatus = async (
  invoiceId: string,
  newStatus: InvoiceStatus,
  notes?: string
): Promise<void> => {
  try {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const updateData: any = {
      status: newStatus,
      updatedAt: Timestamp.now(),
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (newStatus === 'paid') {
      updateData.paidAt = Timestamp.now();
    }

    await updateDoc(invoiceRef, updateData);
    console.log(`Updated invoice ${invoiceId} status to ${newStatus}`);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw new Error('Failed to update invoice status');
  }
};

/**
 * Get invoice payment summary
 */
export const getInvoicePaymentSummary = async (invoiceId: string) => {
  try {
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return {
      invoiceId: invoice.invoiceId,
      totalAmount: invoice.amount,
      amountPaid: invoice.amountPaid,
      amountPending: invoice.amountPending,
      status: invoice.status,
      paymentCount: invoice.payments.length,
      lastPaymentDate:
        invoice.payments.length > 0
          ? invoice.payments[invoice.payments.length - 1].paymentDate
          : null,
      currency: invoice.currency,
    };
  } catch (error) {
    console.error('Error getting invoice payment summary:', error);
    throw new Error('Failed to get invoice payment summary');
  }
};

/**
 * Get invoices by operator
 */
export const getInvoicesByOperator = async (operatorUserCode: string): Promise<Invoice[]> => {
  try {
    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('operatorUserCode', '==', operatorUserCode),
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
    console.error('Error fetching invoices by operator:', error);
    throw new Error('Failed to fetch invoices by operator');
  }
};

/**
 * Get invoice status statistics
 */
export const getInvoiceStatusStats = async (
  operatorUserCode?: string
): Promise<Record<InvoiceStatus, number>> => {
  try {
    let invoicesQuery = query(collection(db, 'invoices'));

    if (operatorUserCode) {
      invoicesQuery = query(
        collection(db, 'invoices'),
        where('operatorUserCode', '==', operatorUserCode)
      );
    }

    const snapshot = await getDocs(invoicesQuery);
    const stats: Record<InvoiceStatus, number> = {
      open: 0,
      'balance-due': 0,
      paid: 0,
    };

    snapshot.docs.forEach((doc) => {
      const invoice = doc.data() as Invoice;
      if (invoice.status in stats) {
        stats[invoice.status]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting invoice status stats:', error);
    throw new Error('Failed to get invoice status stats');
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
