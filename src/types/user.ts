import { User as FirebaseUser } from 'firebase/auth';
import { UserRole } from '@/lib/userCode';

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
}

export interface User extends FirebaseUser {
  userCode: string;
  role: UserRole;
  firstName?: string;
  profile?: UserProfile;
  emailVerified: boolean;
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
