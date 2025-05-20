'use client';

import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { format, addDays, subDays } from 'date-fns';

// Mock data for pending payments
const mockPendingPayments = [
  {
    id: 'payment1',
    flightCode: 'FLT-OP-JETS-20230601-1234',
    invoiceNumber: 'INV-FLT-OP-JETS-20230601-12345678',
    client: 'John Smith',
    operator: 'Luxury Jets',
    amount: 75000,
    dueDate: addDays(new Date(), 3),
    status: 'pending',
    paymentMethod: 'bank_transfer',
    notes: 'Client has confirmed payment will be made by Friday',
  },
  {
    id: 'payment2',
    flightCode: 'FLT-OP-AIRS-20230603-5678',
    invoiceNumber: 'INV-FLT-OP-AIRS-20230603-87654321',
    client: 'ABC Travel Agency',
    operator: 'AirStar Executive',
    amount: 125000,
    dueDate: addDays(new Date(), 1),
    status: 'pending',
    paymentMethod: 'credit_card',
    notes: null,
  },
  {
    id: 'payment3',
    flightCode: 'FLT-OP-ELIT-20230605-9012',
    invoiceNumber: 'INV-FLT-OP-ELIT-20230605-56781234',
    client: 'Luxury Travels',
    operator: 'Elite Air',
    amount: 95000,
    dueDate: subDays(new Date(), 1),
    status: 'overdue',
    paymentMethod: 'bank_transfer',
    notes: 'Payment follow-up email sent',
  },
];

// Mock data for recent payments
const mockCompletedPayments = [
  {
    id: 'payment4',
    flightCode: 'FLT-OP-JETS-20230530-3456',
    invoiceNumber: 'INV-FLT-OP-JETS-20230530-98765432',
    client: 'Michael Brown',
    operator: 'Luxury Jets',
    amount: 56000,
    paidDate: subDays(new Date(), 2),
    status: 'paid',
    paymentMethod: 'bank_transfer',
    verifiedBy: 'Admin User',
    operatorPaid: true,
    operatorPaymentDate: subDays(new Date(), 1),
  },
  {
    id: 'payment5',
    flightCode: 'FLT-OP-AIRS-20230525-7890',
    invoiceNumber: 'INV-FLT-OP-AIRS-20230525-43218765',
    client: 'Sarah Johnson',
    operator: 'AirStar Executive',
    amount: 110000,
    paidDate: subDays(new Date(), 4),
    status: 'paid',
    paymentMethod: 'credit_card',
    verifiedBy: 'Admin User',
    operatorPaid: false,
    operatorPaymentDate: null,
  },
];

