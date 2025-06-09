// @ts-nocheck
'use client';

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
import { getBookingById, updateBookingStatus } from '@/lib/booking';
import { getPassengersForBooking } from '@/lib/passenger';
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
    const paymentId = generatePaymentId(invoiceId);
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
      // Fetch the booking details to get passengerCount and to ensure bookingId is Firestore Doc ID
      const bookingData = await getBookingById(payment.bookingId); // payment.bookingId should be the Firestore doc ID

      if (!bookingData) {
        console.error(`Booking not found with ID: ${payment.bookingId} during payment processing.`);
        // Decide if this should throw an error or just log and skip e-ticket part
        throw new Error('Associated booking not found during payment processing.');
      }

      // First, mark the booking as paid and update its status
      await updateDoc(doc(db, 'bookings', payment.bookingId), {
        isPaid: true,
        status: 'confirmed', // Ensure status is set to confirmed
        updatedAt: Timestamp.now(),
      });
      console.log(`Booking ${payment.bookingId} status updated to confirmed and marked as paid.`);

      // Create notification for client about payment confirmation
      // Ensure bookingData.clientId exists and is correct for notification target
      if (bookingData.clientId) {
        await createNotification(
          bookingData.clientId, // Target the client of the booking
          'PAYMENT_CONFIRMED',
          'Payment Confirmed',
          `Your payment for booking ${bookingData.bookingId} (Ref: ${bookingData.requestCode}) has been confirmed.`,
          { bookingId: payment.bookingId, internalBookingId: bookingData.bookingId },
          `/dashboard/bookings/${payment.bookingId}` // Link to booking detail page
        );
      } else {
        console.warn(
          `Client ID not found for booking ${payment.bookingId}, skipping payment confirmation notification.`
        );
      }

      // Now, attempt to trigger e-ticket generation
      const passengers = await getPassengersForBooking(payment.bookingId); // payment.bookingId is Firestore doc ID

      console.log(
        `For booking ${payment.bookingId}, found ${passengers.length} passengers, expected ${bookingData.passengerCount}`
      );

      if (passengers.length > 0 && passengers.length >= bookingData.passengerCount) {
        console.log(
          `Conditions met for e-ticket generation for booking ${payment.bookingId}. Triggering...`
        );
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const eticketResponse = await fetch(
            `${appUrl}/api/bookings/${payment.bookingId}/generate-etickets`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // TODO: Add any necessary auth headers if the API is protected
                // e.g., an internal service key or a system token
              },
            }
          );

          if (!eticketResponse.ok) {
            const errorData = await eticketResponse.json();
            console.error(
              `Failed to trigger e-ticket generation for booking ${payment.bookingId}: Status ${eticketResponse.status}`,
              errorData.error
            );
            // Log this failure. Consider adding to a retry queue or admin notification.
          } else {
            const responseData = await eticketResponse.json();
            console.log(
              `E-ticket generation API call successful for booking ${payment.bookingId}:`,
              responseData.message
            );
          }
        } catch (eTicketError) {
          console.error(
            `Error calling e-ticket generation API for booking ${payment.bookingId}:`,
            eTicketError
          );
          // Log and continue. E-ticket generation can be retried.
        }
      } else {
        console.log(
          `Booking ${payment.bookingId} confirmed and paid, but passenger manifest (found ${passengers.length}, expected ${bookingData.passengerCount}) not yet complete for e-ticket generation.`
        );
        // Optionally, create a notification for admin/client to complete the manifest
        if (bookingData.clientId) {
          await createNotification(
            bookingData.clientId,
            'MANIFEST_INCOMPLETE',
            'Passenger Information Needed',
            `Your flight booking ${bookingData.bookingId} is confirmed! Please complete the passenger information to receive your e-tickets.`,
            { bookingId: payment.bookingId },
            `/dashboard/bookings/${payment.bookingId}`
          );
        }
      }
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    // Ensure the error is re-thrown so the caller knows the operation failed.
    // If this is part of an admin UI, the UI should display this error.
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to process payment');
    } else {
      throw new Error('Failed to process payment due to an unknown error');
    }
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
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Payment
    );
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
      where('status', '==', 'pending'), // Could also include 'overdue' if that's a status you use
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(pendingQuery);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Payment
    );
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    throw new Error('Failed to fetch pending payments');
  }
};

/**
 * Get all payments (admin function)
 */
export const getAllPayments = async (): Promise<Payment[]> => {
  try {
    const paymentsCollection = collection(db, 'payments');
    const q = query(paymentsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Payment
    );
  } catch (error) {
    console.error('Error fetching all payments:', error);
    throw new Error('Failed to fetch all payments');
  }
};

/**
 * Mark an operator as paid for a given payment (admin function)
 */
export const markOperatorAsPaid = async (
  paymentId: string,
  adminUserCode: string,
  notes?: string
): Promise<void> => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    const paymentSnap = await getDoc(paymentRef);

    if (!paymentSnap.exists()) {
      throw new Error('Payment record not found to mark operator as paid.');
    }

    const paymentData = paymentSnap.data();

    // Ensure the payment is actually completed before marking operator as paid
    if (paymentData.status !== 'completed' && paymentData.status !== 'paid') {
      throw new Error(
        `Cannot mark operator as paid for a payment that is not completed. Current status: ${paymentData.status}`
      );
    }

    await updateDoc(paymentRef, {
      operatorPaid: true,
      operatorPaidDate: Timestamp.now(),
      operatorPaymentNotes: notes || 'Operator paid by admin.', // Default notes
      operatorPaidBy: adminUserCode,
      updatedAt: Timestamp.now(),
    });

    // Optional: Create a notification for the operator or internal logs
    // Example: If booking and operator details are on the payment or can be fetched:
    // const bookingId = paymentData.bookingId;
    // const operatorId = bookingData.operatorId; // Assuming booking data is fetched or available
    // if (operatorId) {
    //   await createNotification(
    //     operatorId,
    //     'OPERATOR_PAYOUT_PROCESSED',
    //     'Payout Processed',
    //     `Your payout for booking ${bookingId} related to payment ${paymentId} has been processed.`,
    //     { paymentId, bookingId },
    //     `/dashboard/operator/payments` // Link to operator payment history
    //   );
    // }
  } catch (error) {
    console.error('Error marking operator as paid:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to mark operator as paid.');
    }
    throw new Error('Failed to mark operator as paid due to an unknown error.');
  }
};
