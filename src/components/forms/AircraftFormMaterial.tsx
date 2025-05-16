'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Button,
  Grid,
  Paper,
  Typography,
  Box,
  GridProps,
  Theme,
  SxProps,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Save, Close, Add } from '@mui/icons-material';
import { AircraftFormData, AircraftType } from '@/types/aircraft';
import AircraftImageGallery from '@/components/AircraftImageGallery';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { checkRegistrationExists } from '@/lib/aircraft';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    formRef: HTMLFormElement | null;
  }
}

// Define the aircraft status enum values
const AIRCRAFT_STATUS = {
  ACTIVE: 'ACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  INACTIVE: 'INACTIVE',
} as const;

type AircraftStatusType = typeof AIRCRAFT_STATUS[keyof typeof AIRCRAFT_STATUS];

// Add this constant at the top of the file, after imports
const COMMON_MANUFACTURERS = [
  'AIRBUS',
  'BEECHCRAFT',
  'BELL',
  'BOEING',
  'BOMBARDIER',
  'CESSNA',
  'CIRRUS',
  'DAHER',
  'DASSAULT',
  'EMBRAER',
  'GULFSTREAM',
  'HAWKER',
  'LEARJET',
  'PILATUS',
  'PIPER',
  'ROBINSON',
  'SIKORSKY',
  'TEXTRON',
];

// Define the Grid component props type
interface CustomGridProps extends GridProps {
  item?: boolean;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  children?: React.ReactNode;
}

// Create a custom Grid component
const CustomGrid: React.FC<CustomGridProps> = ({ children, ...props }) => (
  <Grid {...props}>{children}</Grid>
);

// Define form schema to match AircraftFormData
const aircraftSchema = z.object({
  status: z.enum([AIRCRAFT_STATUS.ACTIVE, AIRCRAFT_STATUS.MAINTENANCE, AIRCRAFT_STATUS.INACTIVE]),
  registration: z.string()
    .min(1, "Registration is required")
    .refine(val => /^[A-Z0-9-]+$/.test(val), "Registration can only contain uppercase letters, numbers, and hyphens")
    .transform(val => val.toUpperCase()),
  type: z.nativeEnum(AircraftType),
  make: z.string().min(1, "Manufacturer is required").toUpperCase(),
  model: z.string().min(1, "Model is required").toUpperCase(),
  year: z.number().min(1900, "Year must be at least 1900").max(new Date().getFullYear(), "Year cannot be in the future"),
  baseAirport: z.string(),
  specifications: z.object({
    maxPassengers: z.number().min(1),
    maxBaggageWeight: z.number().min(0),
    lastInteriorRefurb: z.number().min(1900).max(new Date().getFullYear()),
    lastExteriorRefurb: z.number().min(1900).max(new Date().getFullYear()),
    isPressurized: z.boolean(),
    hasWc: z.boolean(),
    isUnpavedRunwayCapable: z.boolean(),
    allowsPets: z.boolean(),
    allowsSmoking: z.boolean().default(false),
    hasHeatedCabin: z.boolean(),
    hasAirConditioning: z.boolean(),
    cockpitCrew: z.number().min(1),
    cabinCrew: z.number().min(0),
    hasApu: z.boolean(),
    blurb: z.string().max(500).optional(),
  }),
  images: z.array(z.string()),
});

type AircraftFormSchema = z.infer<typeof aircraftSchema>;

interface AircraftFormProps {
  initialData?: Partial<AircraftFormData>;
  onSubmit: (data: AircraftFormData, shouldSave?: boolean) => void;
  onClose?: () => void;
  aircraftId?: string;
  isSubmitting?: boolean;
}

// Common styles
const formControlStyle: SxProps<Theme> = {
  width: '100%',
  '& .MuiInputLabel-root': {
    marginBottom: 1,
  },
  '& .MuiFormHelperText-root': {
    marginTop: 1,
  },
};

// Update the YEARS constant to start from 1960
const YEARS = Array.from(
  { length: new Date().getFullYear() - 1960 + 1 },
  (_, i) => new Date().getFullYear() - i
);

// Add this style constant for error highlighting
const errorHighlightStyle = {
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#d32f2f',
      borderWidth: 2,
    },
  },
  '& .MuiInputLabel-root': {
    color: '#d32f2f',
  },
};

