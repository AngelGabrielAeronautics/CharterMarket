'use client';

import { Box, Typography, Alert } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface EmailValidatorProps {
  email: string;
  isVisible: boolean;
}

export function validateEmail(email: string): boolean {
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

export default function EmailValidator({ email, isVisible }: EmailValidatorProps) {
  if (!isVisible || !email) return null;

  const isValid = validateEmail(email);

  return (
    <Box sx={{ mt: 0.5 }}>
      {!isValid && (
        <Typography variant="caption" sx={{ 
          color: 'error.main',
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.75rem'
        }}>
          <ErrorOutlineIcon fontSize="inherit" sx={{ mr: 0.5 }} />
          Please enter a valid email address
        </Typography>
      )}
    </Box>
  );
} 