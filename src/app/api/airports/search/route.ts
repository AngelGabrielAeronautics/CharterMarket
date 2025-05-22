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
      timezone: 'Africa/Johannesburg',
    },
    {
      iata: 'CPT',
      icao: 'FACT',
      name: 'Cape Town International Airport',
      city: 'Cape Town',
      country: 'South Africa',
      latitude: -33.9648,
      longitude: 18.6017,
      timezone: 'Africa/Johannesburg',
    },
    {
      iata: 'DUR',
      icao: 'FALE',
      name: 'King Shaka International Airport',
      city: 'Durban',
      country: 'South Africa',
      latitude: -29.6144,
      longitude: 31.1197,
      timezone: 'Africa/Johannesburg',
    },
    {
      iata: 'JFK',
      icao: 'KJFK',
      name: 'John F. Kennedy International Airport',
      city: 'New York',
      country: 'United States',
      latitude: 40.6413,
      longitude: -73.7781,
      timezone: 'America/New_York',
    },
    {
      iata: 'LHR',
      icao: 'EGLL',
      name: 'Heathrow Airport',
      city: 'London',
      country: 'United Kingdom',
      latitude: 51.47,
      longitude: -0.4543,
      timezone: 'Europe/London',
    },
    {
      iata: 'DXB',
      icao: 'OMDB',
      name: 'Dubai International Airport',
      city: 'Dubai',
      country: 'United Arab Emirates',
      latitude: 25.2528,
      longitude: 55.3644,
      timezone: 'Asia/Dubai',
    },
    {
      iata: 'SYD',
      icao: 'YSSY',
      name: 'Sydney Kingsford Smith Airport',
      city: 'Sydney',
      country: 'Australia',
      latitude: -33.9399,
      longitude: 151.1753,
      timezone: 'Australia/Sydney',
    },
    {
      iata: 'CDG',
      icao: 'LFPG',
      name: 'Charles de Gaulle Airport',
      city: 'Paris',
      country: 'France',
      latitude: 49.0097,
      longitude: 2.5479,
      timezone: 'Europe/Paris',
    },
    {
      iata: 'NBO',
      icao: 'HKJK',
      name: 'Jomo Kenyatta International Airport',
      city: 'Nairobi',
      country: 'Kenya',
      latitude: -1.3192,
      longitude: 36.9258,
      timezone: 'Africa/Nairobi',
    },
    {
      iata: 'LAX',
      icao: 'KLAX',
      name: 'Los Angeles International Airport',
      city: 'Los Angeles',
      country: 'United States',
      latitude: 33.9416,
      longitude: -118.4085,
      timezone: 'America/Los_Angeles',
    },
    {
      iata: 'JER',
      icao: 'EGJJ',
      name: 'Jersey Airport',
      city: 'Saint Peter',
      country: 'Jersey',
      latitude: 49.2077,
      longitude: -2.1955,
      timezone: 'Europe/London',
    },
    {
      iata: 'GCI',
      icao: 'EGJB',
      name: 'Guernsey Airport',
      city: 'Saint Peter Port',
      country: 'Guernsey',
      latitude: 49.4275,
      longitude: -2.6044,
      timezone: 'Europe/London',
    },
  ];

  // Filter airports based on query
  const filteredAirports = airports.filter(
    (airport) =>
      airport.iata.toLowerCase().includes(query) ||
      airport.icao.toLowerCase().includes(query) ||
      airport.name.toLowerCase().includes(query) ||
      airport.city.toLowerCase().includes(query) ||
      airport.country.toLowerCase().includes(query)
  );

  return NextResponse.json(filteredAirports);
}
