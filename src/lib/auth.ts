// @ts-nocheck
'use client';

import { auth, db } from './firebase';
import { generateUserCode } from './userCode';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  AuthError,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { sendWelcomeEmail, sendAdminNotification } from './email';
import { logAuthEvent, logSystemError } from '@/utils/eventLogger';
import { EventType, EventSeverity } from '@/types/event';
import { UserStatus } from '@/types/user';

export interface UserData {
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
}

// Function to convert Firebase auth errors to user-friendly messages
function getAuthErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'auth/popup-closed-by-user':
      return 'Sign in was cancelled. Please try again if you want to continue.';
    case 'auth/popup-blocked':
      return 'Sign in popup was blocked by your browser. Please allow popups for this site and try again.';
    case 'auth/cancelled-popup-request':
      return 'The sign in process was cancelled. Please try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email. Please try signing in with a different method.';
    case 'auth/network-request-failed':
      return 'Unable to connect to the authentication service. Please check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support for assistance.';
    case 'auth/operation-not-allowed':
      return 'This sign in method is not enabled. Please try a different method.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in or use “Forgot Password” to reset your credentials.';
    default:
      return 'An error occurred during sign in. Please try again.';
  }
}

export const registerUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: UserRole,
  company?: string
): Promise<UserData> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userCode = generateUserCode({ role, lastName, company });

    // Prepare user data
    const userData: UserData = {
      email,
      firstName,
      lastName,
      role,
      userCode,
      company: company || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: false,
      lastReminderSent: null,
      reminderCount: 0,
      profileIncompleteDate: new Date(),
      status: 'incomplete',
      isProfileComplete: false,
      dormantDate: null,
    };

    // Save user data to Firestore
    await setDoc(doc(db, 'users', userCode), userData);

    // Set custom claims for Firebase Auth (required for Firestore rules)
    try {
      const response = await fetch('/api/auth/set-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          role,
          userCode,
        }),
      });

      if (!response.ok) {
        console.error('Failed to set custom claims:', await response.text());
        // Continue with registration even if claims setting fails
      } else {
        console.log(`Custom claims set successfully for user ${userCode}`);
      }
    } catch (error) {
      console.error('Error setting custom claims:', error);
      // Continue with registration even if claims setting fails
    }

    // Log registration event using the new type-safe logging utility
    await logAuthEvent(EventType.REGISTER, {
      userId: user.uid,
      userCode,
      userRole: role,
      description: `New user ${userCode} registered successfully`,
      severity: EventSeverity.INFO,
      data: {
        email,
        firstName,
        lastName,
        role,
        company: company || null,
      },
    });

    // Send verification email
    const enableEmails = process.env.NODE_ENV === 'production' || 
                        process.env.ENABLE_DEV_EMAILS === 'true' || 
                        process.env.NODE_ENV !== 'test';
    
    if (enableEmails) {
      try {
        await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        // Log successful verification email with type-safe logging
        await logAuthEvent(EventType.VERIFICATION_EMAIL_SENT, {
          userId: user.uid,
          userCode,
          userRole: role,
          description: `Verification email sent to ${email}`,
          severity: EventSeverity.INFO,
          data: { email },
        });
      } catch (error: unknown) {
        // Log failed verification email with type-safe logging
        await logAuthEvent(EventType.VERIFICATION_EMAIL_FAILED, {
          userId: user.uid,
          userCode,
          userRole: role,
          description: `Failed to send verification email to ${email}`,
          severity: EventSeverity.ERROR,
          data: { email, errorMessage: error instanceof Error ? error.message : String(error) },
        });
      }
    } else {
      console.log(
        'Development mode: Skipping verification email send (set ENABLE_DEV_EMAILS=true to enable)'
      );
    }

    // Send welcome email
    const enableWelcomeEmails = process.env.NODE_ENV === 'production' || 
                               process.env.ENABLE_DEV_EMAILS === 'true' || 
                               process.env.NODE_ENV !== 'test';
    
    if (enableWelcomeEmails) {
      try {
        await sendWelcomeEmail(email, user.uid, userCode, firstName, role, company);
      } catch (error: unknown) {
        // Log the welcome email error but don't block registration
        logSystemError(
          `Failed to send welcome email to ${email}`,
          error instanceof Error ? error : new Error(String(error)),
          {
            userId: user.uid,
            userCode,
            userRole: role,
            data: { email, firstName },
          }
        );
      }
    } else {
      console.log(
        'Development mode: Skipping welcome email send (set ENABLE_DEV_EMAILS=true to enable)'
      );
    }

    // Send admin notification
    const enableAdminEmails = process.env.NODE_ENV === 'production' || 
                             process.env.ENABLE_DEV_EMAILS === 'true' || 
                             process.env.NODE_ENV !== 'test';
    
    if (enableAdminEmails) {
      try {
        await sendAdminNotification(email, firstName, lastName, role, userCode, company);
      } catch (error: unknown) {
        // Log the admin notification error but don't block registration
        logSystemError(
          `Failed to send admin notification for new user ${email}`,
          error instanceof Error ? error : new Error(String(error)),
          {
            userId: user.uid,
            userCode,
            userRole: role,
          }
        );
      }
    } else {
      console.log(
        'Development mode: Skipping admin notification send (set ENABLE_DEV_EMAILS=true to enable)'
      );
    }

    return userData;
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.code) {
      throw new Error(getAuthErrorMessage(error));
    }
    throw new Error(error.message ?? 'Registration failed. Please try again.');
  }
};

