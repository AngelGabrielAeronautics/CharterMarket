'use client';

import React, { useState, useEffect } from 'react';
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
import { acceptOperatorQuote } from '@/lib/quote';
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
  const [isSubmitOfferModalOpen, setIsSubmitOfferModalOpen] = useState(false);

  useEffect(() => {
    const loadRequestDetails = async () => {
      if (!requestId) return;
      setLoading(true);
      setError(null);
      try {
        const reqData = await fetchQuoteRequest(requestId);
        if (reqData) {
          setRequest(reqData);

          let finalArrivalIcao = reqData.routing.arrivalAirport;
          if (
            reqData.tripType === 'multiCity' &&
            reqData.multiCityRoutes &&
            reqData.multiCityRoutes.length > 0
          ) {
            finalArrivalIcao = reqData.multiCityRoutes[reqData.multiCityRoutes.length - 1].arrivalAirport;
          }

          // Fetch airport details in parallel
          const [dep, arr] = await Promise.all([
            getAirportByICAO(reqData.routing.departureAirport),
            getAirportByICAO(finalArrivalIcao),
          ]);
          setDepartureAirport(dep);
          setArrivalAirport(arr);
        } else {
          setError('Could not find the requested quote.');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to fetch quote details.');
      } finally {
        setLoading(false);
      }
    };

    if (open && requestId) {
      loadRequestDetails();
    }
  }, [open, requestId]);

  const handleOpenSubmitOfferModal = () => {
    setIsSubmitOfferModalOpen(true);
  };

  const handleSubmitOffer = async (price: number) => {
    if (!request || !user) {
      toast.error('Cannot submit offer. Missing request or user information.');
      return;
    }
    try {
      await submitOffer(request, user, price);
      toast.success('Offer submitted successfully!');
      
      // Notify the client
      await createNotification(
        request.clientUserCode,
        'QUOTE_RECEIVED',
        'You Have a New Offer!',
        `You have received a new offer for your request ${request.requestCode}.`,
        { quoteRequestId: request.id },
        `/dashboard/quotes` 
      );

      setIsSubmitOfferModalOpen(false);
      onClose(); // Close the main modal as well
    } catch (error: any) {
      toast.error(`Failed to submit offer: ${error.message}`);
      console.error('Error submitting offer:', error);
    }
  };

  const handleAcceptOffer = async (offer: Offer) => {
    if (!request || !user || !requestId) return;
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
        Quote Request Details
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
        {!loading && !error && request && (
          <QuoteRequestDetails
            request={request}
            departureAirportDetails={departureAirport}
            arrivalAirportDetails={arrivalAirport}
            onAcceptOffer={handleAcceptOffer}
            isAcceptingOffer={isAccepting}
            isClientView={isClientView}
            onSubmitOffer={handleOpenSubmitOfferModal}
          />
        )}
      </DialogContent>
      <SubmitOfferModal
        open={isSubmitOfferModalOpen}
        onClose={() => setIsSubmitOfferModalOpen(false)}
        onSubmit={handleSubmitOffer}
        request={request}
      />
    </Dialog>
  );
};

export default QuoteRequestModal; 