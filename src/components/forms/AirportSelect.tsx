import { useState, useEffect } from 'react';
import { Airport } from '@/types/airport';
import { Select } from './Select';

interface AirportSelectProps {
  value?: string;
  onChange: (value: string) => void;
  name: string;
  label?: string;
  required?: boolean;
  error?: string;
}

export function AirportSelect({ 
  value, 
  onChange, 
  name, 
  label = 'Base Airport', 
  required = false,
  error
}: AirportSelectProps) {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchAirports = async () => {
      if (searchQuery.length < 2) {
        setAirports([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/airports/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setAirports(data);
      } catch (error) {
        console.error('Error searching airports:', error);
        setAirports([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchAirports, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const options = airports.map(airport => ({
    value: airport.icao,
    label: `${airport.name} (${airport.iata}/${airport.icao}) - ${airport.city}, ${airport.country}`
  }));

  return (
    <Select
      name={name}
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      required={required}
      isLoading={isLoading}
      onInputChange={setSearchQuery}
      placeholder="Search for an airport..."
      noOptionsMessage={() => searchQuery.length < 2 ? 'Type at least 2 characters to search' : 'No airports found'}
      error={error}
    />
  );
} 