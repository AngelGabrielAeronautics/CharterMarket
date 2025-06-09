import type { Timestamp as ClientTimestamp } from 'firebase/firestore';
import type { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';

// Allow Firestore timestamp from client or admin SDK
export type Timestamp = ClientTimestamp | AdminTimestamp;

export interface Passenger {
  id: string; // Document ID
  passengerId: string; // Generated passenger ID (PAX-USERCODE-XXXX format)
  bookingId: string; // Reference to booking
  firstName: string;
  lastName: string;
  dateOfBirth: Timestamp;
  nationality: string;
  passportNumber: string;
  passportExpiry: Timestamp;
  specialRequirements?: string;
  contactEmail: string;
  contactPhone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PassengerFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  nationality: string;
  passportNumber: string;
  passportExpiry: Date;
  specialRequirements?: string;
  contactEmail: string;
  contactPhone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}
