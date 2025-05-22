'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useClientDetail, useClientUpdate } from '@/hooks/useClients';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
} from '@mui/material';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

// Form validation schema (same as add client page)
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

export default function EditClientPage() {
  const { id } = useParams();
  const clientId = Array.isArray(id) ? id[0] : id;
  const { user, userRole } = useAuth();
  const router = useRouter();
  const { client, loading: clientLoading, error: clientError } = useClientDetail(clientId);
  const { updateClient, loading: updateLoading, error: updateError, success } = useClientUpdate();
  const [formInitialized, setFormInitialized] = useState(false);

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

  // Client type for conditional rendering
  const clientType = watch('clientType');

  // Set form default values when client data is loaded
  useEffect(() => {
    if (client && !formInitialized) {
      reset({
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone || '',
        company: client.company || '',
        notes: client.notes || '',
        preferredAirport: client.preferredAirport || '',
        clientType: client.clientType,
      });
      setFormInitialized(true);
    }
  }, [client, reset, formInitialized]);

  // Redirect on successful update
  useEffect(() => {
    if (success) {
      router.push(`/dashboard/clients/${clientId}`);
    }
  }, [success, router, clientId]);

  const onSubmit = async (data: ClientFormData) => {
    if (!client) return;
    await updateClient(client.id, data);
  };

  // Check if user is authorized
  if (userRole !== 'agent' && userRole !== 'admin' && userRole !== 'superAdmin') {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          You are not authorized to access this page. Only agents and admins can edit clients.
        </Alert>
      </Box>
    );
  }

  if (clientLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (clientError) {
    return (
      <Alert severity="error" sx={{ my: 4 }}>
        {clientError}
      </Alert>
    );
  }

  if (!client) {
    return (
      <Alert severity="info" sx={{ my: 4 }}>
        Client not found. The client may have been deleted or you don't have permission to edit it.
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main">
          Edit Client
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/dashboard/clients/${clientId}`)}
        >
          Cancel
        </Button>
      </Box>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Client ID: {client.clientId}
          </Typography>
          <Divider />
        </Box>

        {updateError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {updateError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* @ts-ignore MUI Grid type inference issue with 'item' prop */}
            <Grid size={12}>
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

            {/* @ts-ignore MUI Grid type inference issue with 'item' prop */}
            <Grid
              size={{
                xs: 12,
                sm: 6
              }}>
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

            {/* @ts-ignore MUI Grid type inference issue with 'item' prop */}
            <Grid
              size={{
                xs: 12,
                sm: 6
              }}>
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

            {/* @ts-ignore MUI Grid type inference issue with 'item' prop */}
            <Grid size={12}>
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

            {/* @ts-ignore MUI Grid type inference issue with 'item' prop */}
            <Grid size={12}>
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
              /* @ts-ignore MUI Grid type inference issue with 'item' prop */
              (<Grid size={12}>
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
              </Grid>)
            )}

            {/* @ts-ignore MUI Grid type inference issue with 'item' prop */}
            <Grid size={12}>
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

            {/* @ts-ignore MUI Grid type inference issue with 'item' prop */}
            <Grid size={12}>
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

            {/* @ts-ignore MUI Grid type inference issue with 'item' prop */}
            <Grid sx={{ mt: 2 }} size={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => router.push(`/dashboard/clients/${clientId}`)}
                  disabled={updateLoading}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={updateLoading || !isValid || !isDirty}
                  startIcon={
                    updateLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />
                  }
                >
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
