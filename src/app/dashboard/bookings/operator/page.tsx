"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useOperatorBookings } from '@/hooks/useBookings';
import { Booking } from '@/types/booking';
import { format } from 'date-fns';

export default function OperatorBookingsPage() {
  const { user, userRole } = useAuth();
  const { bookings, loading, error } = useOperatorBookings(
    userRole === 'operator' ? user?.userCode : undefined
  );

  if (loading) return <div className="p-8 text-center">Loading bookings...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!bookings.length) return <div className="p-8 text-center">No bookings found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Operator Bookings</h1>
      <ul className="space-y-4">
        {bookings.map((b) => (
          <li key={b.id} className="border p-4 rounded-lg">
            <Link href={`/dashboard/bookings/${b.id}`}>  
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Booking {b.bookingId}</p>
                  <p className="text-sm text-gray-600">
                    {b.routing.departureAirport} → {b.routing.arrivalAirport} on {format(b.routing.departureDate.toDate(), 'dd MMM yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Client: {b.clientId}</p>
                  <p className="text-sm">Status: <strong>{b.status}</strong></p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
} 