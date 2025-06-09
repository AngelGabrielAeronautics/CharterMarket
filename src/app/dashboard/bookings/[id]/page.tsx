'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useBookingDetail, useInvoices } from '@/hooks/useBookings';
import { useBookingPayments } from '@/hooks/usePayments';
import { Booking } from '@/types/booking';
import { Invoice } from '@/types/invoice';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import PaymentForm from '@/components/payments/PaymentForm';
import PassengerManifest from '@/components/passengers/PassengerManifest';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Chip,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  StepIconProps,
} from '@mui/material';
import { Receipt, AttachMoney, Flight, Check, AccessTime, Close } from '@mui/icons-material';
import Rating from '@mui/material/Rating';
import TextField from '@mui/material/TextField';
import { useBookingRating, useRatingManagement } from '@/hooks/useRatings';

// Helper to parse Firestore Timestamp or raw JSON into JS Date
function toJsDate(value: any): Date {
  if (!value) return new Date();
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value.seconds === 'number' && typeof value.nanoseconds === 'number') {
    return new Date(value.seconds * 1000 + value.nanoseconds / 1e6);
  }
  if (typeof value._seconds === 'number' && typeof value._nanoseconds === 'number') {
    return new Date(value._seconds * 1000 + value._nanoseconds / 1e6);
  }
  return new Date(value);
}

