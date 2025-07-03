import React from 'react';

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export const MainContent: React.FC<MainContentProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <main className={`flex-1 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen ${className}`}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  );
}; 