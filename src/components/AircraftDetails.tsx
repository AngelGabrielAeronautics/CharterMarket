'use client';

import { Aircraft } from '@/types/aircraft';
import { Button } from '@/components/ui/Button';
import { Edit } from 'lucide-react';
import Link from 'next/link';
import AircraftImageGallery from './AircraftImageGallery';

interface AircraftDetailsProps {
  aircraft: Aircraft;
}

export default function AircraftDetails({ aircraft }: AircraftDetailsProps) {
  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">Aircraft Information</h2>
          <p className="text-gray-500 mt-1">
            Last updated: {aircraft.updatedAt.toDate().toLocaleDateString()}
          </p>
        </div>
        <Link href={`/dashboard/aircraft/${aircraft.id}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Aircraft
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Basic Information</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Registration</dt>
                <dd className="mt-1 text-sm text-gray-900">{aircraft.registration}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Manufacturer</dt>
                <dd className="mt-1 text-sm text-gray-900">{aircraft.manufacturer}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Model</dt>
                <dd className="mt-1 text-sm text-gray-900">{aircraft.model}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Year</dt>
                <dd className="mt-1 text-sm text-gray-900">{aircraft.year}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${aircraft.status === 'active' ? 'bg-green-100 text-green-800' :
                    aircraft.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'}`}>
                    {aircraft.status.charAt(0).toUpperCase() + aircraft.status.slice(1)}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Performance</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Maximum Passengers</dt>
                <dd className="mt-1 text-sm text-gray-900">{aircraft.maxPassengers}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Range</dt>
                <dd className="mt-1 text-sm text-gray-900">{aircraft.maxRange} nm</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Maximum Speed</dt>
                <dd className="mt-1 text-sm text-gray-900">{aircraft.maxSpeed} kts</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Cabin Dimensions</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Height</dt>
                <dd className="mt-1 text-sm text-gray-900">{aircraft.cabinHeight} ft</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Width</dt>
                <dd className="mt-1 text-sm text-gray-900">{aircraft.cabinWidth} ft</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Length</dt>
                <dd className="mt-1 text-sm text-gray-900">{aircraft.cabinLength} ft</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Baggage Capacity</dt>
                <dd className="mt-1 text-sm text-gray-900">{aircraft.baggageCapacity} cu ft</dd>
              </div>
            </dl>
          </div>

          {aircraft.features && aircraft.features.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Features & Amenities</h3>
              <ul className="grid grid-cols-2 gap-2">
                {aircraft.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Aircraft Images</h3>
        <AircraftImageGallery
          aircraftId={aircraft.id}
          images={aircraft.images.map((url, index) => ({
            id: `${index}`,
            url,
            type: index === 0 ? 'exterior' : 'interior',
            isPrimary: index === 0,
            aircraftId: aircraft.id,
            createdAt: aircraft.createdAt,
            updatedAt: aircraft.updatedAt,
          }))}
          onImagesUpdate={() => {}}
        />
      </div>
    </div>
  );
} 