export default function PaymentVerification() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isOperatorPayDialogOpen, setIsOperatorPayDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter payments based on search query and active tab
  const filteredPendingPayments = mockPendingPayments.filter(
    (payment) =>
      payment.flightCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.operator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompletedPayments = mockCompletedPayments.filter(
    (payment) =>
      payment.flightCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.operator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVerifyPayment = (paymentId: string) => {
    setSelectedPayment(paymentId);
    setIsVerifyDialogOpen(true);
  };

  const handleMarkOperatorPaid = (paymentId: string) => {
    setSelectedPayment(paymentId);
    setIsOperatorPayDialogOpen(true);
  };

  const handleConfirmVerification = () => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsVerifyDialogOpen(false);
      setSelectedPayment(null);
      setVerificationNotes('');
      // In a real app, we would update the payment status
    }, 1500);
  };

  const handleConfirmOperatorPayment = () => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsOperatorPayDialogOpen(false);
      setSelectedPayment(null);
      // In a real app, we would update the operator payment status
    }, 1500);
  };

  const getPaymentDetails = (paymentId: string | null) => {
    if (!paymentId) return null;

    return [...mockPendingPayments, ...mockCompletedPayments].find(
      (payment) => payment.id === paymentId
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const paymentDetails = getPaymentDetails(selectedPayment);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Payment Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Verify client payments and manage operator payouts
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Payment Stats Summary */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={3}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'success.main' }}>
                    R
                    {mockCompletedPayments
                      .reduce((total, payment) => total + payment.amount, 0)
                      .toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Payments Received
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'warning.main' }}>
                    R
                    {mockPendingPayments
                      .filter((p) => p.status === 'pending')
                      .reduce((total, payment) => total + payment.amount, 0)
                      .toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Payments
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'error.main' }}>
                    R
                    {mockPendingPayments
                      .filter((p) => p.status === 'overdue')
                      .reduce((total, payment) => total + payment.amount, 0)
                      .toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overdue Payments
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'info.main' }}>
                    R
                    {mockCompletedPayments
                      .filter((p) => !p.operatorPaid)
                      .reduce((total, payment) => total + payment.amount * 0.97, 0)
                      .toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Due to Operators
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Payment Tables */}
        <Grid item xs={12}>
          <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: 'background.default' }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  textColor="primary"
                  indicatorColor="primary"
                >
                  <Tab
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box component="span">Pending</Box>
                        <Chip
                          label={mockPendingPayments.length}
                          size="small"
                          color="warning"
                          sx={{ ml: 1, height: 20, minWidth: 20 }}
                        />
                      </Box>
                    }
                  />
                  <Tab
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box component="span">Completed</Box>
                        <Chip
                          label={mockCompletedPayments.length}
                          size="small"
                          color="success"
                          sx={{ ml: 1, height: 20, minWidth: 20 }}
                        />
                      </Box>
                    }
                  />
                  <Tab
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box component="span">Operator Payouts</Box>
                        <Chip
                          label={mockCompletedPayments.filter((p) => !p.operatorPaid).length}
                          size="small"
                          color="info"
                          sx={{ ml: 1, height: 20, minWidth: 20 }}
                        />
                      </Box>
                    }
                  />
                </Tabs>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    placeholder="Search payments..."
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button variant="outlined" startIcon={<FilterIcon />} size="small">
                    Filter
                  </Button>
                </Box>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Flight / Invoice</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Operator</TableCell>
                    <TableCell>Amount</TableCell>
                    {tabValue === 0 ? (
                      <TableCell>Due Date</TableCell>
                    ) : (
                      <TableCell>Paid Date</TableCell>
                    )}
                    <TableCell>Status</TableCell>
                    {tabValue === 2 && <TableCell>Charter Fee</TableCell>}
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Render different content based on active tab */}
                  {tabValue === 0 ? (
                    // Pending payments
                    filteredPendingPayments.length > 0 ? (
                      filteredPendingPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {payment.flightCode}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {payment.invoiceNumber}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{payment.client}</TableCell>
                          <TableCell>{payment.operator}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              R{payment.amount.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2">
                                {format(payment.dueDate, 'dd MMM yyyy')}
                              </Typography>
                              {payment.status === 'overdue' && (
                                <Chip
                                  label="Overdue"
                                  color="error"
                                  size="small"
                                  sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                payment.status.charAt(0).toUpperCase() + payment.status.slice(1)
                              }
                              color={getStatusColor(payment.status) as any}
                              size="small"
                              icon={
                                payment.status === 'pending' ? (
                                  <RefreshIcon fontSize="small" />
                                ) : (
                                  <WarningIcon fontSize="small" />
                                )
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Tooltip title="Verify Payment">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleVerifyPayment(payment.id)}
                                  sx={{ mr: 0.5 }}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="View Invoice">
                                <IconButton size="small" sx={{ mr: 0.5 }}>
                                  <ReceiptIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Send Reminder">
                                <IconButton size="small" color="primary">
                                  <SendIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">No pending payments found</Typography>
                        </TableCell>
                      </TableRow>
                    )
                  ) : tabValue === 1 ? (
                    // Completed payments
                    filteredCompletedPayments.length > 0 ? (
                      filteredCompletedPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {payment.flightCode}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {payment.invoiceNumber}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{payment.client}</TableCell>
                          <TableCell>{payment.operator}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              R{payment.amount.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>{format(payment.paidDate, 'dd MMM yyyy')}</TableCell>
                          <TableCell>
                            <Chip
                              label="Paid"
                              color="success"
                              size="small"
                              icon={<CheckCircleIcon fontSize="small" />}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Tooltip title="View Invoice">
                                <IconButton size="small" sx={{ mr: 0.5 }}>
                                  <ReceiptIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip
                                title={
                                  payment.operatorPaid ? 'Operator Paid' : 'Mark Operator Paid'
                                }
                              >
                                <IconButton
                                  size="small"
                                  color={payment.operatorPaid ? 'success' : 'primary'}
                                  onClick={() =>
                                    !payment.operatorPaid && handleMarkOperatorPaid(payment.id)
                                  }
                                  disabled={payment.operatorPaid}
                                >
                                  <MoneyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            No completed payments found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
                  ) : // Operator payouts
                  filteredCompletedPayments.filter((p) => !p.operatorPaid).length > 0 ? (
                    filteredCompletedPayments
                      .filter((p) => !p.operatorPaid)
                      .map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {payment.flightCode}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {payment.invoiceNumber}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{payment.client}</TableCell>
                          <TableCell>{payment.operator}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              R{payment.amount.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>{format(payment.paidDate, 'dd MMM yyyy')}</TableCell>
                          <TableCell>
                            <Chip label="Due to Operator" color="info" size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium" color="success.main">
                              R{Math.round(payment.amount * 0.03).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<MoneyIcon />}
                              onClick={() => handleMarkOperatorPaid(payment.id)}
                            >
                              Mark Paid
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">No pending operator payouts</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Verify Payment Dialog */}
      <Dialog
        open={isVerifyDialogOpen}
        onClose={() => setIsVerifyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Verify Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Please confirm that you have received payment for this flight.
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Flight Code
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {paymentDetails?.flightCode}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Invoice Number
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {paymentDetails?.invoiceNumber}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Client
                </Typography>
                <Typography variant="body1">{paymentDetails?.client}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Amount
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  R{paymentDetails?.amount.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Payment Method
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup defaultValue="bank_transfer" row>
                    <FormControlLabel
                      value="bank_transfer"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BankIcon fontSize="small" sx={{ mr: 0.5 }} />
                          <span>Bank Transfer</span>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="credit_card"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CardIcon fontSize="small" sx={{ mr: 0.5 }} />
                          <span>Credit Card</span>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Verification Notes"
                  multiline
                  rows={3}
                  fullWidth
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Enter any notes about this payment verification"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsVerifyDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmVerification}
            variant="contained"
            color="success"
            disabled={isLoading}
            startIcon={
              isLoading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />
            }
          >
            {isLoading ? 'Processing...' : 'Confirm Payment'}
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
        <DialogTitle>Mark Operator Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Please confirm that you have paid the operator for this flight.
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Operator
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {paymentDetails?.operator}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Flight Code
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {paymentDetails?.flightCode}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Amount to Pay
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  R{paymentDetails ? Math.round(paymentDetails.amount * 0.97).toLocaleString() : 0}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Charter Fee (3%)
                </Typography>
                <Typography variant="body1" fontWeight="medium" color="success.main">
                  R{paymentDetails ? Math.round(paymentDetails.amount * 0.03).toLocaleString() : 0}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Payment Method
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup defaultValue="bank_transfer" row>
                    <FormControlLabel
                      value="bank_transfer"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BankIcon fontSize="small" sx={{ mr: 0.5 }} />
                          <span>Bank Transfer</span>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Payment Reference"
                  fullWidth
                  placeholder="Enter payment reference or transaction ID"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOperatorPayDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmOperatorPayment}
            variant="contained"
            color="primary"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <MoneyIcon />}
          >
            {isLoading ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
