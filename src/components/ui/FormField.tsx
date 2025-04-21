import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export default function FormField({ 
  label, 
  required = false, 
  error, 
  className = '',
  children 
}: FormFieldProps) {
  return (
    <div className={`${className}`}>
      <label className="block text-sm font-medium text-primary-900 dark:text-cream-100 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

// Input styles that can be used with the FormField component
export const inputStyles = {
  default: "w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-primary dark:text-cream-100 transition-colors duration-200",
  error: "w-full px-3 py-2 border border-red-300 dark:border-red-500 rounded-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm dark:bg-dark-primary dark:text-cream-100 transition-colors duration-200"
}; 