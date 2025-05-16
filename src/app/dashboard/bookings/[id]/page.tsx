"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useBookingDetail, useInvoices } from '@/hooks/useBookings';
import { Booking } from '@/types/booking';
import { Invoice } from '@/types/invoice';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';

export default function BookingDetailsPage() {
  const { id } = useParams();
  const bookingDocId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { user } = useAuth();

  const { booking, loading: loadingBooking, error: bookingError } = useBookingDetail(
    bookingDocId,
    user?.uid
  );
  const { invoices, loading: loadingInvoices, error: invoicesError } = useInvoices(
    bookingDocId
  );

  if (loadingBooking) return <div className="p-8 text-center">Loading booking...</div>;
  if (bookingError) return <div className="p-8 text-center text-red-600">{bookingError}</div>;
  if (!booking) return null;
  if (loadingInvoices) return <div className="p-8 text-center">Loading invoices...</div>;
  if (invoicesError) return <div className="p-8 text-center text-red-600">{invoicesError}</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Booking {booking.bookingId}</h1>
      <div className="mb-6 space-y-1">
        <p><strong>Route:</strong> {booking.routing.departureAirport} → {booking.routing.arrivalAirport}</p>
        <p><strong>Date:</strong> {format(booking.routing.departureDate.toDate(), 'dd MMM yyyy')}</p>
        <p><strong>Passengers:</strong> {booking.passengerCount}</p>
        <p><strong>Class:</strong> {booking.cabinClass}</p>
        <p><strong>Status:</strong> {booking.status}</p>
        <p><strong>Price:</strong> ${booking.price.toFixed(2)}</p>
        <p><strong>Total:</strong> ${booking.totalPrice.toFixed(2)}</p>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Invoices</h2>
        {invoices.length === 0 ? (
          <p className="text-gray-500">No invoices found.</p>
        ) : (
          <ul className="space-y-4">
            {invoices.map((inv) => (
              <li key={inv.id} className="border p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p>Invoice {inv.invoiceId}</p>
                  <p>Amount: ${inv.amount.toFixed(2)}</p>
                </div>
                <Button
                  variant="outlined"
                  onClick={() => toast.success(`Invoice ${inv.invoiceId}`)}
                >
                  View
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button variant="contained" onClick={() => router.push('/dashboard/bookings')}>
        Back to Bookings
      </Button>
    </div>
  );
} 