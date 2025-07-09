import { Timestamp } from 'firebase/firestore';

export enum AircraftType {
  SINGLE_PISTON = 'SINGLE_PISTON',
  TWIN_PISTON = 'TWIN_PISTON',
  TURBOPROP = 'TURBOPROP',
  LIGHT_JET = 'LIGHT_JET',
  MIDSIZE_JET = 'MIDSIZE_JET',
  SUPER_MIDSIZE_JET = 'SUPER_MIDSIZE_JET',
  HEAVY_JET = 'HEAVY_JET',
  ULTRA_LONG_RANGE_JET = 'ULTRA_LONG_RANGE_JET',
  HELICOPTER = 'HELICOPTER',
}

export type AircraftStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';

export const AircraftStatusValues: Record<AircraftStatus, AircraftStatus> = {
  ACTIVE: 'ACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  INACTIVE: 'INACTIVE',
};

export interface AircraftFormData {
  registration: string;
  type: AircraftType;
  make: string;
  model: string;
  year: number;
  baseAirport: string;
  status: AircraftStatus;
  specifications: {
    maxPassengers: number;
    maxBaggageWeight: number;
    maxRange: number;
    maxSpeed: number;
    cabinHeight: number;
    cabinWidth: number;
    cabinLength: number;
    baggageCapacity: number;
    features: string[];
    lastInteriorRefurb: number;
    lastExteriorRefurb: number;
    isPressurized: boolean;
    hasWc: boolean;
    isUnpavedRunwayCapable: boolean;
    allowsPets: boolean;
    allowsSmoking: boolean;
    hasHeatedCabin: boolean;
    hasAirConditioning: boolean;
    cockpitCrew: number;
    cabinCrew: number;
    hasApu: boolean;
    blurb?: string;
  };
  images: (string | File)[];
}

export interface Aircraft extends AircraftFormData {
  id: string;
  operatorCode: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AircraftAvailability {
  id: string;
  aircraftId: string;
  startDate: Timestamp;
  endDate: Timestamp;
  type: 'blocked' | 'maintenance' | 'charter';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MaintenanceSchedule {
  id: string;
  aircraftId: string;
  type: 'scheduled' | 'unscheduled' | 'inspection';
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  technician?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

export interface AircraftImage {
  id: string;
  url: string;
  type: 'exterior' | 'interior' | 'layout' | 'cockpit';
  fileName: string;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface AircraftDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Timestamp;
} 