export default function AircraftFormMaterial({ initialData, onSubmit, onClose, aircraftId, isSubmitting }: AircraftFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isManufacturerDialogOpen, setIsManufacturerDialogOpen] = useState(false);
  const [customManufacturer, setCustomManufacturer] = useState('');
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { user } = useAuth();

  // Add state for registration validation
  const [registrationExists, setRegistrationExists] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // Add debounce function
  function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>): void => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Create debounced registration check
  const debouncedRegistrationCheck = useRef(
    debounce(async (registration: string) => {
      if (!registration || !user?.userCode) return;
      
      // Don't check if we're editing and the registration hasn't changed
      if (aircraftId && initialData?.registration === registration) {
        setRegistrationExists(false);
        setRegistrationError(null);
        return;
      }

      setIsCheckingRegistration(true);
      try {
        const exists = await checkRegistrationExists(registration, user.userCode);
        setRegistrationExists(exists);
        setRegistrationError(exists ? `Registration ${registration} is already in use` : null);
        
        if (exists) {
          setError('registration', { 
            type: 'manual',
            message: `Registration ${registration} is already in use`
          });
        } else {
          clearErrors('registration');
        }
      } catch (error) {
        console.error('Error checking registration:', error);
        setRegistrationError('Error checking registration availability');
      } finally {
        setIsCheckingRegistration(false);
      }
    }, 500)
  ).current;

  // Add registration field change handler
  const handleRegistrationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toUpperCase();
    setValue('registration', value, {
      shouldValidate: true,
      shouldDirty: true,
    });
    debouncedRegistrationCheck(value);
  };

  const {
    register,
    handleSubmit: formHandleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
    getValues,
    control,
    trigger,
    clearErrors,
    setError,
  } = useForm<AircraftFormSchema>({
    resolver: zodResolver(aircraftSchema) as Resolver<AircraftFormSchema>,
    defaultValues: {
      status: AIRCRAFT_STATUS.ACTIVE as AircraftStatusType,
      registration: '',
      type: '' as AircraftType,
      make: '',
      model: '',
      year: null,
      baseAirport: '',
      specifications: {
        maxPassengers: 1,
        maxBaggageWeight: 0,
        lastInteriorRefurb: new Date().getFullYear(),
        lastExteriorRefurb: new Date().getFullYear(),
        isPressurized: true,
        hasWc: false,
        isUnpavedRunwayCapable: false,
        allowsPets: false,
        allowsSmoking: false,
        hasHeatedCabin: true,
        hasAirConditioning: true,
        cockpitCrew: 2,
        cabinCrew: 0,
        hasApu: true,
        blurb: '',
      },
      images: [],
      ...initialData,
    } as AircraftFormSchema,
  });

  // Watch registration changes
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'registration' && value.registration) {
        const upperReg = value.registration.toUpperCase();
        if (upperReg !== value.registration) {
          setValue('registration', upperReg);
        }
        debouncedRegistrationCheck(upperReg);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue, debouncedRegistrationCheck]);

  useEffect(() => {
    if (formRef.current) {
      window.formRef = formRef.current;
    }
    return () => {
      window.formRef = null;
    };
  }, []);

  useEffect(() => {
    const handleFormSubmit = (e: Event) => {
      const customEvent = e as CustomEvent;
      const shouldSave = customEvent.detail?.shouldSave ?? false;
      formHandleSubmit((data: AircraftFormSchema) => onSubmit(data, shouldSave))();
    };

    const form = formRef.current;
    if (form) {
      form.addEventListener('submit-form', handleFormSubmit);
      return () => form.removeEventListener('submit-form', handleFormSubmit);
    }
  }, [formHandleSubmit, onSubmit]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const saveForm = async (data: AircraftFormSchema) => {
    const { registration, make, model, type, year } = data;
    const missingFields = [];

    if (!registration) missingFields.push('Registration');
    if (!make) missingFields.push('Manufacturer');
    if (!model) missingFields.push('Model');
    if (!type) missingFields.push('Powerplant');
    if (!year) missingFields.push('Year');

    if (missingFields.length > 0) {
      // Trigger validation on all fields to show errors
      Object.keys(data).forEach((key) => {
        trigger(key as keyof AircraftFormSchema);
      });
      toast.error(`Please complete all required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (!isDirty) {
      toast('No changes to save');
      return;
    }

    setIsSaving(true);
    setSubmissionError(null);
    try {
      const loadingToast = toast.loading('Saving progress...');
      await onSubmit(data, true);
      toast.dismiss(loadingToast);
      toast.success('Progress saved successfully');
      reset(data);
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : 'Failed to save progress');
      toast.error(err instanceof Error ? err.message : 'Failed to save progress');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      const shouldSave = window.confirm('You have unsaved changes. Would you like to save before closing?');
      if (shouldSave) {
        saveForm(getValues()).then(() => {
          onClose?.();
          router.push('/dashboard/aircraft');
        });
      } else {
        onClose?.();
        router.push('/dashboard/aircraft');
      }
    } else {
      onClose?.();
      router.push('/dashboard/aircraft');
    }
  };

  const handleManufacturerDialogClose = () => {
    setIsManufacturerDialogOpen(false);
    setCustomManufacturer('');
  };

  const handleManufacturerSubmit = () => {
    if (customManufacturer.trim()) {
      const upperCaseManufacturer = customManufacturer.trim().toUpperCase();
      setValue('make', upperCaseManufacturer, { shouldValidate: true });
    }
    handleManufacturerDialogClose();
  };

  const handleFormSubmit = async (data: AircraftFormSchema) => {
    const { registration, make, model, type, year } = data;
    const missingFields = [];

    if (!registration) missingFields.push('Registration');
    if (!make) missingFields.push('Manufacturer');
    if (!model) missingFields.push('Model');
    if (!type) missingFields.push('Powerplant');
    if (!year) missingFields.push('Year');

    if (missingFields.length > 0) {
      // Trigger validation on all fields to show errors
      Object.keys(data).forEach((key) => {
        trigger(key as keyof AircraftFormSchema);
      });
      toast.error(`Please complete all required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      const loadingToast = toast.loading('Creating aircraft...');
      await onSubmit(data);
      toast.dismiss(loadingToast);
      toast.success('Aircraft created successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create aircraft');
    }
  };

  return (
    <form ref={formRef} onSubmit={formHandleSubmit(handleFormSubmit)} className="space-y-8">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<Close />}
          onClick={handleClose}
        >
          Close
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Save />}
            onClick={() => saveForm(getValues())}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Progress'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : aircraftId ? 'Update Aircraft' : 'Create Aircraft'}
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Typography variant="h6" gutterBottom sx={{ alignSelf: 'flex-end' }}>
            Service Status
          </Typography>
          <FormControl 
            variant="outlined" 
            error={!!errors.status}
            sx={{ ...formControlStyle, width: '250px' }}
            required
          >
            <InputLabel id="status-label">Service Status</InputLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  labelId="status-label"
                  label="Service Status"
                >
                  <MenuItem value={AIRCRAFT_STATUS.ACTIVE}>Active</MenuItem>
                  <MenuItem value={AIRCRAFT_STATUS.MAINTENANCE}>Maintenance</MenuItem>
                  <MenuItem value={AIRCRAFT_STATUS.INACTIVE}>Inactive</MenuItem>
                </Select>
              )}
            />
            {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
          </FormControl>
        </Box>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Definition</Typography>
        <CustomGrid container spacing={3}>
          <CustomGrid item xs={12} sm={6}>
            <FormControl sx={formControlStyle} error={!!errors.registration}>
              <TextField
                label="Registration"
                {...register('registration')}
                onChange={handleRegistrationChange}
                error={!!errors.registration || registrationExists}
                helperText={
                  isCheckingRegistration ? 'Checking registration...' :
                  errors.registration?.message || registrationError || 
                  'Registration will be automatically converted to uppercase'
                }
                InputProps={{
                  sx: {
                    textTransform: 'uppercase',
                  }
                }}
              />
            </FormControl>
          </CustomGrid>
          
          <CustomGrid item xs={12} sm={6}>
            <FormControl 
              variant="outlined" 
              error={!!errors.make} 
              sx={{ 
                ...formControlStyle, 
                minWidth: 250,
                ...(!!errors.make && errorHighlightStyle)
              }} 
              required
            >
              <InputLabel id="make-label">Manufacturer</InputLabel>
              <Controller
                name="make"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="make-label"
                    label="Manufacturer"
                    value={field.value || ''}
                    onChange={(e) => {
                      if (e.target.value === 'OTHER') {
                        setIsManufacturerDialogOpen(true);
                      } else {
                        field.onChange(e.target.value);
                      }
                    }}
                  >
                    {COMMON_MANUFACTURERS.map((manufacturer) => (
                      <MenuItem key={manufacturer} value={manufacturer}>
                        {manufacturer}
                      </MenuItem>
                    ))}
                    <MenuItem value="OTHER">
                      {!COMMON_MANUFACTURERS.includes(field.value) && field.value 
                        ? field.value 
                        : 'Other (Specify)'}
                    </MenuItem>
                  </Select>
                )}
              />
              {errors.make && <FormHelperText>{errors.make.message}</FormHelperText>}
            </FormControl>
          </CustomGrid>
          
          <CustomGrid item xs={12} sm={6}>
            <FormControl 
              variant="outlined" 
              error={!!errors.model} 
              sx={{ 
                ...formControlStyle,
                ...(!!errors.model && errorHighlightStyle)
              }} 
              required
            >
              <TextField
                {...register("model")}
                label="Model"
                fullWidth
                error={!!errors.model}
                helperText={errors.model?.message}
                inputProps={{ 
                  style: { textTransform: 'uppercase' },
                  onInput: (e) => {
                    const input = e.target as HTMLInputElement;
                    input.value = input.value.toUpperCase();
                  }
                }}
              />
            </FormControl>
          </CustomGrid>
          
          <CustomGrid item xs={12} sm={6}>
            <FormControl 
              variant="outlined" 
              error={!!errors.type} 
              sx={{ 
                ...formControlStyle, 
                minWidth: 250,
                ...(!!errors.type && errorHighlightStyle)
              }} 
              required
            >
              <InputLabel id="type-label">Powerplant</InputLabel>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="type-label"
                    label="Powerplant"
                    value={field.value || ''}
                  >
                    <MenuItem value="">Select Powerplant</MenuItem>
                    <MenuItem value={AircraftType.SINGLE_PISTON}>Single Piston</MenuItem>
                    <MenuItem value={AircraftType.TWIN_PISTON}>Twin Piston</MenuItem>
                    <MenuItem value={AircraftType.TURBOPROP}>Turboprop</MenuItem>
                    <MenuItem value={AircraftType.LIGHT_JET}>Light Jet</MenuItem>
                    <MenuItem value={AircraftType.MIDSIZE_JET}>Midsize Jet</MenuItem>
                    <MenuItem value={AircraftType.SUPER_MIDSIZE_JET}>Super Midsize Jet</MenuItem>
                    <MenuItem value={AircraftType.HEAVY_JET}>Heavy Jet</MenuItem>
                    <MenuItem value={AircraftType.ULTRA_LONG_RANGE_JET}>Ultra Long Range Jet</MenuItem>
                    <MenuItem value={AircraftType.HELICOPTER}>Helicopter</MenuItem>
                  </Select>
                )}
              />
              {errors.type && <FormHelperText>{errors.type.message}</FormHelperText>}
            </FormControl>
          </CustomGrid>
          
          <CustomGrid item xs={12} sm={6}>
            <FormControl 
              variant="outlined" 
              error={!!errors.year} 
              sx={{ 
                ...formControlStyle, 
                minWidth: 250,
                ...(!!errors.year && errorHighlightStyle)
              }} 
              required
            >
              <InputLabel id="year-label">Year</InputLabel>
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="year-label"
                    label="Year"
                    value={field.value || ''}
                  >
                    <MenuItem value="">Select Year</MenuItem>
                    {YEARS.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.year && <FormHelperText>{errors.year.message}</FormHelperText>}
            </FormControl>
          </CustomGrid>
        </CustomGrid>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Performance</Typography>
        <CustomGrid container spacing={3}>
          <CustomGrid item xs={12} sm={6}>
            <FormControl variant="outlined" error={!!errors.baseAirport} sx={formControlStyle} required>
              <TextField
                {...register("baseAirport")}
                label="Base Airport"
                fullWidth
                error={!!errors.baseAirport}
                helperText={errors.baseAirport?.message}
              />
            </FormControl>
          </CustomGrid>
        </CustomGrid>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Crew Information</Typography>
        <CustomGrid container spacing={3}>
          <CustomGrid item xs={12} sm={6}>
            <FormControl variant="outlined" error={!!errors.specifications?.cockpitCrew} sx={formControlStyle} required>
              <TextField
                {...register("specifications.cockpitCrew", { valueAsNumber: true })}
                label="Cockpit Crew"
                type="number"
                fullWidth
                error={!!errors.specifications?.cockpitCrew}
                helperText={errors.specifications?.cockpitCrew?.message}
              />
            </FormControl>
          </CustomGrid>
          <CustomGrid item xs={12} sm={6}>
            <FormControl variant="outlined" error={!!errors.specifications?.cabinCrew} sx={formControlStyle} required>
              <TextField
                {...register("specifications.cabinCrew", { valueAsNumber: true })}
                label="Cabin Crew"
                type="number"
                fullWidth
                error={!!errors.specifications?.cabinCrew}
                helperText={errors.specifications?.cabinCrew?.message}
              />
            </FormControl>
          </CustomGrid>
        </CustomGrid>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Cabin Specifications</Typography>
        <CustomGrid container spacing={3}>
          <CustomGrid item xs={12} sm={6}>
            <FormControl variant="outlined" error={!!errors.specifications?.maxPassengers} sx={formControlStyle} required>
              <TextField
                {...register("specifications.maxPassengers", { valueAsNumber: true })}
                label="Maximum Passengers"
                type="number"
                fullWidth
                error={!!errors.specifications?.maxPassengers}
                helperText={errors.specifications?.maxPassengers?.message}
              />
            </FormControl>
          </CustomGrid>
          <CustomGrid item xs={12} sm={6}>
            <FormControl variant="outlined" error={!!errors.specifications?.maxBaggageWeight} sx={formControlStyle} required>
              <TextField
                {...register("specifications.maxBaggageWeight", { valueAsNumber: true })}
                label="Maximum Baggage Weight (kg)"
                type="number"
                fullWidth
                error={!!errors.specifications?.maxBaggageWeight}
                helperText={errors.specifications?.maxBaggageWeight?.message}
              />
            </FormControl>
          </CustomGrid>
          <CustomGrid item xs={12} sm={6}>
            <FormControl variant="outlined" error={!!errors.specifications?.lastInteriorRefurb} sx={formControlStyle} required>
              <TextField
                {...register("specifications.lastInteriorRefurb", { valueAsNumber: true })}
                label="Last Interior Refurbishment"
                type="number"
                fullWidth
                error={!!errors.specifications?.lastInteriorRefurb}
                helperText={errors.specifications?.lastInteriorRefurb?.message}
              />
            </FormControl>
          </CustomGrid>
          <CustomGrid item xs={12} sm={6}>
            <FormControl variant="outlined" error={!!errors.specifications?.lastExteriorRefurb} sx={formControlStyle} required>
              <TextField
                {...register("specifications.lastExteriorRefurb", { valueAsNumber: true })}
                label="Last Exterior Refurbishment"
                type="number"
                fullWidth
                error={!!errors.specifications?.lastExteriorRefurb}
                helperText={errors.specifications?.lastExteriorRefurb?.message}
              />
            </FormControl>
          </CustomGrid>
        </CustomGrid>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Amenities & Features</Typography>
        <CustomGrid container spacing={2}>
          <CustomGrid item xs={12} sm={6} md={4}>
            <FormControlLabel
              control={
                <Controller
                  name="specifications.isPressurized"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      {...field}
                      checked={field.value}
                    />
                  )}
                />
              }
              label="Pressurized Cabin"
            />
          </CustomGrid>
          <CustomGrid item xs={12} sm={6} md={4}>
            <FormControlLabel
              control={
                <Controller
                  name="specifications.hasWc"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      {...field}
                      checked={field.value}
                    />
                  )}
                />
              }
              label="Lavatory"
            />
          </CustomGrid>
          <CustomGrid item xs={12} sm={6} md={4}>
            <FormControlLabel
              control={
                <Controller
                  name="specifications.isUnpavedRunwayCapable"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      {...field}
                      checked={field.value}
                    />
                  )}
                />
              }
              label="Unpaved Runway Capable"
            />
          </CustomGrid>
          <CustomGrid item xs={12} sm={6} md={4}>
            <FormControlLabel
              control={
                <Controller
                  name="specifications.allowsPets"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      {...field}
                      checked={field.value}
                    />
                  )}
                />
              }
              label="Pets Allowed"
            />
          </CustomGrid>
          <CustomGrid item xs={12} sm={6} md={4}>
            <FormControlLabel
              control={
                <Controller
                  name="specifications.hasHeatedCabin"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      {...field}
                      checked={field.value}
                    />
                  )}
                />
              }
              label="Heated Cabin"
            />
          </CustomGrid>
          <CustomGrid item xs={12} sm={6} md={4}>
            <FormControlLabel
              control={
                <Controller
                  name="specifications.hasAirConditioning"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      {...field}
                      checked={field.value}
                    />
                  )}
                />
              }
              label="Air Conditioning"
            />
          </CustomGrid>
          <CustomGrid item xs={12} sm={6} md={4}>
            <FormControlLabel
              control={
                <Controller
                  name="specifications.hasApu"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      {...field}
                      checked={field.value}
                    />
                  )}
                />
              }
              label="APU"
            />
          </CustomGrid>
          <CustomGrid item xs={12} sm={6} md={4}>
            <FormControlLabel
              control={
                <Controller
                  name="specifications.allowsSmoking"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      {...field}
                      checked={field.value}
                    />
                  )}
                />
              }
              label="Smoking (Not Allowed)"
            />
          </CustomGrid>
        </CustomGrid>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Description</Typography>
        <FormControl variant="outlined" error={!!errors.specifications?.blurb} sx={formControlStyle} required>
          <TextField
            {...register("specifications.blurb")}
            label="Aircraft Description"
            multiline
            rows={4}
            fullWidth
            error={!!errors.specifications?.blurb}
            helperText={errors.specifications?.blurb?.message}
          />
        </FormControl>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Images</Typography>
        <CustomGrid container spacing={3}>
          <CustomGrid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>Exterior</Typography>
            <AircraftImageGallery
              aircraftId={aircraftId || 'new'}
              images={[]}
              onImagesUpdate={() => {}}
              type="exterior"
            />
          </CustomGrid>
          <CustomGrid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>Interior</Typography>
            <AircraftImageGallery
              aircraftId={aircraftId || 'new'}
              images={[]}
              onImagesUpdate={() => {}}
              type="interior"
            />
          </CustomGrid>
          <CustomGrid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>Cabin Layout</Typography>
            <AircraftImageGallery
              aircraftId={aircraftId || 'new'}
              images={[]}
              onImagesUpdate={() => {}}
              type="layout"
            />
          </CustomGrid>
          <CustomGrid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>Cockpit</Typography>
            <AircraftImageGallery
              aircraftId={aircraftId || 'new'}
              images={[]}
              onImagesUpdate={() => {}}
              type="cockpit"
            />
          </CustomGrid>
        </CustomGrid>
      </Paper>

      {submissionError && (
        <Box sx={{ color: 'error.main', mb: 2 }}>
          {submissionError}
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Close />}
          onClick={handleClose}
        >
          Close
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Save />}
            onClick={() => saveForm(getValues())}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Progress'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : aircraftId ? 'Update Aircraft' : 'Create Aircraft'}
          </Button>
        </Box>
      </Box>

      <Dialog 
        open={isManufacturerDialogOpen} 
        onClose={handleManufacturerDialogClose}
        PaperProps={{
          sx: { width: '100%', maxWidth: 500 }
        }}
      >
        <DialogTitle>Enter Manufacturer</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Manufacturer Name"
            type="text"
            fullWidth
            variant="outlined"
            value={customManufacturer}
            onChange={(e) => setCustomManufacturer(e.target.value)}
            inputProps={{ 
              style: { textTransform: 'uppercase' },
              onInput: (e) => {
                const input = e.target as HTMLInputElement;
                input.value = input.value.toUpperCase();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleManufacturerDialogClose} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleManufacturerSubmit} 
            color="primary" 
            variant="contained"
            disabled={!customManufacturer.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </form>
  );
} 