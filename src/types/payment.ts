import { Timestamp } from 'firebase/firestore';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  paymentId: string; // Custom generated payment ID
  bookingId: string; // Reference to booking
  invoiceId: string; // Reference to invoice
  amount: number; // Payment amount
  status: PaymentStatus; // Current payment status
  paymentMethod: string; // e.g., 'bank_transfer', 'credit_card', etc.
  paymentReference?: string; // Reference number for the payment
  notes?: string; // Admin notes about payment
  paymentDate?: Timestamp; // When payment was made
  processedDate?: Timestamp; // When payment was processed/verified by admin
  processedBy?: string; // Admin userCode who processed the payment
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PaymentFormData {
  amount: number;
  paymentMethod: string;
  paymentReference?: string;
  notes?: string;
  paymentDate?: Date;
}
