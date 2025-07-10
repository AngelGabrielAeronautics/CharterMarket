'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import AppDownloadBanner from '@/components/ui/AppDownloadBanner';
import SideNav from '@/components/SideNav';
import { UserRole } from '@/lib/userCode';
import { UserStatus } from '@/types/user';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Box, Container, IconButton, Tooltip } from '@mui/material';
import ProgressNav from '@/components/dashboard/ProgressNav';
import { usePathname } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { markEmailVerified } from '@/lib/user';

interface UserData {
  email: string;
  emailVerified: boolean;
  userCode: string;
  userId: string;
  role: UserRole;
  firstName: string;
  status: UserStatus;
  isProfileComplete: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const muiTheme = useMuiTheme();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSideNavMini, setIsSideNavMini] = useState(false);

  const pathname = usePathname();
  // Width of the sidebar drawer (to offset content when open on mobile)
  const expandedSideNavWidth = muiTheme.spacing(32); // 256px
  const collapsedSideNavWidth = muiTheme.spacing(6); // 48px - ultra compact

  const previousEmailVerifiedState = useRef<boolean | undefined>(undefined);

  const toggleSideNavMini = () => setIsSideNavMini((prev) => !prev);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        router.push('/login');
        setLoading(false);
        return;
      }

      try {
        // Fetch user data from Firestore using user's UID as document ID if possible, or email as fallback
        // Assuming userCode is the document ID in 'users' collection
        // We need to get userCode first if it's not directly firebaseUser.uid
        // For now, let's assume we need to query by email to get the userDoc which contains userCode

        const usersRef = collection(db, 'users');
        // Try to get userDoc by email first to retrieve userCode
        const qByEmail = query(usersRef, where('email', '==', firebaseUser.email));
        const emailQuerySnapshot = await getDocs(qByEmail);

        let userDocData: any = null;
        let userDocId: string | null = null;

        if (!emailQuerySnapshot.empty) {
          const docSnapshot = emailQuerySnapshot.docs[0];
          userDocData = docSnapshot.data();
          userDocId = docSnapshot.id; // This should be the userCode
        } else {
          // Fallback or error: user exists in Auth but not in Firestore 'users' collection by email
          // This case should ideally not happen if registration is robust
          console.error(
            `User with email ${firebaseUser.email} found in Auth but not in Firestore users collection.`
          );
          setLoading(false);
          // Optionally redirect to an error page or logout
          router.push('/login?error=user_not_found_in_db');
          return;
        }

        const currentUserData: UserData = {
          email: firebaseUser.email!,
          // Use emailVerified from Firebase Auth source of truth first, then Firestore's as fallback
          emailVerified: firebaseUser.emailVerified || userDocData.emailVerified || false,
          userCode: userDocId!, // userCode is the document ID
          userId: firebaseUser.uid,
          role: userDocData.role,
          firstName: userDocData.firstName || firebaseUser.email!.split('@')[0],
          status: userDocData.status as UserStatus,
          isProfileComplete: userDocData.isProfileComplete || false,
        };

        setUserData(currentUserData);

        // Check if email verification status changed to true
        if (currentUserData.emailVerified && previousEmailVerifiedState.current === false) {
          console.log(
            `Email for ${currentUserData.userCode} was just verified. Updating Firestore.`
          );
          await markEmailVerified(currentUserData.userCode);
        }
        previousEmailVerifiedState.current = currentUserData.emailVerified;
      } catch (error) {
        console.error('Error fetching user data or processing auth state:', error);
        // Potentially redirect to login or error page
        router.push('/login?error=auth_error');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
    // router is a stable function, muiTheme is stable if not changed. Adding them for completeness but main dependency is auth object.
  }, [router]);

  // Effect to update Firestore if Firebase Auth emailVerified is true and Firestore is false
  useEffect(() => {
    if (
      userData &&
      userData.userCode &&
      auth.currentUser &&
      auth.currentUser.emailVerified &&
      !userData.emailVerified
    ) {
      console.log(
        `Syncing emailVerified status for ${userData.userCode}. Firebase: true, Firestore: false.`
      );
      markEmailVerified(userData.userCode)
        .then(() => {
          setUserData((prev) => (prev ? { ...prev, emailVerified: true } : null));
          console.log(`Successfully updated Firestore emailVerified for ${userData.userCode}`);
        })
        .catch((err) =>
          console.error(`Failed to sync emailVerified for ${userData.userCode}:`, err)
        );
    }
  }, [userData]); // Rerun when userData changes, specifically userData.emailVerified



  if (loading || !userData) {
    return <LoadingSpinner fullscreen />;
  }

  return (
    <Box
      sx={{
        height: '100vh',
        bgcolor: 'background.default',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Mobile Menu Button - only visible on small screens */}
      <Box
        sx={{
          position: 'fixed',
          top: muiTheme.spacing(2),
          left: muiTheme.spacing(2),
          zIndex: 25,
          display: { xs: 'block', lg: 'none' },
        }}
      >
        <Tooltip title="Menu" placement="right">
          <IconButton
            aria-label="Open menu"
            onClick={toggleMobileMenu}
            sx={{
              bgcolor: 'background.paper',
              boxShadow: muiTheme.shadows[3],
              color: 'primary.main',
              borderRadius: '50%',
              width: 40,
              height: 40,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
            size="medium"
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Side nav layout without TopNav */}
      <Box
        sx={{
          pt: 0,
          display: 'flex',
          height: '100vh', // Full viewport height
          overflow: 'visible',
          position: 'relative',
        }}
      >
        {/* Mobile menu backdrop */}
        {isMobileMenuOpen && (
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              transition: 'opacity 300ms',
              display: { xs: 'block', lg: 'none' },
              zIndex: 20,
            }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* SideNav container: hidden on mobile unless opened, visible on desktop */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            position: { xs: 'fixed', lg: 'fixed' },
            top: { xs: 0, lg: 0 },
            inset: { xs: '0 auto 0 0', lg: 'auto' },
            transform: {
              xs: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
              lg: 'none',
            },
            transition: 'transform 300ms ease-in-out',
            zIndex: { xs: 30, lg: 'auto' },
            height: '100vh',
            overflow: 'hidden',
          }}
        >
          {userData && (
            <SideNav
              userRole={userData.role}
              isMobile={isMobileMenuOpen}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
              mini={isSideNavMini}
              onToggleMini={toggleSideNavMini}
            />
          )}
        </Box>

        {/* Main content */}
        <Box
          sx={{
            flexGrow: 1,
            position: 'relative',
            ml: { lg: isSideNavMini ? collapsedSideNavWidth : expandedSideNavWidth },
            pt: { xs: muiTheme.spacing(8), lg: muiTheme.spacing(4) },
            height: '100%',
            overflowY: 'auto',
          }}
        >
          <Container
            maxWidth={false}
            disableGutters
            sx={{
              py: 3,
              px: muiTheme.spacing(4),
            }}
          >
            {userData && !userData.emailVerified && (
              <EmailVerificationBanner isVerified={userData.emailVerified} />
            )}

            {/* App Download Banner - Shown only on mobile devices */}
            <Box sx={{ mb: 2 }}>
              <AppDownloadBanner variant="compact" persistentId="dashboard-app-download" />
            </Box>

            {/* Progress navigation removed from layout; now included per-page header */}

            {children}
          </Container>
        </Box>
      </Box>

      {/* Fixed app download banner for desktop */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          zIndex: 1200,
          width: { xs: '100%', sm: '300px' },
          display: { xs: 'none', md: 'block' },
        }}
      >
        <AppDownloadBanner variant="full" persistentId="dashboard-app-download-fixed" />
      </Box>
    </Box>
  );
}
