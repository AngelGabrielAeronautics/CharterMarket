'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Aircraft } from '@/types/aircraft';
import { Search, SlidersHorizontal, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface AircraftSearchProps {
  aircraft: Aircraft[];
  onSearch: (filters: AircraftSearchFilters) => void;
}

interface AircraftSearchFilters {
  searchTerm: string;
  manufacturer?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPassengers?: number;
  maxPassengers?: number;
  minRange?: number;
  maxRange?: number;
  status?: string;
}

export default function AircraftSearch({ aircraft, onSearch }: AircraftSearchProps) {
  const [filters, setFilters] = useState<AircraftSearchFilters>({
    searchTerm: '',
  });

  const [activeFilter, setActiveFilter] = useState<string>('basic');

  const handleFilterChange = (filterName: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const manufacturers = [...new Set(aircraft.map(a => a.manufacturer))];
  const statuses = [...new Set(aircraft.map(a => a.status))];

  const filteredAircraft = aircraft.filter(a => {
    // Search term filter
    const searchMatch = 
      filters.searchTerm === '' ||
      a.model.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      a.manufacturer.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      a.registration.toLowerCase().includes(filters.searchTerm.toLowerCase());

    // Numeric filters
    const passengerMatch = 
      a.maxPassengers >= (filters.minPassengers || 0) && 
      a.maxPassengers <= (filters.maxPassengers || 100);
    
    const rangeMatch = 
      a.maxRange >= (filters.minRange || 0) && 
      a.maxRange <= (filters.maxRange || 10000);

    // Array filters
    const manufacturerMatch = 
      (filters.manufacturer === undefined || filters.manufacturer === '') || 
      a.manufacturer.toLowerCase().includes(filters.manufacturer.toLowerCase());
    
    const statusMatch = 
      (filters.status === undefined || filters.status === '') || 
      a.status.toLowerCase().includes(filters.status.toLowerCase());

    return searchMatch && passengerMatch && rangeMatch && manufacturerMatch && statusMatch;
  });

  const toggleManufacturer = (manufacturer: string) => {
    setFilters(prev => ({
      ...prev,
      manufacturer: prev.manufacturer === manufacturer ? undefined : manufacturer,
    }));
  };

  const toggleStatus = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status === status ? undefined : status,
    }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search aircraft by model, manufacturer, or registration"
              value={filters.searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setActiveFilter('advanced')}
          >
            <SlidersHorizontal className="h-5 w-5 mr-2" />
            Advanced Search
          </Button>
          {(filters.searchTerm || filters.manufacturer || filters.status) && (
            <Button
              variant="ghost"
              onClick={resetFilters}
            >
              <X className="h-5 w-5 mr-2" />
              Reset
            </Button>
          )}
        </div>

        {activeFilter === 'advanced' && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Passenger Capacity</h4>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPassengers || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('minPassengers', parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  <span>to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPassengers || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('maxPassengers', parseInt(e.target.value) || 100)}
                    className="w-24"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Range (nm)</h4>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minRange || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('minRange', parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  <span>to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxRange || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('maxRange', parseInt(e.target.value) || 10000)}
                    className="w-24"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Manufacturer</h4>
              <div className="flex flex-wrap gap-2">
                {manufacturers.map((manufacturer) => (
                  <Button
                    key={manufacturer}
                    variant={filters.manufacturer === manufacturer ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => toggleManufacturer(manufacturer)}
                  >
                    {manufacturer}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Status</h4>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <Button
                    key={status}
                    variant={filters.status === status ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => toggleStatus(status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAircraft.map((aircraft) => (
          <Link
            key={aircraft.id}
            href={`/dashboard/aircraft/${aircraft.id}`}
            className="block group"
          >
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-shadow hover:shadow-lg">
              <div className="aspect-w-16 aspect-h-9 relative">
                {aircraft.images[0] ? (
                  <Image
                    src={aircraft.images[0]}
                    alt={`${aircraft.manufacturer} ${aircraft.model}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 text-xs rounded">
                  {aircraft.status}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                  {aircraft.manufacturer} {aircraft.model}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Registration: {aircraft.registration}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Passengers</p>
                    <p className="font-medium">{aircraft.maxPassengers}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Range</p>
                    <p className="font-medium">{aircraft.maxRange} nm</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredAircraft.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No aircraft found matching your criteria</p>
        </div>
      )}
    </div>
  );
} 