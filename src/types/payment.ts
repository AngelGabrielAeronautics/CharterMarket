import { Timestamp } from 'firebase/firestore';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'paid' | 'overdue';

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
  dueDate?: Timestamp; // Due date for pending/overdue payments
  processedDate?: Timestamp; // When payment was processed/verified by admin
  processedBy?: string; // Admin userCode who processed the payment
  operatorPaid?: boolean; // Flag indicating if operator has been paid
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
