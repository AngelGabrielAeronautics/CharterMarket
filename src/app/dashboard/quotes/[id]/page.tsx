'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { QuoteRequest, Offer } from '@/types/flight';
import { Airport } from '@/types/airport';
import { getAirportByICAO } from '@/lib/airport';
import { getCityImageUrlWithFallback } from '@/lib/cityImages';
import Image from 'next/image';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Container,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { acceptOperatorQuote } from '@/lib/quote';
import { createNotification } from '@/lib/notification';
import { createComprehensiveBooking, linkInvoiceToBooking } from '@/lib/booking';
import { createComprehensiveInvoice } from '@/lib/invoice';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

import { getQuoteRequest as fetchQuoteRequest } from '@/lib/flight';

// New Component Imports
import QuoteRequestDetails from '@/components/quotes/QuoteRequestDetails';
import OfferCard from '@/components/quotes/OfferCard';

export default function RequestDetailsPage() {
  const { id } = useParams();
  const requestId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { user } = useAuth();

  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [departureAirportDetails, setDepartureAirportDetails] = useState<Airport | null>(null);
  const [arrivalAirportDetails, setArrivalAirportDetails] = useState<Airport | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchData = async () => {
      if (!requestId || !user) return;
      setLoading(true);
      try {
        const req = await fetchQuoteRequest(requestId);
        if (req) {
          setRequest(req);
          if (req.routing?.departureAirport) {
            const depAirport = await getAirportByICAO(req.routing.departureAirport);
            setDepartureAirportDetails(depAirport);
          }
          if (req.routing?.arrivalAirport) {
            const arrAirport = await getAirportByICAO(req.routing.arrivalAirport);
            setArrivalAirportDetails(arrAirport);
          }
        } else {
          setError('Quote request not found.');
        }
      } catch (err: any) {
        console.error('Error fetching quote request:', err);
        setError(err.message || 'Failed to load quote request details.');
        toast.error(err.message || 'Failed to load quote request details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [requestId, user]);

  const handleAccept = async (offer: Offer) => {
    if (!request || !user || !requestId) return;
    setSubmitting(true);
    setError(null);
    try {
      console.log('Starting quote acceptance process:', {
        requestId,
        offerId: offer.offerId,
        userCode: user.userCode,
        userRole: user.role,
      });

      // First, check if user has proper authentication claims
      try {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          const response = await fetch('/api/debug/user-claims', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const claims = await response.json();
            console.log('User claims verification:', claims);

            if (!claims.tokenClaims.role || !claims.tokenClaims.userCode) {
              console.warn('Missing custom claims detected, attempting to refresh token...');
              // Force token refresh to get updated claims
              await auth.currentUser?.getIdToken(true);
            }
          }
        }
      } catch (claimsError) {
        console.warn('Could not verify user claims, proceeding anyway:', claimsError);
      }

      console.log('Accepting operator quote...');
      await acceptOperatorQuote(requestId, offer.offerId);

      console.log('Fetching updated quote request...');
      const updatedRequest = await fetchQuoteRequest(requestId);
      if (
        !updatedRequest ||
        !updatedRequest.acceptedOfferId ||
        !updatedRequest.acceptedOperatorUserCode
      ) {
        throw new Error(
          'Failed to retrieve updated quote request details after acceptance, or accepted offer details are missing.'
        );
      }

      const acceptedOfferDetails = updatedRequest.offers?.find(
        (o) => o.offerId === updatedRequest.acceptedOfferId
      );
      if (!acceptedOfferDetails) {
        throw new Error('Could not find details of the accepted offer in the updated request.');
      }

      console.log('Creating comprehensive booking with data:', {
        updatedRequest: {
          id: updatedRequest.id,
          requestCode: updatedRequest.requestCode,
          clientUserCode: updatedRequest.clientUserCode,
        },
        acceptedOfferDetails: {
          offerId: acceptedOfferDetails.offerId,
          operatorUserCode: acceptedOfferDetails.operatorUserCode,
          price: acceptedOfferDetails.price,
          totalPrice: acceptedOfferDetails.totalPrice,
        },
      });

      console.log('Creating comprehensive booking first...');
      const bookingDocId = await createComprehensiveBooking(updatedRequest, acceptedOfferDetails);
      console.log('Comprehensive booking created successfully with ID:', bookingDocId);

      console.log('Creating comprehensive invoice...');
      const invoiceId = await createComprehensiveInvoice(
        bookingDocId, // ✅ Now we have a valid booking ID!
        updatedRequest.clientUserCode,
        acceptedOfferDetails.operatorUserCode,
        acceptedOfferDetails.offerId,
        Number(acceptedOfferDetails.totalPrice),
        {
          requestId: updatedRequest.id,
          description: `Flight service: ${updatedRequest.routing.departureAirport} → ${updatedRequest.routing.arrivalAirport}`,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          clientNotes: `Flight request ${updatedRequest.requestCode}`,
        }
      );
      console.log('Comprehensive invoice created successfully with ID:', invoiceId);

      // Link the invoice to the booking
      console.log('Linking invoice to booking...');
      await linkInvoiceToBooking(bookingDocId, invoiceId);
      console.log('Invoice linked to booking successfully');

      console.log('Creating notification...');
      await createNotification(
        acceptedOfferDetails.operatorUserCode,
        'QUOTE_ACCEPTED',
        'Quote Accepted',
        `Your quote ${acceptedOfferDetails.offerId} for request ${updatedRequest.requestCode} has been accepted.`,
        { quoteRequestId: requestId, quoteId: acceptedOfferDetails.offerId },
        `/dashboard/bookings/operator/${bookingDocId}`
      );
      console.log('Notification created successfully');

      toast.success('Quote accepted successfully! Booking process initiated.');
      // Navigate using the custom booking ID (which is now the same as the document ID)
      router.push(`/dashboard/bookings/${bookingDocId}`);
    } catch (err) {
      console.error('Error during quote acceptance process:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined,
      });

      let errorMessage = 'Failed to accept quote and create booking.';
      if (err instanceof Error) {
        errorMessage = err.message;

        // Provide more helpful error messages for common issues
        if (err.message.includes('permission') || err.message.includes('Firestore')) {
          errorMessage = 'Permission error: Please try refreshing the page and logging in again.';
        } else if (err.message.includes('custom claims') || err.message.includes('token')) {
          errorMessage = 'Authentication error: Please log out and log back in, then try again.';
        }
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const sortedOffers = useMemo(() => {
    if (!request?.offers) return [];
    const offersCopy = [...request.offers];
    return offersCopy.sort((a, b) =>
      sortOrder === 'asc' ? a.totalPrice - b.totalPrice : b.totalPrice - a.totalPrice
    );
  }, [request?.offers, sortOrder]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Request Details...</Typography>
      </Box>
    );
  }

  if (error && !request) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!request) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">Quote request could not be loaded.</Alert>
      </Container>
    );
  }

  // Determine if there are any offers that are not expired or rejected
  const hasActiveOffers = sortedOffers.some(
    (offer) => offer.offerStatus !== 'expired' && offer.offerStatus !== 'rejected-by-client'
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
        <QuoteRequestDetails
          request={request}
          departureAirportDetails={departureAirportDetails}
          arrivalAirportDetails={arrivalAirportDetails}
        />

        {/* Available Offers Section */}
        <Box sx={{ mt: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h5">Available Offers</Typography>
            <ToggleButtonGroup
              value={sortOrder}
              exclusive
              onChange={(_, newOrder) => {
                if (newOrder) setSortOrder(newOrder);
              }}
              size="small"
            >
              <ToggleButton value="asc">
                <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                Low-High
              </ToggleButton>
              <ToggleButton value="desc">
                <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                High-Low
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {sortedOffers.length > 0 ? (
            <Grid container spacing={3}>
              {sortedOffers.map((offer) => (
                <Grid item xs={12} key={offer.offerId}>
                  <OfferCard
                    offer={offer}
                    isClientView={true}
                    onAccept={() => handleAccept(offer)}
                    isAccepting={submitting}
                    isRequestBooked={!!request.acceptedOfferId}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              No offers have been submitted for this request yet.
            </Alert>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
