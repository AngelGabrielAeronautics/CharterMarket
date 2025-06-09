import { Timestamp } from 'firebase/firestore';

export type TripType = 'oneWay' | 'return' | 'multiCity';
export type FlightStatus =
  // New quote request statuses
  | 'submitted' // Initial status when quote request is created
  | 'under-operator-review' // When any operator has viewed the request
  | 'under-offer' // When any operator has submitted an offer
  | 'accepted' // When user accepts an offer
  // Legacy statuses (for backward compatibility)
  | 'pending'
  | 'quoted'
  | 'booked'
  | 'cancelled'
  | 'expired'
  | 'draft';

export type CabinClass = 'standard' | 'premium' | 'vip';

export interface FlightRouting {
  departureAirport: string; // ICAO code
  arrivalAirport: string; // ICAO code
  departureAirportName?: string;
  arrivalAirportName?: string;
  departureDate: Timestamp;
  returnDate?: Timestamp; // Only for return trips
  flexibleDates: boolean; // If true, +/- 2 days from specified dates
}

export interface MultiCityRoute {
  departureAirport: string; // ICAO code
  arrivalAirport: string; // ICAO code
  departureAirportName?: string;
  arrivalAirportName?: string;
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
  operatorUserCode: string; // UserCode of the operator making the offer
  clientUserCode?: string; // UserCode of the originating client (for reference and permissions)
  price: number;
  commission: number;
  totalPrice: number;
  offerStatus: OfferStatus; // Status of this specific offer
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QuoteRequest {
  id: string;
  requestCode: string; // Format: QR-USERCODE-YYYYMMDD-XXXX
  clientUserCode: string; // User ID of the requesting client (renamed from clientId for clarity)
  tripType: TripType;
  routing: FlightRouting;
  departureAirportName?: string; // Full name of the departure airport
  arrivalAirportName?: string; // Full name of the arrival airport
  passengerCount: number;
  specialRequirements?: string;
  twinEngineMin?: boolean;
  status: FlightStatus; // Overall status of the QuoteRequest
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Note: expiresAt removed - quotes expire, not quote requests

  offers?: Offer[]; // Array of offers from operators
  operatorUserCodesWhoHaveQuoted?: string[]; // Helper array to easily find requests an operator has quoted on
  acceptedOfferId?: string; // The offerId of the offer that was accepted by the client
  acceptedOperatorUserCode?: string; // The operatorUserCode corresponding to the acceptedOfferId
}

export interface QuoteRequestFormData {
  tripType: TripType;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: Date;
  returnDate?: Date;
  flexibleDates: boolean;
  passengerCount: number;
  specialRequirements?: string;
  twinEngineMin?: boolean;
  multiCityRoutes?: MultiCityRoute[]; // For multi-city trips
}

// For backward compatibility
export type FlightRequest = QuoteRequest;
export type FlightRequestFormData = QuoteRequestFormData;
