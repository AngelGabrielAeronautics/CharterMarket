'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDarkMode } from '@/contexts/DarkModeContext';
import AccountDropdown from './AccountDropdown';
import Logo from './Logo';
import RegisterButton from './RegisterButton';
import LoginButton from './LoginButton';

export default function TopNavBar() {
  const { user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-dark-primary shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo href="/" />
          </div>

          {/* Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {user && (
                <Link
                  href="/dashboard"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-cream-200 hover:bg-gray-100 dark:hover:bg-dark-accent"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Right side - User menu or Sign in/Register */}
          {user ? (
            <AccountDropdown 
              userEmail={user.email || ''}
              firstName={user.firstName || (user.email ? user.email.split('@')[0] : 'User')}
            />
          ) : (
            <div className="flex items-center space-x-6">
              <LoginButton />
              <RegisterButton className="px-6 py-3 rounded-md border-2 border-tiber-DEFAULT bg-tiber-DEFAULT text-linen-dark hover:bg-transparent hover:text-tiber-DEFAULT transition-all duration-200 text-lg font-medium" data-register-button>
                REGISTER
              </RegisterButton>
            </div>
          )}
        </div>
      </nav>
      <div className="h-24" /> {/* Spacer to match new navbar height */}
    </>
  );
} 