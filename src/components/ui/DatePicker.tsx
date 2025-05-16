'use client';

import { forwardRef } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/Calendar';
import { Box, Button, Typography, Popover, IconButton } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useTheme } from '@mui/material/styles';

interface DatePickerProps {
  label: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  ({ label, value, onChange, error, disabled, className }, ref) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    return (
      <Box 
        ref={ref} 
        sx={{ 
          position: 'relative',
          width: '100%',
          ...(className && { className })
        }}
      >
        <Button
          variant="outlined"
          disabled={disabled}
          onClick={handleClick}
          fullWidth
          sx={{
            justifyContent: 'flex-start',
            textAlign: 'left',
            fontWeight: 'normal',
            borderColor: error ? 'error.main' : undefined,
            '&:hover': {
              borderColor: error ? 'error.main' : undefined,
            }
          }}
        >
          <CalendarTodayIcon sx={{ mr: 1, fontSize: 20 }} />
          <Typography
            sx={{
              color: value ? 'text.primary' : 'text.secondary',
              flex: 1,
              textAlign: 'left'
            }}
          >
            {value ? format(value, 'PPP') : 'Pick a date'}
          </Typography>
        </Button>

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              p: 0,
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[3]
            }
          }}
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date);
              handleClose();
            }}
            disabled={(date) => date < new Date()}
            initialFocus
          />
        </Popover>

        {error && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 1, display: 'block' }}
          >
            {error}
          </Typography>
        )}

        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: -10,
            left: 8,
            px: 1,
            bgcolor: 'background.paper',
            color: 'text.secondary',
            fontWeight: 500
          }}
        >
          {label}
        </Typography>
      </Box>
    );
  }
);

DatePicker.displayName = 'DatePicker'; 