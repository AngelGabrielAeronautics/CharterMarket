// @ts-nocheck
'use client';

import React, { forwardRef } from 'react';
import { 
  FormControl, 
  InputLabel, 
  FormHelperText, 
  Box 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ReactPhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
}

// Styled wrapper for the phone input to match Material UI styling with mobile enhancements
const StyledPhoneInputWrapper = styled(Box)(({ theme }) => ({
  '& .react-tel-input': {
    fontFamily: theme.typography.fontFamily,
    
    '& .form-control': {
      width: '100%',
      // Enhanced mobile touch targets
      height: theme.breakpoints.down('sm') ? '48px' : '56px',
      padding: theme.breakpoints.down('sm') ? '12px 14px 12px 48px' : '16.5px 14px 16.5px 48px',
      // Prevents zoom on iOS
      fontSize: theme.breakpoints.down('sm') ? '16px' : theme.typography.body1.fontSize,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)'}`,
      transition: theme.transitions.create(['border-color', 'box-shadow']),
      // Better mobile line height
      lineHeight: theme.breakpoints.down('sm') ? 1.4 : 1.43,
      
      '&:hover': {
        borderColor: theme.palette.primary.main,
      },
      
      '&:focus': {
        borderColor: theme.palette.primary.main,
        // Enhanced mobile focus feedback
        borderWidth: theme.breakpoints.down('sm') ? '2px' : '2px',
        boxShadow: `0 0 0 2px ${theme.palette.primary.main}${theme.palette.mode === 'light' ? '20' : '30'}`,
        outline: 'none',
        // Adjust padding to compensate for thicker border
        padding: theme.breakpoints.down('sm') ? '11px 13px 11px 47px' : '15.5px 13px 15.5px 47px',
      },

      '&.error': {
        borderColor: theme.palette.error.main,
        '&:focus': {
          borderColor: theme.palette.error.main,
          padding: theme.breakpoints.down('sm') ? '11px 13px 11px 47px' : '15.5px 13px 15.5px 47px',
        }
      },
      
      '&.disabled': {
        backgroundColor: theme.palette.action.disabledBackground,
        color: theme.palette.action.disabled,
      },

      // Enhanced mobile placeholder styling
      '&::placeholder': {
        fontSize: theme.breakpoints.down('sm') ? '16px' : theme.typography.body1.fontSize,
        color: theme.palette.text.secondary
      }
    },
    
    '& .flag-dropdown': {
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: `${theme.shape.borderRadius}px 0 0 ${theme.shape.borderRadius}px`,
      // Enhanced mobile touch targets for flag dropdown
      minWidth: theme.breakpoints.down('sm') ? '48px' : '40px',
      height: '100%',
      
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
      
      '&:focus': {
        backgroundColor: theme.palette.action.hover,
        outline: 'none',
      },
      
      '& .selected-flag': {
        // Better mobile flag positioning
        padding: theme.breakpoints.down('sm') ? '0 8px' : '0 6px',
        display: 'flex',
        alignItems: 'center',
        
        '& .flag': {
          // Enhanced mobile flag sizing
          width: theme.breakpoints.down('sm') ? '20px' : '16px',
          height: theme.breakpoints.down('sm') ? '15px' : '11px',
        },
        
        '& .arrow': {
          // Better mobile arrow positioning
          marginLeft: theme.breakpoints.down('sm') ? '6px' : '4px',
          border: `3px solid ${theme.palette.text.secondary}`,
          borderRadius: '1px',
          borderColor: `transparent transparent ${theme.palette.text.secondary} transparent`,
          borderWidth: '0 3px 4px 3px'
        }
      }
    },
    
    '& .country-list': {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.shape.borderRadius,
      boxShadow: theme.shadows[8],
      // Better mobile dropdown sizing
      maxHeight: theme.breakpoints.down('sm') ? '60vh' : '200px',
      
      '& .country': {
        // Enhanced mobile touch targets for country list
        padding: theme.breakpoints.down('sm') ? '12px 16px' : '8px 12px',
        fontSize: theme.breakpoints.down('sm') ? '1rem' : '0.875rem',
        color: theme.palette.text.primary,
        
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
        
        '& .flag': {
          // Better mobile flag sizing in dropdown
          width: theme.breakpoints.down('sm') ? '20px' : '16px',
          height: theme.breakpoints.down('sm') ? '15px' : '11px',
          marginRight: theme.breakpoints.down('sm') ? '12px' : '8px',
        }
      },
      
      '& .search': {
        // Enhanced mobile search in dropdown
        padding: theme.breakpoints.down('sm') ? '12px' : '8px',
        
        '& input': {
          backgroundColor: theme.palette.background.default,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.shape.borderRadius,
          color: theme.palette.text.primary,
          // Mobile-friendly search input
          fontSize: theme.breakpoints.down('sm') ? '16px' : '0.875rem',
          height: theme.breakpoints.down('sm') ? '40px' : '32px',
          padding: theme.breakpoints.down('sm') ? '8px 12px' : '6px 8px',
          
          '&:focus': {
            outline: 'none',
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
          }
        }
      }
    }
  }
}));

const CustomPhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(({
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
}, ref) => {
  return (
    <FormControl fullWidth error={!!error} variant="outlined" required={required}>
      <InputLabel 
        shrink 
        sx={{ 
          transform: 'translate(0, -1.5px) scale(0.75)',
          transformOrigin: 'top left',
          // Better mobile label positioning
          fontSize: { xs: '1rem', sm: '1rem' },
          '&.Mui-focused': {
            fontSize: { xs: '0.75rem', sm: '0.75rem' }
          }
        }}
      >
        Phone Number
      </InputLabel>
      
      <StyledPhoneInputWrapper>
        <ReactPhoneInput
          ref={ref}
          inputProps={{
            required,
            name: 'phone',
          }}
          country={'za'}
          value={value}
          onChange={onChange}
          placeholder={helperText || ''}
          disabled={disabled}
          containerClass=""
          inputClass={`form-control ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
          buttonClass=""
          dropdownClass=""
          searchClass=""
          // Enhanced mobile-specific props
          searchPlaceholder="Search countries..."
          enableSearch={true}
          disableSearchIcon={false}
          // Better mobile UX
          preferredCountries={['za', 'us', 'gb', 'au']}
          excludeCountries={[]}
        />
      </StyledPhoneInputWrapper>
      
      {(error || helperText) && (
        <FormHelperText 
          error={!!error}
          sx={{
            // Better mobile helper text
            fontSize: { xs: '0.75rem', sm: '0.75rem' },
            marginLeft: { xs: '14px', sm: '14px' },
            marginRight: { xs: '14px', sm: '14px' },
            marginTop: { xs: '4px', sm: '3px' }
          }}
        >
          {error || helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
});

CustomPhoneInput.displayName = 'CustomPhoneInput';

export default CustomPhoneInput;