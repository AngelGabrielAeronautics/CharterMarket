import { Timestamp } from 'firebase/firestore';

export type TripType = 'oneWay' | 'return' | 'multiCity';
export type FlightStatus = 'pending' | 'quoted' | 'booked' | 'cancelled' | 'expired' | 'draft';
export type CabinClass = 'standard' | 'premium' | 'vip';

export interface FlightRouting {
  departureAirport: string; // ICAO code
  arrivalAirport: string; // ICAO code
  departureDate: Timestamp;
  returnDate?: Timestamp; // Only for return trips
  flexibleDates: boolean; // If true, +/- 2 days from specified dates
}

export interface MultiCityRoute {
  departureAirport: string; // ICAO code
  arrivalAirport: string; // ICAO code
  departureDate: Date;
  flexibleDate: boolean; // If true, +/- 2 days from specified date
}

export type OfferStatus =
  | 'pending-client-acceptance'
  | 'accepted-by-client'
  | 'rejected-by-client'
  | 'expired'
  | 'awaiting-acknowledgement';

export interface Offer {
  offerId: string; // Unique ID for this specific offer (e.g., QT-OPERATORCODE-YYYYMMDD-XXXX)
  operatorId: string; // UserCode of the operator making the offer
  price: number;
  commission: number;
  totalPrice: number;
  offerStatus: OfferStatus; // Status of this specific offer
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QuoteRequest {
  id: string;
  requestCode: string; // Format: RQ-USERCODE-YYYYMMDD-XXXX
  clientUserCode: string; // User ID of the requesting client (renamed from clientId for clarity)
  tripType: TripType;
  routing: FlightRouting;
  passengerCount: number;
  cabinClass: CabinClass;
  specialRequirements?: string;
  twinEngineMin?: boolean;
  status: FlightStatus; // Overall status of the QuoteRequest
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp; // Request expires after 24 hours if no quotes received

  offers?: Offer[]; // Array of offers from operators
  operatorIdsWhoHaveQuoted?: string[]; // Helper array to easily find requests an operator has quoted on
  acceptedOfferId?: string; // The offerId of the offer that was accepted by the client
  acceptedOperatorId?: string; // The operatorId corresponding to the acceptedOfferId
}

export interface QuoteRequestFormData {
  tripType: TripType;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: Date;
  returnDate?: Date;
  flexibleDates: boolean;
  passengerCount: number;
  cabinClass: CabinClass;
  specialRequirements?: string;
  twinEngineMin?: boolean;
  multiCityRoutes?: MultiCityRoute[]; // For multi-city trips
}

// For backward compatibility
export type FlightRequest = QuoteRequest;
export type FlightRequestFormData = QuoteRequestFormData;
