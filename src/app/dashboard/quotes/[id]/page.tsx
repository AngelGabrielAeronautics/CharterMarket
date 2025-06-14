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
  Grid,
  Typography,
  CircularProgress,
  Paper,
  Container,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
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
  const [departureCityImageUrl, setDepartureCityImageUrl] = useState<string | null>(null);
  const [arrivalCityImageUrl, setArrivalCityImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchData = async () => {
      if (!requestId || !user) return;
      setLoading(true);
      setImageLoading(true);
      try {
        const req = await fetchQuoteRequest(requestId);
        console.log('Fetched Quote Request:', req);
        if (req) {
          setRequest(req);
          setDepartureCityImageUrl(null);
          setArrivalCityImageUrl(null);

          let depImageUrl, arrImageUrl;

          if (req.routing?.departureAirport) {
            console.log('Fetching departure airport for ICAO:', req.routing.departureAirport);
            const depAirport = await getAirportByICAO(req.routing.departureAirport);
            console.log('Departure Airport Details:', depAirport);
            setDepartureAirportDetails(depAirport);
            if (depAirport) {
              depImageUrl = await getCityImageUrlWithFallback(depAirport);
              console.log('Departure City Image URL:', depImageUrl);
              setDepartureCityImageUrl(depImageUrl);
            }
          }
          if (req.routing?.arrivalAirport) {
            console.log('Fetching arrival airport for ICAO:', req.routing.arrivalAirport);
            const arrAirport = await getAirportByICAO(req.routing.arrivalAirport);
            console.log('Arrival Airport Details:', arrAirport);
            setArrivalAirportDetails(arrAirport);
            if (arrAirport) {
              arrImageUrl = await getCityImageUrlWithFallback(arrAirport);
              console.log('Arrival City Image URL:', arrImageUrl);
              setArrivalCityImageUrl(arrImageUrl);
            }
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
        setImageLoading(false);
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

  if (loading) return <div className="p-8 text-center">Loading request details...</div>;
  if (error && !request) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!request) return <div className="p-8 text-center text-red-600">Request not found.</div>;

  const MAP_WIDTH = 600;
  const MAP_HEIGHT = 300;
  let staticMapUrl = '';

  if (
    departureAirportDetails?.latitude &&
    departureAirportDetails?.longitude &&
    arrivalAirportDetails?.latitude &&
    arrivalAirportDetails?.longitude
  ) {
    const depLat = departureAirportDetails.latitude;
    const depLon = departureAirportDetails.longitude;
    const arrLat = arrivalAirportDetails.latitude;
    const arrLon = arrivalAirportDetails.longitude;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (apiKey) {
      staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=${MAP_WIDTH}x${MAP_HEIGHT}&maptype=roadmap&markers=color:red|label:D|${depLat},${depLon}&markers=color:red|label:A|${arrLat},${arrLon}&path=color:0x0000ff|weight:2|${depLat},${depLon}|${arrLat},${arrLon}&key=${apiKey}`;
    } else {
      console.warn('Google Maps API key is missing. Map will not be displayed.');
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Request {request.requestCode}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
          {/* Departure Image */}
          <Grid size={{ xs: 12, md: 6 }}>
            {imageLoading ? (
              <Box
                sx={{
                  width: '100%',
                  height: '200px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                }}
              >
                <CircularProgress />
              </Box>
            ) : departureCityImageUrl ? (
              <Box sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={departureCityImageUrl}
                  alt={`City image for ${departureAirportDetails?.city}`}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '200px',
                    objectFit: 'cover',
                    borderRadius: 2,
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    color: 'white',
                    textShadow: '1px 1px 3px rgba(0,0,0,0.7)',
                    fontWeight: 'bold',
                  }}
                >
                  {departureAirportDetails?.city}, {departureAirportDetails?.country}
                </Typography>
              </Box>
            ) : null}
          </Grid>

          {/* Arrival Image */}
          <Grid size={{ xs: 12, md: 6 }}>
            {imageLoading ? (
              <Box
                sx={{
                  width: '100%',
                  height: '200px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                }}
              >
                <CircularProgress />
              </Box>
            ) : arrivalCityImageUrl ? (
              <Box sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={arrivalCityImageUrl}
                  alt={`City image for ${arrivalAirportDetails?.city}`}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '200px',
                    objectFit: 'cover',
                    borderRadius: 2,
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    color: 'white',
                    textShadow: '1px 1px 3px rgba(0,0,0,0.7)',
                    fontWeight: 'bold',
                  }}
                >
                  {arrivalAirportDetails?.city}, {arrivalAirportDetails?.country}
                </Typography>
              </Box>
            ) : null}
          </Grid>
        </Grid>

        <Box sx={{ mb: 3, pl: 1 }}>
          <Typography variant="body1">
            <strong>Route:</strong> {request.routing.departureAirport} →{' '}
            {request.routing.arrivalAirport}
          </Typography>
          <Typography variant="body1">
            <strong>Date:</strong>{' '}
            {format(request.routing.departureDate.toDate(), 'dd MMM yyyy, HH:mm')}
          </Typography>
          {request.routing.returnDate && (
            <Typography variant="body1">
              <strong>Return:</strong>{' '}
              {format(request.routing.returnDate.toDate(), 'dd MMM yyyy, HH:mm')}
            </Typography>
          )}
          <Typography variant="body1">
            <strong>Passengers:</strong> {request.passengerCount}
          </Typography>
          <Typography variant="body1">
            <strong>Status:</strong>{' '}
            <Typography
              component="span"
              sx={{
                fontWeight: 'bold',
                color: request.status === 'booked' ? 'success.main' : 'text.primary',
              }}
            >
              {request.status}
            </Typography>
          </Typography>
          {request.specialRequirements && (
            <Typography variant="body1">
              <strong>Notes:</strong> {request.specialRequirements}
            </Typography>
          )}
        </Box>

        {/* Route Map Section */}
        {staticMapUrl && (
          <Box sx={{ my: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'medium' }}>
              Route Map
            </Typography>
            <Paper
              elevation={2}
              sx={{
                overflow: 'hidden',
                borderRadius: 2,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Image
                src={staticMapUrl}
                alt={`Route map from ${departureAirportDetails?.name || 'Departure'} to ${arrivalAirportDetails?.name || 'Arrival'}`}
                width={MAP_WIDTH}
                height={MAP_HEIGHT}
                // layout="responsive" // Use this if you want the map to scale with container width
              />
            </Paper>
          </Box>
        )}

        <Box>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'semibold' }}>
              Available Offers
            </Typography>
            <ToggleButtonGroup
              value={sortOrder}
              exclusive
              onChange={(event, newOrder) => {
                if (newOrder) {
                  setSortOrder(newOrder);
                }
              }}
              aria-label="Sort by price"
              size="small"
            >
              <ToggleButton value="asc" aria-label="Sort by price ascending">
                <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                Low-High
              </ToggleButton>
              <ToggleButton value="desc" aria-label="Sort by price descending">
                <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                High-Low
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {!sortedOffers || sortedOffers.length === 0 ? (
            <Typography color="textSecondary">No offers available yet.</Typography>
          ) : (
            <div className="flex flex-wrap -mx-2">
              {sortedOffers.map((offer) => (
                <div className="w-full px-2 mb-4" key={offer.offerId}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      borderColor:
                        offer.offerStatus === 'accepted-by-client' ? 'success.main' : 'divider',
                      borderWidth: offer.offerStatus === 'accepted-by-client' ? 2 : 1,
                    }}
                  >
                    <Box>
                      <Typography variant="body1">
                        Price: <strong>${offer.price.toFixed(2)}</strong>
                      </Typography>
                      <Typography variant="body1">
                        Total (incl. 3%): <strong>${offer.totalPrice.toFixed(2)}</strong>
                      </Typography>
                      <Typography variant="body1">
                        Status: <strong>{offer.offerStatus}</strong>
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Operator: {offer.operatorUserCode}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="textSecondary">
                        Offer ID: {offer.offerId}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      onClick={() => handleAccept(offer)}
                      disabled={
                        submitting ||
                        offer.offerStatus !== 'pending-client-acceptance' ||
                        request.status === 'booked' ||
                        request.status === 'cancelled'
                      }
                      size="small"
                    >
                      {submitting ? 'Processing...' : 'Accept Offer'}
                    </Button>
                  </Paper>
                </div>
              ))}
            </div>
          )}
        </Box>
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            Error: {error}
          </Typography>
        )}
      </Paper>
    </Container>
  );
}
