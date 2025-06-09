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
  InputAdornment,
} from '@mui/material';
import { Airport } from '@/types/airport';
import { getCityImageUrlWithFallback } from '@/lib/cityImages';
import Image from 'next/image';
import debounce from 'lodash/debounce';
import { ChevronDown } from 'lucide-react';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';

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
  disabled?: boolean;
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
  disabled = false,
}: AirportSelectProps) {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const manualEntryOption: Airport = {
    icao: 'MANUAL',
    name: 'Manually add unlisted airfields',
    city: '',
    country: '',
    iata: '',
    timezone: '',
    latitude: 0,
    longitude: 0,
  };

  const [options, setOptions] = useState<Airport[]>([manualEntryOption]);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState<Airport | string | null>(null);
  const [cityImageUrl, setCityImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [showUndocumented, setShowUndocumented] = useState(false);

  const getOptionLabelString = (option: Airport | string): string => {
    if (typeof option === 'string') return option;
    if (option.icao === 'MANUAL') return ''; // Manual entry shouldn't show in input
    return `${option.name} (${option.icao}) - ${option.city}, ${option.country}`;
  };

  // Debounced fetch function
  const fetchAirports = useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm.length < 2) {
        setOptions([]);
        setOptions([manualEntryOption]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`/api/airports/search?q=${searchTerm}`);
        const data: Airport[] = await response.json();
        // Always include the manual entry option at the beginning
        setOptions([manualEntryOption, ...data]);
        setShowUndocumented(data.length === 0);
      } catch (error) {
        console.error('Failed to fetch airports:', error);
        setOptions([manualEntryOption]);
        setShowUndocumented(true);
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
      setOptions([manualEntryOption]);
      setShowUndocumented(false);
    }
  }, [inputValue, fetchAirports]);

  // Effect to fetch details and image for the initially selected airport (based on ICAO value prop)
  useEffect(() => {
    const loadAirportFromValueProp = async () => {
      if (!value) {
        setSelectedValue(null);
        setInputValue('');
        if (cityImageUrl) setCityImageUrl(null);
        if (onAirportSelected) onAirportSelected(null);
        return;
      }

      if (value === 'MANUAL') {
        setSelectedValue(manualEntryOption);
        setInputValue(getOptionLabelString(manualEntryOption)); // Though it's empty
        return;
      }

      let currentICAO = '';
      if (selectedValue && typeof selectedValue !== 'string') currentICAO = selectedValue.icao;
      else if (typeof selectedValue === 'string') currentICAO = selectedValue;

      if (value !== currentICAO) {
        // Only process if the prop value is actually different
        setLoading(true);
        try {
          let airport = options.find((opt) => typeof opt !== 'string' && opt.icao === value);
          if (!airport) {
            const response = await fetch(`/api/airports/search?q=${value}`);
            const data: Airport[] = await response.json();
            airport = data.find((d) => d.icao === value);
          }

          if (airport) {
            setSelectedValue(airport);
            setInputValue(getOptionLabelString(airport));
            if (onAirportSelected) onAirportSelected(airport);
            if (showCityImages && airport.city && airport.country) {
              setImageLoading(true);
              const imageUrl = await getCityImageUrlWithFallback(airport);
              setCityImageUrl(imageUrl);
              setImageLoading(false);
            }
          } else {
            // If value is an ICAO but not found, clear out to avoid stale display
            setSelectedValue(null);
            setInputValue('');
            if (onAirportSelected) onAirportSelected(null);
          }
        } catch (err) {
          console.error('Failed to fetch airport for value prop:', err);
          setSelectedValue(null);
          setInputValue('');
        } finally {
          setLoading(false);
        }
      }
    };
    loadAirportFromValueProp();
  }, [value, onAirportSelected, showCityImages]); // Removed options and selectedValue from deps

  // Show helper message below the input whenever the user has typed at least 2 characters,
  // the component is not loading, and no airport suggestions are available.
  useEffect(() => {
    if (!loading && inputValue.trim().length >= 2 && options.length === 0) {
      setShowUndocumented(true);
    } else {
      setShowUndocumented(false);
    }
  }, [loading, inputValue, options]);

  const handleSelectionChange = async (event: unknown, newValue: Airport | string | null) => {
    if (disabled) return;

    // If the value is an Airport object, keep it; otherwise store the free-text string.
    // Prevent selecting the manual message option
    if (newValue && typeof newValue !== 'string' && newValue.icao === 'MANUAL') {
      return; // Do nothing when manual message is clicked
    }

    setSelectedValue(newValue);

    if (typeof newValue === 'string') {
      // Free-text entry – pass the raw string up and notify that no documented airport was selected.
      onChange(newValue.trim());
      if (onAirportSelected) {
        onAirportSelected(null);
      }
    } else if (newValue) {
      // Airport object selected from the list
      onChange(newValue.icao);
      if (onAirportSelected) {
        onAirportSelected(newValue);
      }
    } else {
      // Selection cleared
      onChange('');
      if (onAirportSelected) {
        onAirportSelected(null);
      }
    }

    if (
      showCityImages &&
      newValue &&
      typeof newValue !== 'string' &&
      newValue.city &&
      newValue.country
    ) {
      setImageLoading(true);
      setCityImageUrl(null); // Clear previous image
      try {
        const imageUrl = await getCityImageUrlWithFallback(newValue as Airport);
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

  // Helper to determine if we need to commit free text
  function freeSoloCommitNeeded() {
    // No airport object selected and user has typed something.
    return (selectedValue === null || selectedValue === '') && inputValue.trim().length > 0;
  }

  return (
    <Box className={className}>
      <Autocomplete
        freeSolo
        options={options}
        getOptionLabel={getOptionLabelString}
        value={selectedValue ?? null}
        inputValue={inputValue}
        onInputChange={(event, newInputValue, reason) => {
          if (disabled && reason !== 'reset') return;
          setInputValue(newInputValue);
        }}
        onChange={handleSelectionChange}
        onBlur={() => {
          if (disabled) return;
          // Commit the current input as a free-text value when the field loses focus and nothing is selected yet.
          if (freeSoloCommitNeeded()) {
            const trimmed = inputValue.trim();
            if (trimmed) {
              handleSelectionChange(null, trimmed);
            }
          }
        }}
        loading={loading}
        disabled={disabled}
        readOnly={disabled}
        disableClearable={disabled}
        noOptionsText="Undocumented airfields can be added manually"
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            variant="outlined"
            required={required}
            placeholder={placeholder}
            error={!!error}
            disabled={disabled}
            helperText={
              error
                ? `${error}${showUndocumented ? ' — Undocumented airfields can be added manually' : ''}`
                : showUndocumented
                  ? 'Undocumented airfields can be added manually'
                  : ' '
            }
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  {label === 'From' && (
                    <InputAdornment position="start">
                      <FlightTakeoffIcon />
                    </InputAdornment>
                  )}
                  {label === 'To' && (
                    <InputAdornment position="start">
                      <FlightLandIcon />
                    </InputAdornment>
                  )}
                  {params.InputProps.startAdornment}
                </>
              ),
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) =>
          typeof option === 'string' ? (
            <Box component="li" {...props} key={option}>
              {option}
            </Box>
          ) : option.icao === 'MANUAL' ? (
            <Box
              component="li"
              {...props}
              onClick={(e) => e.stopPropagation()} // Prevent selection
              key={option.icao}
              sx={{
                fontStyle: 'italic',
                color: theme.palette.primary.main,
                fontWeight: 'bold',
                borderTop: '1px solid',
                borderColor: theme.palette.divider,
                py: 1.5,
                pointerEvents: 'none', // Make non-clickable
              }}
            >
              {option.name}
            </Box>
          ) : (
            <Box component="li" {...props} key={option.icao}>
              <Grid container alignItems="center" spacing={2}>
                {showCityImages && (
                  <Grid>
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
                <Grid size="grow">
                  <Typography variant="body2" component="div">
                    {option.name} ({option.icao})
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {option.city}, {option.country}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )
        }
        isOptionEqualToValue={(option, val) => {
          if (typeof option === 'string' || typeof val === 'string') {
            return option === val;
          }
          return option.icao === val.icao;
        }}
        filterOptions={(x) => x} // Disable frontend filtering, rely on API
        autoComplete
        includeInputInList
        filterSelectedOptions
      />
      {showCityImages && selectedValue && typeof selectedValue !== 'string' && (
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
              alt={`${selectedValue.city}, ${selectedValue.country}`}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              style={{ objectFit: 'cover' }}
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
