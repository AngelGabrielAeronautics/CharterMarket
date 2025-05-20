'use client';

import { useState, useEffect } from 'react';
import { Passenger, PassengerFormData } from '@/types/passenger';

/**
 * Hook to fetch passengers for a booking
 */
export function useBookingPassengers(bookingId?: string) {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
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
        const res = await fetch(`/api/passengers?bookingId=${bookingId}`);
        if (!res.ok) throw new Error(await res.text());
        const data: Passenger[] = await res.json();
        setPassengers(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load passengers');
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  return { passengers, loading, error };
}

/**
 * Hook to manage passenger creation and updates
 */
export function usePassengerManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createPassenger = async (
    bookingId: string,
    userCode: string,
    passengerData: PassengerFormData
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/passengers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId, userCode, ...passengerData }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const data = await res.json();
      setSuccess(true);
      return data.id;
    } catch (err) {
      console.error('Error creating passenger:', err);
      setError(err instanceof Error ? err.message : 'Failed to create passenger');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePassenger = async (
    passengerId: string,
    passengerData: Partial<PassengerFormData>
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/passengers/${passengerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passengerData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error updating passenger:', err);
      setError(err instanceof Error ? err.message : 'Failed to update passenger');
    } finally {
      setLoading(false);
    }
  };

  const deletePassenger = async (passengerId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/passengers/${passengerId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error deleting passenger:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete passenger');
    } finally {
      setLoading(false);
    }
  };

  return {
    createPassenger,
    updatePassenger,
    deletePassenger,
    loading,
    error,
    success,
  };
}
