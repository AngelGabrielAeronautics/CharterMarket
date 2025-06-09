'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getQuoteRequest, updateQuoteRequest, markQuoteRequestAsViewed } from '@/lib/flight';
import { createQuote } from '@/lib/quote';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { createNotification } from '@/lib/notification';
import toast from 'react-hot-toast';
import { QuoteRequest } from '@/types/flight';

// Import MUI components directly
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

import {
  FlightTakeoff as FlightTakeoffIcon,
  FlightLand as FlightLandIcon,
  Person as PersonIcon,
  DateRange as DateRangeIcon,
  CancelOutlined as CancelIcon,
  LocalOffer as LocalOfferIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

export default function OperatorQuoteSubmissionPage() {
  const { id } = useParams();
  const requestId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();
  const router = useRouter();
  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [price, setPrice] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDeclineDialog, setOpenDeclineDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!requestId) return;
      setLoading(true);
      try {
        const req = await getQuoteRequest(requestId);
        setRequest(req);

        if (!req) {
          setError('Quote request not found.');
        } else {
          // Mark the request as viewed by operator if it's still in submitted status
          if (req.status === 'submitted' && user?.userCode) {
            try {
              await markQuoteRequestAsViewed(requestId);
              console.log('Quote request marked as under operator review');
            } catch (viewError) {
              console.warn('Failed to mark quote request as viewed:', viewError);
              // Don't block the UI for this error
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(
          'Failed to load request details. Please ensure the request ID is correct and try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [requestId, user?.userCode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!request || !user?.userCode) {
      setError('User information is missing or request not loaded.');
      return;
    }
    if (!requestId) {
      setError('Request ID is missing.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const existingOffer = request.offers?.find((o) => o.operatorUserCode === user.userCode);
      if (existingOffer) {
        toast.error('You have already submitted an offer for this request.');
        setError(
          'You have already submitted an offer for this request. You might need to edit your existing offer (feature not yet implemented).'
        );
        setSubmitting(false);
        return;
      }

      const priceValue = parseFloat(price);
      if (isNaN(priceValue) || priceValue <= 0) {
        toast.error('Please enter a valid price.');
        setError('Please enter a valid price.');
        setSubmitting(false);
        return;
      }

      await createQuote(requestId, user.userCode, { price: priceValue });

      if (request.clientUserCode) {
        await createNotification(
          request.clientUserCode,
          'QUOTE_RECEIVED',
          'New Offer Received',
          `You have received a new offer for your quote request ${request.requestCode}.`,
          { quoteRequestId: requestId },
          `/dashboard/quotes/${requestId}`
        );
      } else {
        console.warn('clientUserCode not found on request, cannot send notification.');
      }

      toast.success('Offer submitted successfully!');
      router.push('/dashboard/quotes/incoming');
    } catch (err) {
      console.error('Error submitting offer:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to submit offer. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!request || !user?.userCode || !request.clientUserCode) return;
    if (!requestId) {
      setError('Request ID is missing.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await updateQuoteRequest(requestId, { status: 'cancelled' });

      await createNotification(
        request.clientUserCode,
        'REQUEST_DECLINED',
        'Quote Request Declined by Operator',
        `Operator ${user.userCode} has declined to quote on request ${request.requestCode}: ${declineReason || 'No reason provided'}`,
        { quoteRequestId: requestId },
        `/dashboard/quotes/${requestId}`
      );

      toast.success('Request marked as declined by you.');
      setOpenDeclineDialog(false);
      router.push('/dashboard/quotes/incoming');
    } catch (err) {
      console.error('Error declining request:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to decline request. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return React.createElement('div', null, 'Loading...');
  }

  if (error && !request) {
    return React.createElement('div', null, 'Error occurred and no request data.');
  }

  if (!request) {
    return React.createElement('div', null, 'Request not found.');
  }

  // Create the quote submission form
  const createQuoteForm = () => {
    if (
      !['submitted', 'under-operator-review', 'pending', 'quoted', 'under-offer'].includes(
        request.status
      )
    ) {
      return null;
    }

    return React.createElement(
      'div',
      { className: 'mb-4' },
      React.createElement(
        Typography,
        { variant: 'h6', fontWeight: 'medium', sx: { mb: 2 } },
        'Submit Quote'
      ),
      React.createElement(
        Paper,
        { elevation: 2, sx: { p: 3, borderRadius: 2 } },
        error && React.createElement(Alert, { severity: 'error', sx: { mb: 3 } }, error),
        React.createElement(
          'form',
          { onSubmit: handleSubmit },
          React.createElement(TextField, {
            label: 'Your Price (USD)',
            type: 'number',
            fullWidth: true,
            value: price,
            onChange: (e) => setPrice(e.target.value),
            required: true,
            InputProps: {
              startAdornment: React.createElement(InputAdornment, { position: 'start' }, '$'),
            },
            sx: { mb: 3 },
          }),
          React.createElement(
            'div',
            { className: 'flex justify-between' },
            React.createElement(
              Button,
              {
                variant: 'outlined',
                color: 'error',
                onClick: () => setOpenDeclineDialog(true),
              },
              'Decline Request'
            ),
            React.createElement(
              Button,
              {
                type: 'submit',
                variant: 'contained',
                color: 'primary',
                disabled: submitting || !price,
              },
              submitting ? 'Submitting...' : 'Submit Quote'
            )
          )
        )
      )
    );
  };

  return React.createElement(
    'div',
    { className: 'max-w-[800px] mx-auto px-4 py-4' },
    // Header with back button
    React.createElement(
      'div',
      { className: 'flex items-center mb-4' },
      React.createElement(
        Button,
        { onClick: () => router.back(), variant: 'text', sx: { mr: 2 } },
        'Back'
      ),
      React.createElement(
        Typography,
        { variant: 'h4', fontWeight: 'bold', color: 'primary.main' },
        `Quote Request ${request.requestCode}`
      )
    ),
    // Request details
    React.createElement(
      Paper,
      { elevation: 2, sx: { p: 3, mb: 4, borderRadius: 2 } },
      React.createElement(
        Grid,
        { container: true, spacing: 3 },
        // From
        React.createElement(
          Grid,
          { size: { xs: 12, sm: 6 } },
          React.createElement(
            'div',
            { className: 'flex items-center mb-2' },
            React.createElement(FlightTakeoffIcon, { sx: { mr: 1, color: 'primary.main' } }),
            React.createElement(Typography, { variant: 'subtitle1', fontWeight: 'medium' }, 'From')
          ),
          React.createElement(Typography, { variant: 'body1' }, request.routing.departureAirport)
        ),
        // To
        React.createElement(
          Grid,
          { size: { xs: 12, sm: 6 } },
          React.createElement(
            'div',
            { className: 'flex items-center mb-2' },
            React.createElement(FlightLandIcon, { sx: { mr: 1, color: 'primary.main' } }),
            React.createElement(Typography, { variant: 'subtitle1', fontWeight: 'medium' }, 'To')
          ),
          React.createElement(Typography, { variant: 'body1' }, request.routing.arrivalAirport)
        ),
        // Passengers
        React.createElement(
          Grid,
          { size: { xs: 12, sm: 6 } },
          React.createElement(
            'div',
            { className: 'flex items-center mb-2' },
            React.createElement(PersonIcon, { sx: { mr: 1, color: 'primary.main' } }),
            React.createElement(
              Typography,
              { variant: 'subtitle1', fontWeight: 'medium' },
              'Passengers'
            )
          ),
          React.createElement(Typography, { variant: 'body1' }, request.passengerCount)
        )
      )
    ),
    // Quote form
    createQuoteForm(),
    // Decline dialog
    React.createElement(
      Dialog,
      { open: openDeclineDialog, onClose: () => setOpenDeclineDialog(false) },
      React.createElement(DialogTitle, null, 'Decline Quote Request'),
      React.createElement(
        DialogContent,
        null,
        React.createElement(
          DialogContentText,
          null,
          'Are you sure you want to decline this quote request?'
        ),
        React.createElement(TextField, {
          label: 'Reason for declining (optional)',
          fullWidth: true,
          multiline: true,
          rows: 3,
          value: declineReason,
          onChange: (e) => setDeclineReason(e.target.value),
        })
      ),
      React.createElement(
        DialogActions,
        null,
        React.createElement(
          Button,
          { onClick: () => setOpenDeclineDialog(false), color: 'primary' },
          'Cancel'
        ),
        React.createElement(
          Button,
          { onClick: handleDeclineRequest, color: 'error', disabled: submitting },
          submitting ? 'Processing...' : 'Decline Request'
        )
      )
    )
  );
}
