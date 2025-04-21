export interface Event {
  id: string;
  timestamp: string;
  category: 'onboarding' | 'aircraft' | 'flight';
  type: string;
  severity: 'info' | 'warning' | 'error';
  description: string;
  userId?: string;
  operatorId?: string;
  metadata?: Record<string, any>;
} 