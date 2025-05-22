// @ts-nocheck
'use client';

import { useState, useRef } from 'react';
import { Box, FormControl, InputLabel, Select as MuiSelect, MenuItem, Typography, FormHelperText } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface SelectProps {
  label: string;
  name: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
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
            px: 1
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
          sx={{
            '& .MuiSelect-select': {
              py: 1.5,
              px: 2,
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
                  : 'divider',
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
          <FormHelperText error={!!error}>
            {error || helperText}
          </FormHelperText>
        )}
      </FormControl>
    </Box>
  );
} 