'use client';

import { forwardRef } from 'react';
import { 
  TextField, 
  FormControl, 
  TextFieldProps
} from '@mui/material';

export interface InputProps extends Omit<TextFieldProps, 'error'> {
  label?: string;
  error?: string;
  helperText?: string;
  endAdornment?: React.ReactNode;
  min?: number | string;
  max?: number | string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    endAdornment,
    InputProps,
    min,
    max,
    ...props 
  }, ref) => {
    return (
      <FormControl fullWidth error={!!error} variant="outlined">
        <TextField
          label={label}
          error={!!error}
          helperText={error || helperText}
          inputRef={ref}
          InputProps={{
            ...InputProps,
            endAdornment: endAdornment,
            sx: {
              // Enhanced mobile touch targets and spacing
              minHeight: { xs: '48px', sm: '56px' },
              '& .MuiInputBase-input': {
                padding: { xs: '12px 14px', sm: '16.5px 14px' },
                fontSize: { xs: '16px', sm: '1rem' }, // Prevents zoom on iOS
                lineHeight: { xs: 1.4, sm: 1.43 }
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
              },
              ...InputProps?.sx
            }
          }}
          InputLabelProps={{
            sx: {
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
          inputProps={{
            min,
            max,
            sx: {
              // Enhanced mobile accessibility
              '&::placeholder': {
                fontSize: { xs: '1rem', sm: '1rem' },
                color: 'text.secondary'
              }
            }
          }}
          fullWidth
          margin="dense"
          variant="outlined"
          {...props}
        />
      </FormControl>
    );
  }
);

Input.displayName = 'Input';

export default Input; 