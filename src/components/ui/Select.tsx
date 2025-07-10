// @ts-nocheck
'use client';

import React, { useState, useRef } from 'react';
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  FormHelperText,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  label?: string;
  name?: string;
  value?: string | number;
  onChange?: (event: React.ChangeEvent<{ value: unknown }>) => void;
  required?: boolean;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  noOptionsMessage?: () => string;
}

export default function Select({
  label,
  name,
  value = '',
  onChange,
  required = false,
  error,
  helperText,
  options = [],
  className = '',
  disabled = false,
  isLoading = false,
  onInputChange,
  placeholder,
  noOptionsMessage,
}: SelectProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  return (
    <Box 
      sx={{ 
        position: 'relative',
        ...(className && { className })
      }}
    >
      <FormControl 
        fullWidth 
        error={!!error}
        disabled={disabled}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: disabled ? 'action.disabledBackground' : 'background.paper',
            transition: theme.transitions.create(['border-color', 'box-shadow']),
            // Enhanced mobile touch targets
            minHeight: { xs: '48px', sm: '56px' },
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
      >
        <InputLabel 
          id={`${name}-label`}
          sx={{
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
            // Improved mobile transform
            transform: { xs: 'translate(14px, 16px) scale(1)', sm: 'translate(14px, 16px) scale(1)' },
            '&.Mui-focused, &.MuiFormLabel-filled': {
              transform: { xs: 'translate(14px, -9px) scale(0.75)', sm: 'translate(14px, -9px) scale(0.75)' }
            }
          }}
        >
          {label}
          {required && <Typography component="span" color="error">*</Typography>}
        </InputLabel>
        <MuiSelect
          ref={selectRef}
          labelId={`${name}-label`}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          label={label}
          IconComponent={KeyboardArrowDownIcon}
          MenuProps={{
            PaperProps: {
              sx: {
                // Better mobile menu styling
                maxHeight: { xs: '60vh', sm: '40vh' },
                '& .MuiMenuItem-root': {
                  // Enhanced mobile touch targets for menu items
                  minHeight: { xs: '48px', sm: '40px' },
                  padding: { xs: '12px 16px', sm: '8px 16px' },
                  fontSize: { xs: '1rem', sm: '0.875rem' },
                  // Better mobile tap feedback
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                    '&:hover': {
                      backgroundColor: 'action.selected'
                    }
                  }
                }
              }
            }
          }}
          sx={{
            '& .MuiSelect-select': {
              // Enhanced mobile padding and spacing
              py: { xs: '12px', sm: '16.5px' },
              px: { xs: '14px', sm: '14px' },
              fontSize: { xs: '16px', sm: '1rem' }, // Prevents zoom on iOS
              lineHeight: { xs: 1.4, sm: 1.43 },
              minHeight: 'unset' // Reset default minHeight
            },
            '& .MuiSelect-icon': {
              // Better mobile icon sizing and positioning
              fontSize: { xs: '1.5rem', sm: '1.5rem' },
              right: { xs: '8px', sm: '8px' },
              transition: theme.transitions.create('transform', {
                duration: theme.transitions.duration.short
              }),
              // Enhanced visual feedback for mobile
              '.Mui-focused &': {
                transform: 'rotate(180deg)'
              }
            },
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
                : isFocused 
                  ? 'primary.main'
                  : 'primary.main',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: error 
                ? 'error.main'
                : 'primary.main',
            }
          }}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </MuiSelect>
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
    </Box>
  );
} 