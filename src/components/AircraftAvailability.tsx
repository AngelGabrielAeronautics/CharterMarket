'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/Calendar';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Plus } from 'lucide-react';
import { AircraftAvailability } from '@/types/aircraft';
import { getAircraftAvailability, createAvailabilityBlock } from '@/lib/aircraft';
import { addDays, format } from 'date-fns';

interface AircraftAvailabilityProps {
  aircraftId: string;
}

export default function AircraftAvailabilityCalendar({ aircraftId }: AircraftAvailabilityProps) {
  const [availability, setAvailability] = useState<AircraftAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [blockType, setBlockType] = useState<'blocked' | 'maintenance' | 'charter'>('blocked');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadAvailability();
  }, [aircraftId]);

  const loadAvailability = async () => {
    try {
      const data = await getAircraftAvailability(aircraftId);
      setAvailability(data);
    } catch (err) {
      console.error('Error loading availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlock = async () => {
    if (selectedDates.length !== 2) {
      setError('Please select both start and end dates');
      return;
    }

    setIsAddingBlock(true);
    try {
      await createAvailabilityBlock({
        aircraftId,
        startDate: selectedDates[0],
        endDate: selectedDates[1],
        type: blockType,
        notes,
      });
      await loadAvailability();
      setSelectedDates([]);
      setNotes('');
      setBlockType('blocked');
    } catch (err) {
      console.error('Error adding availability block:', err);
      setError(err instanceof Error ? err.message : 'Failed to add availability block');
    } finally {
      setIsAddingBlock(false);
    }
  };

  const getDateClass = (date: Date) => {
    const classes = ['cursor-pointer hover:bg-gray-100 rounded-lg'];
    
    availability.forEach(block => {
      const start = block.startDate.toDate();
      const end = block.endDate.toDate();
      
      if (date >= start && date <= end) {
        switch (block.type) {
          case 'blocked':
            classes.push('bg-red-100 hover:bg-red-200');
            break;
          case 'maintenance':
            classes.push('bg-yellow-100 hover:bg-yellow-200');
            break;
          case 'charter':
            classes.push('bg-blue-100 hover:bg-blue-200');
            break;
        }
      }
    });

    if (selectedDates.some(d => d.toDateString() === date.toDateString())) {
      classes.push('bg-blue-500 text-white hover:bg-blue-600');
    }

    return classes.join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Availability Calendar</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Block
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Availability Block</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Block Type
                </label>
                <select
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value as 'blocked' | 'maintenance' | 'charter')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="blocked">Blocked</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="charter">Charter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={3}
                />
              </div>
              <Button
                onClick={handleAddBlock}
                disabled={isAddingBlock || selectedDates.length !== 2}
                className="w-full"
              >
                {isAddingBlock ? 'Adding...' : 'Add Block'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <Calendar
          mode="range"
          selected={selectedDates}
          onSelect={dates => setSelectedDates(dates || [])}
          numberOfMonths={2}
          disabled={{ before: new Date() }}
          classNames={{
            day: date => getDateClass(date),
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {availability.map((block) => (
          <div
            key={block.id}
            className={`p-4 rounded-lg border ${
              block.type === 'blocked' ? 'border-red-200 bg-red-50' :
              block.type === 'maintenance' ? 'border-yellow-200 bg-yellow-50' :
              'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium capitalize">{block.type}</h4>
                <p className="text-sm text-gray-500">
                  {format(block.startDate.toDate(), 'MMM d, yyyy')} - {format(block.endDate.toDate(), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            {block.notes && (
              <p className="mt-2 text-sm text-gray-600">{block.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 