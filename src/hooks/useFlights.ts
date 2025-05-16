import { useState, useEffect } from 'react';
import { FlightRequest } from '@/types/flight';
import { Quote } from '@/types/quote';
import {
  getClientFlightRequests,
  getOperatorFlightRequests,
  getFlightRequest,
} from '@/lib/flight';
import { getQuotesForRequest } from '@/lib/quote';

/**
 * Hook to fetch flight requests for a client
 */
export function useClientFlightRequests(clientId?: string) {
  const [requests, setRequests] = useState<FlightRequest[]>([]);
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
        const rs = await getClientFlightRequests(clientId);
        setRequests(rs);
      } catch (err) {
        console.error(err);
        setError('Failed to load flight requests');
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId]);

  return { requests, loading, error };
}

/**
 * Hook to fetch flight requests for an operator
 */
export function useOperatorFlightRequests(operatorCode?: string) {
  const [requests, setRequests] = useState<FlightRequest[]>([]);
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
        const rs = await getOperatorFlightRequests(operatorCode);
        setRequests(rs);
      } catch (err) {
        console.error(err);
        setError('Failed to load incoming flight requests');
      } finally {
        setLoading(false);
      }
    })();
  }, [operatorCode]);

  return { requests, loading, error };
}

/**
 * Hook to fetch a single flight request detail
 */
export function useFlightRequestDetail(requestId?: string) {
  const [request, setRequest] = useState<FlightRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const r = await getFlightRequest(requestId);
        if (!r) {
          setError('Flight request not found');
        } else {
          setRequest(r);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load flight request');
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId]);

  return { request, loading, error };
}

/**
 * Hook to fetch quotes for a flight request
 */
export function useQuotes(requestId?: string) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const qs = await getQuotesForRequest(requestId);
        setQuotes(qs);
      } catch (err) {
        console.error(err);
        setError('Failed to load quotes');
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId]);

  return { quotes, loading, error };
} 