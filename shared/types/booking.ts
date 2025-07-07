// Simplified booking types for mobile app
export interface BookingFormData {
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  isRoundTrip: boolean;
  flightType?: 'one-way' | 'return';
  preferredDepartureTime?: string;
  preferredArrivalTime?: string;
}

export interface BookingDetails {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalPrice: number;
  currency: string;
  createdAt: string;
}

export interface PassengerInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber?: string;
  nationality?: string;
} 