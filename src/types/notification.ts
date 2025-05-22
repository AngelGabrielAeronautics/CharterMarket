import { Timestamp } from 'firebase/firestore';

export type NotificationType =
  | 'REQUEST_SUBMITTED'
  | 'QUOTE_RECEIVED'
  | 'QUOTE_ACCEPTED'
  | 'PAYMENT_REQUIRED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_PENDING' // For admin notifications about pending payments
  | 'PAYMENT_CONFIRMED' // For client notifications about confirmed payments
  | 'FLIGHT_CONFIRMED'
  | 'FLIGHT_CANCELLED'
  | 'REQUEST_DECLINED' // Added for when an operator declines a quote request
  | 'DOCUMENTS_REQUIRED'
  | 'DOCUMENTS_APPROVED'
  | 'PASSENGER_ADDED' // For notifications about passenger manifest updates
  | 'PASSENGER_UPDATED' // For admin notifications about passenger updates
  | 'FLIGHT_REMINDER'
  | 'FLIGHT_COMPLETED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  metadata?: {
    quoteRequestId?: string;
    quoteId?: string;
    operatorId?: string;
    paymentId?: string;
    bookingId?: string;
    invoiceId?: string;
    documentId?: string;
    passengerId?: string; // Added for passenger-related notifications
  };
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  types: {
    [K in NotificationType]: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}
