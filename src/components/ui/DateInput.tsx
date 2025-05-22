// @ts-nocheck
'use client';

import { useState, useRef } from 'react';
import { Box, TextField, Typography, Fade } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface DateInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
        InputLabelProps={{
          shrink: true,
          sx: {
            color: error 
              ? 'error.main'
              : isFocused 
                ? 'primary.main'
                : 'text.secondary',
            bgcolor: 'background.paper',
            px: 1
          }
        }}
        InputProps={{
          sx: {
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
            },
            '& input[type="date"]::-webkit-calendar-picker-indicator': {
              opacity: 1,
              cursor: 'pointer',
              filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none'
            }
          }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: disabled ? 'action.disabledBackground' : 'background.paper',
            transition: theme.transitions.create(['border-color', 'box-shadow']),
          }
        }}
      />
      {required && !value && (
        <Typography
          component="span"
          color="error"
          sx={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none'
          }}
        >
          *
        </Typography>
      )}
    </Box>
  );
} 