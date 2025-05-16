import React from 'react';
import { Box, Typography } from '@mui/material';

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
    <Box className={className} sx={{ mb: 2 }}>
      <Typography variant="body2" fontWeight={500} color="text.primary" mb={0.5} component="label">
        {label}
        {required && <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Box>}
      </Typography>
      {children}
      {error && (
        <Typography variant="caption" color="error" mt={0.5} display="block">{error}</Typography>
      )}
    </Box>
  );
}

// Input styles that can be used with the FormField component
export const inputStyles = {
  default: "w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-primary dark:text-cream-100 transition-colors duration-200",
  error: "w-full px-3 py-2 border border-red-300 dark:border-red-500 rounded-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm dark:bg-dark-primary dark:text-cream-100 transition-colors duration-200"
}; 