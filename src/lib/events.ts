import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, limit, startAfter } from 'firebase/firestore';
import { EventLog, EventCategory, EventType, EventSeverity, EventMetadata, EventData, EventLogFilter } from '@/types/event';

// Helper function to get user metadata
const getUserMetadata = (): EventMetadata => {
  if (typeof window === 'undefined') return {};

  const metadata: EventMetadata = {
    userAgent: window.navigator.userAgent,
    deviceType: /Mobile|Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent) 
      ? 'mobile' 
      : /Tablet|iPad/i.test(window.navigator.userAgent)
        ? 'tablet'
        : 'desktop',
    browser: getBrowser(),
    os: getOS(),
    screenResolution: {
      width: window.screen.width,
      height: window.screen.height
    },
    referrer: document.referrer || null,
  };

  const sessionId = sessionStorage.getItem('sessionId');
  if (sessionId) {
    metadata.sessionId = sessionId;
  }

  return metadata;
};

// Helper function to get browser name
const getBrowser = (): string => {
  const userAgent = window.navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) return 'Internet Explorer';
  return 'Unknown';
};

// Helper function to get OS name
const getOS = (): string => {
  const userAgent = window.navigator.userAgent;
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'MacOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
};

export const logEvent = async (
  category: EventCategory,
  type: EventType,
  severity: EventSeverity,
  userId: string,
  userCode: string,
  userRole: string,
  description: string,
  data: EventData = {},
  metadata: EventMetadata = {}
): Promise<string> => {
  try {
    const eventLog: Omit<EventLog, 'id'> = {
      timestamp: Timestamp.now(),
      category,
      type,
      severity,
      userId,
      userCode,
      userRole,
      description,
      metadata: {
        ...getUserMetadata(),
        ...metadata
      },
      data
    };

    const docRef = await addDoc(collection(db, 'eventLogs'), eventLog);
    return docRef.id;
  } catch (error) {
    console.error('Error logging event:', error);
    throw error;
  }
};

export const getEventLogs = async (filter: EventLogFilter = {}): Promise<{ events: EventLog[]; total: number }> => {
  try {
    let q = query(collection(db, 'eventLogs'), orderBy('timestamp', 'desc'));

    // Apply filters
    if (filter.startDate) {
      q = query(q, where('timestamp', '>=', Timestamp.fromDate(filter.startDate)));
    }

    if (filter.endDate) {
      q = query(q, where('timestamp', '<=', Timestamp.fromDate(filter.endDate)));
    }

    if (filter.category) {
      q = query(q, where('category', '==', filter.category));
    }

    if (filter.type) {
      q = query(q, where('type', '==', filter.type));
    }

    if (filter.severity) {
      q = query(q, where('severity', '==', filter.severity));
    }

    if (filter.userId) {
      q = query(q, where('userId', '==', filter.userId));
    }

    if (filter.userCode) {
      q = query(q, where('userCode', '==', filter.userCode));
    }

    if (filter.userRole) {
      q = query(q, where('userRole', '==', filter.userRole));
    }

    // Apply pagination
    if (filter.limit) {
      q = query(q, limit(filter.limit));
    }

    if (filter.offset) {
      q = query(q, startAfter(filter.offset));
    }

    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as EventLog[];

    // Get total count for pagination
    const countQuery = query(collection(db, 'eventLogs'));
    const countSnapshot = await getDocs(countQuery);
    const total = countSnapshot.size;

    return { events, total };
  } catch (error) {
    console.error('Error fetching event logs:', error);
    throw error;
  }
};

export const searchEventLogs = async (searchTerm: string): Promise<EventLog[]> => {
  try {
    const q = query(collection(db, 'eventLogs'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EventLog))
      .filter(log => {
        const searchableFields = [
          log.description,
          log.userCode,
          log.userRole,
          log.type,
          log.category,
          JSON.stringify(log.data)
        ];
        return searchableFields.some(field => 
          field?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
  } catch (error) {
    console.error('Error searching event logs:', error);
    throw error;
  }
};

// Helper function to log system events
export const logSystemEvent = async (
  type: EventType,
  severity: EventSeverity,
  description: string,
  data: EventData = {}
): Promise<string> => {
  return logEvent(
    EventCategory.SYSTEM,
    type,
    severity,
    'system',
    'SYSTEM',
    'system',
    description,
    data
  );
};

// Helper function to log user events
export const logUserEvent = async (
  type: EventType,
  severity: EventSeverity,
  userId: string,
  userCode: string,
  userRole: string,
  description: string,
  data: EventData = {}
): Promise<string> => {
  return logEvent(
    EventCategory.USER,
    type,
    severity,
    userId,
    userCode,
    userRole,
    description,
    data
  );
};

// Helper function to log authentication events
export const logAuthEvent = async (
  type: EventType,
  severity: EventSeverity,
  userId: string,
  userCode: string,
  userRole: string,
  description: string,
  data: EventData = {}
): Promise<string> => {
  return logEvent(
    EventCategory.AUTHENTICATION,
    type,
    severity,
    userId,
    userCode,
    userRole,
    description,
    data
  );
}; 