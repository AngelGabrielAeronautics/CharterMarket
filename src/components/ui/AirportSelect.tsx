'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Typography,
  CircularProgress,
  useTheme,
  Avatar,
  Grid,
} from '@mui/material';
import { Airport } from '@/types/airport';
import { getCityImageUrlWithFallback } from '@/lib/cityImages';
import Image from 'next/image';
import debounce from 'lodash/debounce';
import { ChevronDown } from 'lucide-react';

interface AirportSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  showCityImages?: boolean;
  onAirportSelected?: (airport: Airport | null) => void;
}

export default function AirportSelect({
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder = 'Search for an airport...',
  className,
  showCityImages = false,
  onAirportSelected,
}: AirportSelectProps) {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [cityImageUrl, setCityImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);

  // Debounced fetch function
  const fetchAirports = useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm.length < 2) {
        setOptions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`/api/airports/search?q=${searchTerm}`);
        const data: Airport[] = await response.json();
        setOptions(data);
      } catch (error) {
        console.error('Failed to fetch airports:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (inputValue) {
      fetchAirports(inputValue);
    } else {
      setOptions([]);
    }
  }, [inputValue, fetchAirports]);

  // Effect to fetch details and image for the initially selected airport (based on ICAO value)
  useEffect(() => {
    const loadInitialAirport = async () => {
      if (value && options.length === 0) {
        // Only if value is present and options haven't been fetched for it
        setLoading(true); // Indicate loading for initial fetch
        try {
          // Attempt to find in current options, or fetch if not found (e.g., on initial load)
          let airport = options.find((opt) => opt.icao === value);
          if (!airport) {
            const response = await fetch(`/api/airports/search?q=${value}`); // Assuming API can find by ICAO
            const data: Airport[] = await response.json();
            airport = data.find((d) => d.icao === value);
          }

          if (airport) {
            setSelectedAirport(airport);
            if (onAirportSelected) {
              onAirportSelected(airport);
            }
            if (showCityImages && airport.city && airport.country) {
              setImageLoading(true);
              const imageUrl = await getCityImageUrlWithFallback(airport);
              setCityImageUrl(imageUrl);
              setImageLoading(false);
            }
          }
        } catch (error) {
          console.error('Failed to fetch initial airport details:', error);
        } finally {
          setLoading(false);
        }
      } else if (!value) {
        setSelectedAirport(null);
        setCityImageUrl(null);
        if (onAirportSelected) {
          onAirportSelected(null);
        }
      }
    };
    loadInitialAirport();
  }, [value, showCityImages, onAirportSelected]); // options removed to avoid re-triggering if options change due to typing

  const handleSelectionChange = async (event: any, newValue: Airport | null) => {
    setSelectedAirport(newValue);
    onChange(newValue ? newValue.icao : ''); // Pass ICAO code up
    if (onAirportSelected) {
      onAirportSelected(newValue);
    }

    if (showCityImages && newValue && newValue.city && newValue.country) {
      setImageLoading(true);
      setCityImageUrl(null); // Clear previous image
      try {
        const imageUrl = await getCityImageUrlWithFallback(newValue);
        setCityImageUrl(imageUrl);
      } catch (error) {
        console.error('Failed to load city image for selected airport', error);
        setCityImageUrl(null); // Fallback or keep null
      } finally {
        setImageLoading(false);
      }
    } else {
      setCityImageUrl(null); // Clear image if no airport selected or no city/country
    }
  };

  return (
    <Box className={className}>
      <Autocomplete
        options={options}
        getOptionLabel={(option) =>
          `${option.name} (${option.icao}) - ${option.city}, ${option.country}`
        }
        value={selectedAirport}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        onChange={handleSelectionChange}
        loading={loading}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            variant="outlined"
            required={required}
            placeholder={placeholder}
            error={!!error}
            helperText={error}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.icao}>
            <Grid container alignItems="center" spacing={2}>
              {showCityImages && (
                <Grid item>
                  {/* Placeholder for potential small thumbnail in dropdown, not implemented here */}
                  {/* For now, using Avatar as a placeholder if you want an icon */}
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.8rem',
                      bgcolor: theme.palette.primary.light,
                    }}
                  >
                    {option.city.substring(0, 1)}
                  </Avatar>
                </Grid>
              )}
              <Grid item xs>
                <Typography variant="body2" component="div">
                  {option.name} ({option.icao})
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {option.city}, {option.country}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
        isOptionEqualToValue={(option, val) => option.icao === val.icao}
        filterOptions={(x) => x} // Disable frontend filtering, rely on API
        autoComplete
        includeInputInList
        filterSelectedOptions
      />
      {showCityImages && selectedAirport && (
        <Box
          sx={{
            mt: 2,
            height: 150,
            width: '100%',
            position: 'relative',
            borderRadius: '4px',
            overflow: 'hidden',
            backgroundColor: theme.palette.grey[200],
          }}
        >
          {imageLoading && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <CircularProgress />
            </Box>
          )}
          {!imageLoading && cityImageUrl && (
            <Image
              src={cityImageUrl}
              alt={`${selectedAirport.city}, ${selectedAirport.country}`}
              layout="fill" // Use fill for responsive behavior within the Box
              objectFit="cover"
              loading="lazy"
            />
          )}
          {!imageLoading && !cityImageUrl && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <Typography variant="caption">Image not available</Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
