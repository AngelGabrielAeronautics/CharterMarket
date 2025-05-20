import { Timestamp } from 'firebase/firestore';

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
