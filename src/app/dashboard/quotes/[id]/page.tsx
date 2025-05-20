'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { QuoteRequest, Offer } from '@/types/flight';
import { Airport } from '@/types/airport';
import { getAirportByICAO } from '@/lib/airport';
import { getCityImageUrlWithFallback } from '@/lib/cityImages';
import Image from 'next/image';
import { Box, Grid, Typography, CircularProgress, Paper, Container } from '@mui/material';
import { acceptOperatorQuote } from '@/lib/quote';
import { createNotification } from '@/lib/notification';
import { createBooking } from '@/lib/booking';
import { createInvoice } from '@/lib/invoice';
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
      await acceptOperatorQuote(requestId, offer.offerId);
      const updatedRequest = await fetchQuoteRequest(requestId);
      if (
        !updatedRequest ||
        !updatedRequest.acceptedOfferId ||
        !updatedRequest.acceptedOperatorId
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
      const bookingDocId = await createBooking(updatedRequest, acceptedOfferDetails);
      await createInvoice(
        bookingDocId,
        updatedRequest.clientUserCode,
        updatedRequest.requestCode,
        Number(acceptedOfferDetails.totalPrice)
      );
      await createNotification(
        acceptedOfferDetails.operatorId,
        'QUOTE_ACCEPTED',
        'Quote Accepted',
        `Your quote ${acceptedOfferDetails.offerId} for request ${updatedRequest.requestCode} has been accepted.`,
        { quoteRequestId: requestId, quoteId: acceptedOfferDetails.offerId },
        `/dashboard/bookings/operator/${bookingDocId}`
      );
      toast.success('Quote accepted successfully! Booking process initiated.');
      router.push(`/dashboard/bookings/${bookingDocId}`);
    } catch (err) {
      console.error('Error during quote acceptance process:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to accept quote and create booking.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading request details...</div>;
  if (error && !request) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!request) return <div className="p-8 text-center text-red-600">Request not found.</div>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Request {request.requestCode}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
          <Grid item xs={12} sm={5}>
            {imageLoading ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 150,
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <Grid
                container
                spacing={2}
                alignItems="center"
                justifyContent="center"
                sx={{ mt: 2, mb: 2 }}
              >
                {departureAirportDetails && departureCityImageUrl && (
                  <Grid item xs={12} sm={5}>
                    <Paper
                      elevation={3}
                      sx={{
                        borderRadius: '8px',
                        overflow: 'hidden',
                        height: 150,
                        position: 'relative',
                      }}
                    >
                      <Image
                        src={departureCityImageUrl}
                        alt={`City image for ${departureAirportDetails.city}`}
                        layout="fill"
                        objectFit="cover"
                        priority={false}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          width: '100%',
                          background: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          p: 1,
                        }}
                      >
                        <Typography variant="subtitle1" align="center">
                          {departureAirportDetails.city}, {departureAirportDetails.country}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                )}
                {arrivalAirportDetails && arrivalCityImageUrl && (
                  <Grid item xs={12} sm={5}>
                    <Paper
                      elevation={3}
                      sx={{
                        borderRadius: '8px',
                        overflow: 'hidden',
                        height: 150,
                        position: 'relative',
                      }}
                    >
                      <Image
                        src={arrivalCityImageUrl}
                        alt={`City image for ${arrivalAirportDetails.city}`}
                        layout="fill"
                        objectFit="cover"
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          width: '100%',
                          background: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          p: 1,
                        }}
                      >
                        <Typography variant="subtitle1" align="center">
                          {arrivalAirportDetails.city}, {arrivalAirportDetails.country}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            )}
          </Grid>
          <Grid item xs={12} sm={2} sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ my: { xs: 1, sm: 0 } }}>
              →
            </Typography>
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

        <Box>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 'semibold', mt: 4, mb: 2 }}
          >
            Available Offers
          </Typography>
          {!request.offers || request.offers.length === 0 ? (
            <Typography color="textSecondary">No offers available yet.</Typography>
          ) : (
            <Grid container spacing={2}>
              {request.offers.map((offer) => (
                <Grid item xs={12} key={offer.offerId}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 1,
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
                        Operator: {offer.operatorId}
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
                </Grid>
              ))}
            </Grid>
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
