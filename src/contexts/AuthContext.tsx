'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { logoutUser } from '@/lib/auth';
import { UserRole } from '@/lib/userCode';
import { User as CustomUser, UserProfile } from '@/types/user';
import { User as FirebaseUser } from 'firebase/auth';
import { logAuthEvent } from '@/lib/events';
import { EventType, EventSeverity } from '@/types/event';

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  error: string | null;
  userRole: UserRole | null;
  logout: () => Promise<void>;
  profile: UserProfile | undefined;
}

const AuthContext = createContext<AuthContextType>({
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
          const q = query(
            collection(db, 'users'),
            where('email', '==', firebaseUser.email)
          );
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            // Set the complete user data including userCode
            setUser({
              ...firebaseUser,
              userCode: userData.userCode,
              role: userData.role,
            } as CustomUser);
            setUserRole(userData.role);
            setProfile({
              ...userData,
              createdAt: userData.createdAt.toDate(),
              updatedAt: userData.updatedAt.toDate(),
            } as UserProfile);

            // Log successful login
            await logAuthEvent(
              EventType.LOGIN,
              EventSeverity.INFO,
              firebaseUser.uid,
              userData.userCode,
              userData.role,
              `User ${userData.userCode} logged in successfully`,
              {
                email: firebaseUser.email,
                provider: firebaseUser.providerData[0]?.providerId || 'email'
              }
            );
          } else {
            console.log('No user data found in Firestore for email:', firebaseUser.email);
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
        console.log('No Firebase user');
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
        await logAuthEvent(
          EventType.LOGOUT,
          EventSeverity.INFO,
          currentUser.uid,
          currentUser.userCode,
          currentUser.role,
          `User ${currentUser.userCode} logged out`,
          {
            email: currentUser.email
          }
        );
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