import { Timestamp } from 'firebase/firestore';

export interface Invoice {
  id: string;
  invoiceId: string;
  bookingId: string;
  clientId: string;
  amount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
