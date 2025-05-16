'use client';

import { useState, useEffect } from 'react';
import { Box, TextField, Autocomplete, Typography, CircularProgress, useTheme } from '@mui/material';
import { Airport } from '@/types/airport';

interface AirportSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export default function AirportSelect({
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder = 'Search for an airport...',
  className = '',
}: AirportSelectProps) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAirports = async () => {
      if (query.length < 2) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/airports/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setAirports(data);
      } catch (error) {
        console.error('Error fetching airports:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchAirports, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const selectedAirport = airports.find((airport) => airport.iata === value);

  return (
    <Box sx={{ width: '100%', ...(className && { className }) }}>
      <Autocomplete
        value={selectedAirport || null}
        onChange={(_, newValue) => {
          onChange(newValue?.iata || '');
        }}
        inputValue={query}
        onInputChange={(_, newInputValue) => {
          setQuery(newInputValue);
        }}
        options={airports}
        getOptionLabel={(option) => 
          option ? `${option.iata} - ${option.name}, ${option.city}` : ''
        }
        loading={loading}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            required={required}
            error={!!error}
            helperText={error}
            placeholder={placeholder}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress
                      color="inherit"
                      size={20}
                      sx={{ mr: 1 }}
                    />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box>
              <Typography variant="body1">
                {option.iata} - {option.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {option.city}, {option.country}
              </Typography>
            </Box>
          </Box>
        )}
        noOptionsText={
          query.length < 2
            ? 'Type at least 2 characters to search'
            : 'No airports found'
        }
        sx={{
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
            },
          },
        }}
      />
    </Box>
  );
} 