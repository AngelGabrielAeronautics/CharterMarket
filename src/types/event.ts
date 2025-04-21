import { Timestamp } from 'firebase/firestore';

export enum EventCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AIRCRAFT = 'AIRCRAFT',
  FLIGHT = 'FLIGHT',
  QUOTE = 'QUOTE',
  BOOKING = 'BOOKING',
  PAYMENT = 'PAYMENT',
  USER = 'USER',
  SYSTEM = 'SYSTEM'
}

export enum EventType {
  // Authentication Events
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  VERIFICATION_EMAIL_SENT = 'VERIFICATION_EMAIL_SENT',
  VERIFICATION_EMAIL_FAILED = 'VERIFICATION_EMAIL_FAILED',

  // Aircraft Events
  AIRCRAFT_CREATED = 'AIRCRAFT_CREATED',
  AIRCRAFT_UPDATED = 'AIRCRAFT_UPDATED',
  AIRCRAFT_DELETED = 'AIRCRAFT_DELETED',
  AIRCRAFT_STATUS_CHANGED = 'AIRCRAFT_STATUS_CHANGED',
  AIRCRAFT_MAINTENANCE = 'AIRCRAFT_MAINTENANCE',
  AIRCRAFT_AVAILABILITY = 'AIRCRAFT_AVAILABILITY',

  // Flight Events
  FLIGHT_REQUESTED = 'FLIGHT_REQUESTED',
  FLIGHT_QUOTED = 'FLIGHT_QUOTED',
  FLIGHT_BOOKED = 'FLIGHT_BOOKED',
  FLIGHT_CANCELLED = 'FLIGHT_CANCELLED',
  FLIGHT_COMPLETED = 'FLIGHT_COMPLETED',
  FLIGHT_DELAYED = 'FLIGHT_DELAYED',
  FLIGHT_ROUTE_CHANGED = 'FLIGHT_ROUTE_CHANGED',
  FLIGHT_PASSENGER_ADDED = 'FLIGHT_PASSENGER_ADDED',
  FLIGHT_PASSENGER_REMOVED = 'FLIGHT_PASSENGER_REMOVED',

  // Quote Events
  QUOTE_CREATED = 'QUOTE_CREATED',
  QUOTE_ACCEPTED = 'QUOTE_ACCEPTED',
  QUOTE_REJECTED = 'QUOTE_REJECTED',
  QUOTE_EXPIRED = 'QUOTE_EXPIRED',
  QUOTE_UPDATED = 'QUOTE_UPDATED',
  QUOTE_CANCELLED = 'QUOTE_CANCELLED',

  // Booking Events
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_UPDATED = 'BOOKING_UPDATED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_PENDING = 'BOOKING_PENDING',

  // Payment Events
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_DISPUTED = 'PAYMENT_DISPUTED',

  // User Events
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  PREFERENCES_UPDATED = 'PREFERENCES_UPDATED',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  EMAIL_CHANGED = 'EMAIL_CHANGED',
  ROLE_CHANGED = 'ROLE_CHANGED',

  // System Events
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  SECURITY_ALERT = 'SECURITY_ALERT'
}

export enum EventSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO',
  ERROR = 'ERROR'
}

export interface EventMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
  };
  screenResolution?: {
    width: number;
    height: number;
  };
  referrer?: string;
  sessionId?: string;
  requestId?: string;
}

export interface EventData {
  [key: string]: any;
  // Common fields that might be present in most events
  entityId?: string;
  entityType?: string;
  previousValue?: any;
  newValue?: any;
  reason?: string;
  affectedUsers?: string[];
  duration?: number;
  status?: string;
}

export interface EventLog {
  id: string;
  timestamp: Timestamp;
  category: EventCategory;
  type: EventType;
  severity: EventSeverity;
  userId: string;
  userCode: string;
  userRole: string;
  description: string;
  metadata: EventMetadata;
  data: EventData;
  // Additional fields for better organization and querying
  operatorCode?: string;
  aircraftId?: string;
  flightId?: string;
  quoteId?: string;
  bookingId?: string;
  paymentId?: string;
  clientId?: string;
}

export interface EventLogFilter {
  startDate?: Date;
  endDate?: Date;
  category?: EventCategory;
  type?: EventType;
  severity?: EventSeverity;
  userId?: string;
  userCode?: string;
  userRole?: string;
  searchTerm?: string;
  operatorCode?: string;
  aircraftId?: string;
  flightId?: string;
  quoteId?: string;
  bookingId?: string;
  paymentId?: string;
  clientId?: string;
  limit?: number;
  offset?: number;
} 