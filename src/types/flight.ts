import { Timestamp } from 'firebase/firestore';

export type TripType = 'oneWay' | 'return';
export type FlightStatus = 'draft' | 'pending' | 'quoted' | 'accepted' | 'confirmed' | 'completed' | 'cancelled';
export type CabinClass = 'standard' | 'premium' | 'vip';

export interface FlightRouting {
  departureAirport: string;  // ICAO code
  arrivalAirport: string;    // ICAO code
  departureDate: Timestamp;
  returnDate?: Timestamp;    // Only for return trips
  flexibleDates: boolean;    // If true, +/- 2 days from specified dates
}

export interface FlightRequest {
  id: string;
  requestCode: string;       // Format: FLT-OPERATORCODE-YYYYMMDD-XXXX
  clientId: string;         // User ID of the requesting client
  operatorId: string;       // User code or ID of the operator handling this request
  tripType: TripType;
  routing: FlightRouting;
  passengerCount: number;
  cabinClass: CabinClass;
  specialRequirements?: string;
  status: FlightStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;     // Request expires after 24 hours if no quotes received
}

export interface FlightRequestFormData {
  tripType: TripType;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: Date;
  returnDate?: Date;
  flexibleDates: boolean;
  passengerCount: number;
  cabinClass: CabinClass;
  specialRequirements?: string;
} 