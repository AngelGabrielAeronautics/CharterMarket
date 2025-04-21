'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { UserRole } from '@/lib/userCode';

interface AccountDropdownProps {
  userEmail: string;
  firstName: string;
}

export default function AccountDropdown({ userEmail, firstName }: AccountDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setUserCode(userData.userCode);
          setRole(userData.role);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, [userEmail]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-accent min-h-[44px] touch-manipulation"
      >
        <div className="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {firstName.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-gray-700 dark:text-cream-200 hidden sm:block">{firstName}</span>
        <svg
          className={`w-4 h-4 text-gray-500 dark:text-cream-300 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-screen sm:w-64 bg-white dark:bg-dark-secondary rounded-md shadow-lg border border-gray-200 dark:border-dark-border max-w-[calc(100vw-2rem)] sm:max-w-none">
          <div className="py-2">
            <Link
              href="/dashboard"
              className="block px-4 py-3 sm:py-2 border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-accent"
              onClick={() => setIsOpen(false)}
            >
              <p className="text-sm font-medium text-gray-900 dark:text-cream-100">Account Details</p>
              <p className="text-sm text-gray-500 dark:text-cream-300 break-all">{userEmail}</p>
              <p className="text-sm text-gray-500 dark:text-cream-300 mt-1">
                <span className="font-medium">User Code:</span> {userCode}
              </p>
              <p className="text-sm text-gray-500 dark:text-cream-300">
                <span className="font-medium">Account Type:</span> <span className="capitalize">{role}</span>
              </p>
            </Link>
            
            <Link
              href="/dashboard/profile"
              className="block px-4 py-3 sm:py-2 text-sm text-gray-700 dark:text-cream-200 hover:bg-gray-100 dark:hover:bg-dark-accent min-h-[44px] flex items-center"
              onClick={() => setIsOpen(false)}
            >
              USER PROFILE
            </Link>
            
            <Link
              href="/dashboard/guide"
              className="block px-4 py-3 sm:py-2 text-sm text-gray-700 dark:text-cream-200 hover:bg-gray-100 dark:hover:bg-dark-accent min-h-[44px] flex items-center"
              onClick={() => setIsOpen(false)}
            >
              SETUP GUIDE
            </Link>
            
            <Link
              href="/dashboard/support"
              className="block px-4 py-3 sm:py-2 text-sm text-gray-700 dark:text-cream-200 hover:bg-gray-100 dark:hover:bg-dark-accent min-h-[44px] flex items-center"
              onClick={() => setIsOpen(false)}
            >
              HELP & SUPPORT
            </Link>

            <Link
              href="/dashboard/profile"
              className="block px-4 py-3 sm:py-2 text-sm text-gray-700 dark:text-cream-200 hover:bg-gray-100 dark:hover:bg-dark-accent min-h-[44px] flex items-center border-t border-gray-200 dark:border-dark-border"
              onClick={() => {
                setIsOpen(false);
                router.push('/dashboard/profile?action=change-password');
              }}
            >
              CHANGE PASSWORD
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-3 sm:py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-accent min-h-[44px] flex items-center"
            >
              SIGN OUT
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 