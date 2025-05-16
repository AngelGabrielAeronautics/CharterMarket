/* eslint-disable no-console */
import { EventLog, EventCategory, EventType, EventSeverity } from '@/types/event';
import { Event, convertTimestampToString } from '@/types/events';

/**
 * Utility to help debug events during development
 */
export const createDevConsoleLogger = (enabled = process.env.NODE_ENV === 'development') => {
  return {
    /**
     * Log an event to the console in development mode
     */
    logEvent: (event: Event | EventLog) => {
      if (!enabled) return;

      const timestamp = typeof event.timestamp === 'string' 
        ? event.timestamp 
        : convertTimestampToString(event.timestamp);
      
      const colorMap: Record<EventSeverity, string> = {
        [EventSeverity.CRITICAL]: '#ff0000',
        [EventSeverity.HIGH]: '#ff3300',
        [EventSeverity.MEDIUM]: '#ff9900',
        [EventSeverity.LOW]: '#ffcc00',
        [EventSeverity.INFO]: '#0099ff',
        [EventSeverity.ERROR]: '#ff0000',
      };

      const categoryColorMap: Record<EventCategory, string> = {
        [EventCategory.AUTHENTICATION]: '#9900cc',
        [EventCategory.AIRCRAFT]: '#666600',
        [EventCategory.FLIGHT]: '#006699',
        [EventCategory.QUOTE]: '#cc6600',
        [EventCategory.BOOKING]: '#00cc99',
        [EventCategory.PAYMENT]: '#cc0066',
        [EventCategory.USER]: '#6600cc',
        [EventCategory.SYSTEM]: '#666666',
      };

      console.group(
        `%c${event.category}%c::%c${event.type}%c (${event.severity})`,
        `background: ${categoryColorMap[event.category] || '#888'}; color: white; padding: 2px 4px; border-radius: 3px;`,
        'color: #888;',
        `color: ${colorMap[event.severity] || '#888'};`,
        'color: #888;'
      );
      console.log(`🕒 ${timestamp}`);
      console.log(`📝 ${event.description}`);
      console.log('👤 User:', {
        userId: event.userId,
        userCode: 'userCode' in event ? event.userCode : 'N/A',
        userRole: 'userRole' in event ? event.userRole : 'N/A',
      });
      
      if ('data' in event && event.data) {
        console.log('📦 Data:', event.data);
      }
      
      if ('metadata' in event && event.metadata) {
        console.log('🔍 Metadata:', event.metadata);
      }
      
      console.groupEnd();
    },

    /**
     * Log an array of events for debugging
     */
    logEventBatch: (events: (Event | EventLog)[]) => {
      if (!enabled) return;
      events.forEach(event => createDevConsoleLogger(enabled).logEvent(event));
    },

    /**
     * Create a test event for development purposes
     */
    createTestEvent: (
      category: EventCategory = EventCategory.SYSTEM,
      type: EventType = EventType.INFO,
      severity: EventSeverity = EventSeverity.INFO,
      description = 'Test event for development'
    ): Event => {
      return {
        id: `test-${Date.now()}`,
        timestamp: new Date().toISOString(),
        category,
        type,
        severity,
        description,
        userId: 'test-user',
        userCode: 'TS-TEST-0000',
        metadata: {
          deviceType: 'desktop',
          browser: 'Development Console',
          userAgent: navigator.userAgent,
        },
        data: {
          testField: 'This is a test event',
          createdAt: new Date().toISOString(),
        }
      };
    }
  };
};

// Export a singleton instance for easy use
export const eventDebugger = createDevConsoleLogger(); 