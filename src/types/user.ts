import { User as FirebaseUser } from 'firebase/auth';
import { UserRole } from '@/lib/userCode';
import { Timestamp } from 'firebase/firestore';

export type UserStatus = 'active' | 'dormant' | 'suspended' | 'incomplete';

export interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  userCode: string;
  company: string | null;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  lastReminderSent: Date | null;
  reminderCount: number;
  profileIncompleteDate: Date | null;
  status: UserStatus;
  isProfileComplete: boolean;
  dormantDate: Date | null;
  photoURL?: string | null;
  companyName?: string | null;
  defaultCurrency?: string;
}

export interface User extends FirebaseUser {
  userCode: string;
  role: UserRole;
  firstName?: string;
  profile?: UserProfile;
  emailVerified: boolean;
  defaultCurrency?: string;
  profileImageUrl?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  profileIncompleteDate?: Timestamp | null;
}

export interface OnboardingFormData {
  userId: string;
  operatorId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  userCode: string;
  company: string | null;
}
