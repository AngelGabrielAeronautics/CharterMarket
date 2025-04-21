'use client';

import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Airport } from '@/types/airport';

interface AirportSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export default function AirportSelect({
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder = 'Search for an airport...',
  className = '',
}: AirportSelectProps) {
  const [query, setQuery] = useState('');
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAirports = async () => {
      if (query.length < 2) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/airports/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setAirports(data);
      } catch (error) {
        console.error('Error fetching airports:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchAirports, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const filteredAirports = airports.filter((airport) =>
    airport.iata.toLowerCase().includes(query.toLowerCase()) ||
    airport.name.toLowerCase().includes(query.toLowerCase()) ||
    airport.city.toLowerCase().includes(query.toLowerCase())
  );

  const selectedAirport = airports.find((airport) => airport.iata === value);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Combobox value={value} onChange={onChange}>
        <div className="relative">
          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
            <Combobox.Input
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
              displayValue={(airport: string) => {
                const found = airports.find(a => a.iata === airport);
                return found ? `${found.iata} - ${found.name}, ${found.city}` : airport;
              }}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
            {loading ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                Loading...
              </div>
            ) : filteredAirports.length === 0 ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                No airports found.
              </div>
            ) : (
              filteredAirports.map((airport) => (
                <Combobox.Option
                  key={airport.iata}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-teal-600 text-white' : 'text-gray-900'
                    }`
                  }
                  value={airport.iata}
                >
                  {({ selected, active }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {airport.iata} - {airport.name}, {airport.city}
                      </span>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? 'text-white' : 'text-teal-600'
                          }`}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </div>
      </Combobox>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
} 