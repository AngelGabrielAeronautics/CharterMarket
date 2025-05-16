import { Timestamp } from 'firebase/firestore';

export interface Invoice {
  id: string;
  invoiceId: string;
  bookingId: string;
  amount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
} 