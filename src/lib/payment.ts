import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { Payment, PaymentFormData, PaymentStatus } from '@/types/payment';
import { updateBookingStatus } from '@/lib/booking';
import { generatePaymentId } from '@/lib/serials';
import { createNotification } from '@/lib/notification';

/**
 * Create a new payment record for an invoice
 */
export const createPayment = async (
  bookingId: string,
  invoiceId: string,
  data: PaymentFormData
): Promise<string> => {
  try {
    const paymentId = generatePaymentId();
    const paymentData: Omit<Payment, 'id'> = {
      paymentId,
      bookingId,
      invoiceId,
      amount: data.amount,
      status: 'pending',
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference,
      notes: data.notes,
      paymentDate: data.paymentDate ? Timestamp.fromDate(data.paymentDate) : undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'payments'), paymentData);

    // Create notification for admins about new payment
    await createNotification(
      'admin', // Create for admin role
      'PAYMENT_PENDING',
      'New Payment Pending',
      `A new payment for booking ${bookingId} requires verification.`,
      { bookingId, paymentId: docRef.id },
      `/admin/payments/${docRef.id}`
    );

    return docRef.id;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw new Error('Failed to create payment record');
  }
};

/**
 * Process a payment (admin function)
 */
export const processPayment = async (
  paymentId: string,
  adminUserCode: string,
  status: PaymentStatus,
  notes?: string
): Promise<void> => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    const paymentSnap = await getDoc(paymentRef);

    if (!paymentSnap.exists()) {
      throw new Error('Payment record not found');
    }

    const payment = { id: paymentSnap.id, ...paymentSnap.data() } as Payment;

    // Update payment status
    await updateDoc(paymentRef, {
      status,
      notes: notes || payment.notes,
      processedDate: Timestamp.now(),
      processedBy: adminUserCode,
      updatedAt: Timestamp.now(),
    });

    // If payment is completed, update booking status to confirmed
    if (status === 'completed') {
      await updateBookingStatus(payment.bookingId, 'confirmed');

      // Create notification for client
      await createNotification(
        payment.processedBy || 'unknown',
        'PAYMENT_CONFIRMED',
        'Payment Confirmed',
        `Your payment for booking ${payment.bookingId} has been confirmed.`,
        { bookingId: payment.bookingId },
        `/dashboard/bookings/${payment.bookingId}`
      );
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    throw new Error('Failed to process payment');
  }
};

/**
 * Get all payments for a booking
 */
export const getPaymentsForBooking = async (bookingId: string): Promise<Payment[]> => {
  try {
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('bookingId', '==', bookingId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(paymentsQuery);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Payment);
  } catch (error) {
    console.error('Error fetching payments for booking:', error);
    throw new Error('Failed to fetch payments');
  }
};

/**
 * Get a single payment by ID
 */
export const getPaymentById = async (paymentId: string): Promise<Payment | null> => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    const paymentSnap = await getDoc(paymentRef);

    if (!paymentSnap.exists()) {
      return null;
    }

    return { id: paymentSnap.id, ...paymentSnap.data() } as Payment;
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw new Error('Failed to fetch payment');
  }
};

/**
 * Get all pending payments (admin function)
 */
export const getPendingPayments = async (): Promise<Payment[]> => {
  try {
    const pendingQuery = query(
      collection(db, 'payments'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(pendingQuery);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Payment);
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    throw new Error('Failed to fetch pending payments');
  }
};
