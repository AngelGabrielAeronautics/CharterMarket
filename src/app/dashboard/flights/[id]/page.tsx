"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getFlightRequest } from '@/lib/flight';
import { getQuotesForRequest, updateQuoteStatus } from '@/lib/quote';
import { createNotification } from '@/lib/notification';
import { createBooking } from '@/lib/booking';
import { createInvoice } from '@/lib/invoice';
import { FlightRequest } from '@/types/flight';
import { Quote } from '@/types/quote';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function RequestDetailsPage() {
  const { id } = useParams();
  const requestId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { user } = useAuth();

  const [request, setRequest] = useState<FlightRequest | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!requestId || !user) return;
      setLoading(true);
      try {
        const req = await getFlightRequest(requestId);
        if (req) {
          setRequest(req);
          const qs = await getQuotesForRequest(requestId);
          setQuotes(qs);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to load request details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [requestId, user]);

  const handleAccept = async (quote: Quote) => {
    if (!request || !user) return;
    setSubmitting(true);
    try {
      await updateQuoteStatus(quote.id, 'accepted');
      const bookingDocId = await createBooking(request, quote);
      await createInvoice(bookingDocId, request.requestCode, quote.totalPrice);
      await createNotification(
        request.operatorId,
        'QUOTE_ACCEPTED',
        'Quote Accepted',
        `Your quote ${quote.quoteId} for request ${request.requestCode} has been accepted.`,
        { flightRequestId: requestId, quoteId: quote.id },
        `/dashboard/flights/incoming/${request.id}`
      );
      toast.success('Quote accepted!');
      router.push('/dashboard/flights');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to accept quote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!request) return <div className="p-8 text-center text-red-600">Request not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Request {request.requestCode}</h1>
      <div className="mb-6 space-y-1">
        <p><strong>Route:</strong> {request.routing.departureAirport} → {request.routing.arrivalAirport}</p>
        <p><strong>Date:</strong> {format(request.routing.departureDate.toDate(), 'dd MMM yyyy')}</p>
        <p><strong>Passengers:</strong> {request.passengerCount}</p>
        <p><strong>Status:</strong> {request.status}</p>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Available Quotes</h2>
        {quotes.length === 0 ? (
          <p className="text-gray-500">No quotes available yet.</p>
        ) : (
          <ul className="space-y-4">
            {quotes.map((q) => (
              <li key={q.id} className="border p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p>Price: <strong>${q.price.toFixed(2)}</strong></p>
                  <p>Total (incl. 3%): <strong>${q.totalPrice.toFixed(2)}</strong></p>
                  <p>Status: <strong>{q.status}</strong></p>
                </div>
                <Button
                  variant="outlined"
                  onClick={() => handleAccept(q)}
                  disabled={submitting || q.status !== 'pending'}
                >
                  {submitting ? 'Processing...' : 'Accept'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
