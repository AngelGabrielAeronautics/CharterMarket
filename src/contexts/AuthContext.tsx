'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { logoutUser } from '@/lib/auth';
import { UserRole } from '@/lib/userCode';
import { User as CustomUser, UserProfile } from '@/types/user';
import { logAuthEvent } from '@/utils/eventLogger';
import { EventType, EventSeverity } from '@/types/event';

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  error: string | null;
  userRole: UserRole | null;
  logout: () => Promise<void>;
  profile: UserProfile | undefined;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  userRole: null,
  logout: async () => {},
  profile: undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            console.log('AuthContext: Fetched userData from Firestore:', userData);
            console.log('AuthContext: Attempting to set user.userCode to:', userData.userCode);
            // Set the complete user data including userCode
            setUser({
              ...firebaseUser,
              userCode: userData.userCode,
              role: userData.role,
            } as CustomUser);
            setUserRole(userData.role);
            // Map Firestore data to UserProfile, converting Timestamps
            const raw = querySnapshot.docs[0].data();
            const profileData: UserProfile = {
              email: raw.email,
              firstName: raw.firstName,
              lastName: raw.lastName,
              role: raw.role,
              userCode: raw.userCode,
              company: raw.company ?? null,
              createdAt: (raw.createdAt as Timestamp).toDate(),
              updatedAt: (raw.updatedAt as Timestamp).toDate(),
              emailVerified: raw.emailVerified,
              lastReminderSent: raw.lastReminderSent
                ? (raw.lastReminderSent as Timestamp).toDate()
                : null,
              reminderCount: raw.reminderCount,
              profileIncompleteDate: raw.profileIncompleteDate
                ? (raw.profileIncompleteDate as Timestamp).toDate()
                : null,
              status: raw.status,
              isProfileComplete: raw.isProfileComplete,
              dormantDate: raw.dormantDate ? (raw.dormantDate as Timestamp).toDate() : null,
            };
            setProfile(profileData);

            // Log successful login
            await logAuthEvent(EventType.LOGIN, {
              severity: EventSeverity.INFO,
              userId: firebaseUser.uid,
              userCode: userData.userCode,
              userRole: userData.role,
              description: `User ${userData.userCode} logged in successfully`,
              data: {
                email: firebaseUser.email,
                provider: firebaseUser.providerData[0]?.providerId || 'email',
              },
            });
          } else {
            // No user data found in Firestore
            setUser(null);
            setUserRole(null);
            setProfile(undefined);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Error fetching user data');
          setUser(null);
          setUserRole(null);
          setProfile(undefined);
        } finally {
          setLoading(false);
        }
      } else {
        // No Firebase user
        setUser(null);
        setUserRole(null);
        setProfile(undefined);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      const currentUser = user; // Store current user before logout
      if (currentUser) {
        // Log logout event before actually logging out
        await logAuthEvent(EventType.LOGOUT, {
          severity: EventSeverity.INFO,
          userId: currentUser.uid,
          userCode: currentUser.userCode,
          userRole: currentUser.role,
          description: `User ${currentUser.userCode} logged out`,
          data: { email: currentUser.email },
        });
      }

      await logoutUser();
      setUser(null);
      setUserRole(null);
      setProfile(undefined);
    } catch (err) {
      console.error('Error logging out:', err);
      setError('Error logging out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, userRole, logout, profile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
