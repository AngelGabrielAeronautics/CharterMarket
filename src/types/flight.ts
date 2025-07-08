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
  currency?: string; // Quote currency (defaults to operator's preferred currency or USD)
  notes?: string; // Additional notes from operator
  attachments?: { // Array of PDF attachments (up to 5, visible to operator and admin only)
    url: string;
    fileName: string;
    uploadedAt: Timestamp;
  }[];
  // Legacy fields for backward compatibility
  attachmentUrl?: string; // @deprecated - use attachments array instead
  attachmentFileName?: string; // @deprecated - use attachments array instead
  offerStatus: OfferStatus; // Status of this specific offer
  createdAt: Timestamp;
  updatedAt: Timestamp;
  responseTimeMinutes?: number; // Time taken to respond to the quote request (in minutes)
  // Aircraft selection
  aircraftId?: string; // ID of the selected aircraft from operator's fleet
  aircraftDetails?: {
    id: string;
    registration: string;
    make: string;
    model: string;
    type: string;
    maxPassengers: number;
  };
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

  // Aircraft & Baggage Options
  twinEngineMin: boolean;
  pressurisedCabin?: boolean;
  twoCrewMin?: boolean;
  hasPets?: boolean;
  petDetails?: string;
  hasExtraBaggage?: boolean;
  baggageDetails?: string;
  hasHardBags?: boolean;
  hardBagsDetails?: string;
  additionalNotes?: string;

  status: FlightStatus; // Overall status of the QuoteRequest
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Note: expiresAt removed - quotes expire, not quote requests

  offers?: Offer[]; // Array of offers from operators
  operatorUserCodesWhoHaveQuoted?: string[]; // Helper array to easily find requests an operator has quoted on
  acceptedOfferId?: string; // The offerId of the offer that was accepted by the client
  acceptedOperatorUserCode?: string; // The operatorUserCode corresponding to the acceptedOfferId

  multiCityRoutes?: MultiCityRoute[]; // For multi-city trips
}

export interface QuoteRequestFormData {
  tripType: TripType;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: Date;
  returnDate?: Date;
  flexibleDates: boolean;
  passengerCount: number;

  // Aircraft & Baggage Options
  twinEngineMin?: boolean;
  pressurisedCabin?: boolean;
  twoCrewMin?: boolean;
  hasExtraBaggage?: boolean;
  hasPets?: boolean;
  hasHardBags?: boolean;
  baggageDetails?: string;
  petDetails?: string;
  hardBagsDetails?: string;
  additionalNotes?: string;

  multiCityRoutes?: MultiCityRoute[]; // For multi-city trips
}

// For backward compatibility
export type FlightRequest = QuoteRequest;
export type FlightRequestFormData = QuoteRequestFormData;

// New flight leg system
export type FlightLegType = 'passenger' | 'empty';
export type FlightLegStatus =
  | 'scheduled'
  | 'available'
  | 'booked'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

export interface FlightLeg {
  legNumber: number; // 1, 2, 3, etc.
  flightNumber: string; // Full flight number including leg: FLT-OP-OPER-WS1L-W12L0A-1
  legType: FlightLegType; // 'passenger' (booked leg) or 'empty' (return/positioning leg)
  status: FlightLegStatus;

  // Route information
  departureAirport: string; // ICAO code
  arrivalAirport: string; // ICAO code
  departureAirportName?: string;
  arrivalAirportName?: string;
  scheduledDepartureTime: Timestamp;
  scheduledArrivalTime: Timestamp;
  estimatedDepartureTime?: Timestamp;
  estimatedArrivalTime?: Timestamp;
  actualDepartureTime?: Timestamp;
  actualArrivalTime?: Timestamp;

  // Booking information (only for passenger legs)
  bookingIds?: string[]; // Multiple bookings can share a leg
  availableSeats?: number; // For empty legs that could take passengers
  maxSeats: number; // Total seats available on aircraft

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Flight {
  id: string; // Firestore document ID
  flightGroupId: string; // Base flight ID without leg suffix: FLT-OP-OPER-WS1L-W12L0A
  operatorUserCode: string;
  aircraftId: string;

  // All legs associated with this flight
  legs: FlightLeg[];

  // Flight metadata
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  totalLegs: number;

  // Original booking information
  primaryBookingId?: string; // The booking that initiated this flight
  originalQuoteRequestId?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper interface for flight creation
export interface CreateFlightData {
  operatorUserCode: string;
  aircraftId: string;
  primaryBookingId: string;
  originalQuoteRequestId: string;

  // Primary leg (the booked passenger leg)
  primaryLeg: {
    departureAirport: string;
    arrivalAirport: string;
    departureAirportName?: string;
    arrivalAirportName?: string;
    scheduledDepartureTime: Timestamp;
    scheduledArrivalTime: Timestamp;
    maxSeats: number;
    bookingIds: string[];
  };

  // Optional return/positioning leg (empty leg)
  returnLeg?: {
    departureAirport: string; // Same as primaryLeg.arrivalAirport
    arrivalAirport: string; // Same as primaryLeg.departureAirport or different destination
    scheduledDepartureTime: Timestamp;
    scheduledArrivalTime: Timestamp;
    maxSeats: number;
  };
}
