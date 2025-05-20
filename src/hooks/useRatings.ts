import { useState, useEffect } from 'react';
import { Rating } from '@/types/rating';

/** Hook to fetch a rating for a booking */
export function useBookingRating(bookingId?: string) {
  const [rating, setRating] = useState<Rating | null>(null);
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
        const res = await fetch(`/api/ratings?bookingId=${bookingId}`);
        if (!res.ok) throw new Error(await res.text());
        const data: Rating | null = await res.json();
        setRating(data);
      } catch (err) {
        console.error('Error loading rating:', err);
        setError('Failed to load rating');
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  return { rating, loading, error };
}

/** Hook to create a rating */
export function useRatingManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createRating = async (
    bookingId: string,
    operatorId: string,
    customerUserCode: string,
    ratingValue: number,
    comments?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, operatorId, customerUserCode, ratingValue, comments }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSuccess(true);
      return true;
    } catch (err: any) {
      console.error('Error creating rating:', err);
      setError(err.message || 'Failed to submit rating');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { createRating, loading, error, success };
}
