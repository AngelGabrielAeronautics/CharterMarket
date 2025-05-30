'use client';
import { useState, useEffect } from 'react';
import { Booking } from '@/types/booking';
import { Invoice } from '@/types/invoice';
import {
  mockGetClientBookings,
  mockGetOperatorBookings,
  mockGetBookingById,
} from '@/mocks/api/bookings';

// Check if we're in development environment
const isDev = process.env.NODE_ENV === 'development';

/**
 * Hook to fetch bookings for a client
 */
export function useClientBookings(clientId?: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        // Use mock API in development
        if (isDev) {
          const data = await mockGetClientBookings(clientId);
          setBookings(data);
        } else {
          const res = await fetch(`/api/bookings?clientId=${clientId}`);
          if (!res.ok) throw new Error(await res.text());
          const data: Booking[] = await res.json();
          setBookings(data);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId]);

  return { bookings, loading, error };
}

/**
 * Hook to fetch bookings for an operator
 */
export function useOperatorBookings(operatorCode?: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!operatorCode) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        // Use mock API in development
        if (isDev) {
          const data = await mockGetOperatorBookings(operatorCode);
          setBookings(data);
        } else {
          const res = await fetch(`/api/bookings?operatorId=${operatorCode}`);
          if (!res.ok) {
            // Try to parse JSON error response
            const text = await res.text();
            let msg = text;
            try {
              msg = JSON.parse(text).error || text;
            } catch (e) {
              /* ignore parsing error, msg remains text */
            }
            throw new Error(msg);
          }
          const data: Booking[] = await res.json();
          setBookings(data);
        }
      } catch (err: any) {
        console.error('Error in useOperatorBookings:', err);
        setError(err.message || 'Failed to fetch operator bookings');
      } finally {
        setLoading(false);
      }
    })();
  }, [operatorCode]);

  return { bookings, loading, error };
}

/**
 * Hook to fetch a single booking detail (client-side only)
 */
export function useBookingDetail(bookingId?: string, userCode?: string, userRole?: string) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId || !userCode || !userRole) {
      setLoading(false);
      // setError('Missing bookingId, userCode, or userRole'); // Optional: More specific error
      return;
    }
    (async () => {
      setLoading(true);
      setError(null); // Clear previous errors
      try {
        // Use mock API in development
        if (isDev) {
          const b = await mockGetBookingById(bookingId);

          if (!b) {
            throw new Error('Booking not found');
          }

          if (
            userRole === 'admin' ||
            userRole === 'superAdmin' ||
            b.clientId === userCode ||
            b.operatorId === userCode
          ) {
            setBooking(b);
          } else {
            setError('Not authorized to view this booking');
          }
        } else {
          const res = await fetch(`/api/bookings?bookingId=${bookingId}`);
          if (!res.ok) {
            let errorMsg = 'Failed to load booking';
            try {
              const errRes = await res.json();
              errorMsg = errRes.error || errorMsg;
            } catch (e) {
              // If response is not JSON, use text
              errorMsg = (await res.text()) || errorMsg;
            }
            throw new Error(errorMsg);
          }
          const b: Booking = await res.json();

          if (
            userRole === 'admin' ||
            userRole === 'superAdmin' ||
            b.clientId === userCode ||
            b.operatorId === userCode
          ) {
            setBooking(b);
          } else {
            setError('Not authorized to view this booking');
          }
        }
      } catch (err: any) {
        console.error('Error in useBookingDetail:', err);
        setError(err.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId, userCode, userRole]);

  return { booking, loading, error };
}

/**
 * Hook to fetch invoices for a booking
 */
export function useInvoices(bookingId?: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchInvoices = async () => {
      setLoading(true);
      try {
        console.log('Fetching invoices for bookingId:', bookingId);
        const res = await fetch(`/api/invoices?bookingId=${bookingId}`);

        // Don't update state if component is unmounted
        if (!isMounted) return;

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Error response when fetching invoices:', errorText, 'Status:', res.status);

          let errorMessage = 'Failed to load invoices';
          try {
            // Try to parse error JSON
            const errorData = JSON.parse(errorText);
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            // If not JSON, use the raw error text
            errorMessage = errorText || `HTTP error ${res.status}`;
          }

          throw new Error(errorMessage);
        }

        const data: Invoice[] = await res.json();
        console.log('Invoices loaded successfully:', data);

        // Don't update state if component is unmounted
        if (!isMounted) return;

        setInvoices(data);
      } catch (err) {
        console.error('Error in useInvoices hook:', err);

        // Don't update state if component is unmounted
        if (!isMounted) return;

        setError(err instanceof Error ? err.message : 'Failed to load invoices');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInvoices();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  return { invoices, loading, error };
}

/**
 * Hook to fetch a single invoice detail
 */
export function useInvoiceDetail(invoiceId?: string) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) {
      setLoading(false);
      setInvoice(null); // Ensure invoice is null if no ID
      return;
    }
    (async () => {
      setLoading(true);
      setError(null); // Clear previous errors
      try {
        const res = await fetch(`/api/invoices?invoiceId=${invoiceId}`);
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API Error fetching invoice:', errorText, 'Status:', res.status);
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || `HTTP error ${res.status}`);
          } catch (e) {
            throw new Error(errorText || `HTTP error ${res.status}`);
          }
        }
        const data: Invoice = await res.json();
        setInvoice(data);
      } catch (err: any) {
        console.error('Error in useInvoiceDetail:', err);
        setError(err.message || 'Failed to load invoice details');
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [invoiceId]);

  return { invoice, loading, error };
}

/**
 * Hook to fetch all invoices for a given client (passenger or agent)
 */
export function useClientInvoices(clientId?: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      setInvoices([]);
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // This API endpoint will need to be updated to support querying invoices by clientId
        const res = await fetch(`/api/invoices?clientId=${clientId}`);
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API Error fetching client invoices:', errorText, 'Status:', res.status);
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || `HTTP error ${res.status}`);
          } catch (e) {
            throw new Error(errorText || `HTTP error ${res.status}`);
          }
        }
        const data: Invoice[] = await res.json();
        setInvoices(data);
      } catch (err: any) {
        console.error('Error in useClientInvoices:', err);
        setError(err.message || 'Failed to load client invoices');
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId]);

  return { invoices, loading, error };
}
