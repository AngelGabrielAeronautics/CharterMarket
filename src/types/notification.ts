import { Timestamp } from 'firebase/firestore';

export type NotificationType = 
  | 'REQUEST_SUBMITTED'
  | 'QUOTE_RECEIVED'
  | 'QUOTE_ACCEPTED'
  | 'PAYMENT_REQUIRED'
  | 'PAYMENT_RECEIVED'
  | 'FLIGHT_CONFIRMED'
  | 'FLIGHT_CANCELLED'
  | 'DOCUMENTS_REQUIRED'
  | 'DOCUMENTS_APPROVED'
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
    flightRequestId?: string;
    quoteId?: string;
    operatorId?: string;
    paymentId?: string;
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