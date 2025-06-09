import { Timestamp } from 'firebase/firestore';
import { FlightRouting, CabinClass, QuoteRequest, Offer } from '@/types/flight';

export type BookingStatus =
  | 'pending-payment' // Default status when booking is created
  | 'deposit-paid' // Partial payment received
  | 'confirmed' // Full payment received
  | 'client-ready' // Payment + passenger manifest complete
  | 'flight-ready' // All criteria met (payment, manifest, operator checklists)
  | 'cancelled' // Cancelled
  | 'credited' // Cancelled and credited
  | 'refunded' // Cancelled and refunded
  | 'archived'; // Archived after flight completion

export interface PassengerDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  nationality: string;
  passportNumber?: string;
  passportExpiry?: Date;
  specialRequirements?: string;
  seatPreference?: string;
}

export interface AircraftDetails {
  id: string;
  registration: string;
  make: string;
  model: string;
  year?: number;
  maxPassengers: number;
  category: string;
  homeBase?: string;
  specifications?: {
    range?: number;
    cruiseSpeed?: number;
    cabinHeight?: number;
    cabinLength?: number;
    cabinWidth?: number;
    bagageCapacity?: number;
  };
}

export interface ClientPreferences {
  specialRequirements?: string;
  twinEngineMin?: boolean;
  preferredCabinClass?: CabinClass;
  mealPreferences?: string[];
  beveragePreferences?: string[];
  extraServices?: string[];
}

export interface OperatorDetails {
  operatorUserCode: string;
  operatorName: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  operatorLicense?: string;
  insuranceDetails?: {
    provider: string;
    policyNumber: string;
    coverage: number;
    expiryDate: Date;
  };
}

export interface FlightDetails {
  flightNumber?: string;
  estimatedDepartureTime?: Timestamp;
  estimatedArrivalTime?: Timestamp;
  estimatedFlightDuration?: number; // in minutes
  actualDepartureTime?: Timestamp;
  actualArrivalTime?: Timestamp;
  flightPath?: string;
  alternateAirports?: string[];
  weatherConditions?: string;
}

export interface PaymentSummary {
  subtotal: number;
  commission: number;
  taxes?: number;
  fees?: number;
  totalAmount: number;
  amountPaid: number;
  amountPending: number;
  currency: string;
  paymentMethod?: string;
  lastPaymentDate?: Timestamp;
}

export interface BookingDocuments {
  invoiceId?: string;
  proformaInvoiceId?: string;
  contractId?: string;
  insuranceCertificateId?: string;
  flightPermits?: string[];
  customsDocuments?: string[];
}

/**
 * Comprehensive Booking Interface
 * The booking is the central hub that brings together all aspects of a flight:
 * Quote Request + Quote + Client + Operator + Aircraft + Passengers + Invoice + Flight Details
 */
export interface Booking {
  // Core Identification
  id: string; // Document ID
  flightId?: string; // Grouping ID for actual flight instance
  bookingId: string; // Human-readable booking ID (e.g., BK-OPERATOR-YYYYMMDD-XXXX)

  // References (removed duplication: only keep requestId, not requestCode)
  requestId: string; // Reference to the original quote request
  quoteId: string; // Reference to the accepted quote/offer

  // Status & Lifecycle
  status: BookingStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archivedAt?: Timestamp; // When booking was archived

  // Core Flight Information
  routing: FlightRouting; // Flight routing details
  flightDetails: FlightDetails; // Actual flight execution details

  // Parties Involved
  clientId: string; // Client user code
  operator: OperatorDetails; // Comprehensive operator information

  // Aircraft & Preferences
  aircraft: AircraftDetails; // Complete aircraft information
  clientPreferences: ClientPreferences; // Client's original preferences and requirements
  cabinClass: CabinClass; // Final cabin class for the flight

  // Passengers
  passengerCount: number;
  passengers: PassengerDetails[]; // Complete passenger manifest

  // Financial
  payment: PaymentSummary; // Comprehensive payment tracking

  // Documents & References
  documents: BookingDocuments; // All related documents and IDs

  // Original Request & Quote Data (embedded for historical reference)
  originalRequest: {
    requestCode: string; // Keep original request code for reference
    submittedAt: Timestamp;
    specialRequirements?: string;
    flexibleDates: boolean;
  };

  acceptedQuote: {
    offerId: string;
    submittedAt: Timestamp;
    validUntil?: Timestamp;
    notes?: string;
    termsAndConditions?: string;
  };

  // Operational
  checklistsCompleted?: {
    operatorChecklist: boolean;
    clientChecklist: boolean;
    documentChecklist: boolean;
    paymentChecklist: boolean;
  };

  // Communication
  notes?: string; // Internal booking notes
  clientNotes?: string; // Notes visible to client
  operatorNotes?: string; // Notes visible to operator
}

// Legacy interface for backward compatibility
export interface LegacyBooking {
  id: string;
  bookingId: string;
  requestId: string;
  requestCode: string; // Will be deprecated
  quoteId: string;
  operatorUserCode: string;
  clientId: string;
  routing: FlightRouting;
  passengerCount: number;
  cabinClass: CabinClass;
  price: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'; // Old status system
  createdAt: Timestamp;
  updatedAt: Timestamp;
  flightNumber?: string;
  operatorName?: string;
  isPaid?: boolean;
}
