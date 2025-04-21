import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AirportSelect } from '@/components/forms/AirportSelect';
import { Airport } from '@/types/airport';

interface FlightRequestFormData {
  departureAirport: Airport | null;
  arrivalAirport: Airport | null;
}

const FlightRequestForm = () => {
  const { watch, setValue, formState: { errors } } = useForm<FlightRequestFormData>();

  return (
    <div>
      <AirportSelect
        name="departureAirport"
        label="Departure Airport"
        value={watch('departureAirport')}
        onChange={(value: Airport | null) => setValue('departureAirport', value)}
        required
        error={errors.departureAirport?.message}
      />
      <AirportSelect
        name="arrivalAirport"
        label="Arrival Airport"
        value={watch('arrivalAirport')}
        onChange={(value: Airport | null) => setValue('arrivalAirport', value)}
        required
        error={errors.arrivalAirport?.message}
      />
    </div>
  );
};

export default FlightRequestForm; 