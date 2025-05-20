'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  Description as DescriptionIcon,
  BusinessCenter as BusinessTypeIcon,
} from '@mui/icons-material';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Schema for company profile validation
const companyProfileSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  companyType: z.enum(['charter', 'broker', 'management', 'other']),
  businessType: z.enum(['commercial', 'private', 'both']),
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  companyAddress: z.string().min(5, 'Company address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().min(2, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  emailAddress: z.string().email('Valid email address is required'),
  website: z.string().url('Valid website URL is required').or(z.string().length(0)),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
  yearEstablished: z.coerce.number().min(1900).max(new Date().getFullYear()).optional(),
  numberOfEmployees: z.coerce.number().min(1).optional(),
  operatingLocations: z.string().optional(),
  certifications: z.string().optional(),
});

type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;

export default function CompanyProfilePage() {
  const { user, userRole, userData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyProfileFormData | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      companyName: '',
      companyType: 'charter' as const,
      businessType: 'commercial' as const,
      registrationNumber: '',
      vatNumber: '',
      companyAddress: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phoneNumber: '',
      emailAddress: '',
      website: '',
      description: '',
      yearEstablished: undefined,
      numberOfEmployees: undefined,
      operatingLocations: '',
      certifications: '',
    },
  });

  // Fetch company profile data
  useEffect(() => {
    async function fetchCompanyProfile() {
      if (!user || !userData) {
        setLoading(false);
        return;
      }

      try {
        const userCompanyRef = doc(db, 'companies', userData.companyId || 'not-found');
        const docSnap = await getDoc(userCompanyRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as CompanyProfileFormData;
          setCompanyData(data);
          reset(data);
        } else {
          // No company profile exists yet
          // Prefill company name from userData if available
          const defaultValues = {
            companyName: userData.company || '',
            companyType: 'charter',
            businessType: 'commercial',
            registrationNumber: '',
            vatNumber: '',
            companyAddress: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
            phoneNumber: userData.phoneNumber || '',
            emailAddress: userData.email || '',
            website: '',
            description: '',
            yearEstablished: undefined,
            numberOfEmployees: undefined,
            operatingLocations: '',
            certifications: '',
          };

          reset(defaultValues);
          setIsEditMode(true); // Auto-enable edit mode for new profiles
        }
      } catch (err) {
        console.error('Error fetching company profile:', err);
        setError('Failed to load company profile');
      } finally {
        setLoading(false);
      }
    }

    fetchCompanyProfile();
  }, [user, userData, reset]);

  // Redirect if not operator or agent
  useEffect(() => {
    if (userRole && !['operator', 'agent'].includes(userRole)) {
      router.push('/dashboard');
    }
  }, [userRole, router]);

  const onSubmit = async (data: CompanyProfileFormData) => {
    if (!user || !userData?.companyId) {
      setError('User data is missing');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const companyRef = doc(db, 'companies', userData.companyId);
      const docSnap = await getDoc(companyRef);

      if (docSnap.exists()) {
        // Update existing company
        await updateDoc(companyRef, {
          ...data,
          updatedAt: new Date(),
          updatedBy: user.uid,
        });

        // If the company name has changed, update it in the user's profile as well
        if (userData.company !== data.companyName) {
          const userRef = doc(db, 'users', userData.userCode);
          await updateDoc(userRef, {
            company: data.companyName,
            updatedAt: new Date(),
          });
        }
      } else {
        // Create new company
        // Also update the user's company name if it's changed
        const newCompanyData = {
          ...data,
          id: userData.companyId,
          createdAt: new Date(),
          createdBy: user.uid,
          updatedAt: new Date(),
          updatedBy: user.uid,
          associatedUsers: [userData.userCode], // Keep track of associated users
          primaryContact: {
            name: `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            phone: userData.phoneNumber || '',
            role: userData.role,
          },
        };

        await setDoc(companyRef, newCompanyData);

        // If the company name has changed, update it in the user's profile
        if (userData.company !== data.companyName) {
          const userRef = doc(db, 'users', userData.userCode);
          await updateDoc(userRef, {
            company: data.companyName,
            updatedAt: new Date(),
          });
        }
      }

      setCompanyData(data);
      setSuccess(true);
      setIsEditMode(false);
    } catch (err) {
      console.error('Error saving company profile:', err);
      setError('Failed to save company profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            Company Profile
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Manage your company information and settings
          </Typography>
        </Box>
        <Box>
          {isEditMode ? (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setIsEditMode(false);
                reset(companyData || undefined);
              }}
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => setIsEditMode(true)}
              sx={{ mr: 2 }}
            >
              Edit Profile
            </Button>
          )}
          <Button
            component={Link}
            href="/dashboard/profile"
            variant="outlined"
            color="primary"
            startIcon={<PersonIcon />}
          >
            User Profile
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 4 }}>
          Company profile saved successfully!
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        {!isEditMode && companyData ? (
          // View Mode
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {companyData.companyName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip
                    icon={<BusinessTypeIcon />}
                    label={
                      companyData.companyType.charAt(0).toUpperCase() +
                      companyData.companyType.slice(1)
                    }
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={
                      companyData.businessType.charAt(0).toUpperCase() +
                      companyData.businessType.slice(1)
                    }
                    color="secondary"
                    variant="outlined"
                    size="small"
                  />
                  {companyData.yearEstablished && (
                    <Chip
                      label={`Est. ${companyData.yearEstablished}`}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
              </Box>
              <Tooltip title="Edit company profile">
                <IconButton color="primary" onClick={() => setIsEditMode(true)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                    Contact Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body1">{companyData.companyAddress}</Typography>
                      <Typography variant="body1">
                        {companyData.city}, {companyData.state && `${companyData.state}, `}
                        {companyData.postalCode}
                      </Typography>
                      <Typography variant="body1">{companyData.country}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PhoneIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Typography variant="body1">{companyData.phoneNumber}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EmailIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Typography variant="body1">{companyData.emailAddress}</Typography>
                  </Box>
                  {companyData.website && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <WebsiteIcon sx={{ mr: 2, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        <Link href={companyData.website} target="_blank">
                          {companyData.website}
                        </Link>
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                    Business Details
                  </Typography>
                  {companyData.registrationNumber && (
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Registration Number:</strong> {companyData.registrationNumber}
                    </Typography>
                  )}
                  {companyData.vatNumber && (
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>VAT Number:</strong> {companyData.vatNumber}
                    </Typography>
                  )}
                  {companyData.numberOfEmployees && (
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Employees:</strong> {companyData.numberOfEmployees}
                    </Typography>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                {companyData.description && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                      About the Company
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {companyData.description}
                    </Typography>
                  </Box>
                )}

                {companyData.operatingLocations && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                      Operating Locations
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {companyData.operatingLocations}
                    </Typography>
                  </Box>
                )}

                {companyData.certifications && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                      Certifications
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {companyData.certifications}
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        ) : (
          // Edit Mode
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                Company Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="companyName"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Company Name"
                        fullWidth
                        required
                        error={!!errors.companyName}
                        helperText={errors.companyName?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="companyType"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        label="Company Type"
                        fullWidth
                        required
                        error={!!errors.companyType}
                        helperText={errors.companyType?.message}
                      >
                        <MenuItem value="charter">Charter Operator</MenuItem>
                        <MenuItem value="broker">Broker</MenuItem>
                        <MenuItem value="management">Aircraft Management</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="businessType"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        label="Business Type"
                        fullWidth
                        required
                        error={!!errors.businessType}
                        helperText={errors.businessType?.message}
                      >
                        <MenuItem value="commercial">Commercial</MenuItem>
                        <MenuItem value="private">Private</MenuItem>
                        <MenuItem value="both">Both Commercial & Private</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="yearEstablished"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Year Established"
                        type="number"
                        fullWidth
                        InputProps={{ inputProps: { min: 1900, max: new Date().getFullYear() } }}
                        error={!!errors.yearEstablished}
                        helperText={errors.yearEstablished?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="registrationNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Registration Number"
                        fullWidth
                        error={!!errors.registrationNumber}
                        helperText={errors.registrationNumber?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="vatNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="VAT Number"
                        fullWidth
                        error={!!errors.vatNumber}
                        helperText={errors.vatNumber?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="numberOfEmployees"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Number of Employees"
                        type="number"
                        fullWidth
                        InputProps={{ inputProps: { min: 1 } }}
                        error={!!errors.numberOfEmployees}
                        helperText={errors.numberOfEmployees?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                Contact Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name="companyAddress"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Address"
                        fullWidth
                        required
                        error={!!errors.companyAddress}
                        helperText={errors.companyAddress?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="City"
                        fullWidth
                        required
                        error={!!errors.city}
                        helperText={errors.city?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="State/Province"
                        fullWidth
                        error={!!errors.state}
                        helperText={errors.state?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="postalCode"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Postal Code"
                        fullWidth
                        required
                        error={!!errors.postalCode}
                        helperText={errors.postalCode?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Country"
                        fullWidth
                        required
                        error={!!errors.country}
                        helperText={errors.country?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="phoneNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Phone Number"
                        fullWidth
                        required
                        error={!!errors.phoneNumber}
                        helperText={errors.phoneNumber?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="emailAddress"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Email Address"
                        type="email"
                        fullWidth
                        required
                        error={!!errors.emailAddress}
                        helperText={errors.emailAddress?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="website"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Website"
                        fullWidth
                        placeholder="https://www.example.com"
                        error={!!errors.website}
                        helperText={errors.website?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                Additional Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Company Description"
                        multiline
                        rows={4}
                        fullWidth
                        placeholder="Describe your company, services offered, etc."
                        error={!!errors.description}
                        helperText={errors.description?.message || 'Maximum 500 characters'}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="operatingLocations"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Operating Locations"
                        multiline
                        rows={2}
                        fullWidth
                        placeholder="List your primary operating locations or regions"
                        error={!!errors.operatingLocations}
                        helperText={errors.operatingLocations?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="certifications"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Certifications & Licenses"
                        multiline
                        rows={2}
                        fullWidth
                        placeholder="List important certifications, licenses, or qualifications"
                        error={!!errors.certifications}
                        helperText={errors.certifications?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setIsEditMode(false);
                  reset(companyData || undefined);
                }}
                sx={{ mr: 2 }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </form>
        )}
      </Paper>
    </Box>
  );
}
