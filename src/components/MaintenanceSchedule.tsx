'use client';

import { useState, useEffect } from 'react';
import { MaintenanceSchedule } from '@/types/aircraft';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Plus, Wrench, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/Calendar';
import { DateRange } from 'react-day-picker';
import LoadingSpinner from './LoadingSpinner';

interface MaintenanceScheduleProps {
  aircraftId: string;
}

export default function MaintenanceScheduleComponent({ aircraftId }: MaintenanceScheduleProps) {
  const [schedule, setSchedule] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingMaintenance, setIsAddingMaintenance] = useState(false);
  const [selectedDates, setSelectedDates] = useState<DateRange | undefined>(undefined);
  const [maintenanceType, setMaintenanceType] = useState<
    'scheduled' | 'unscheduled' | 'inspection'
  >('scheduled');
  const [description, setDescription] = useState('');
  const [technician, setTechnician] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadMaintenanceSchedule();
  }, [aircraftId]);

  const loadMaintenanceSchedule = async () => {
    try {
      // TODO: Implement getMaintenanceSchedule in lib/aircraft
      // const data = await getMaintenanceSchedule(aircraftId);
      // setSchedule(data);
      setSchedule([]);
    } catch (err) {
      console.error('Error loading maintenance schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to load maintenance schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaintenance = async () => {
    if (!selectedDates?.from || !selectedDates?.to) {
      setError('Please select both start and end dates');
      return;
    }

    setIsAddingMaintenance(true);
    try {
      // TODO: Implement createMaintenanceRecord in lib/aircraft
      // await createMaintenanceRecord({
      //   aircraftId,
      //   type: maintenanceType,
      //   description,
      //   startDate: selectedDates.from,
      //   endDate: selectedDates.to,
      //   technician,
      //   notes,
      //   status: 'scheduled'
      // });
      await loadMaintenanceSchedule();
      setSelectedDates(undefined);
      setDescription('');
      setTechnician('');
      setNotes('');
      setMaintenanceType('scheduled');
    } catch (err) {
      console.error('Error adding maintenance record:', err);
      setError(err instanceof Error ? err.message : 'Failed to add maintenance record');
    } finally {
      setIsAddingMaintenance(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size={32} fullscreen={false} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Maintenance Schedule</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Maintenance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance Type
                </label>
                <select
                  value={maintenanceType}
                  onChange={(e) =>
                    setMaintenanceType(e.target.value as 'scheduled' | 'unscheduled' | 'inspection')
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="scheduled">Scheduled Maintenance</option>
                  <option value="unscheduled">Unscheduled Maintenance</option>
                  <option value="inspection">Inspection</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="maintenance-description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <input
                  id="maintenance-description"
                  name="description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Brief description of maintenance work"
                />
              </div>
              <div>
                <label
                  htmlFor="maintenance-technician"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Technician
                </label>
                <input
                  id="maintenance-technician"
                  name="technician"
                  type="text"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Assigned technician"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={3}
                  placeholder="Additional notes or instructions"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <Calendar
                  mode="range"
                  selected={selectedDates}
                  onSelect={setSelectedDates}
                  numberOfMonths={1}
                  disabled={{ before: new Date() }}
                />
              </div>
              <Button
                onClick={handleAddMaintenance}
                disabled={isAddingMaintenance || !selectedDates?.from || !selectedDates?.to}
                className="w-full"
              >
                {isAddingMaintenance ? 'Scheduling...' : 'Schedule Maintenance'}
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

      <div className="space-y-4">
        {schedule.map((maintenance) => (
          <div
            key={maintenance.id}
            className={`p-4 rounded-lg border ${getStatusColor(maintenance.status)}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5" />
                  <h4 className="font-medium">{maintenance.description}</h4>
                </div>
                <p className="text-sm mt-1">
                  {format(maintenance.startDate.toDate(), 'MMM d, yyyy')} -{' '}
                  {format(maintenance.endDate.toDate(), 'MMM d, yyyy')}
                </p>
                {maintenance.technician && (
                  <p className="text-sm mt-1">Technician: {maintenance.technician}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {maintenance.status === 'scheduled' && (
                  <>
                    <Button size="small" variant="outlined" className="text-green-600">
                      <Check className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                    <Button size="small" variant="outlined" className="text-red-600">
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}
                {maintenance.status === 'in-progress' && (
                  <Button size="small" variant="outlined" className="text-green-600">
                    <Check className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                )}
              </div>
            </div>
            {maintenance.notes && <p className="mt-2 text-sm">{maintenance.notes}</p>}
          </div>
        ))}

        {schedule.length === 0 && (
          <div className="text-center py-12 text-gray-500">No maintenance records found</div>
        )}
      </div>
    </div>
  );
}
