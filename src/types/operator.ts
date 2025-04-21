import { Timestamp } from 'firebase/firestore';

export interface Operator {
  id: string;
  operatorCode: string;  // Format: OP-COMPANY-XXXX
  companyName: string;
  aocNumber: string;    // Air Operator Certificate number
  baseAirport: string;  // ICAO code
  contactEmail: string;
  contactPhone: string;
  status: 'pending' | 'active' | 'suspended';
  operatingRegions: string[];  // List of regions where operator flies
  fleetSize: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  verifiedAt?: Timestamp;
}

export interface OperatorSearchResult {
  id: string;
  operatorCode: string;
  companyName: string;
  baseAirport: string;
  fleetSize: number;
  status: Operator['status'];
} 