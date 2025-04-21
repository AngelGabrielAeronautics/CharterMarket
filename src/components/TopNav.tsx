'use client';

import Link from 'next/link';
import AccountDropdown from './AccountDropdown';
import NotificationDropdown from './NotificationDropdown';
import { UserRole } from '@/lib/userCode';
import Logo from './Logo';

interface TopNavProps {
  userEmail: string;
  userRole: UserRole;
  firstName: string;
  onMenuClick: () => void;
  isMobileMenuOpen: boolean;
}

export default function TopNav({ userEmail, userRole, firstName, onMenuClick, isMobileMenuOpen }: TopNavProps) {
  return (
    <nav className="fixed top-0 right-0 left-0 bg-white dark:bg-dark-secondary border-b border-gray-200 dark:border-dark-border z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={onMenuClick}
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {/* Menu open: "hidden", Menu closed: "block" */}
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Menu open: "block", Menu closed: "hidden" */}
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
              <Logo href="/" height={32} />
            </div>
          </div>

          {/* Right side navigation items */}
          <div className="flex items-center space-x-4">
            <NotificationDropdown userId={userEmail} />
            <AccountDropdown userEmail={userEmail} firstName={firstName} />
          </div>
        </div>
      </div>
    </nav>
  );
} 