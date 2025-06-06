// Server-side payment functions for API routes
// NOTE: This mirrors some functions from payment.ts but for server-side use

import { getAdminDb } from '@/lib/firebase-admin';
import { generatePaymentId } from '@/lib/serials';
import { Timestamp } from 'firebase-admin/firestore';
import { Payment, PaymentFormData, PaymentStatus } from '@/types/payment';

/**
 * Create a new payment record for an invoice (server-side)
 */
export const createPaymentServer = async (
  bookingId: string,
  invoiceId: string,
  data: PaymentFormData
): Promise<string> => {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error('Firebase Admin Database not available');
    }

    const paymentId = generatePaymentId();
    const paymentData = {
      paymentId,
      bookingId,
      invoiceId,
      amount: data.amount,
      status: 'pending' as PaymentStatus,
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference,
      notes: data.notes,
      paymentDate: data.paymentDate ? Timestamp.fromDate(data.paymentDate) : undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Use custom document ID
    const docRef = adminDb.collection('payments').doc(paymentId);
    await docRef.set(paymentData);

    // TODO: Create notification for admins about new payment
    // Note: This would need a server-side notification function

    return paymentId;
  } catch (error) {
    console.error('Error creating payment (server):', error);
    throw new Error('Failed to create payment record');
  }
};

/**
 * Get all payments for a booking (server-side)
 */
export const getPaymentsForBookingServer = async (bookingId: string): Promise<Payment[]> => {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error('Firebase Admin Database not available');
    }

    const paymentsQuery = adminDb
      .collection('payments')
      .where('bookingId', '==', bookingId)
      .orderBy('createdAt', 'desc');

    const snapshot = await paymentsQuery.get();
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Payment
    );
  } catch (error) {
    console.error('Error fetching payments for booking (server):', error);
    throw new Error('Failed to fetch payments');
  }
};

/**
 * Get a single payment by ID (server-side)
 */
export const getPaymentByIdServer = async (paymentId: string): Promise<Payment | null> => {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error('Firebase Admin Database not available');
    }

    const paymentRef = adminDb.collection('payments').doc(paymentId);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      return null;
    }

    return { id: paymentSnap.id, ...paymentSnap.data() } as Payment;
  } catch (error) {
    console.error('Error fetching payment (server):', error);
    throw new Error('Failed to fetch payment');
  }
};

/**
 * Get all pending payments (server-side, admin function)
 */
export const getPendingPaymentsServer = async (): Promise<Payment[]> => {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error('Firebase Admin Database not available');
    }

    const pendingQuery = adminDb
      .collection('payments')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'asc');

    const snapshot = await pendingQuery.get();
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Payment
    );
  } catch (error) {
    console.error('Error fetching pending payments (server):', error);
    throw new Error('Failed to fetch pending payments');
  }
};

/**
 * Process a payment (server-side, admin function)
 */
export const processPaymentServer = async (
  paymentId: string,
  adminUserCode: string,
  status: PaymentStatus,
  notes?: string
): Promise<void> => {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error('Firebase Admin Database not available');
    }

    const paymentRef = adminDb.collection('payments').doc(paymentId);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      throw new Error('Payment record not found');
    }

    const payment = { id: paymentSnap.id, ...paymentSnap.data() } as Payment;

    // Update payment status
    await paymentRef.update({
      status,
      notes: notes || payment.notes,
      processedDate: Timestamp.now(),
      processedBy: adminUserCode,
      updatedAt: Timestamp.now(),
    });

    // If payment is completed, update booking status to confirmed
    if (status === 'completed') {
      const bookingRef = adminDb.collection('bookings').doc(payment.bookingId);
      await bookingRef.update({
        isPaid: true,
        status: 'confirmed',
        updatedAt: Timestamp.now(),
      });

      // TODO: Add notification and e-ticket generation logic here
      console.log(`Booking ${payment.bookingId} status updated to confirmed and marked as paid.`);
    }
  } catch (error) {
    console.error('Error processing payment (server):', error);
    throw new Error('Failed to process payment');
  }
};
