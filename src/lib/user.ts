import { db } from './firebase';
import {
  doc,
  updateDoc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { UserStatus } from '@/types/user';
import type { OnboardingFormData } from '@/types/user';
import { operatorHasAircraft } from './aircraft';

export async function updateUserStatus(userId: string, status: UserStatus) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status,
      updatedAt: new Date(),
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

    // Check if operator has aircraft using real-time query instead of cached field
    const hasAircraft = userData.role === 'operator' ? await operatorHasAircraft(userCode) : true; // Non-operators don't need aircraft

    const isComplete =
      userData.emailVerified &&
      userData.isProfileComplete &&
      (userData.role !== 'operator' || hasAircraft);

    if (isComplete && userData.status === 'incomplete') {
      // Update user status to active when all steps are completed
      await updateDoc(doc(db, 'users', userCode), {
        status: 'active',
        profileIncompleteDate: null,
        updatedAt: new Date(),
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
      updatedAt: new Date(),
    });

    // Check if this completes the registration
    await checkRegistrationCompletion(userCode);
  } catch (error) {
    console.error('Error marking profile complete:', error);
    throw error;
  }
}

export async function markEmailVerified(userCode: string) {
  try {
    await updateDoc(doc(db, 'users', userCode), {
      emailVerified: true,
      updatedAt: new Date(),
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

/**
 * Fetches user data from the 'users' collection by their short userCode (document ID).
 * @param userCode The short userCode (document ID) of the user (e.g., PA-COPP-LECE).
 * @returns The user data object if found, otherwise null.
 */
export async function getUserDataByUserCode(
  userCode: string
): Promise<{ id: string; [key: string]: any } | null> {
  try {
    const userDocRef = doc(db, 'users', userCode);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.warn(`No user found with userCode (document ID): ${userCode}`);
      return null;
    }
    // userDocSnap.id will be the userCode itself
    return { id: userDocSnap.id, ...userDocSnap.data() };
  } catch (error) {
    console.error(`Error fetching user data by userCode (${userCode}):`, error);
    throw error;
  }
}

/**
 * Fetches the short userCode (document ID) from the 'users' collection by their Firebase Auth UID.
 * @param authUid The Firebase Auth UID of the user.
 * @returns The short userCode (string) if found, otherwise null.
 */
export async function getUserCodeFromAuthUid(authUid: string): Promise<string | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('firebaseAuthId', '==', authUid), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`No user found with firebaseAuthId: ${authUid} to retrieve userCode.`);
      return null;
    }
    // The document ID is the short userCode
    return querySnapshot.docs[0].id;
  } catch (error) {
    console.error(`Error fetching userCode by firebaseAuthId (${authUid}):`, error);
    throw error;
  }
}
