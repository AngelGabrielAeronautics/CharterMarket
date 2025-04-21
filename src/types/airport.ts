export interface Airport {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface AirportSearchResult {
  icao: string;
  label: string;  // Formatted as "ICAO - Airport Name (City)"
  airport: Airport;
} 