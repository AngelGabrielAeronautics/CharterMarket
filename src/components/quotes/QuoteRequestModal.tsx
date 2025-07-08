'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  CircularProgress,
  Box,
  Alert,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { QuoteRequest, Offer } from '@/types/flight';
import { Airport } from '@/types/airport';
import { getQuoteRequest as fetchQuoteRequest } from '@/lib/flight';
import { getAirportByICAO } from '@/lib/airport';
import QuoteRequestDetails from '@/components/quotes/QuoteRequestDetails';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { acceptOperatorQuote, rejectOperatorQuote } from '@/lib/quote';
import { createNotification } from '@/lib/notification';
import { createComprehensiveBooking, linkInvoiceToBooking } from '@/lib/booking';
import { createComprehensiveInvoice } from '@/lib/invoice';
import { auth } from '@/lib/firebase';
import SubmitOfferModal from './SubmitOfferModal';
import { submitOffer } from '@/lib/quote';

interface QuoteRequestModalProps {
  open: boolean;
  onClose: () => void;
  requestId: string | null;
}

const QuoteRequestModal: React.FC<QuoteRequestModalProps> = ({ open, onClose, requestId }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [departureAirport, setDepartureAirport] = useState<Airport | null>(null);
  const [arrivalAirport, setArrivalAirport] = useState<Airport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSubmitOfferModalOpen, setIsSubmitOfferModalOpen] = useState(false);
  
  // Cache to prevent unnecessary refetching
  const requestCacheRef = useRef<{[key: string]: QuoteRequest}>({});
  const lastFetchedRequestIdRef = useRef<string | null>(null);

  // Function to force refresh (invalidate cache and refetch)
  const forceRefreshRequest = async () => {
    if (!requestId) return;
    
    // Clear cache for this request
    delete requestCacheRef.current[requestId];
    lastFetchedRequestIdRef.current = null;
    
    // Trigger refetch
    setLoading(true);
    setError(null);
    try {
      const reqData = await fetchQuoteRequest(requestId);
      if (reqData) {
        requestCacheRef.current[requestId] = reqData;
        lastFetchedRequestIdRef.current = requestId;
        setRequest(reqData);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch quote details.');
    } finally {
      setLoading(false);
    }
  };

  // Memoize the request object to prevent unnecessary re-renders
  // Only re-memoize when key fields that affect the UI actually change
  const memoizedRequest = useMemo(() => {
    if (!request) return null;
    return request;
  }, [
    request?.id,
    request?.requestCode, 
    request?.status,
    request?.tripType,
    request?.routing?.departureAirport,
    request?.routing?.arrivalAirport,
    request?.routing?.departureDate,
    request?.routing?.returnDate,
    request?.passengerCount,
    request?.offers?.length,
    request?.multiCityRoutes?.length,
    // Include a hash of offers to detect changes
    JSON.stringify(request?.offers?.map(o => ({id: o.offerId, status: o.offerStatus, price: o.totalPrice})))
  ]);

  useEffect(() => {
    const loadRequestDetails = async () => {
      if (!requestId) return;
      
      // Check if we already have this data cached and avoid unnecessary fetch
      const cachedRequest = requestCacheRef.current[requestId];
      if (cachedRequest && lastFetchedRequestIdRef.current === requestId) {
        console.log('Using cached request data for', requestId);
        setRequest(cachedRequest);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const reqData = await fetchQuoteRequest(requestId);
        if (reqData) {
          // Cache the request data
          requestCacheRef.current[requestId] = reqData;
          lastFetchedRequestIdRef.current = requestId;
          setRequest(reqData);

          let finalArrivalIcao = reqData.routing.arrivalAirport;
          if (
            reqData.tripType === 'multiCity' &&
            reqData.multiCityRoutes &&
            reqData.multiCityRoutes.length > 0
          ) {
            finalArrivalIcao = reqData.multiCityRoutes[reqData.multiCityRoutes.length - 1].arrivalAirport;
          }

          // Only fetch airport details if we don't have them cached
          if (!departureAirport || !arrivalAirport) {
            const [dep, arr] = await Promise.all([
              getAirportByICAO(reqData.routing.departureAirport),
              getAirportByICAO(finalArrivalIcao),
            ]);
            setDepartureAirport(dep);
            setArrivalAirport(arr);
          }
        } else {
          setError('Could not find the requested quote.');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to fetch quote details.');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if modal is open, we have a requestId, and we don't already have the data
    if (open && requestId) {
      loadRequestDetails();
    }
  }, [open, requestId]); // Keep original dependencies but add smart caching inside

  // Clear cache when modal closes to ensure fresh data on next open (if needed)
  useEffect(() => {
    if (!open) {
      // Optional: Clear cache when modal closes to ensure fresh data
      // Comment this out if you want to keep cache across modal opens/closes
      // requestCacheRef.current = {};
      // lastFetchedRequestIdRef.current = null;
    }
  }, [open]);

  const handleOpenSubmitOfferModal = () => {
    setIsSubmitOfferModalOpen(true);
  };

  const handleSubmitOffer = async (price: number) => {
    if (!memoizedRequest || !user) {
      toast.error('Cannot submit offer. Missing request or user information.');
      return;
    }
    try {
      await submitOffer(memoizedRequest, user, price);
      toast.success('Offer submitted successfully!');
      
      // Notify the client
      await createNotification(
        memoizedRequest.clientUserCode,
        'QUOTE_RECEIVED',
        'You Have a New Offer!',
        `You have received a new offer for your request ${memoizedRequest.requestCode}.`,
        { quoteRequestId: memoizedRequest.id },
        `/dashboard/quotes` 
      );

      // Force refresh to get updated request data with new offer
      await forceRefreshRequest();

      setIsSubmitOfferModalOpen(false);
      onClose(); // Close the main modal as well
    } catch (error: any) {
      toast.error(`Failed to submit offer: ${error.message}`);
      console.error('Error submitting offer:', error);
    }
  };

  const handleAcceptOffer = async (offer: Offer) => {
    if (!memoizedRequest || !user || !requestId) return;
    setIsAccepting(true);
    setError(null);
    try {
      await acceptOperatorQuote(requestId, offer.offerId);

      const updatedRequest = await fetchQuoteRequest(requestId);
      if (
        !updatedRequest ||
        !updatedRequest.acceptedOfferId ||
        !updatedRequest.acceptedOperatorUserCode
      ) {
        throw new Error('Failed to retrieve updated quote request details after acceptance.');
      }

      const acceptedOfferDetails = updatedRequest.offers?.find(
        (o) => o.offerId === updatedRequest.acceptedOfferId
      );
      if (!acceptedOfferDetails) {
        throw new Error('Could not find details of the accepted offer.');
      }

      const bookingDocId = await createComprehensiveBooking(updatedRequest, acceptedOfferDetails);
      const invoiceId = await createComprehensiveInvoice(
        bookingDocId,
        updatedRequest.clientUserCode,
        acceptedOfferDetails.operatorUserCode,
        acceptedOfferDetails.offerId,
        Number(acceptedOfferDetails.totalPrice),
        {
          requestId: updatedRequest.id,
          description: `Flight service: ${updatedRequest.routing.departureAirport} → ${updatedRequest.routing.arrivalAirport}`,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          clientNotes: `Flight request ${updatedRequest.requestCode}`,
        }
      );

      await linkInvoiceToBooking(bookingDocId, invoiceId);

      await createNotification(
        acceptedOfferDetails.operatorUserCode,
        'QUOTE_ACCEPTED',
        'Quote Accepted',
        `Your quote ${acceptedOfferDetails.offerId} for request ${updatedRequest.requestCode} has been accepted.`,
        { quoteRequestId: requestId, quoteId: acceptedOfferDetails.offerId },
        `/dashboard/bookings/operator/${bookingDocId}`
      );

      toast.success('Quote accepted successfully! Booking process initiated.');
      router.push(`/dashboard/bookings/${bookingDocId}`);
      onClose(); // Close modal on success
    } catch (err: any) {
      console.error('Error during quote acceptance:', err);
      setError(err.message || 'Failed to accept quote.');
      toast.error(err.message || 'Failed to accept quote.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectOffer = async (offer: Offer) => {
    if (!memoizedRequest || !user || !requestId) return;
    setIsRejecting(true);
    setError(null);
    try {
      await rejectOperatorQuote(requestId, offer.offerId);

      await createNotification(
        offer.operatorUserCode,
        'REQUEST_DECLINED',
        'Quote Rejected',
        `Your quote ${offer.offerId} for request ${memoizedRequest.requestCode} has been rejected.`,
        { quoteRequestId: requestId, quoteId: offer.offerId },
        `/dashboard/quotes/incoming`
      );

      toast.success('Quote rejected successfully.');
      
      // Force refresh to get updated request data
      await forceRefreshRequest();
      
      onClose(); // Close modal on success
    } catch (err: any) {
      console.error('Error during quote rejection:', err);
      setError(err.message || 'Failed to reject quote.');
      toast.error(err.message || 'Failed to reject quote.');
    } finally {
      setIsRejecting(false);
    }
  };

  const isClientView = user?.role === 'passenger' || user?.role === 'agent';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      scroll="paper"
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ pr: 6 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'normal' }}>
            <Box component="span" sx={{ fontWeight: 'bold' }}>
              Quote Request Details:
            </Box>
            {' '}
            <Box component="span" sx={{ fontWeight: 'normal' }}>
              {memoizedRequest?.requestCode || 'Loading...'}
            </Box>
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box display="flex" justifyContent="center" p={5}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && memoizedRequest && (
          <QuoteRequestDetails 
            request={memoizedRequest} 
            onAcceptOffer={handleAcceptOffer}
            onRejectOffer={handleRejectOffer}
            onQuoteSubmitted={onClose}
            isAccepting={isAccepting}
            isRejecting={isRejecting}
          />
        )}
      </DialogContent>
      <SubmitOfferModal
        open={isSubmitOfferModalOpen}
        onClose={() => setIsSubmitOfferModalOpen(false)}
        onSubmit={handleSubmitOffer}
        request={memoizedRequest}
      />
    </Dialog>
  );
};

export default QuoteRequestModal; 