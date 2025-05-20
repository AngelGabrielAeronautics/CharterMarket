import { Timestamp } from 'firebase/firestore';

export type ClientType = 'individual' | 'corporate';

export interface Client {
  id: string;
  clientId: string; // Formatted client ID (e.g., CL-AG-ANGE-1234)
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  preferredAirport?: string;
  clientType: ClientType;
  agentUserCode: string; // Reference to the agent who added the client
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  preferredAirport?: string;
  clientType: ClientType;
}
