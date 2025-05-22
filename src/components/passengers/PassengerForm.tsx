'use client';

import { useState } from 'react';
import { PassengerFormData } from '@/types/passenger';
import { usePassengerManagement } from '@/hooks/usePassengers';
import {
  Box,
  TextField,
  Grid,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, subYears, addYears } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface PassengerFormProps {
  bookingId: string;
  userCode: string;
  initialData?: Partial<PassengerFormData>;
  passengerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const initialFormState: PassengerFormData = {
  firstName: '',
  lastName: '',
  dateOfBirth: subYears(new Date(), 30), // Default to 30 years ago
  nationality: '',
  passportNumber: '',
  passportExpiry: addYears(new Date(), 5), // Default to 5 years from now
  specialRequirements: '',
  contactEmail: '',
  contactPhone: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

const nationalityOptions = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' },
  { value: 'IT', label: 'Italy' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'IN', label: 'India' },
  { value: 'BR', label: 'Brazil' },
  { value: 'RU', label: 'Russia' },
  // Add more countries as needed
];

export default function PassengerForm({
  bookingId,
  userCode,
  initialData,
  passengerId,
  onSuccess,
  onCancel,
}: PassengerFormProps) {
  const [formData, setFormData] = useState<PassengerFormData>({
    ...initialFormState,
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { createPassenger, updatePassenger, loading, error, success } = usePassengerManagement();

  const handleChange = (field: keyof PassengerFormData, value: any) => {
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
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.nationality) newErrors.nationality = 'Nationality is required';
    if (!formData.passportNumber) newErrors.passportNumber = 'Passport number is required';
    if (!formData.passportExpiry) newErrors.passportExpiry = 'Passport expiry date is required';
    if (!formData.contactEmail) newErrors.contactEmail = 'Contact email is required';
    if (!formData.contactPhone) newErrors.contactPhone = 'Contact phone is required';

    // Email format validation
    if (formData.contactEmail && !/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
    }

    // Passport expiry must be in the future
    if (formData.passportExpiry && formData.passportExpiry < new Date()) {
      newErrors.passportExpiry = 'Passport must have a future expiry date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (passengerId) {
        // Update existing passenger
        await updatePassenger(passengerId, formData);
      } else {
        // Create new passenger
        await createPassenger(bookingId, userCode, formData);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error submitting passenger form:', err);
    }
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
          Passenger information {passengerId ? 'updated' : 'added'} successfully!
        </Alert>
      )}
      <Typography variant="h6" gutterBottom>
        {passengerId ? 'Edit Passenger Details' : 'Add New Passenger'}
      </Typography>
      <Grid container spacing={2}>
        {/* Personal Information */}
        <Grid size={12}>
          <Typography variant="subtitle1" fontWeight="medium">
            Personal Information
          </Typography>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <TextField
            required
            fullWidth
            id="firstName"
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            error={!!errors.firstName}
            helperText={errors.firstName}
            disabled={loading}
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <TextField
            required
            fullWidth
            id="lastName"
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            error={!!errors.lastName}
            helperText={errors.lastName}
            disabled={loading}
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date of Birth"
              value={formData.dateOfBirth}
              onChange={(date) => handleChange('dateOfBirth', date)}
              disableFuture
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.dateOfBirth,
                  helperText: errors.dateOfBirth,
                },
              }}
              disabled={loading}
            />
          </LocalizationProvider>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <FormControl fullWidth required error={!!errors.nationality} disabled={loading}>
            <InputLabel id="nationality-label">Nationality</InputLabel>
            <Select
              labelId="nationality-label"
              id="nationality"
              value={formData.nationality}
              label="Nationality"
              onChange={(e) => handleChange('nationality', e.target.value)}
            >
              {nationalityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {errors.nationality && <FormHelperText>{errors.nationality}</FormHelperText>}
          </FormControl>
        </Grid>

        {/* Travel Document Information */}
        <Grid sx={{ mt: 2 }} size={12}>
          <Typography variant="subtitle1" fontWeight="medium">
            Travel Document Information
          </Typography>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <TextField
            required
            fullWidth
            id="passportNumber"
            label="Passport Number"
            name="passportNumber"
            value={formData.passportNumber}
            onChange={(e) => handleChange('passportNumber', e.target.value)}
            error={!!errors.passportNumber}
            helperText={errors.passportNumber}
            disabled={loading}
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Passport Expiry Date"
              value={formData.passportExpiry}
              onChange={(date) => handleChange('passportExpiry', date)}
              disablePast
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.passportExpiry,
                  helperText: errors.passportExpiry,
                },
              }}
              disabled={loading}
            />
          </LocalizationProvider>
        </Grid>

        {/* Contact Information */}
        <Grid sx={{ mt: 2 }} size={12}>
          <Typography variant="subtitle1" fontWeight="medium">
            Contact Information
          </Typography>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <TextField
            required
            fullWidth
            id="contactEmail"
            label="Email Address"
            name="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => handleChange('contactEmail', e.target.value)}
            error={!!errors.contactEmail}
            helperText={errors.contactEmail}
            disabled={loading}
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <TextField
            required
            fullWidth
            id="contactPhone"
            label="Phone Number"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={(e) => handleChange('contactPhone', e.target.value)}
            error={!!errors.contactPhone}
            helperText={errors.contactPhone}
            disabled={loading}
          />
        </Grid>

        {/* Emergency Contact */}
        <Grid sx={{ mt: 2 }} size={12}>
          <Typography variant="subtitle1" fontWeight="medium">
            Emergency Contact (Optional)
          </Typography>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <TextField
            fullWidth
            id="emergencyContactName"
            label="Emergency Contact Name"
            name="emergencyContactName"
            value={formData.emergencyContactName || ''}
            onChange={(e) => handleChange('emergencyContactName', e.target.value)}
            disabled={loading}
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <TextField
            fullWidth
            id="emergencyContactPhone"
            label="Emergency Contact Phone"
            name="emergencyContactPhone"
            value={formData.emergencyContactPhone || ''}
            onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
            disabled={loading}
          />
        </Grid>

        {/* Special Requirements */}
        <Grid sx={{ mt: 2 }} size={12}>
          <Typography variant="subtitle1" fontWeight="medium">
            Additional Information
          </Typography>
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            id="specialRequirements"
            label="Special Requirements or Notes"
            name="specialRequirements"
            multiline
            rows={3}
            value={formData.specialRequirements || ''}
            onChange={(e) => handleChange('specialRequirements', e.target.value)}
            disabled={loading}
          />
        </Grid>

        {/* Form Actions */}
        <Grid
          sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}
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
            disabled={loading}
            sx={{ minWidth: '120px' }}
          >
            {loading ? <CircularProgress size={24} /> : passengerId ? 'Update' : 'Add Passenger'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
