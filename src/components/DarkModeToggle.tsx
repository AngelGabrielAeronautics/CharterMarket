'use client';

import { useDarkMode } from '@/contexts/DarkModeContext';

export default function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center space-x-3 px-4 py-2 w-full text-sm text-gray-700 dark:text-cream-200"
    >
      <div className="flex items-center justify-center w-5 h-5">
        {isDarkMode ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"
            />
          </svg>
        )}
      </div>
      <span className="uppercase">{isDarkMode ? 'DARK MODE' : 'LIGHT MODE'}</span>
      <div className={`ml-auto relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${isDarkMode ? 'bg-primary-600' : 'bg-gray-200'}`}>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
            isDarkMode ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
    </button>
  );
} 