'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Aircraft } from '@/types/aircraft';
import { getAircraft } from '@/lib/aircraft';
import { Plane, Calendar, Settings, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import AircraftDetails from '@/components/AircraftDetails';
import AircraftAvailability from '@/components/AircraftAvailability';
import MaintenanceSchedule from '@/components/MaintenanceSchedule';
import AircraftDocuments from '@/components/AircraftDocuments';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AircraftPage() {
  const { id } = useParams();
  const [aircraft, setAircraft] = useState<Aircraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAircraft = async () => {
      try {
        if (!id) throw new Error('Aircraft ID is required');
        const data = await getAircraft(id as string);
        setAircraft(data);
      } catch (err) {
        console.error('Error loading aircraft:', err);
        setError(err instanceof Error ? err.message : 'Failed to load aircraft');
      } finally {
        setLoading(false);
      }
    };

    loadAircraft();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} fullscreen={false} />
      </div>
    );
  }

  if (error || !aircraft) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error || 'Aircraft not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {aircraft.make} {aircraft.model}
        </h1>
        <p className="text-gray-500 mt-2">Registration: {aircraft.registration}</p>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">
            <Plane className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="availability">
            <Calendar className="h-4 w-4 mr-2" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Settings className="h-4 w-4 mr-2" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="bg-transparent shadow-sm rounded-lg border border-gray-200">
            <AircraftDetails aircraft={aircraft} />
          </div>
        </TabsContent>

        <TabsContent value="availability">
          <div className="bg-transparent shadow-sm rounded-lg border border-gray-200">
            <AircraftAvailability aircraftId={aircraft.id} />
          </div>
        </TabsContent>

        <TabsContent value="maintenance">
          <div className="bg-transparent shadow-sm rounded-lg border border-gray-200">
            <MaintenanceSchedule aircraftId={aircraft.id} />
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="bg-transparent shadow-sm rounded-lg border border-gray-200">
            <AircraftDocuments aircraftId={aircraft.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
