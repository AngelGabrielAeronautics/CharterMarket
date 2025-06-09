'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/Calendar';
import { Button } from '@/components/ui/Button';
import { addAircraftAvailability, getAircraftAvailability } from '@/lib/aircraft';
import { AircraftAvailability } from '@/types/aircraft';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import LoadingSpinner from './LoadingSpinner';

interface AircraftAvailabilityCalendarProps {
  aircraftId: string;
}

export default function AircraftAvailabilityCalendar({
  aircraftId,
}: AircraftAvailabilityCalendarProps) {
  const [date, setDate] = useState<DateRange | undefined>();
  const [availabilities, setAvailabilities] = useState<AircraftAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1); // Get availability for the past month
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 6); // Get availability for the next 6 months

        const fetchedAvailabilities = await getAircraftAvailability(aircraftId, startDate, endDate);
        setAvailabilities(fetchedAvailabilities);
      } catch (err) {
        console.error('Error fetching aircraft availability:', err);
        setError('Failed to load availability data');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [aircraftId]);

  const handleAddAvailability = async () => {
    if (!date?.from || !date?.to) return;

    try {
      await addAircraftAvailability(aircraftId, {
        startDate: date.from,
        endDate: date.to,
        type: 'blocked',
      });

      // Refresh the availability data
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);

      const updatedAvailabilities = await getAircraftAvailability(aircraftId, startDate, endDate);
      setAvailabilities(updatedAvailabilities);
      setDate(undefined);
    } catch (err) {
      console.error('Error adding availability:', err);
      setError('Failed to add availability');
    }
  };

  const disabledDays = availabilities.map((availability) => ({
    from: availability.startDate.toDate(),
    to: availability.endDate.toDate(),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Aircraft Availability</h3>
        {date?.from && date?.to && (
          <Button onClick={handleAddAvailability}>
            Block {format(date.from, 'PPP')} to {format(date.to, 'PPP')}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-4">
          <LoadingSpinner size={24} fullscreen={false} />
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <Calendar
          mode="range"
          selected={date}
          onSelect={setDate}
          disabled={disabledDays}
          className="rounded-md border"
        />
      )}

      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Blocked Periods</h4>
        <div className="space-y-2">
          {availabilities.map((availability) => (
            <div
              key={availability.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
            >
              <div>
                <p className="text-sm font-medium">
                  {format(availability.startDate.toDate(), 'PPP')} to{' '}
                  {format(availability.endDate.toDate(), 'PPP')}
                </p>
                {availability.notes && (
                  <p className="text-sm text-gray-500">{availability.notes}</p>
                )}
              </div>
              <div className="text-sm text-gray-500">{availability.type}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
