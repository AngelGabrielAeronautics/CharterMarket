'use client';

import React, { useState } from 'react';
import { Popover, TextField, Button, Box, Checkbox, FormControlLabel, Typography, InputAdornment, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addMonths } from 'date-fns';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface CustomDateTimePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  required?: boolean;
}

export default function CustomDateTimePicker({
  label,
  value,
  onChange,
  minDate = new Date(),
  maxDate = addMonths(new Date(), 12),
  required = false,
}: CustomDateTimePickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [tempDatePart, setTempDatePart] = useState<Date | null>(value);
  const [tempTimePart, setTempTimePart] = useState<Date | null>(value);
  const [dateNotDecided, setDateNotDecided] = useState<boolean>(false);
  const [calendarKey, setCalendarKey] = useState(0);
  const [displayedMonth, setDisplayedMonth] = useState<Date>(value ?? new Date());
  const currentYear = minDate.getFullYear();
  const nextYear = currentYear + 1;

  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setTempDatePart(value);
    setTempTimePart(value);
    setDisplayedMonth(value ?? new Date());
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleReset = () => {
    setTempDatePart(value);
    setTempTimePart(value);
    setDateNotDecided(false);
    setCalendarKey(prev => prev + 1);
    setDisplayedMonth(value ?? new Date());
  };

  const handleApply = () => {
    if (tempDatePart != null) {
      const combined = new Date(tempDatePart);
      if (tempTimePart) {
        combined.setHours(tempTimePart.getHours(), tempTimePart.getMinutes(), 0, 0);
      }
      onChange(combined);
    }
    handleClose();
  };

  const formatted = value
    ? `${format(value, 'PP')} ${
        value.getHours() !== 0 || value.getMinutes() !== 0
          ? format(value, 'HH:mm')
          : '--:--'
      }`
    : '';

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <TextField
        label={label}
        value={formatted}
        onClick={handleOpen}
        required={required}
        fullWidth
        InputProps={{
          readOnly: true,
          startAdornment: <InputAdornment position="start"><CalendarTodayIcon /></InputAdornment>
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{ sx: { width: 350, ...(dateNotDecided ? { minHeight: '600px' } : {}) } }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {dateNotDecided && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 1 }}>
              <Button
                variant={displayedMonth.getFullYear() === currentYear ? 'contained' : 'text'}
                onClick={() => {
                  const dt = new Date(currentYear, 0, 1);
                  setTempDatePart(dt);
                  setDisplayedMonth(dt);
                }}
              >
                {currentYear}
              </Button>
              <Button
                variant={displayedMonth.getFullYear() === nextYear ? 'contained' : 'text'}
                onClick={() => {
                  const dt = new Date(nextYear, 0, 1);
                  setTempDatePart(dt);
                  setDisplayedMonth(dt);
                }}
              >
                {nextYear}
              </Button>
            </Box>
          )}
          <DateCalendar
            key={calendarKey}
            value={tempDatePart}
            onChange={(newDate) => {
              setTempDatePart(newDate);
            }}
            onMonthChange={(month) => setDisplayedMonth(month)}
            minDate={minDate}
            maxDate={maxDate}
            {...(dateNotDecided ? { views: ['month'], openTo: 'month' } : {})}
          />
          {/* Date not decided block with border */}
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 1 }}>
            {dateNotDecided && (
              <>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Indicative quote
                </Typography>
                <Typography variant="body2">
                  Get an estimated price for planning only—you won't be able to accept this quote.
                </Typography>
                <Typography variant="body2">
                  To receive an official quote, please submit a new request once your dates are confirmed.
                </Typography>
              </>
            )}
            <FormControlLabel
              control={
                <Checkbox
                  checked={dateNotDecided}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setDateNotDecided(checked);
                    if (checked) {
                      setTempDatePart(null);
                      setTempTimePart(null);
                    }
                  }}
                />
              }
              label="Date not decided"
            />
          </Box>
          {/* Custom Hour/Minute Selectors */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>HH</InputLabel>
              <Select
                label="HH"
                value={tempTimePart ? tempTimePart.getHours().toString() : ''}
                onChange={(e) => {
                  const hour = parseInt(e.target.value as string, 10);
                  setTempTimePart(prev => {
                    const date = prev ? new Date(prev) : new Date();
                    date.setHours(hour);
                    return date;
                  });
                }}
                disabled={dateNotDecided}
              >
                {Array.from({ length: 24 }, (_, i) => i).map(h => (
                  <MenuItem key={h} value={h.toString()}>{h.toString().padStart(2, '0')}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <InputLabel sx={{ fontSize: '0.75rem' }}>MM</InputLabel>
              <Select
                label="MM"
                value={tempTimePart ? tempTimePart.getMinutes().toString() : ''}
                onChange={(e) => {
                  const min = parseInt(e.target.value as string, 10);
                  setTempTimePart(prev => {
                    const date = prev ? new Date(prev) : new Date();
                    date.setMinutes(min);
                    return date;
                  });
                }}
                disabled={dateNotDecided}
              >
                {Array.from({ length: 12 }, (_, i) => i * 5).map(m => (
                  <MenuItem key={m} value={m.toString()}>{m.toString().padStart(2, '0')}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={handleReset}>Reset</Button>
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="contained" onClick={handleApply}>
              Apply
            </Button>
          </Box>
        </Box>
      </Popover>
    </LocalizationProvider>
  );
} 