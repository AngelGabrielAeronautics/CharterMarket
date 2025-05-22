'use client';

import { useState } from 'react';
import { PaymentFormData } from '@/types/payment';
import { usePaymentManagement } from '@/hooks/usePayments';
import {
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface PaymentFormProps {
  bookingId: string;
  invoiceId: string;
  amount: number;
  onSuccess?: (paymentId: string) => void;
  onCancel?: () => void;
}

const initialFormState: PaymentFormData = {
  amount: 0,
  paymentMethod: '',
  paymentReference: '',
  notes: '',
  paymentDate: new Date(),
};

const paymentMethods = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'wire_transfer', label: 'Wire Transfer' },
  { value: 'paypal', label: 'PayPal' },
];

export default function PaymentForm({
  bookingId,
  invoiceId,
  amount,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    ...initialFormState,
    amount, // Use the amount from props
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { createPayment, loading, error, success } = usePaymentManagement();

  const handleChange = (field: keyof PaymentFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear validation error on field change
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';
    if (!formData.paymentDate) newErrors.paymentDate = 'Payment date is required';

    // Additional field validations based on payment method
    if (formData.paymentMethod === 'bank_transfer' || formData.paymentMethod === 'wire_transfer') {
      if (!formData.paymentReference)
        newErrors.paymentReference = 'Reference/confirmation number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await createPayment(bookingId, invoiceId, formData);

    if (result && onSuccess) {
      onSuccess(result);
    }
  };

  // Display bank transfer instructions based on the selected payment method
  const renderPaymentInstructions = () => {
    if (formData.paymentMethod === 'bank_transfer' || formData.paymentMethod === 'wire_transfer') {
      return (
        <Paper variant="outlined" sx={{ p: 2, mt: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            Bank Transfer Instructions
          </Typography>
          <Typography variant="body2" paragraph>
            Please transfer the exact amount to the following bank account:
          </Typography>
          <Box sx={{ my: 2 }}>
            <Typography variant="body2">
              <strong>Bank Name:</strong> Charter Aviation Bank
            </Typography>
            <Typography variant="body2">
              <strong>Account Name:</strong> Charter Aviation Ltd.
            </Typography>
            <Typography variant="body2">
              <strong>Account Number:</strong> 12345678
            </Typography>
            <Typography variant="body2">
              <strong>Sort Code:</strong> 12-34-56
            </Typography>
            <Typography variant="body2">
              <strong>SWIFT/BIC:</strong> CHAVABC123
            </Typography>
            <Typography variant="body2">
              <strong>IBAN:</strong> GB12CHAV12345612345678
            </Typography>
            <Typography variant="body2">
              <strong>Reference:</strong> {bookingId}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Please include your booking ID as the payment reference. After making the payment, enter
            the payment details below and submit the form.
          </Typography>
        </Paper>
      );
    } else if (formData.paymentMethod === 'paypal') {
      return (
        <Paper variant="outlined" sx={{ p: 2, mt: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            PayPal Payment Instructions
          </Typography>
          <Typography variant="body2" paragraph>
            Please send the payment to the following PayPal account:
          </Typography>
          <Box sx={{ my: 2 }}>
            <Typography variant="body2">
              <strong>PayPal Email:</strong> payments@charter-aviation.com
            </Typography>
            <Typography variant="body2">
              <strong>Reference:</strong> {bookingId}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            After making the payment, please enter the PayPal transaction ID in the reference field
            below.
          </Typography>
        </Paper>
      );
    }

    return null;
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Payment information submitted successfully! Our team will verify your payment.
        </Alert>
      )}
      <Typography variant="h6" gutterBottom>
        Payment Information
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Please provide details about your payment. Our team will verify the payment and update your
        booking status.
      </Typography>
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            required
            fullWidth
            id="amount"
            label="Amount"
            name="amount"
            value={formData.amount}
            InputProps={{
              readOnly: true,
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            disabled
          />
        </Grid>

        <Grid size={12}>
          <FormControl fullWidth required error={!!errors.paymentMethod} disabled={loading}>
            <InputLabel id="payment-method-label">Payment Method</InputLabel>
            <Select
              labelId="payment-method-label"
              id="paymentMethod"
              value={formData.paymentMethod}
              label="Payment Method"
              onChange={(e) => handleChange('paymentMethod', e.target.value)}
            >
              {paymentMethods.map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  {method.label}
                </MenuItem>
              ))}
            </Select>
            {errors.paymentMethod && <FormHelperText>{errors.paymentMethod}</FormHelperText>}
          </FormControl>
        </Grid>

        {renderPaymentInstructions()}

        <Grid
          size={{
            xs: 12,
            md: formData.paymentMethod ? 6 : 12
          }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Payment Date"
              value={formData.paymentDate}
              onChange={(date) => handleChange('paymentDate', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.paymentDate,
                  helperText: errors.paymentDate,
                },
              }}
              disabled={loading}
            />
          </LocalizationProvider>
        </Grid>

        {formData.paymentMethod && (
          <Grid
            size={{
              xs: 12,
              md: 6
            }}>
            <TextField
              fullWidth
              id="paymentReference"
              label={
                formData.paymentMethod === 'paypal'
                  ? 'PayPal Transaction ID'
                  : 'Payment Reference Number'
              }
              name="paymentReference"
              value={formData.paymentReference || ''}
              onChange={(e) => handleChange('paymentReference', e.target.value)}
              error={!!errors.paymentReference}
              helperText={errors.paymentReference}
              required={
                formData.paymentMethod === 'bank_transfer' ||
                formData.paymentMethod === 'wire_transfer' ||
                formData.paymentMethod === 'paypal'
              }
              disabled={loading}
            />
          </Grid>
        )}

        <Grid size={12}>
          <TextField
            fullWidth
            id="notes"
            label="Additional Notes"
            name="notes"
            multiline
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            disabled={loading}
            placeholder="Please provide any additional information about your payment"
          />
        </Grid>

        <Grid sx={{ mt: 2 }} size={12}>
          <Divider />
        </Grid>

        <Grid
          sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}
          size={12}>
          {onCancel && (
            <Button variant="outlined" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || success}
            sx={{ minWidth: '120px' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit Payment'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
