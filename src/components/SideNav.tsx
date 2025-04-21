'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/lib/userCode';
import DarkModeToggle from './DarkModeToggle';
import { useState } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    roles: ['passenger', 'operator', 'agent', 'admin', 'superAdmin'],
  },
  {
    name: 'Profile',
    href: '/dashboard/profile',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    roles: ['operator', 'agent', 'admin', 'superAdmin'],
  },
  {
    name: 'Passengers',
    href: '/dashboard/passengers',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    roles: ['passenger', 'operator', 'agent', 'admin', 'superAdmin'],
  },
  {
    name: 'Bookings',
    href: '/dashboard/bookings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    roles: ['passenger', 'operator', 'agent', 'admin', 'superAdmin'],
  },
  {
    name: 'Aircraft',
    href: '/dashboard/aircraft',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
    roles: ['operator', 'admin', 'superAdmin'],
  },
  {
    name: 'Clients',
    href: '/dashboard/clients',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    roles: ['agent', 'admin', 'superAdmin'],
  },
  {
    name: 'Users',
    href: '/dashboard/users',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    roles: ['admin', 'superAdmin'],
  },
  {
    name: 'Events',
    href: '/dashboard/events',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    roles: ['admin', 'superAdmin'],
  },
  {
    name: 'Admin Management',
    href: '/dashboard/admin',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    roles: ['superAdmin'],
  },
  {
    name: 'System Settings',
    href: '/dashboard/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ['admin', 'superAdmin'],
    children: [
      {
        name: 'Design System',
        href: '/design/colors',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        ),
        roles: ['superAdmin'],
      },
      {
        name: 'Test Pages',
        href: '/dashboard/test',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
        roles: ['superAdmin'],
      },
      {
        name: 'Test Components',
        href: '/dashboard/test/components',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        ),
        roles: ['superAdmin'],
      },
      {
        name: 'Test Forms',
        href: '/dashboard/test/forms',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
        roles: ['superAdmin'],
      },
      {
        name: 'Test Layouts',
        href: '/dashboard/test/layouts',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        ),
        roles: ['superAdmin'],
      },
    ],
  },
];

interface SideNavProps {
  userRole: UserRole;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function SideNav({ userRole, isMobile, onCloseMobile }: SideNavProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

  return (
    <nav className="flex flex-col w-64 h-full bg-white dark:bg-dark-secondary border-r border-gray-200 dark:border-dark-border">
      <div className="flex flex-col h-full">
        <div className="flex-1 py-4 overflow-y-auto">
          {/* Close button for mobile */}
          {isMobile && (
            <div className="px-4 pb-2 flex justify-end lg:hidden">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={onCloseMobile}
              >
                <span className="sr-only">Close sidebar</span>
                <svg
                  className="h-6 w-6 text-gray-500 dark:text-gray-400"
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
            </div>
          )}

          <div className="px-2 space-y-1">
            {navigation
              .filter(item => item.roles.includes(userRole))
              .map((item) => (
                <div key={item.name}>
                  {item.children ? (
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className={`w-full group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md ${
                        pathname.startsWith(item.href)
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-cream-100'
                          : 'text-primary-700 dark:text-cream-200 hover:bg-gray-50 dark:hover:bg-dark-accent'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className={`mr-3 ${
                          pathname.startsWith(item.href)
                            ? 'text-primary-900 dark:text-cream-100'
                            : 'text-primary-600 dark:text-primary-400 group-hover:text-primary-900 dark:group-hover:text-cream-100'
                        }`}>
                          {item.icon}
                        </span>
                        {item.name}
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          expandedItems.includes(item.name) ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        pathname === item.href
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-cream-100'
                          : 'text-primary-700 dark:text-cream-200 hover:bg-gray-50 dark:hover:bg-dark-accent'
                      }`}
                      onClick={isMobile ? onCloseMobile : undefined}
                    >
                      <span className={`mr-3 ${
                        pathname === item.href
                          ? 'text-primary-900 dark:text-cream-100'
                          : 'text-primary-600 dark:text-primary-400 group-hover:text-primary-900 dark:group-hover:text-cream-100'
                      }`}>
                        {item.icon}
                      </span>
                      {item.name}
                    </Link>
                  )}
                  
                  {item.children && expandedItems.includes(item.name) && (
                    <div className="ml-6 space-y-0.5 overflow-hidden transition-all duration-200 ease-in-out">
                      {item.children
                        .filter(child => child.roles.includes(userRole))
                        .map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={`group flex items-center px-2 py-1.5 text-xs font-medium rounded-md ${
                              pathname === child.href
                                ? 'bg-primary-50/50 dark:bg-primary-900/10 text-primary-800 dark:text-cream-200'
                                : 'text-primary-600 dark:text-cream-300 hover:bg-gray-50/50 dark:hover:bg-dark-accent/50'
                            }`}
                            onClick={isMobile ? onCloseMobile : undefined}
                          >
                            <span className={`mr-2 h-4 w-4 ${
                              pathname === child.href
                                ? 'text-primary-800 dark:text-cream-200'
                                : 'text-primary-500 dark:text-primary-400 group-hover:text-primary-800 dark:group-hover:text-cream-200'
                            }`}>
                              {child.icon}
                            </span>
                            {child.name}
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-dark-border">
          <DarkModeToggle />
        </div>
      </div>
    </nav>
  );
} 