'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import OperatorOnboardingBanner from '@/components/OperatorOnboardingBanner';
import AppDownloadBanner from '@/components/ui/AppDownloadBanner';
import SideNav from '@/components/SideNav';
import { UserRole } from '@/lib/userCode';
import { UserStatus } from '@/types/user';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Box, Container, IconButton, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import tokens from '@/styles/tokens';
import { useTheme as useMuiTheme } from '@mui/material/styles';

interface UserData {
  email: string;
  emailVerified: boolean;
  userCode: string;
  userId: string;
  role: UserRole;
  firstName: string;
  status: UserStatus;
  isProfileComplete: boolean;
  hasAircraft: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const muiTheme = useMuiTheme();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSideNavMini, setIsSideNavMini] = useState(false);
  // Width of the sidebar drawer (to offset content when open on mobile)
  const expandedSideNavWidth = muiTheme.spacing(32); // 256px
  const collapsedSideNavWidth = muiTheme.spacing(6); // 48px - ultra compact

  const toggleSideNavMini = () => setIsSideNavMini((prev) => !prev);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

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
            status: userDoc.status as UserStatus,
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

  if (loading || !userData) {
    return <LoadingSpinner fullscreen />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
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
          minHeight: '100vh',
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
            position: { xs: 'fixed', lg: 'static' },
            inset: { xs: '0 auto 0 0', lg: 'auto' },
            transform: {
              xs: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
              lg: 'none',
            },
            transition: 'transform 300ms ease-in-out',
            zIndex: { xs: 30, lg: 'auto' },
            height: '100%',
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
            overflow: 'auto',
            width: '100%',
            pt: { xs: muiTheme.spacing(8), lg: muiTheme.spacing(4) }, // Adjusted lg padding top
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
                  dormantDate: null,
                  lastName: '',
                }}
                isEmailVerified={userData.emailVerified}
              />
            )}

            {/* App Download Banner - Shown only on mobile devices */}
            <Box sx={{ mb: 2 }}>
              <AppDownloadBanner variant="compact" persistentId="dashboard-app-download" />
            </Box>

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
