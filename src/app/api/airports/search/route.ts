import { NextResponse } from 'next/server';
import { Airport } from '@/types/airport';

// This is a mock implementation. In a real application, you would:
// 1. Use a real airport database API
// 2. Implement caching
// 3. Add rate limiting
// 4. Add proper error handling
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';

  // Mock airport data - replace with real data source
  const airports: Airport[] = [
    {
      iata: 'JNB',
      icao: 'FAOR',
      name: 'O.R. Tambo International Airport',
      city: 'Johannesburg',
      country: 'South Africa',
      latitude: -26.1392,
      longitude: 28.246,
      timezone: 'Africa/Johannesburg'
    },
    {
      iata: 'CPT',
      icao: 'FACT',
      name: 'Cape Town International Airport',
      city: 'Cape Town',
      country: 'South Africa',
      latitude: -33.9648,
      longitude: 18.6017,
      timezone: 'Africa/Johannesburg'
    },
    // Add more airports as needed
  ];

  // Filter airports based on query
  const filteredAirports = airports.filter(airport => 
    airport.iata.toLowerCase().includes(query) ||
    airport.icao.toLowerCase().includes(query) ||
    airport.name.toLowerCase().includes(query) ||
    airport.city.toLowerCase().includes(query)
  );

  return NextResponse.json(filteredAirports);
} 