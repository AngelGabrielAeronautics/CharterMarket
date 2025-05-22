'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Tooltip,
  Divider,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  Send as SendIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  Refresh as RefreshIcon,
  ReceiptLong as InvoiceIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { usePayments } from '@/hooks/usePayments'; // Import the hook
import { Payment, PaymentStatus } from '@/types/payment'; // Import Payment type
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Helper to convert Firestore Timestamp to Date if necessary
const toJsDate = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  // Attempt to parse if it's a string
  if (typeof timestamp === 'string') {
    const parsed = parseISO(timestamp);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  console.warn('Invalid date/timestamp:', timestamp);
  return null;
};

export default function PaymentVerification() {
  const { user } = useAuth();
  const {
    payments: allPayments,
    loading: paymentsLoading,
    error: paymentsError,
    refetchPayments,
  } = usePayments(true); // Use the hook

  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isOperatorPayDialogOpen, setIsOperatorPayDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); // For individual actions
  const [verificationStatus, setVerificationStatus] = useState<PaymentStatus>('completed');
  const [verificationNotes, setVerificationNotes] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const pendingPayments = useMemo(
    () => allPayments.filter((p) => p.status === 'pending' || p.status === 'processing'),
    [allPayments]
  );

  const completedPayments = useMemo(
    () =>
      allPayments.filter(
        (p) => p.status === 'completed' || p.status === 'failed' || p.status === 'refunded'
      ),
    [allPayments]
  );

  // Operator Payouts Tab - for now, these are payments that are 'completed'/'paid' but not yet marked as 'operatorPaid'
  // This logic will need refinement based on how `operatorPaid` is structured and updated.
  const operatorPayouts = useMemo(
    () =>
      allPayments.filter((p) => p.status === 'completed' && !p.operatorPaid),
    [allPayments]
  );

  const filterPayments = (paymentsToFilter: Payment[]) => {
    if (!searchQuery) return paymentsToFilter;
    return paymentsToFilter.filter(
      (payment) =>
        payment.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (payment.paymentId &&
          payment.paymentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (payment.paymentReference &&
          payment.paymentReference.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const filteredPendingPayments = useMemo(
    () => filterPayments(pendingPayments),
    [pendingPayments, searchQuery]
  );
  const filteredCompletedPayments = useMemo(
    () => filterPayments(completedPayments),
    [completedPayments, searchQuery]
  );
  const filteredOperatorPayouts = useMemo(
    () => filterPayments(operatorPayouts),
    [operatorPayouts, searchQuery]
  );

  const handleOpenVerifyDialog = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setVerificationStatus('completed'); // Default to completed
    setVerificationNotes(allPayments.find((p) => p.id === paymentId)?.notes || '');
    setIsVerifyDialogOpen(true);
  };

  const handleOpenOperatorPayDialog = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    // Potentially pre-fill notes or other details for operator payment
    setIsOperatorPayDialogOpen(true);
  };

  const handleConfirmVerification = async () => {
    if (!selectedPaymentId || !user?.userCode) {
      toast.error('User or payment details missing.');
      return;
    }
    setActionLoading(true);
    try {
      // API call to verify payment
      // This will be: POST /api/admin/payments/[paymentId]/verify
      // Body: { adminUserCode: user.userCode, status: verificationStatus, notes: verificationNotes }
      const response = await fetch(`/api/admin/payments/${selectedPaymentId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserCode: user.userCode,
          status: verificationStatus,
          notes: verificationNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify payment.');
      }

      toast.success('Payment status updated!');
      refetchPayments(); // Refresh the list
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      toast.error(error.message || 'Could not update payment status.');
    } finally {
      setActionLoading(false);
      setIsVerifyDialogOpen(false);
      setSelectedPaymentId(null);
      setVerificationNotes('');
    }
  };

  const handleConfirmOperatorPayment = async () => {
    if (!selectedPaymentId || !user?.userCode) {
      toast.error('User or payment details missing.');
      return;
    }
    setActionLoading(true);
    try {
      // API call to mark operator paid
      // This will be: POST /api/admin/payments/[paymentId]/mark-operator-paid
      // Body: { adminUserCode: user.userCode, notes: "Operator paid" } (or similar)
      const response = await fetch(`/api/admin/payments/${selectedPaymentId}/mark-operator-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserCode: user.userCode,
          // Potentially add other fields like payout date, reference, etc.
          notes: `Operator paid by ${user.userCode}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark operator as paid.');
      }
      toast.success('Operator marked as paid!');
      refetchPayments(); // Refresh the list
    } catch (error: any) {
      console.error('Error marking operator paid:', error);
      toast.error(error.message || 'Could not mark operator as paid.');
    } finally {
      setActionLoading(false);
      setIsOperatorPayDialogOpen(false);
      setSelectedPaymentId(null);
    }
  };

  const currentPaymentDetails = useMemo(
    () => allPayments.find((payment) => payment.id === selectedPaymentId),
    [allPayments, selectedPaymentId]
  );

  const getStatusChipColor = (
    status?: PaymentStatus
  ): 'success' | 'warning' | 'error' | 'default' | 'info' => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderPaymentTable = (
    payments: Payment[],
    type: 'pending' | 'completed' | 'operatorPayout'
  ) => {
    if (paymentsLoading) {
  return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (paymentsError) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          Failed to load payments: {paymentsError}
        </Alert>
      );
    }
    if (payments.length === 0) {
      return (
        <Typography sx={{ p: 3, textAlign: 'center' }}>No payments in this category.</Typography>
      );
    }

    return (
      <TableContainer>
        <Table stickyHeader>
            <TableHead>
              <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Invoice ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Booking ID</TableCell>
              {/* Add Client / Operator name columns later if data is available */}
              <TableCell sx={{ fontWeight: 'bold' }} align="right">
                Amount
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date Created</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Due Date / Paid Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">
                Actions
              </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {payments.map((payment) => {
              const createdAtDate = toJsDate(payment.createdAt);
              const paymentDateOrDueDate =
                payment.status === 'completed' || payment.status === 'paid'
                  ? toJsDate(payment.paymentDate || payment.processedDate) // Use paymentDate or processedDate for paid
                  : toJsDate(payment.dueDate); // Use dueDate for pending/overdue
              return (
                <TableRow hover key={payment.id}>
                  <TableCell>
                    <Link href={`/admin/invoices/${payment.invoiceId}`} passHref>
                      <Typography
                        variant="body2"
                        color="primary"
                        sx={{ textDecoration: 'underline' }}
                      >
                        {payment.invoiceId}
                      </Typography>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/bookings/${payment.bookingId}`} passHref>
                      <Typography
                        variant="body2"
                        color="primary"
                        sx={{ textDecoration: 'underline' }}
                      >
                        {payment.bookingId}
                      </Typography>
                    </Link>
                    <br />
                    <Typography variant="caption" color="textSecondary">
                      {payment.paymentId}
                    </Typography>
                  </TableCell>
                  {/* Client / Operator Cells - Placeholder for now */}
                  <TableCell align="right">
                    R
                    {payment.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    {createdAtDate ? format(createdAtDate, 'dd MMM yyyy, HH:mm') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {paymentDateOrDueDate ? format(paymentDateOrDueDate, 'dd MMM yyyy') : 'N/A'}
                    {payment.status === 'overdue' && (
                      <Chip label="Overdue" color="error" size="small" sx={{ ml: 1 }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payment.status}
                      color={getStatusChipColor(payment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                        component={Link}
                        href={`/admin/payments/${payment.id}`}
                        >
                        {' '}
                        {/* Assuming a detail page might exist */}
                        <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    {(type === 'pending' || type === 'operatorPayout') && (
                      <Tooltip
                        title={type === 'pending' ? 'Verify Client Payment' : 'Mark Operator Paid'}
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            type === 'pending'
                              ? handleOpenVerifyDialog(payment.id)
                              : handleOpenOperatorPayDialog(payment.id)
                          }
                          color="primary"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            </TableBody>
          </Table>
        </TableContainer>
    );
  };

  // Calculate summary stats from live data
  const totalReceived = useMemo(
    () => completedPayments.reduce((sum, p) => sum + p.amount, 0),
    [completedPayments]
  );

  const totalPending = useMemo(
    () =>
      pendingPayments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    [pendingPayments]
  );

  const totalOverdue = useMemo(
    () =>
      pendingPayments.filter((p) => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
    [pendingPayments]
  );

  // This needs to be calculated based on amounts from 'operatorPayouts' list
  const totalDueToOperators = useMemo(
    () => operatorPayouts.reduce((sum, p) => sum + p.amount, 0), // Or use a specific 'payoutAmount' field if it exists
    [operatorPayouts]
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Payment Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Verify client payments and manage operator payouts
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refetchPayments}
          disabled={paymentsLoading || actionLoading}
        >
          Refresh
        </Button>
      </Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Payment Stats Summary */}
        <Grid
          size={{
            xs: 12,
            md: 3
          }}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'success.main' }}>
              R
              {totalReceived.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Payments Received
            </Typography>
          </Paper>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 3
          }}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'warning.main' }}>
              R
              {totalPending.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Client Payments
            </Typography>
          </Paper>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 3
          }}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'error.main' }}>
              R
              {totalOverdue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overdue Client Payments
            </Typography>
          </Paper>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 3
          }}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'info.main' }}>
              R
              {totalDueToOperators.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Due to Operators
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="payment categories">
            <Tab
              label={
                <Box>
                  Pending{' '}
                  <Chip
                    label={filteredPendingPayments.length}
                    size="small"
                    color="warning"
                    sx={{ ml: 1 }}
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box>
                  Completed{' '}
                  <Chip
                    label={filteredCompletedPayments.length}
                    size="small"
                    color="success"
                    sx={{ ml: 1 }}
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box>
                  Operator Payouts{' '}
                  <Chip
                    label={filteredOperatorPayouts.length}
                    size="small"
                    color="info"
                    sx={{ ml: 1 }}
                  />
                </Box>
              }
            />
          </Tabs>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { sm: 'auto', md: 300 } }}
            />
            {/* <Button variant="outlined" startIcon={<FilterIcon />} size="small">
              Filter
            </Button> */}
          </Box>
        </Box>

        {tabValue === 0 && renderPaymentTable(filteredPendingPayments, 'pending')}
        {tabValue === 1 && renderPaymentTable(filteredCompletedPayments, 'completed')}
        {tabValue === 2 && renderPaymentTable(filteredOperatorPayouts, 'operatorPayout')}
      </Paper>
      {/* Verify Payment Dialog */}
      <Dialog
        open={isVerifyDialogOpen}
        onClose={() => setIsVerifyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Verify Client Payment</DialogTitle>
        <DialogContent>
          {currentPaymentDetails ? (
            <Box>
              <Typography gutterBottom>
                <strong>Invoice ID:</strong> {currentPaymentDetails.invoiceId}
              </Typography>
              <Typography gutterBottom>
                <strong>Booking ID:</strong> {currentPaymentDetails.bookingId}
              </Typography>
              <Typography gutterBottom>
                <strong>Amount:</strong> R
                {currentPaymentDetails.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <FormControl component="fieldset" sx={{ mt: 2, mb: 1 }}>
                <Typography component="legend" variant="subtitle1" sx={{ mb: 1 }}>
                  Set Payment Status:
              </Typography>
                <RadioGroup
                  row
                  aria-label="payment-status"
                  name="payment-status"
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as PaymentStatus)}
                >
                  <FormControlLabel value="completed" control={<Radio />} label="Completed/Paid" />
                  <FormControlLabel value="pending" control={<Radio />} label="Still Pending" />
                  <FormControlLabel value="failed" control={<Radio />} label="Failed" />
                </RadioGroup>
                </FormControl>
                <TextField
                label="Verification Notes (Optional)"
                  multiline
                  rows={3}
                fullWidth
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                variant="outlined"
                sx={{ mt: 1 }}
              />
            </Box>
          ) : (
            <CircularProgress />
          )}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
          <Button
            onClick={() => setIsVerifyDialogOpen(false)}
            color="inherit"
            variant="outlined"
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmVerification}
            color="primary"
            variant="contained" 
            disabled={actionLoading || !selectedPaymentId}
            startIcon={
              actionLoading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />
            }
          >
            {actionLoading ? 'Processing...' : 'Confirm & Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Mark Operator Paid Dialog */}
      <Dialog
        open={isOperatorPayDialogOpen}
        onClose={() => setIsOperatorPayDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Mark Operator as Paid</DialogTitle>
        <DialogContent>
          {currentPaymentDetails ? (
            <Box>
              <Typography gutterBottom>
                <strong>Invoice ID:</strong> {currentPaymentDetails.invoiceId}
                  </Typography>
              <Typography gutterBottom>
                <strong>Booking ID:</strong> {currentPaymentDetails.bookingId} (Operator payout
                portion)
                    </Typography>
              <Typography gutterBottom>
                <strong>Amount Due to Operator:</strong>
                {/* This should ideally be a separate field like 'operatorPayoutAmount' on the payment or booking */}
                R
                {(currentPaymentDetails.amount * 0.97).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                (Assuming 3% commission)
                    </Typography>
              <Typography variant="caption" color="textSecondary">
                Note: This is an estimate. The actual payout amount should be confirmed based on the
                operator agreement.
                    </Typography>
              <TextField
                label="Operator Payout Notes (Optional)"
                multiline
                rows={3}
                fullWidth
                // value={operatorPayoutNotes}
                // onChange={(e) => setOperatorPayoutNotes(e.target.value)}
                variant="outlined"
                sx={{ mt: 2 }}
                placeholder="e.g., Paid via EFT, Ref: OP12345"
              />
            </Box>
          ) : (
            <CircularProgress />
          )}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
          <Button
            onClick={() => setIsOperatorPayDialogOpen(false)}
            color="inherit"
            variant="outlined"
            disabled={actionLoading}
          >
            Cancel
          </Button>
            <Button 
            onClick={handleConfirmOperatorPayment}
            color="primary"
              variant="contained" 
            disabled={actionLoading || !selectedPaymentId}
            startIcon={
              actionLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />
            }
          >
            {actionLoading ? 'Processing...' : 'Confirm Operator Paid'}
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 
