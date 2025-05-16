'use client';

import React, { ReactNode } from 'react';
import { 
  Box, 
  Alert, 
  AlertTitle, 
  Button, 
  IconButton,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export type BannerVariant = 'default' | 'success' | 'warning' | 'error';

interface BannerProps {
  variant?: BannerVariant;
  title?: string;
  message?: string;
  children?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  onDismiss?: () => void;
}

export default function Banner({ 
  variant = 'default',
  title,
  message,
  children, 
  action,
  onDismiss 
}: BannerProps) {
  // Map Banner variant to Alert severity
  const getSeverity = () => {
    switch(variant) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  return (
    <Alert 
      severity={getSeverity()}
      sx={{ 
        mb: 3,
        '& .MuiAlert-message': {
          width: '100%'
        }
      }}
      action={
        onDismiss && (
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={onDismiss}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        )
      }
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%'
      }}>
        <Box sx={{ flexGrow: 1 }}>
          {title && <AlertTitle>{title}</AlertTitle>}
          {message && <Typography variant="body2">{message}</Typography>}
          {children}
        </Box>
        
        {action && (
          <Button
            variant="text"
            size="small"
            onClick={action.onClick}
            disabled={action.loading}
            sx={{ ml: 2, whiteSpace: 'nowrap' }}
          >
            {action.loading ? 'LOADING...' : action.label}
          </Button>
        )}
      </Box>
    </Alert>
  );
} 