'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Alert,
  AlertTitle,
  CircularProgress,
  InputAdornment,
  Card,
  CardContent,
  Stack,
  Chip,
  FormHelperText,
} from '@mui/material';
import {
  FlightTakeoff,
  FlightLand,
  AccessTime,
  People,
  Money,
  LocalOffer,
  AirplanemodeActive,
  Send,
  Calculate,
  Edit,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { addDays } from 'date-fns';

// Define the schema for form validation
const quoteResponseSchema = z.object({
  basePrice: z.number().min(1, 'Base price is required'),
  operatorQuoteNumber: z.string().optional(),
  charterFee: z.number().min(0, 'Charter fee must be a positive number'),
  totalPrice: z.number().min(1, 'Total price is required'),
  aircraft: z.string().min(1, 'Aircraft is required'),
  availabilityStart: z.date(),
  availabilityEnd: z.date(),
  validUntil: z.date(),
  notes: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

type QuoteResponseForm = z.infer<typeof quoteResponseSchema>;

// Mock data for a quote request
const mockQuoteRequest = {
  id: 'req1',
  requestCode: 'QR-PA-SMIT-20230601-1234',
  clientName: 'John Smith',
  clientType: 'passenger',
  departureAirport: 'FAJS',
  arrivalAirport: 'FACT',
  departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  returnDate: null, // One-way flight
  flexibleDates: false,
  passengerCount: 4,
  cabinClass: 'premium',
  specialRequirements: 'Need extra luggage space for golf equipment',
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
};

// Mock data for operator's aircraft
const mockAircraft = [
  {
    id: 'aircraft1',
    registration: 'ZS-ABC',
    type: 'LIGHT_JET',
    status: 'ACTIVE',
    make: 'CESSNA',
    model: 'CITATION XLS',
    maxPassengers: 8,
  },
  {
    id: 'aircraft2',
    registration: 'ZS-XYZ',
    type: 'MIDSIZE_JET',
    status: 'ACTIVE',
    make: 'BOMBARDIER',
    model: 'CHALLENGER 350',
    maxPassengers: 10,
  },
];

interface QuoteResponseFormProps {
  quoteRequestId: string;
  onSubmitSuccess?: () => void;
}

export default function QuoteResponseForm({
  quoteRequestId,
  onSubmitSuccess,
}: QuoteResponseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [quoteRequest, setQuoteRequest] = useState(mockQuoteRequest);
  const [aircraft, setAircraft] = useState(mockAircraft);

  // Initialize the form with react-hook-form and zod validation
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuoteResponseForm>({
    resolver: zodResolver(quoteResponseSchema),
    defaultValues: {
      basePrice: 0,
      charterFee: 0,
      totalPrice: 0,
      aircraft: '',
      availabilityStart: quoteRequest.departureDate,
      availabilityEnd: quoteRequest.departureDate,
      validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Valid for 3 days
      notes: '',
      termsAccepted: false,
    },
  });

  // Watch form values for calculations
  const basePrice = watch('basePrice');
  const selectedAircraft = watch('aircraft');

  // Calculate charter fee and total price (3% of base price)
  const calculatePrices = () => {
    setCalculatingPrice(true);
    setTimeout(() => {
      if (basePrice) {
        const charterFee = basePrice * 0.03;
        const totalPrice = basePrice + charterFee;
        setValue('charterFee', Math.round(charterFee * 100) / 100);
        setValue('totalPrice', Math.round(totalPrice * 100) / 100);
      }
      setCalculatingPrice(false);
    }, 500);
  };

  // Handle form submission
  const onSubmit = (data: QuoteResponseForm) => {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      console.log('Quote response submitted:', data);
      setIsSubmitting(false);
      setShowSuccessMessage(true);

      // Call the success callback if provided
      if (onSubmitSuccess) {
        setTimeout(() => {
          onSubmitSuccess();
        }, 2000);
      }
    }, 1500);
  };

  return (
    <Box>
      {showSuccessMessage ? (
        <Alert
          severity="success"
          sx={{ mb: 4, p: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setShowSuccessMessage(false)}>
              CLOSE
            </Button>
          }
        >
          <AlertTitle>Quote submitted successfully!</AlertTitle>
          Your quote response has been sent to the client. You will be notified when they respond.
        </Alert>
      ) : (
        <>
          {/* Quote request details */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h5" fontWeight="bold">
                    Quote Request
                  </Typography>
                  <Chip label={quoteRequest.requestCode} color="primary" variant="outlined" />
                </Box>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <FlightTakeoff color="primary" sx={{ mr: 1, mt: 0.5 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Departure
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {quoteRequest.departureAirport}
                      </Typography>
                      <Typography variant="body2">
                        {format(quoteRequest.departureDate, 'dd MMM yyyy')}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <FlightLand color="primary" sx={{ mr: 1, mt: 0.5 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Arrival
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {quoteRequest.arrivalAirport}
                      </Typography>
                      {quoteRequest.returnDate && (
                        <Typography variant="body2">
                          Return: {format(quoteRequest.returnDate, 'dd MMM yyyy')}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <People color="primary" sx={{ mr: 1, mt: 0.5 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Passengers
                      </Typography>
                      <Typography variant="body1">
                        {quoteRequest.passengerCount} passengers
                      </Typography>
                      <Typography variant="body2">
                        {quoteRequest.cabinClass.charAt(0).toUpperCase() +
                          quoteRequest.cabinClass.slice(1)}{' '}
                        class
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}>
                <Card variant="outlined" sx={{ height: '100%', bgcolor: 'background.paper' }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Special Requirements
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {quoteRequest.specialRequirements || 'No special requirements'}
                    </Typography>

                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Client Information
                    </Typography>
                    <Typography variant="body2">
                      <strong>Name:</strong> {quoteRequest.clientName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Type:</strong> {quoteRequest.clientType}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Request received: {format(quoteRequest.createdAt, 'dd MMM yyyy HH:mm')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Quote response form */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Your Quote Response
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <FormControl fullWidth error={!!errors.aircraft}>
                    <InputLabel id="aircraft-label">Select Aircraft</InputLabel>
                    <Controller
                      name="aircraft"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          labelId="aircraft-label"
                          label="Select Aircraft"
                          startAdornment={
                            <InputAdornment position="start">
                              <AirplanemodeActive />
                            </InputAdornment>
                          }
                        >
                          <MenuItem value="" disabled>
                            <em>Select an aircraft</em>
                          </MenuItem>
                          {aircraft
                            .filter((a) => a.maxPassengers >= quoteRequest.passengerCount)
                            .map((a) => (
                              <MenuItem key={a.id} value={a.id}>
                                {a.registration} - {a.make} {a.model} ({a.maxPassengers} pax)
                              </MenuItem>
                            ))}
                        </Select>
                      )}
                    />
                    {errors.aircraft && (
                      <FormHelperText error>{errors.aircraft.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <Controller
                    name="operatorQuoteNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Your Quote Reference (Optional)"
                        fullWidth
                        placeholder="Your internal reference number"
                        helperText="For your own reference tracking"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocalOffer fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 4
                  }}>
                  <Controller
                    name="basePrice"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Base Price (ZAR)"
                        type="number"
                        fullWidth
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : 0;
                          field.onChange(value);
                        }}
                        error={!!errors.basePrice}
                        helperText={errors.basePrice?.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Money fontSize="small" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button
                                onClick={calculatePrices}
                                disabled={!basePrice || calculatingPrice}
                                sx={{ minWidth: 32, p: 0.5 }}
                                color="primary"
                              >
                                {calculatingPrice ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <Calculate fontSize="small" />
                                )}
                              </Button>
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 4
                  }}>
                  <Controller
                    name="charterFee"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Charter Fee (3%)"
                        type="number"
                        fullWidth
                        disabled
                        value={field.value || ''}
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              <Money fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 4
                  }}>
                  <Controller
                    name="totalPrice"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Total Price"
                        type="number"
                        fullWidth
                        disabled
                        value={field.value || ''}
                        error={!!errors.totalPrice}
                        helperText={errors.totalPrice?.message}
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              <Money fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 4
                  }}>
                  <Controller
                    name="availabilityStart"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Available From"
                        value={field.value}
                        onChange={field.onChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.availabilityStart,
                            helperText: errors.availabilityStart?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 4
                  }}>
                  <Controller
                    name="availabilityEnd"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Available Until"
                        value={field.value}
                        onChange={field.onChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.availabilityEnd,
                            helperText: errors.availabilityEnd?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    md: 4
                  }}>
                  <Controller
                    name="validUntil"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Quote Valid Until"
                        value={field.value}
                        onChange={field.onChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.validUntil,
                            helperText: errors.validUntil?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={12}>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Additional Notes"
                        multiline
                        rows={4}
                        fullWidth
                        placeholder="Add any additional information, terms or conditions for this quote"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Edit fontSize="small" sx={{ mt: -3 }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={12}>
                  <Controller
                    name="termsAccepted"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label={
                          <Typography variant="body2">
                            I confirm that this aircraft is available for the specified dates and
                            all pricing is accurate. I understand that Charter will add a 3% service
                            fee to my base price.
                          </Typography>
                        }
                      />
                    )}
                  />
                  {errors.termsAccepted && (
                    <FormHelperText error>{errors.termsAccepted.message}</FormHelperText>
                  )}
                </Grid>

                <Grid size={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="outlined" color="inherit">
                      Save as Draft
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      disabled={isSubmitting}
                      startIcon={isSubmitting ? <CircularProgress size={20} /> : <Send />}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Quote'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </>
      )}
    </Box>
  );
}
