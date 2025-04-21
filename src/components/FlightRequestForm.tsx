'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { FlightRequestFormData, TripType, CabinClass } from '@/types/flight';
import AirportSelect from '@/components/ui/AirportSelect';
import Input from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { useAuth } from '@/contexts/AuthContext';
import { createFlightRequest } from '@/lib/flight';
import { findAvailableOperators } from '@/lib/operator';
import { useRouter } from 'next/navigation';

const schema = z.object({
  tripType: z.enum(['oneWay', 'return']),
  departureAirport: z.string().length(4, 'ICAO code must be 4 characters'),
  arrivalAirport: z.string().length(4, 'ICAO code must be 4 characters'),
  departureDate: z.date().min(new Date(), 'Departure date must be in the future'),
  returnDate: z.date().optional(),
  flexibleDates: z.boolean(),
  passengerCount: z.number().min(1).max(20),
  cabinClass: z.enum(['standard', 'premium', 'vip']),
  specialRequirements: z.string().optional(),
});

export default function FlightRequestForm() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FlightRequestFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tripType: 'oneWay',
      flexibleDates: false,
      passengerCount: 1,
      cabinClass: 'standard',
    },
  });

  const tripType = watch('tripType');

  const onSubmit = async (data: FlightRequestFormData) => {
    if (!user?.userCode) {
      setError('You must be logged in to submit a flight request');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find available operators for this flight request
      const availableOperators = await findAvailableOperators(
        data.departureAirport,
        data.arrivalAirport,
        data.passengerCount
      );

      if (availableOperators.length === 0) {
        setError('No operators available for this route. Please try different airports or passenger count.');
        return;
      }

      // Use the first available operator
      const operatorId = availableOperators[0].id;
      const requestId = await createFlightRequest(user.userCode, operatorId, data);
      router.push(`/dashboard/flights/${requestId}`);
    } catch (err) {
      console.error('Error submitting flight request:', err);
      setError('Failed to submit flight request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Trip Type"
          value={watch('tripType')}
          {...register('tripType')}
          error={errors.tripType?.message}
          options={[
            { value: 'oneWay', label: 'One Way' },
            { value: 'return', label: 'Return' },
          ]}
        />

        <Input
          label="Number of Passengers"
          type="number"
          {...register('passengerCount', { valueAsNumber: true })}
          error={errors.passengerCount?.message}
          min={1}
          max={20}
        />

        <AirportSelect
          label="Departure Airport"
          value={watch('departureAirport')}
          {...register('departureAirport')}
          error={errors.departureAirport?.message}
          onChange={(value: string) => setValue('departureAirport', value)}
        />

        <AirportSelect
          label="Arrival Airport"
          value={watch('arrivalAirport')}
          {...register('arrivalAirport')}
          error={errors.arrivalAirport?.message}
          onChange={(value: string) => setValue('arrivalAirport', value)}
        />

        <DatePicker
          label="Departure Date"
          {...register('departureDate')}
          error={errors.departureDate?.message}
          onChange={(date) => date && setValue('departureDate', date)}
        />

        {tripType === 'return' && (
          <DatePicker
            label="Return Date"
            {...register('returnDate')}
            error={errors.returnDate?.message}
            onChange={(date) => date && setValue('returnDate', date)}
          />
        )}

        <Select
          label="Cabin Class"
          value={watch('cabinClass')}
          {...register('cabinClass')}
          error={errors.cabinClass?.message}
          options={[
            { value: 'standard', label: 'Standard' },
            { value: 'premium', label: 'Premium' },
            { value: 'vip', label: 'VIP' },
          ]}
        />

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('flexibleDates')}
            className="form-checkbox"
          />
          <label className="text-sm text-gray-600">
            Flexible Dates (+/- 2 days)
          </label>
        </div>
      </div>

      <div className="col-span-full">
        <textarea
          {...register('specialRequirements')}
          placeholder="Special Requirements or Notes"
          className="w-full h-32 p-3 border rounded-md"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm mt-2">{error}</div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full md:w-auto"
      >
        {loading ? 'Submitting...' : 'Submit Flight Request'}
      </Button>
    </form>
  );
} 