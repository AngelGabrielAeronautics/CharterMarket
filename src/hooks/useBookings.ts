"use client";
import { useState, useEffect } from 'react';
import { Booking } from '@/types/booking';
import { Invoice } from '@/types/invoice';

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
        const res = await fetch(`/api/bookings?clientId=${clientId}`);
        if (!res.ok) throw new Error(await res.text());
        const data: Booking[] = await res.json();
        setBookings(data);
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
        const res = await fetch(`/api/bookings?operatorId=${operatorCode}`);
        if (!res.ok) throw new Error(await res.text());
        const data: Booking[] = await res.json();
        setBookings(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load operator bookings');
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
export function useBookingDetail(bookingId?: string, clientId?: string) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId || !clientId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/bookings?bookingId=${bookingId}`);
        if (!res.ok) throw new Error(await res.text());
        const b: Booking = await res.json();
        if (b.clientId !== clientId) {
          setError('Not authorized to view this booking');
        } else {
          setBooking(b);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load booking');
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId, clientId]);

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
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/invoices?bookingId=${bookingId}`);
        if (!res.ok) throw new Error(await res.text());
        const data: Invoice[] = await res.json();
        setInvoices(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  return { invoices, loading, error };
} 