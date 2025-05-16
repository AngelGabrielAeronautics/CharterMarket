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
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    endAdornment,
    InputProps,
    ...props 
  }, ref) => {
    return (
      <FormControl fullWidth error={!!error} variant="outlined">
        <TextField
          label={label}
          error={!!error}
          helperText={error || helperText}
          InputProps={{
            ...InputProps,
            endAdornment: endAdornment,
            ref: ref
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