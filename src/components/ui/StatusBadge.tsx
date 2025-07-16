'use client';

import React from 'react';
import { Chip } from '@mui/material';
import { FlightStatus } from '@/types/flight';
import { 
  getPassengerStatusDisplay, 
  getOperatorStatusDisplay, 
  getPulseClasses 
} from '@/utils/status-helpers';

interface StatusBadgeProps {
  status: FlightStatus;
  perspective: 'passenger' | 'operator';
  operatorUserCode?: string;
  request?: {
    operatorUserCodesWhoHaveQuoted?: string[];
    acceptedOperatorUserCode?: string;
  };
  hasUnviewedQuotes?: boolean;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  perspective,
  operatorUserCode,
  request,
  hasUnviewedQuotes = false,
  className = ''
}) => {
  const statusDisplay = perspective === 'passenger' 
    ? getPassengerStatusDisplay(status, hasUnviewedQuotes)
    : getOperatorStatusDisplay(status, operatorUserCode || '', request || {});

  const pulseClasses = getPulseClasses(statusDisplay.pulse);
  
  return (
    <Chip
      label={statusDisplay.label}
      title={statusDisplay.description}
      size="small"
      sx={{
        width: '100%',
        backgroundColor: statusDisplay.backgroundColor,
        color: statusDisplay.color,
        fontWeight: 'bold',
        fontSize: '0.75rem',
        border: '1px solid',
        borderColor: status === 'accepted' ? '#ffffff' : statusDisplay.pulse ? '#4caf50' : 'rgba(0, 0, 0, 0.23)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        textTransform: 'capitalize',
        '& .MuiChip-label': {
          display: 'block',
          width: '100%',
          textAlign: 'center',
          fontWeight: 'inherit',
          fontSize: 'inherit',
        },
        ...(statusDisplay.pulse && {
          animation: 'quoteReceivedPulse 1.5s infinite',
          '@keyframes quoteReceivedPulse': {
            '0%': { 
              opacity: 1,
              transform: 'scale(1)',
              boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)',
              borderRadius: '16px'
            },
            '50%': { 
              opacity: 0.4,
              transform: 'scale(1.15)',
              boxShadow: '0 0 0 8px rgba(76, 175, 80, 0)',
              borderRadius: '20px'
            },
            '100%': { 
              opacity: 1,
              transform: 'scale(1)',
              boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)',
              borderRadius: '16px'
            }
          }
        }),
      }}
      className={`${pulseClasses} ${className}`}
    />
  );
};

export default StatusBadge; 