// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { QuoteRequest } from '@/types/flight';
import { Quote } from '@/types/quote';
import { Flight } from '@/types/flight';
import { UserRole } from '@/lib/userCode';
import {
  getClientQuoteRequests,
  getOperatorQuoteRequests,
  getOperatorQuoteRequestsFallback,
  getQuoteRequest,
} from '@/lib/flight';
import { getQuotesForRequest, getOperatorSubmittedQuotes } from '@/lib/quote';
import { FlightService } from '@/lib/flight-service';

/**
 * Hook to fetch actual flights based on user role
 */
export function useFlights(userCode?: string, userRole?: UserRole) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const refreshFlights = useCallback(() => {
    setLastRefresh(Date.now());
  }, []);

  useEffect(() => {
    if (!userCode || !userRole) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchFlights = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);

      try {
        let flightData: Flight[] = [];

        if (userRole === 'operator') {
          // For operators, get flights they operate
          flightData = await FlightService.getFlightsByOperator(userCode);
        } else if (userRole === 'admin' || userRole === 'superAdmin') {
          // For admin/superAdmin, get all flights
          flightData = await FlightService.getAllFlights();
        } else {
          // For passengers/agents, get flights they're involved in
          // This requires a different approach since flights don't directly reference clients
          // We'll need to get their bookings and find associated flights
          flightData = await FlightService.getAllFlights();
          // Filter to flights where user has bookings
          flightData = flightData.filter(flight => 
            flight.legs && flight.legs.some(leg => 
              leg.bookingIds && leg.bookingIds.length > 0
              // Note: We'd need to check if these bookings belong to the user
              // This would require additional lookup logic
            )
          );
        }

        if (isMounted) {
          setFlights(flightData);
        }
      } catch (err) {
        console.error('Error fetching flights:', err);
        if (isMounted) {
          setError('Failed to load flights');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFlights();

    // Set up auto-refresh every 60 seconds for flights
    const intervalId = setInterval(fetchFlights, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [userCode, userRole, lastRefresh]);

  return { flights, loading, error, refreshFlights };
}

/**
 * Hook to fetch a specific flight by ID with full details
 */
export function useFlightDetail(flightId?: string) {
  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!flightId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchFlight = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);

      try {
        const flightData = await FlightService.getFlightById(flightId);
        if (isMounted) {
          setFlight(flightData);
        }
      } catch (err) {
        console.error('Error fetching flight:', err);
        if (isMounted) {
          setError('Failed to load flight details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFlight();

    return () => {
      isMounted = false;
    };
  }, [flightId]);

  return { flight, loading, error };
}

/**
 * Hook to fetch quote requests for a client
 */
export function useClientQuoteRequests(clientUserCode?: string) {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const refreshRequests = useCallback(() => {
    setLastRefresh(Date.now());
  }, []);

  useEffect(() => {
    if (!clientUserCode) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchClientRequests = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const rs = await getClientQuoteRequests(clientUserCode);
        if (isMounted) {
          setRequests(rs);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError('Failed to load quote requests');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchClientRequests();

    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(fetchClientRequests, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [clientUserCode, lastRefresh]);

  return { requests, loading, error, refreshRequests };
}

/**
 * Hook to fetch quote requests for an operator
 */
export function useOperatorQuoteRequests(operatorCode?: string) {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [indexError, setIndexError] = useState(false);
  const [indexUrl, setIndexUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [useFallback, setUseFallback] = useState(false);

  // Add a function to force refresh
  const refreshRequests = useCallback(() => {
    setLastRefresh(Date.now());
    setError(null);
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!operatorCode) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchRequests = async () => {
      try {
        console.log(
          `[useOperatorQuoteRequests] Fetching quote requests for operator: ${operatorCode}`
        );

        let rs: QuoteRequest[] = [];
        let errorOccurred = false;

        // First try the fallback method immediately, as it's guaranteed to work
        try {
          console.log('Using fallback method to get immediate results');
          rs = await getOperatorQuoteRequestsFallback(operatorCode);

          if (rs.length > 0 && isMounted) {
            console.log(`Got ${rs.length} results using fallback method`);
            setRequests(rs);
            setLoading(false); // Show results immediately
            setUseFallback(true);
            // Don't clear errors yet - we'll try the main method next
          }
        } catch (fallbackErr) {
          console.error('Fallback method failed:', fallbackErr);
          errorOccurred = true;
          // Continue to try the main method
        }

        // Then try the main method (even if we got fallback results)
        try {
          console.log('Attempting to use main query method');
          const mainResults = await getOperatorQuoteRequests(operatorCode);

          if (isMounted) {
            console.log(`Got ${mainResults.length} results using main method`);
            setRequests(mainResults);
            setLoading(false);
            setError(null); // Clear any errors since this worked
            setIndexError(false);
            setIndexUrl(null);
            setUseFallback(false);
          }
        } catch (mainErr: any) {
          // If the main method failed with an index error
          if (
            mainErr.isIndexError ||
            mainErr.message?.includes('The query requires an index') ||
            mainErr.toString().includes('FirebaseError: The query requires an index')
          ) {
            console.log('Index error detected when using main method');
            if (isMounted) {
              setIndexError(true);
              setIndexUrl(mainErr.indexUrl || null);
              setUseFallback(true);

              // Only show the error if the fallback didn't work
              if (rs.length === 0) {
                setError('The system is being configured. Please try again in a few minutes.');
                errorOccurred = true;
              } else {
                // We have fallback data, so don't show an error
                setError(null);
              }
            }
          } else {
            // Some other error occurred with the main method
            console.error('Main method failed with non-index error:', mainErr);
            if (isMounted) {
              // Only show this error if we don't have fallback data
              if (rs.length === 0) {
                setError('Failed to load incoming quote requests');
                errorOccurred = true;
              }
            }
          }
        }

        if (isMounted && !errorOccurred) {
          setError(null);
        }
      } catch (err: any) {
        console.error(`[useOperatorQuoteRequests] Unexpected error:`, err);
        if (isMounted) {
          setError('An unexpected error occurred. Please try again.');
          setLoading(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    fetchRequests();

    // Setup refresh interval (every 30 seconds)
    // If there was an index error, try less frequently (every 2 minutes)
    // After 3 retries with index errors, back off to 5 minutes
    let intervalTime = 30000; // Default 30 seconds
    if (indexError) {
      intervalTime = retryCount > 3 ? 300000 : 120000; // 5 minutes or 2 minutes
    }

    const intervalId = setInterval(() => {
      console.log(`[useOperatorQuoteRequests] Auto-refreshing quote requests for ${operatorCode}`);
      fetchRequests();
    }, intervalTime);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [operatorCode, lastRefresh, retryCount]);

  return {
    requests,
    loading,
    error,
    refreshRequests,
    indexError,
    indexUrl,
    retryCount,
    useFallback,
  };
}

/**
 * Hook to fetch a single quote request detail
 */
export function useQuoteRequestDetail(requestId?: string) {
  const [request, setRequest] = useState<QuoteRequest | null>(null);
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
        const r = await getQuoteRequest(requestId);
        if (!r) {
          setError('Quote request not found');
        } else {
          setRequest(r);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load quote request');
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId]);

  return { request, loading, error };
}

/**
 * Hook to fetch quotes for a quote request
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

/**
 * Hook to fetch submitted quotes for a specific operator.
 */
export const useOperatorSubmittedQuotes = (operatorUserCode?: string) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    if (!operatorUserCode) {
      setQuotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const operatorQuotes = await getOperatorSubmittedQuotes(operatorUserCode);
      setQuotes(operatorQuotes);
      setError(null);
    } catch (err) {
      console.error('Error in useOperatorSubmittedQuotes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch submitted quotes');
      setQuotes([]); // Clear quotes on error
    } finally {
      setLoading(false);
    }
  }, [operatorUserCode]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  return { quotes, loading, error, refreshSubmittedQuotes: fetchQuotes };
};
