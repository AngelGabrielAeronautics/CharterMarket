// @ts-nocheck
'use client';

import { useState, forwardRef, Ref } from 'react';
import ReactPhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { 
  Box, 
  FormControl, 
  FormHelperText, 
  InputLabel, 
  styled
} from '@mui/material';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
}

// Styled wrapper for the phone input to match Material UI styling
const StyledPhoneInputWrapper = styled(Box)(({ theme }) => ({
  '& .react-tel-input': {
    fontFamily: theme.typography.fontFamily,
    
    '& .form-control': {
      width: '100%',
      height: '56px',
      padding: '16.5px 14px',
      paddingLeft: '48px',
      fontSize: theme.typography.body1.fontSize,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)'}`,
      transition: theme.transitions.create(['border-color', 'box-shadow']),
      
      '&:hover': {
        borderColor: theme.palette.text.primary,
      },
      
      '&:focus': {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 2px ${theme.palette.primary.main}${theme.palette.mode === 'light' ? '20' : '30'}`,
        outline: 'none',
      },

      '&.error': {
        borderColor: theme.palette.error.main,
      },
      
      '&.disabled': {
        backgroundColor: theme.palette.action.disabledBackground,
        color: theme.palette.action.disabled,
      }
    },
    
    '& .flag-dropdown': {
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: `${theme.shape.borderRadius}px 0 0 ${theme.shape.borderRadius}px`,
      
      '& .selected-flag': {
        backgroundColor: 'transparent',
        padding: '0 0 0 12px',
        
        '&:hover, &:focus': {
          backgroundColor: theme.palette.action.hover,
        },
      },
      
      '& .country-list': {
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[2],
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        
        '& .country': {
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
          
          '&.highlight': {
            backgroundColor: theme.palette.action.selected,
          },
        },
      },
    },
  },
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
          transformOrigin: 'top left'
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
        />
      </StyledPhoneInputWrapper>
      
      {(error || helperText) && (
        <FormHelperText error={!!error}>
          {error || helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
});

CustomPhoneInput.displayName = 'CustomPhoneInput';

export default CustomPhoneInput;