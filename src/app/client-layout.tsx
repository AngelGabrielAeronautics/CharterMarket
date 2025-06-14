'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ModalProvider } from '@/contexts/ModalContext';
import { Box, Container } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { CookiesProvider } from 'react-cookie';
import Header from '@/components/Header';
import { usePathname } from 'next/navigation';

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  // Hide TopNavBar on pages that use SideNav (dashboard and admin dashboard)
  const isSideNavPage =
    pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin/dashboard');
  return (
    <CookiesProvider>
      <AuthProvider>
        <ModalProvider>
          <Box
            sx={{
              minHeight: '100vh',
              bgcolor: 'background.default',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {!isSideNavPage && <Header />}
            <Box
              component="main"
              sx={{
                width: '100%',
                flexGrow: 1,
                pt: !isSideNavPage ? 8 : 0,
              }}
            >
              <Container maxWidth={false} disableGutters sx={{ py: 4 }}>
                {children}
              </Container>
            </Box>
          </Box>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 8000,
              success: {
                duration: 8000,
                style: {
                  background: '#10B981',
                  color: 'white',
                },
              },
              error: {
                duration: 10000,
                style: {
                  background: '#EF4444',
                  color: 'white',
                },
              },
              loading: {
                style: {
                  background: '#6B7280',
                  color: 'white',
                },
              },
            }}
          />
        </ModalProvider>
      </AuthProvider>
    </CookiesProvider>
  );
}
