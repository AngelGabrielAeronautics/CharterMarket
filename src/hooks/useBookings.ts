'use client';
import { useState, useEffect, useCallback } from 'react';
import { Booking } from '@/types/booking';
import { Invoice } from '@/types/invoice';
import {
  mockGetClientBookings,
  mockGetOperatorBookings,
  mockGetBookingById,
} from '@/mocks/api/bookings';
import { auth } from '@/lib/firebase';

// Check if we're in development environment
const isDev = process.env.NODE_ENV === 'development';

// Helper function to get auth headers
async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
  }
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Hook to fetch bookings for a client
 */
export function useClientBookings(clientId?: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const refreshBookings = useCallback(() => {
    setLastRefresh(Date.now());
  }, []);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    console.log(`[useClientBookings] Fetching bookings for clientId: ${clientId}`);
    (async () => {
      setLoading(true);
      try {
        // Always fetch real API for client bookings
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/bookings?clientId=${clientId}`, {
          headers,
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || `API error ${res.status}`);
        }
        const data: Booking[] = await res.json();
        setBookings(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId, lastRefresh]);

  return { bookings, loading, error, refreshBookings };
}

/**
 * Hook to fetch bookings for an operator
 */
export function useOperatorBookings(operatorCode?: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const refreshBookings = useCallback(() => {
    setLastRefresh(Date.now());
  }, []);

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
          const headers = await getAuthHeaders();
          const res = await fetch(`/api/bookings?operatorUserCode=${operatorCode}`, {
            headers,
          });
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
  }, [operatorCode, lastRefresh]);

  return { bookings, loading, error, refreshBookings };
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
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch booking detail from API
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/bookings?bookingId=${bookingId}`, {
          headers,
        });
        if (!res.ok) {
          let errorMsg = 'Failed to load booking';
          try {
            const errRes = await res.json();
            errorMsg = errRes.error || errorMsg;
          } catch {
            errorMsg = (await res.text()) || errorMsg;
          }
          throw new Error(errorMsg);
        }
        const b: Booking = await res.json();

        // Support both legacy and new booking structures
        const bookingAny = b as any;
        const operatorUserCode = bookingAny.operatorUserCode || b.operator?.operatorUserCode;

        if (
          userRole === 'admin' ||
          userRole === 'superAdmin' ||
          b.clientId === userCode ||
          operatorUserCode === userCode
        ) {
          setBooking(b);
        } else {
          setError('Not authorized to view this booking');
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
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/invoices?bookingId=${bookingId}`, {
          headers,
        });

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
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/invoices?invoiceId=${invoiceId}`, {
          headers,
        });
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
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/invoices?clientId=${clientId}`, {
          headers,
        });
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

/**
 * A generalized hook to fetch bookings based on user role.
 * It uses useClientBookings for passengers/agents and useOperatorBookings for operators.
 */
export function useBookings(userCode?: string, userRole?: string) {
  const isOperator = userRole === 'operator';
  const isClient = userRole === 'passenger' || userRole === 'agent';

  const {
    bookings: clientBookings,
    loading: clientLoading,
    error: clientError,
    refreshBookings: refreshClientBookings,
  } = useClientBookings(isClient ? userCode : undefined);

  const {
    bookings: operatorBookings,
    loading: operatorLoading,
    error: operatorError,
    refreshBookings: refreshOperatorBookings,
  } = useOperatorBookings(isOperator ? userCode : undefined);

  // Combine results based on user role
  const bookings = isOperator ? operatorBookings : clientBookings;
  const loading = isOperator ? operatorLoading : clientLoading;
  const error = isOperator ? operatorError : clientError;
  const refreshBookings = isOperator ? refreshOperatorBookings : refreshClientBookings;

  // The refresh function would ideally be unified as well.
  // For now, we are not returning a refresh function.
  // A potential implementation would be to return the specific refresh function based on role.

  return { bookings, loading, error, refreshBookings };
}
