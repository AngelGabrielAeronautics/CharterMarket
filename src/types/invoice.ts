import { Timestamp } from 'firebase/firestore';

export type InvoiceStatus =
  | 'open' // Default status when created
  | 'balance-due' // Partial payment received
  | 'paid'; // Fully paid

export interface PaymentRecord {
  id: string;
  amount: number;
  paymentDate: Timestamp;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceId: string; // New format: INV-{offerId}-{4 random alphanumeric}
  bookingId: string;
  clientId: string; // Client who receives the invoice
  operatorUserCode: string; // Operator providing the service

  // Financial Details
  amount: number; // Total invoice amount
  currency: string; // Invoice currency (default: USD)

  // Payment Tracking
  status: InvoiceStatus;
  amountPaid: number; // Total amount received
  amountPending: number; // Remaining balance
  payments: PaymentRecord[]; // History of payments received

  // References
  offerId?: string; // Reference to the original quote/offer
  requestId?: string; // Reference to the original quote request

  // Invoice Details
  description?: string; // Service description
  dueDate?: Timestamp; // Payment due date

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  paidAt?: Timestamp; // When fully paid

  // Notes
  notes?: string; // Internal notes
  clientNotes?: string; // Notes visible to client
}

// Legacy interface for backward compatibility
export interface LegacyInvoice {
  id: string;
  invoiceId: string;
  bookingId: string;
  clientId: string;
  amount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