export default function BookingDetailsPage() {
  const { id } = useParams();
  const bookingDocId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { rating, loading: loadingRating } = useBookingRating(bookingDocId);
  const {
    createRating,
    loading: creatingRating,
    success: createSuccess,
    error: createError,
  } = useRatingManagement();
  const [userRating, setUserRating] = useState<number>(rating?.rating || 0);
  const [comments, setComments] = useState<string>(rating?.comments || '');

  const {
    booking,
    loading: loadingBooking,
    error: bookingError,
  } = useBookingDetail(bookingDocId, user?.userCode, userRole ?? undefined);
  const { invoices, loading: loadingInvoices, error: invoicesError } = useInvoices(bookingDocId);
  const {
    payments,
    loading: loadingPayments,
    error: paymentsError,
  } = useBookingPayments(bookingDocId);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
  };

  const closePaymentDialog = () => {
    setIsPaymentDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    toast.success(
      'Payment information submitted successfully! Your booking will be updated once payment is verified.'
    );
    closePaymentDialog();
    // Refresh the page to show updated payments
    router.refresh();
  };

  const handleDownloadTicket = async () => {
    try {
      // Open PDF directly in a new window
      window.open(`/api/tickets/${bookingDocId}`, '_blank');
    } catch (err: any) {
      console.error('Download ticket error:', err);
      toast.error('Failed to generate e-ticket');
    }
  };

  const handleSubmitRating = async () => {
    // Support both legacy and new booking structures
    const operatorId = (booking as any)?.operatorId || booking?.operator?.operatorUserCode;
    if (!userRating || !user?.userCode || !bookingDocId || !operatorId) return;
    await createRating(bookingDocId, operatorId, user.userCode, userRating, comments);
  };

  if (loadingBooking) return <div className="p-8 text-center">Loading booking...</div>;
  if (bookingError) return <div className="p-8 text-center text-red-600">{bookingError}</div>;
  if (!booking) return null;

  // Determine if the booking is in a state where passenger details can be edited
  const canEditPassengers = [
    'pending-payment',
    'deposit-paid',
    'confirmed',
    'client-ready',
  ].includes(booking.status);

  // Get the booking progress step
  const getBookingStep = () => {
    switch (booking.status) {
      case 'pending-payment':
      case 'deposit-paid':
        return 0;
      case 'confirmed':
      case 'client-ready':
      case 'flight-ready':
        return 1;
      case 'archived':
        return 2;
      case 'cancelled':
      case 'credited':
      case 'refunded':
        return -1;
      default:
        return 0;
    }
  };

  // Check if any payment is pending
  const hasPendingPayment = payments?.some((p) => p.status === 'pending');

  return (
    <Box className="container mx-auto px-4 py-8" sx={{ maxWidth: '900px' }}>
      <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
        Booking {booking.bookingId}
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }} variant="outlined">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Box sx={{ flex: '1 1 300px', mr: 3, mb: 2 }}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Flight Details
            </Typography>
            <Typography variant="body1">
              <strong>Route:</strong> {booking.routing.departureAirport} →{' '}
              {booking.routing.arrivalAirport}
            </Typography>
            <Typography variant="body1">
              <strong>Date:</strong>{' '}
              {booking.routing.departureDate &&
              typeof booking.routing.departureDate.toDate === 'function'
                ? format(booking.routing.departureDate.toDate(), 'dd MMM yyyy')
                : 'Date not available'}
            </Typography>
            <Typography variant="body1">
              <strong>Passengers:</strong> {booking.passengerCount}
            </Typography>
            <Typography variant="body1">
              <strong>Class:</strong> {booking.cabinClass}
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 300px' }}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Booking Status
            </Typography>
            <Typography
              variant="h6"
              color={
                ['confirmed', 'client-ready', 'flight-ready'].includes(booking.status)
                  ? 'success.main'
                  : ['cancelled', 'credited', 'refunded'].includes(booking.status)
                    ? 'error.main'
                    : booking.status === 'archived'
                      ? 'info.main'
                      : 'warning.main'
              }
            >
              {booking.status.toUpperCase()}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Booked on{' '}
              {booking.createdAt && typeof booking.createdAt.toDate === 'function'
                ? format(booking.createdAt.toDate(), 'dd MMM yyyy')
                : 'Date not available'}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                <strong>Price:</strong> $
                {((booking as any).price || booking.payment?.subtotal || 0).toFixed(2)}
              </Typography>
              <Typography variant="body1">
                <strong>Total:</strong> $
                {((booking as any).totalPrice || booking.payment?.totalAmount || 0).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Add booking progress stepper */}
        <Box sx={{ mt: 4 }}>
          <Stepper activeStep={getBookingStep()} orientation="horizontal">
            <Step>
              <StepLabel>Booking Created</StepLabel>
            </Step>
            <Step>
              <StepLabel>Payment Confirmed</StepLabel>
            </Step>
            <Step>
              <StepLabel>Flight Completed</StepLabel>
            </Step>
          </Stepper>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Tabs and Tab Content */}
        <Box sx={{ mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Passenger Manifest" id="tab-0" />
            <Tab label="Invoices & Payments" id="tab-1" />
            <Tab label="Feedback" id="tab-2" />
          </Tabs>

          {activeTab === 0 && bookingDocId && (
            <Box>
              <PassengerManifest
                bookingId={bookingDocId}
                userCode={user?.userCode || ''}
                passengerCount={booking.passengerCount}
                readOnly={!canEditPassengers}
              />
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Invoices & Payments
              </Typography>

              {loadingInvoices ? (
                <Typography>Loading invoices...</Typography>
              ) : invoicesError ? (
                <Paper sx={{ p: 3, textAlign: 'center' }} variant="outlined">
                  <Typography color="error">Unable to load invoices: {invoicesError}</Typography>
                  <Button
                    variant="outlined"
                    onClick={() => window.location.reload()}
                    sx={{ mt: 2 }}
                  >
                    Retry
                  </Button>
                </Paper>
              ) : invoices.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }} variant="outlined">
                  <Typography color="text.secondary">No invoices found.</Typography>
                </Paper>
              ) : (
                <Paper variant="outlined">
                  {invoices.map((inv, index) => (
                    <Box key={inv.id}>
                      {index > 0 && <Divider />}
                      <Box sx={{ p: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 1,
                          }}
                        >
                          <Box>
                            <Typography variant="subtitle2">Invoice {inv.invoiceId}</Typography>
                            <Typography variant="body2">
                              Issued: {format(toJsDate(inv.createdAt), 'dd MMM yyyy')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1" fontWeight="medium" sx={{ mr: 2 }}>
                              ${inv.amount.toFixed(2)}
                            </Typography>
                            <Button
                              variant="outlined"
                              onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                              sx={{ mr: 1 }}
                            >
                              View
                            </Button>
                            {['pending-payment', 'deposit-paid'].includes(booking.status) &&
                              !hasPendingPayment && (
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={() => openPaymentDialog(inv)}
                                >
                                  Pay Now
                                </Button>
                              )}
                          </Box>
                        </Box>

                        {/* Show related payments for this invoice */}
                        {!loadingPayments &&
                          payments &&
                          payments.filter((p) => p.invoiceId === inv.id).length > 0 && (
                            <Box sx={{ mt: 2, ml: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Payment History
                              </Typography>
                              {payments
                                .filter((p) => p.invoiceId === inv.id)
                                .map((payment) => (
                                  <Box
                                    key={payment.id}
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      p: 1,
                                      borderLeft: '2px solid',
                                      borderColor:
                                        payment.status === 'completed'
                                          ? 'success.main'
                                          : payment.status === 'failed'
                                            ? 'error.main'
                                            : payment.status === 'pending'
                                              ? 'warning.main'
                                              : 'info.main',
                                      pl: 2,
                                      bgcolor: 'background.default',
                                    }}
                                  >
                                    <Box>
                                      <Typography variant="body2">
                                        {payment.paymentId} - {payment.paymentMethod}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {payment.paymentDate
                                          ? format(toJsDate(payment.paymentDate), 'dd MMM yyyy')
                                          : format(toJsDate(payment.createdAt), 'dd MMM yyyy')}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Typography variant="body2" sx={{ mr: 1 }}>
                                        ${payment.amount.toFixed(2)}
                                      </Typography>
                                      <Chip
                                        size="small"
                                        label={
                                          payment.status.charAt(0).toUpperCase() +
                                          payment.status.slice(1)
                                        }
                                        color={
                                          payment.status === 'completed'
                                            ? 'success'
                                            : payment.status === 'failed'
                                              ? 'error'
                                              : payment.status === 'pending'
                                                ? 'warning'
                                                : 'info'
                                        }
                                      />
                                    </Box>
                                  </Box>
                                ))}
                            </Box>
                          )}
                      </Box>
                    </Box>
                  ))}
                </Paper>
              )}
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                User Feedback
              </Typography>
              {loadingRating ? (
                <Typography>Loading feedback...</Typography>
              ) : rating ? (
                <Box>
                  <Typography>Thank you for your feedback!</Typography>
                  <Rating value={rating.rating} readOnly />
                  {rating.comments && <Typography sx={{ mt: 1 }}>{rating.comments}</Typography>}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
                  {createError && <Typography color="error">{createError}</Typography>}
                  <Rating
                    name="userRating"
                    value={userRating}
                    onChange={(_, newValue) => setUserRating(newValue || 0)}
                  />
                  <TextField
                    label="Comments (optional)"
                    multiline
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmitRating}
                      disabled={creatingRating || userRating === 0 || createSuccess}
                    >
                      {creatingRating
                        ? 'Submitting...'
                        : createSuccess
                          ? 'Submitted'
                          : 'Submit Feedback'}
                    </Button>
                    {createSuccess && <Typography color="success.main">Feedback sent!</Typography>}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mt: 4,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Button variant="outlined" onClick={() => router.push('/dashboard/bookings')}>
            Back to Bookings
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {['confirmed', 'client-ready', 'flight-ready', 'archived'].includes(booking.status) && (
              <Button variant="contained" color="primary" onClick={handleDownloadTicket}>
                Download Ticket
              </Button>
            )}

            {['pending-payment', 'deposit-paid'].includes(booking.status) &&
              !hasPendingPayment &&
              invoices.length > 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => openPaymentDialog(invoices[0])}
                  startIcon={<AttachMoney />}
                >
                  Make Payment
                </Button>
              )}

            {hasPendingPayment && (
              <Button variant="contained" color="warning" disabled startIcon={<AccessTime />}>
                Payment Pending Verification
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onClose={closePaymentDialog} maxWidth="md" fullWidth>
        <DialogTitle>Make Payment</DialogTitle>
        <DialogContent>
          {selectedInvoice && bookingDocId && (
            <PaymentForm
              bookingId={bookingDocId}
              invoiceId={selectedInvoice.id}
              amount={selectedInvoice.amount}
              onSuccess={handlePaymentSuccess}
              onCancel={closePaymentDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
