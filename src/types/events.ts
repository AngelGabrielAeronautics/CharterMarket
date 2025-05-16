import { EventCategory, EventType, EventSeverity, JsonValue } from './event';
import { Timestamp } from 'firebase/firestore';

// Re-export the comprehensive types from event.ts
export type { EventCategory, EventType, EventSeverity, JsonValue } from './event';

// Define a type for metadata values that extends JsonValue but also allows Date objects
export type MetadataValue = 
  | JsonValue
  | Date
  | MetadataValue[]
  | { [key: string]: MetadataValue };

// Simplified event interface for client-side usage
export interface Event {
  id: string;
  timestamp: string | Timestamp;
  category: EventCategory;
  type: EventType;
  severity: EventSeverity;
  description: string;
  userId?: string;
  userCode?: string;
  operatorId?: string;
  metadata?: Record<string, MetadataValue>;
  data?: Record<string, JsonValue>;
}

// Add conversion utilities
export const convertTimestampToString = (timestamp: Timestamp): string => {
  return timestamp.toDate().toISOString();
};

export const convertStringToTimestamp = (dateString: string): Timestamp => {
  return Timestamp.fromDate(new Date(dateString));
}; 