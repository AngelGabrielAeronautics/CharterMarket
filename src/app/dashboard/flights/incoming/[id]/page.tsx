"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getFlightRequest } from '@/lib/flight';
import { getQuotesForRequest, createQuote } from '@/lib/quote';
import { createNotification } from '@/lib/notification';
import { FlightRequest } from '@/types/flight';
import { Quote } from '@/types/quote';
import { format } from 'date-fns';
import Input from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function QuotePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<FlightRequest | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    const fetchData = async () => {
      if (!requestId || !user?.userCode) return;
      setLoading(true);
      try {
        const req = await getFlightRequest(requestId);
        if (req) {
          setRequest(req);
          const qs = await getQuotesForRequest(requestId);
          setQuotes(qs);
        }
      } catch (err: any) {
        console.error(err);
        setError('Failed to load request data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [requestId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request || !user?.userCode) return;
    setError(null);
    setSubmitting(true);
    try {
      const quoteDocId = await createQuote(request.id, user.userCode, { price: parseFloat(price) });
      // Notify client
      await createNotification(
        request.clientId,
        'QUOTE_RECEIVED',
        'New Quote Received',
        `You have received a new quote for request ${request.requestCode}`,
        { quoteId: quoteDocId },
        `/dashboard/flights/${request.id}`
      );
      toast.success('Quote submitted');
      router.push('/dashboard/flights/incoming');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit quote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!request) return <div className="p-8 text-center text-red-600">Request not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Quote Request {request.requestCode}</h1>
      <div className="mb-6">
        <p><strong>Route:</strong> {request.routing.departureAirport} → {request.routing.arrivalAirport}</p>
        <p><strong>Date:</strong> {format(request.routing.departureDate.toDate(), 'dd MMM yyyy')}</p>
        <p><strong>Passengers:</strong> {request.passengerCount}</p>
        <p><strong>Status:</strong> {request.status}</p>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Existing Quotes</h2>
        {quotes.length === 0 ? (
          <p className="text-gray-500">No quotes yet.</p>
        ) : (
          <ul className="space-y-2">
            {quotes.map((q) => (
              <li key={q.id} className="flex justify-between border p-2 rounded">
                <span>Price: ${q.price.toFixed(2)}</span>
                <span>Total: ${q.totalPrice.toFixed(2)}</span>
                <span>Status: {q.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Submit Quote</h2>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Operator Price (USD)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <div>
            <Button type="submit" disabled={submitting || !price}>
              {submitting ? 'Submitting...' : 'Submit Quote'}
            </Button>
            <Button type="button" variant="text" onClick={() => router.back()} className="ml-2">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 