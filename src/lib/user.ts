import { db } from './firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { UserStatus } from '@/types/user';
import type { OnboardingFormData } from '@/types/user';

export async function updateUserStatus(userId: string, status: UserStatus) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
}

export async function checkRegistrationCompletion(userCode: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userCode));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const isComplete = userData.emailVerified && 
      userData.isProfileComplete && 
      (userData.role !== 'operator' || userData.hasAircraft);

    if (isComplete && userData.status === 'incomplete') {
      // Update user status to active when all steps are completed
      await updateDoc(doc(db, 'users', userCode), {
        status: 'active',
        profileIncompleteDate: null,
        updatedAt: new Date()
      });
    }

    return isComplete;
  } catch (error) {
    console.error('Error checking registration completion:', error);
    throw error;
  }
}

export async function markProfileComplete(userCode: string) {
  try {
    await updateDoc(doc(db, 'users', userCode), {
      isProfileComplete: true,
      updatedAt: new Date()
    });

    // Check if this completes the registration
    await checkRegistrationCompletion(userCode);
  } catch (error) {
    console.error('Error marking profile complete:', error);
    throw error;
  }
}

export async function markAircraftAdded(userCode: string) {
  try {
    await updateDoc(doc(db, 'users', userCode), {
      hasAircraft: true,
      updatedAt: new Date()
    });

    // Check if this completes the registration
    await checkRegistrationCompletion(userCode);
  } catch (error) {
    console.error('Error marking aircraft added:', error);
    throw error;
  }
}

export async function markEmailVerified(userCode: string) {
  try {
    await updateDoc(doc(db, 'users', userCode), {
      emailVerified: true,
      updatedAt: new Date()
    });

    // Check if this completes the registration
    await checkRegistrationCompletion(userCode);
  } catch (error) {
    console.error('Error marking email verified:', error);
    throw error;
  }
}

export async function createUserProfile(
  profile: OnboardingFormData & { createdAt: string; updatedAt: string; status: string }
): Promise<void> {
  try {
    await setDoc(doc(db, 'users', profile.userCode), profile, { merge: true });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
} 