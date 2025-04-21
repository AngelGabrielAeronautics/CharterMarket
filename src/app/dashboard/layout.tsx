'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import OperatorOnboardingBanner from '@/components/OperatorOnboardingBanner';
import SideNav from '@/components/SideNav';
import TopNav from '@/components/TopNav';
import { UserRole } from '@/lib/userCode';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserData {
  email: string;
  emailVerified: boolean;
  userCode: string;
  userId: string;
  role: UserRole;
  firstName: string;
  status: string;
  isProfileComplete: boolean;
  hasAircraft: boolean;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Fetch user data from Firestore
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0].data();
          setUserData({
            email: user.email!,
            emailVerified: userDoc.emailVerified || false,
            userCode: userDoc.userCode,
            userId: user.uid,
            role: userDoc.role,
            firstName: userDoc.firstName || user.email!.split('@')[0], // Fallback to email username if firstName not set
            status: userDoc.status,
            isProfileComplete: userDoc.isProfileComplete || false,
            hasAircraft: userDoc.hasAircraft || false,
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-primary">
      {userData && (
        <TopNav 
          userEmail={userData.email} 
          userRole={userData.role} 
          firstName={userData.firstName}
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />
      )}
      
      <div className="pt-16 flex min-h-screen relative">
        {/* Mobile menu backdrop */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden z-20"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile menu */}
        <div className={`
          fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          transition duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:duration-0
          z-30 lg:z-0
        `}>
          {userData && <SideNav userRole={userData.role} isMobile={isMobileMenuOpen} onCloseMobile={() => setIsMobileMenuOpen(false)} />}
        </div>

        {/* Main content */}
        <main className="flex-1 relative">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {userData && !userData.emailVerified && (
              <EmailVerificationBanner
                email={userData.email}
                userId={userData.userId}
                userCode={userData.userCode}
                isVerified={userData.emailVerified}
              />
            )}
            {userData && userData.role === 'operator' && (
              <OperatorOnboardingBanner
                profile={{
                  ...userData,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  company: null,
                  lastReminderSent: null,
                  reminderCount: 0,
                  profileIncompleteDate: null,
                  dormantDate: null
                }}
                isEmailVerified={userData.emailVerified}
              />
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 