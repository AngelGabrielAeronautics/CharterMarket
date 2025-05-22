'use client';

import { useState, useEffect, useCallback } from 'react';
import { Payment, PaymentFormData, PaymentStatus } from '@/types/payment';

/**
 * Hook to fetch payments for a booking
 */
export function useBookingPayments(bookingId?: string) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/payments?bookingId=${bookingId}`);
        if (!res.ok) throw new Error(await res.text());
        const data: Payment[] = await res.json();
        setPayments(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load payments');
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  return { payments, loading, error };
}

/**
 * Hook to fetch a single payment
 */
export function usePaymentDetail(paymentId?: string) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) {
      setLoading(false);
      setPayment(null);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/payments/${paymentId}`);
        if (!res.ok) throw new Error(await res.text());
        const data: Payment = await res.json();
        setPayment(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load payment');
      } finally {
        setLoading(false);
      }
    })();
  }, [paymentId]);

  return { payment, loading, error };
}

/**
 * Hook for admin to fetch pending payments
 */
export function usePendingPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/payments?pending=true`);
        if (!res.ok) throw new Error(await res.text());
        const data: Payment[] = await res.json();
        setPayments(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load pending payments');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { payments, loading, error };
}

/**
 * Hook to manage payment submission and processing
 */
export function usePaymentManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createPayment = async (
    bookingId: string,
    invoiceId: string,
    data: PaymentFormData
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId, invoiceId, ...data }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const responseData = await res.json();
      setSuccess(true);
      return responseData.id;
    } catch (err) {
      console.error('Error creating payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payment');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (
    paymentId: string,
    adminUserCode: string,
    status: PaymentStatus,
    notes?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminUserCode, status, notes }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      setSuccess(true);
      return true;
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createPayment,
    processPayment,
    loading,
    error,
    success,
  };
}

const isDev = process.env.NODE_ENV === 'development';

export function usePayments(adminView: boolean = false) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // In a real app, for adminView, you might have a different endpoint
      // or pass an admin flag to fetch all payments.
      // For now, assuming /api/payments can return all if no specific ID is given,
      // or if an admin token/role is detected server-side.
      const response = await fetch(adminView ? '/api/payments?all=true' : '/api/payments');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch payments: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setPayments(data);
    } catch (e: any) {
      console.error('Error in usePayments:', e);
      setError(e.message || 'An unknown error occurred');
      setPayments([]); // Clear payments on error
    } finally {
      setLoading(false);
    }
  }, [adminView]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { payments, loading, error, refetchPayments: fetchPayments };
}
