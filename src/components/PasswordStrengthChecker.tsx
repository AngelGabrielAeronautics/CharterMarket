'use client';

import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, Paper } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

interface PasswordStrengthCheckerProps {
  password: string;
  isVisible: boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    label: 'At least 6 characters',
    test: (password) => password.length >= 6,
  },
  {
    label: 'At least 1 letter',
    test: (password) => /[a-z]/i.test(password),
  },
  {
    label: 'At least 1 uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: 'At least 1 special character',
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export default function PasswordStrengthChecker({ password, isVisible }: PasswordStrengthCheckerProps) {
  if (!isVisible) return null;

  return (
    <Paper variant="outlined" sx={{ 
      mt: 1.5, 
      p: 2, 
      bgcolor: 'background.paper',
      borderRadius: 2 
    }}>
      <Typography variant="subtitle2" fontWeight="medium" sx={{ mb: 1, color: 'text.secondary' }}>
        Password Requirements:
      </Typography>

      <List disablePadding dense>
        {passwordRequirements.map((requirement, index) => {
          const isMet = requirement.test(password);
          return (
            <ListItem key={index} disablePadding disableGutters sx={{ mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 30, color: isMet ? 'success.main' : 'text.disabled' }}>
                {isMet ? <CheckIcon fontSize="small" /> : <CloseIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText 
                primary={requirement.label} 
                sx={{ 
                  m: 0,
                  '& .MuiTypography-root': {
                    fontSize: '0.875rem',
                    color: isMet ? 'text.primary' : 'text.secondary'
                  }
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
}

export function validatePassword(password: string): boolean {
  return passwordRequirements.every(requirement => requirement.test(password));
} 