'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Input from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AircraftFormData, AircraftType, AircraftStatus, AircraftStatusValues } from '@/types/aircraft';
import Select from '@/components/ui/Select';
import AircraftImageGallery from '@/components/AircraftImageGallery';
import AirportSelect from '@/components/ui/AirportSelect';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    formRef: HTMLFormElement | null;
  }
}

const aircraftSchema = z.object({
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE'] as const),
  registration: z.string().min(1, "Registration is required").toUpperCase(),
  type: z.nativeEnum(AircraftType),
  make: z.string().min(1, "Manufacturer is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().min(1900).max(new Date().getFullYear()),
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
  images: z.array(z.string()).default([]),
});

interface AircraftFormProps {
  initialData?: Partial<AircraftFormData>;
  onSubmit: (data: AircraftFormData, shouldSave?: boolean) => void;
  onClose?: () => void;
  aircraftId?: string;
  isSubmitting?: boolean;
}

export default function AircraftForm({ initialData, onSubmit, onClose, aircraftId, isSubmitting }: AircraftFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<AircraftFormData>({
    resolver: zodResolver(aircraftSchema),
    defaultValues: initialData || {
      status: 'ACTIVE' as AircraftStatus,
      specifications: {
        allowsSmoking: false,
        maxPassengers: 1,
        maxBaggageWeight: 0,
        cockpitCrew: 1,
        cabinCrew: 0,
        isPressurized: false,
        hasWc: false,
        isUnpavedRunwayCapable: false,
        allowsPets: false,
        hasHeatedCabin: false,
        hasAirConditioning: false,
        hasApu: false,
      }
    },
  });

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
      handleSubmit((data) => onSubmit(data, shouldSave))();
    };

    const form = formRef.current;
    if (form) {
      form.addEventListener('submit-form', handleFormSubmit);
      return () => form.removeEventListener('submit-form', handleFormSubmit);
    }
  }, [handleSubmit, onSubmit]);

  // Handle browser/tab close with unsaved changes
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

  const handleSave = async () => {
    if (!isDirty) {
      toast.info('No changes to save');
      return;
    }

    const data = getValues();
    if (!data.registration) {
      toast.error('Registration is required');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    try {
      const loadingToast = toast.loading('Saving progress...');
      await onSubmit(data, true);
      toast.dismiss(loadingToast);
      toast.success('Progress saved successfully');
      reset(data); // Reset form with new data to clear dirty state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save progress');
      toast.error(err instanceof Error ? err.message : 'Failed to save progress');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      const shouldSave = window.confirm('You have unsaved changes. Would you like to save before closing?');
      if (shouldSave) {
        handleSave().then(() => {
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

  return (
    <form ref={formRef} className="space-y-8">
      {/* Status Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 gap-4">
          <Select
            label="Status"
            {...register("status")}
            error={errors.status?.message}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'MAINTENANCE', label: 'Maintenance' },
              { value: 'INACTIVE', label: 'Inactive' }
            ]}
          />
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Registration *"
            {...register("registration")}
            error={errors.registration?.message}
          />
          <Select
            label="Aircraft Type *"
            {...register("type")}
            error={errors.type?.message}
            options={[
              { value: AircraftType.LIGHT_JET, label: 'Light Jet' },
              { value: AircraftType.MIDSIZE_JET, label: 'Midsize Jet' },
              { value: AircraftType.SUPER_MIDSIZE_JET, label: 'Super Midsize Jet' },
              { value: AircraftType.HEAVY_JET, label: 'Heavy Jet' },
              { value: AircraftType.ULTRA_LONG_RANGE_JET, label: 'Ultra Long Range Jet' },
              { value: AircraftType.TURBOPROP, label: 'Turboprop' },
              { value: AircraftType.HELICOPTER, label: 'Helicopter' }
            ]}
          />
          <Input
            label="Manufacturer *"
            {...register("make")}
            error={errors.make?.message}
          />
          <Input
            label="Model *"
            {...register("model")}
            error={errors.model?.message}
          />
          <Input
            label="Year *"
            type="number"
            {...register("year", { valueAsNumber: true })}
            error={errors.year?.message}
          />
          <Input
            label="Base Airport"
            {...register("baseAirport")}
            error={errors.baseAirport?.message}
          />
        </div>
      </div>

      {/* Crew Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Crew Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Cockpit Crew *"
            type="number"
            {...register("specifications.cockpitCrew", { valueAsNumber: true })}
            error={errors.specifications?.cockpitCrew?.message}
          />
          <Input
            label="Cabin Crew"
            type="number"
            {...register("specifications.cabinCrew", { valueAsNumber: true })}
            error={errors.specifications?.cabinCrew?.message}
          />
        </div>
      </div>

      {/* Cabin Specifications */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Cabin Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Maximum Passengers *"
            type="number"
            {...register("specifications.maxPassengers", { valueAsNumber: true })}
            error={errors.specifications?.maxPassengers?.message}
          />
          <Input
            label="Maximum Baggage Weight (kg) *"
            type="number"
            {...register("specifications.maxBaggageWeight", { valueAsNumber: true })}
            error={errors.specifications?.maxBaggageWeight?.message}
          />
          <Input
            label="Last Interior Refurbishment"
            type="number"
            {...register("specifications.lastInteriorRefurb", { valueAsNumber: true })}
            error={errors.specifications?.lastInteriorRefurb?.message}
          />
          <Input
            label="Last Exterior Refurbishment"
            type="number"
            {...register("specifications.lastExteriorRefurb", { valueAsNumber: true })}
            error={errors.specifications?.lastExteriorRefurb?.message}
          />
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Amenities & Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register("specifications.isPressurized")}
              className="rounded border-gray-300"
            />
            <span>Pressurized Cabin</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register("specifications.hasWc")}
              className="rounded border-gray-300"
            />
            <span>Lavatory</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register("specifications.isUnpavedRunwayCapable")}
              className="rounded border-gray-300"
            />
            <span>Unpaved Runway Capable</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register("specifications.allowsPets")}
              className="rounded border-gray-300"
            />
            <span>Pets Allowed</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register("specifications.hasHeatedCabin")}
              className="rounded border-gray-300"
            />
            <span>Heated Cabin</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register("specifications.hasAirConditioning")}
              className="rounded border-gray-300"
            />
            <span>Air Conditioning</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register("specifications.hasApu")}
              className="rounded border-gray-300"
            />
            <span>APU</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              disabled
              checked={false}
              className="rounded border-gray-300"
            />
            <span className="text-gray-500">Smoking (Not Allowed)</span>
          </label>
        </div>
      </div>

      {/* Description */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Description</h3>
        <div className="grid grid-cols-1 gap-4">
          <textarea
            {...register("specifications.blurb")}
            className="w-full h-32 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Enter a brief description of the aircraft (max 500 characters)"
            maxLength={500}
          />
          {errors.specifications?.blurb && (
            <p className="text-red-500 text-sm">{errors.specifications.blurb.message}</p>
          )}
        </div>
      </div>

      {/* Images Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Images</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Exterior</h4>
            <AircraftImageGallery
              aircraftId={aircraftId || 'new'}
              images={[]}
              onImagesUpdate={() => {}}
              type="exterior"
            />
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Interior</h4>
            <AircraftImageGallery
              aircraftId={aircraftId || 'new'}
              images={[]}
              onImagesUpdate={() => {}}
              type="interior"
            />
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Cabin Layout</h4>
            <AircraftImageGallery
              aircraftId={aircraftId || 'new'}
              images={[]}
              onImagesUpdate={() => {}}
              type="layout"
            />
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Cockpit</h4>
            <AircraftImageGallery
              aircraftId={aircraftId || 'new'}
              images={[]}
              onImagesUpdate={() => {}}
              type="cockpit"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="flex justify-between space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
        >
          Close
        </Button>
        <div className="flex space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Progress'}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : aircraftId ? 'Update Aircraft' : 'Create Aircraft'}
          </Button>
        </div>
      </div>
    </form>
  );
} 