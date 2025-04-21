'use client';

import { Sen } from 'next/font/google';
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DarkModeProvider } from '@/contexts/DarkModeContext';
import { ModalProvider } from '@/contexts/ModalContext';
import TopNavBar from '@/components/TopNavBar';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';

const sen = Sen({ 
  subsets: ['latin'],
  variable: '--font-sen',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  return (
    <html lang="en" suppressHydrationWarning className={`${sen.variable} font-sen antialiased text-gray-900 dark:text-dark-primary bg-white dark:bg-dark-primary transition-colors duration-200`}>
      <body
        suppressHydrationWarning
      >
        <DarkModeProvider>
          <ThemeProvider>
            <AuthProvider>
              <ModalProvider>
                <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
                  {!isDashboard && <TopNavBar />}
                  <main className={`w-full ${!isDashboard ? 'pt-16' : ''}`}>
                    {children}
                  </main>
                </div>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    success: {
                      duration: 3000,
                      style: {
                        background: '#10B981',
                        color: 'white',
                      },
                    },
                    error: {
                      duration: 4000,
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
          </ThemeProvider>
        </DarkModeProvider>
      </body>
    </html>
  );
}
