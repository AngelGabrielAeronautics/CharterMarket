'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  Snackbar,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import toast from 'react-hot-toast';

// Form validation schema
const clientSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number is too short').optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  preferredAirport: z.string().optional().or(z.literal('')),
  clientType: z.enum(['individual', 'corporate']),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function AddClientPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid, isDirty },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      notes: '',
      preferredAirport: '',
      clientType: 'individual',
    },
    mode: 'onChange',
  });

  const clientType = watch('clientType');

  const onSubmit = async (data: ClientFormData) => {
    if (!user?.userCode) {
      setSubmitError('You must be logged in to add a client');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // This would be a real API call in production
      // const response = await fetch('/api/clients', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     ...data,
      //     agentUserCode: user.userCode
      //   }),
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Failed to add client');
      // }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Client added successfully');
      reset();

      // Redirect to client list
      router.push('/dashboard/clients');
    } catch (error) {
      console.error('Error adding client:', error);
      setSubmitError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user is authorized (agent or admin)
  if (userRole !== 'agent' && userRole !== 'admin' && userRole !== 'superAdmin') {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          You are not authorized to access this page. Only agents and admins can manage clients.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main">
          Add New Client
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/dashboard/clients')}
        >
          Back to Clients
        </Button>
      </Box>

      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="client-type-label">Client Type</InputLabel>
                <Controller
                  name="clientType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      labelId="client-type-label"
                      label="Client Type"
                      error={!!errors.clientType}
                    >
                      <MenuItem value="individual">Individual</MenuItem>
                      <MenuItem value="corporate">Corporate</MenuItem>
                    </Select>
                  )}
                />
                {errors.clientType && (
                  <FormHelperText error>{errors.clientType.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First Name"
                    variant="outlined"
                    fullWidth
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Last Name"
                    variant="outlined"
                    fullWidth
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email Address"
                    variant="outlined"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    required
                    type="email"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone Number"
                    variant="outlined"
                    fullWidth
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    placeholder="+27 XX XXX XXXX"
                  />
                )}
              />
            </Grid>

            {clientType === 'corporate' && (
              <Grid item xs={12}>
                <Controller
                  name="company"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Company Name"
                      variant="outlined"
                      fullWidth
                      error={!!errors.company}
                      helperText={errors.company?.message}
                      required={clientType === 'corporate'}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Controller
                name="preferredAirport"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Preferred Airport (ICAO code)"
                    variant="outlined"
                    fullWidth
                    error={!!errors.preferredAirport}
                    helperText={errors.preferredAirport?.message}
                    placeholder="e.g. FAJS (Johannesburg)"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Client Notes"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={4}
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                    placeholder="Special requirements, preferences, etc."
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => reset()}
                  disabled={isSubmitting || !isDirty}
                >
                  Reset Form
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting || !isValid}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <PersonAddIcon />
                    )
                  }
                >
                  {isSubmitting ? 'Adding Client...' : 'Add Client'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
