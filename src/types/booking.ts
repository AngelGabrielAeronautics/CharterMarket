import { Timestamp } from 'firebase/firestore';
import { FlightRouting, CabinClass } from '@/types/flight';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  bookingId: string;
  requestId: string;
  requestCode: string;
  quoteId: string;
  operatorId: string;
  clientId: string;
  routing: FlightRouting;
  passengerCount: number;
  cabinClass: CabinClass;
  price: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  flightNumber?: string;
  operatorName?: string;
  isPaid?: boolean;
}