export const loginUser = async (email: string, password: string): Promise<UserData> => {
  try {
    // First authenticate with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Query Firestore for user data by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Unable to find your account information. Please contact support.');
    }

    const userData = querySnapshot.docs[0].data() as UserData;
    return userData;
  } catch (error: any) {
    console.error('Error in loginUser:', error);
    if (error.code) {
      throw new Error(getAuthErrorMessage(error));
    }
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error in logoutUser:', error);
    throw error;
  }
};

export const updateUserProfile = async (
  userCode: string,
  updates: Partial<UserData>
): Promise<void> => {
  try {
    // Get user doc directly by userCode
    const userRef = doc(db, 'users', userCode);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
};

export const getUserByCode = async (userCode: string): Promise<UserData | null> => {
  try {
    console.log('Fetching user by code:', userCode);
    const userDoc = await getDoc(doc(db, 'users', userCode));

    if (!userDoc.exists()) {
      console.log('No user found with code:', userCode);
      return null;
    }

    const userData = userDoc.data() as UserData;
    console.log('Found user data:', userData);
    return userData;
  } catch (error) {
    console.error('Error in getUserByCode:', error);
    throw error;
  }
};

export async function signInWithGoogle(): Promise<UserData> {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const { user } = userCredential;

    // Check if user already exists in Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', user.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // User exists, return their data
      return querySnapshot.docs[0].data() as UserData;
    }

    // User doesn't exist, create a new profile
    const firstName = user.displayName?.split(' ')[0] || '';
    const lastName = user.displayName?.split(' ').slice(1).join(' ') || '';

    // Generate user code
    const userCode = await generateUserCode({
      role: 'passenger', // Default role for Google sign-in
      lastName,
      company: undefined,
    });

    // Prepare user data
    const userData: UserData = {
      email: user.email!,
      firstName,
      lastName,
      role: 'passenger',
      userCode,
      company: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: user.emailVerified,
      lastReminderSent: null,
      reminderCount: 0,
      profileIncompleteDate: new Date(),
      status: 'incomplete',
      isProfileComplete: false,
      dormantDate: null,
    };

    // Save user data to Firestore
    await setDoc(doc(db, 'users', userCode), userData);

    // Set custom claims for Firebase Auth (required for Firestore rules)
    try {
      const response = await fetch('/api/auth/set-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          role: 'passenger',
          userCode,
        }),
      });

      if (!response.ok) {
        console.error('Failed to set custom claims for Google user:', await response.text());
        // Continue with sign-in even if claims setting fails
      } else {
        console.log(`Custom claims set successfully for Google user ${userCode}`);
      }
    } catch (error) {
      console.error('Error setting custom claims for Google user:', error);
      // Continue with sign-in even if claims setting fails
    }

    // Send welcome email (Google sign-in)
    const enableGoogleWelcomeEmails = process.env.NODE_ENV === 'production' || 
                                     process.env.ENABLE_DEV_EMAILS === 'true' || 
                                     process.env.NODE_ENV !== 'test';
    
    if (enableGoogleWelcomeEmails) {
      try {
        await sendWelcomeEmail(user.email!, user.uid, userCode, firstName, 'passenger', null);
      } catch (error) {
        console.error('Error sending welcome email:', error);
        // Don't block registration if email sending fails
      }
    } else {
      console.log(
        'Development mode: Skipping welcome email send (set ENABLE_DEV_EMAILS=true to enable)'
      );
    }

    return userData;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    // Convert Firebase auth error to user-friendly message
    if (error.code) {
      throw new Error(getAuthErrorMessage(error));
    }
    throw new Error(error.message);
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No authenticated user found');
    }

    // Re-authenticate user before changing password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);
  } catch (error: any) {
    console.error('Error changing password:', error);
    if (error.code === 'auth/wrong-password') {
      throw new Error('Current password is incorrect');
    } else if (error.code === 'auth/requires-recent-login') {
      throw new Error('Please sign in again before changing your password');
    } else if (error.code) {
      throw new Error(getAuthErrorMessage(error));
    }
    throw error;
  }
}
