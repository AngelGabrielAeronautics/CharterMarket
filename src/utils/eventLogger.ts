import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit as limitQuery, startAfter, Timestamp } from 'firebase/firestore';
import { EventCategory, EventData, EventLog, EventMetadata, EventSeverity, EventType } from '@/types/event';
import { MetadataValue, convertTimestampToString } from '@/types/events';
import { EventLogFilter } from '@/types/event';

interface LogEventParams {
  category: EventCategory;
  type: EventType;
  severity: EventSeverity;
  userId: string;
  userCode: string;
  userRole: string;
  description: string;
  metadata?: EventMetadata;
  data?: EventData;
  operatorCode?: string;
  aircraftId?: string;
  flightId?: string;
  quoteId?: string;
  bookingId?: string;
  paymentId?: string;
  clientId?: string;
}

/**
 * Log an event to Firestore
 * @param params Event parameters
 * @returns The ID of the logged event
 */
export async function logEvent(params: LogEventParams): Promise<string> {
  try {
    const eventData: Omit<EventLog, 'id' | 'timestamp'> = {
      category: params.category,
      type: params.type,
      severity: params.severity,
      userId: params.userId,
      userCode: params.userCode,
      userRole: params.userRole,
      description: params.description,
      metadata: params.metadata || {},
      data: params.data || {},
      ...(params.operatorCode && { operatorCode: params.operatorCode }),
      ...(params.aircraftId && { aircraftId: params.aircraftId }),
      ...(params.flightId && { flightId: params.flightId }),
      ...(params.quoteId && { quoteId: params.quoteId }),
      ...(params.bookingId && { bookingId: params.bookingId }),
      ...(params.paymentId && { paymentId: params.paymentId }),
      ...(params.clientId && { clientId: params.clientId }),
    };

    // Add browser/device metadata if not provided
    if (!eventData.metadata.userAgent && typeof window !== 'undefined') {
      eventData.metadata = {
        ...eventData.metadata,
        userAgent: window.navigator.userAgent,
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        screenResolution: {
          width: window.screen.width,
          height: window.screen.height,
        },
      };
    }

    const docRef = await addDoc(collection(db, 'eventLogs'), {
      ...eventData,
      timestamp: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error logging event:', error);
    // Still attempt to log the error to the console even if Firebase logging fails
    return '';
  }
}

/**
 * Get the device type based on user agent
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = window.navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Get the browser information
 */
function getBrowserInfo(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = window.navigator.userAgent;
  let browserName = 'unknown';
  
  if (ua.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
  } else if (ua.indexOf('Safari') > -1) {
    browserName = 'Safari';
  } else if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
  } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1) {
    browserName = 'Internet Explorer';
  } else if (ua.indexOf('Edge') > -1) {
    browserName = 'Edge';
  }
  
  return browserName;
}

// Convenience functions for common event types
export function logAuthEvent(
  type: Extract<EventType, 
    | EventType.LOGIN 
    | EventType.LOGOUT 
    | EventType.REGISTER 
    | EventType.PASSWORD_RESET 
    | EventType.EMAIL_VERIFICATION
    | EventType.VERIFICATION_EMAIL_SENT 
    | EventType.VERIFICATION_EMAIL_FAILED>,
  params: Omit<LogEventParams, 'category' | 'type'> 
): Promise<string> {
  return logEvent({
    ...params,
    category: EventCategory.AUTHENTICATION,
    type,
  });
}

export function logUserEvent(
  type: Extract<EventType, 
    | EventType.PROFILE_UPDATED 
    | EventType.PREFERENCES_UPDATED 
    | EventType.SETTINGS_CHANGED 
    | EventType.PASSWORD_CHANGED
    | EventType.EMAIL_CHANGED
    | EventType.ROLE_CHANGED>,
  params: Omit<LogEventParams, 'category' | 'type'> 
): Promise<string> {
  return logEvent({
    ...params,
    category: EventCategory.USER,
    type,
  });
}

export function logSystemError(
  description: string,
  error: Error,
  params: Partial<Omit<LogEventParams, 'category' | 'type' | 'severity' | 'description'>> 
): Promise<string> {
  return logEvent({
    category: EventCategory.SYSTEM,
    type: EventType.ERROR,
    severity: EventSeverity.ERROR,
    description,
    data: {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack ?? '',
    },
    userId: params.userId || 'system',
    userCode: params.userCode || 'system',
    userRole: params.userRole || 'system',
    ...params,
  });
}

/**
 * Fetches paginated event logs based on filters
 */
export async function getEventLogs(
  filter: EventLogFilter = {}
): Promise<{ events: EventLog[]; total: number }> {
  try {
    let q = query(collection(db, 'eventLogs'), orderBy('timestamp', 'desc'));
    if (filter.startDate) q = query(q, where('timestamp', '>=', Timestamp.fromDate(filter.startDate)));
    if (filter.endDate) q = query(q, where('timestamp', '<=', Timestamp.fromDate(filter.endDate)));
    if (filter.category) q = query(q, where('category', '==', filter.category));
    if (filter.type) q = query(q, where('type', '==', filter.type));
    if (filter.severity) q = query(q, where('severity', '==', filter.severity));
    if (filter.userId) q = query(q, where('userId', '==', filter.userId));
    if (filter.userCode) q = query(q, where('userCode', '==', filter.userCode));
    if (filter.userRole) q = query(q, where('userRole', '==', filter.userRole));
    if (filter.limit) q = query(q, limitQuery(filter.limit));
    if (filter.offset) q = query(q, startAfter(filter.offset));
    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventLog));
    const countSnapshot = await getDocs(collection(db, 'eventLogs'));
    return { events, total: countSnapshot.size };
  } catch (error) {
    console.error('Error fetching event logs:', error);
    throw error;
  }
}

/**
 * Search through event logs by a search term
 */
export async function searchEventLogs(searchTerm: string): Promise<EventLog[]> {
  try {
    const q = query(collection(db, 'eventLogs'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as EventLog))
      .filter(log => [
        log.description,
        log.userCode,
        log.userRole,
        log.type,
        log.category,
        JSON.stringify(log.data),
      ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase())));
  } catch (error) {
    console.error('Error searching event logs:', error);
    throw error;
  }
} 