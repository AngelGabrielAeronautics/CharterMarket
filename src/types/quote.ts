import { Timestamp } from 'firebase/firestore';

export type QuoteStatus = 'pending' | 'accepted' | 'rejected';

export interface Quote {
  id: string;
  quoteId: string;
  requestId: string;
  operatorId: string;
  price: number;
  commission: number;
  totalPrice: number;
  status: QuoteStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QuoteFormData {
  price: number;
} 