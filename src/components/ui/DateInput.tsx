// @ts-nocheck
'use client';

import React, { useState, useRef } from 'react';
import { TextField, Box, useTheme } from '@mui/material';

interface DateInputProps {
  label?: string;
  name?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  min?: string;
  max?: string;
}

export default function DateInput({
  label,
  name,
  value,
  onChange,
  required = false,
  error,
  helperText,
  className = '',
  disabled = false,
  id,
  onFocus,
  onBlur,
  min,
  max,
}: DateInputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <Box 
      sx={{ 
        position: 'relative',
        ...(className && { className })
      }}
    >
      <TextField
        ref={inputRef}
        id={id || name}
        name={name}
        type="date"
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        error={!!error}
        helperText={error || helperText}
        label={label}
        min={min}
        max={max}
        fullWidth
        variant="outlined"
        InputProps={{
          sx: {
            // Enhanced mobile touch targets and spacing
            minHeight: { xs: '48px', sm: '56px' },
            '& .MuiInputBase-input': {
              padding: { xs: '12px 14px', sm: '16.5px 14px' },
              fontSize: { xs: '16px', sm: '1rem' }, // Prevents zoom on iOS
              lineHeight: { xs: 1.4, sm: 1.43 },
              // Better mobile date picker appearance
              '&::-webkit-calendar-picker-indicator': {
                width: { xs: '20px', sm: '16px' },
                height: { xs: '20px', sm: '16px' },
                cursor: 'pointer',
                // Enhanced mobile touch target for date picker icon
                padding: { xs: '4px', sm: '2px' },
                margin: { xs: '0 4px', sm: '0 2px' }
              }
            },
            // Better mobile focus states
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: { xs: '2px', sm: '2px' }
              }
            },
            // Enhanced mobile hover states
            '&:hover:not(.Mui-disabled)': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main'
              }
            }
          }
        }}
        InputLabelProps={{
          shrink: true,
          sx: {
            color: error 
              ? 'error.main'
              : isFocused 
                ? 'primary.main'
                : 'text.secondary',
            bgcolor: 'background.paper',
            px: 1,
            // Better mobile label positioning and sizing
            fontSize: { xs: '1rem', sm: '1rem' },
            '&.Mui-focused': {
              fontSize: { xs: '0.75rem', sm: '0.75rem' }
            },
            '&.MuiFormLabel-filled': {
              fontSize: { xs: '0.75rem', sm: '0.75rem' }
            },
            // Improved mobile transform for shrunk labels
            '&.MuiInputLabel-shrink': {
              transform: { xs: 'translate(14px, -9px) scale(0.75)', sm: 'translate(14px, -9px) scale(0.75)' }
            }
          }
        }}
        FormHelperTextProps={{
          sx: {
            // Better mobile helper text
            fontSize: { xs: '0.75rem', sm: '0.75rem' },
            marginLeft: { xs: '14px', sm: '14px' },
            marginRight: { xs: '14px', sm: '14px' },
            marginTop: { xs: '4px', sm: '3px' }
          }
        }}
        sx={{
          // Enhanced mobile date input styling
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: error 
              ? 'error.main'
              : isFocused 
                ? 'primary.main'
                : 'divider',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: error 
              ? 'error.main'
              : 'primary.main',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: error 
              ? 'error.main'
              : 'primary.main',
          }
        }}
      />
    </Box>
  );
} 