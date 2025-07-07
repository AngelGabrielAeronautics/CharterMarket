// Simplified flight types for mobile app
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface FlightRouting {
  departure: Airport;
  arrival: Airport;
  departureDate: string;
  arrivalDate?: string;
}

export interface CabinClass {
  id: string;
  name: string;
  description: string;
}

export interface QuoteRequest {
  id: string;
  routing: FlightRouting;
  passengers: number;
  isRoundTrip: boolean;
  status: 'pending' | 'quoted' | 'booked' | 'cancelled';
  createdAt: string;
}

export interface Offer {
  id: string;
  quoteRequestId: string;
  operatorId: string;
  aircraftType: string;
  totalPrice: number;
  currency: string;
  validUntil: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
} 