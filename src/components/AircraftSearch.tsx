'use client';

import { useState, useEffect } from 'react';
import type { AircraftStatus } from '@/types/aircraft';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Grid, 
  Paper, 
  Stack, 
  InputAdornment, 
  Chip,
  Card, 
  CardContent, 
  CardMedia 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import { getImageUrl } from '@/utils/image-utils';

// Simplified aircraft data for search component
interface ExtendedAircraft {
  id: string;
  manufacturer: string;
  maxPassengers: number;
  maxRange: number;
  registration: string;
  model: string;
  status: AircraftStatus;
  images: string[];
}

interface AircraftSearchProps {
  aircraft: ExtendedAircraft[];
  onSearch: (filters: AircraftSearchFilters) => void;
}

interface AircraftSearchFilters {
  searchTerm: string;
  manufacturer?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPassengers?: number;
  maxPassengers?: number;
  minRange?: number;
  maxRange?: number;
  status?: string;
}

export default function AircraftSearch({ aircraft, onSearch }: AircraftSearchProps) {
  const [filters, setFilters] = useState<AircraftSearchFilters>({
    searchTerm: '',
  });

  const [activeFilter, setActiveFilter] = useState<string>('basic');

  const handleFilterChange = (filterName: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const manufacturers = [...new Set(aircraft.map(a => a.manufacturer))];
  const statuses = [...new Set(aircraft.map(a => a.status))];

  const filteredAircraft = aircraft.filter(a => {
    // Search term filter
    const searchMatch = 
      filters.searchTerm === '' ||
      a.model.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      a.manufacturer.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      a.registration.toLowerCase().includes(filters.searchTerm.toLowerCase());

    // Numeric filters
    const passengerMatch = 
      a.maxPassengers >= (filters.minPassengers || 0) && 
      a.maxPassengers <= (filters.maxPassengers || 100);
    
    const rangeMatch = 
      a.maxRange >= (filters.minRange || 0) && 
      a.maxRange <= (filters.maxRange || 10000);

    // Array filters
    const manufacturerMatch = 
      (filters.manufacturer === undefined || filters.manufacturer === '') || 
      a.manufacturer.toLowerCase().includes(filters.manufacturer.toLowerCase());
    
    const statusMatch = 
      (filters.status === undefined || filters.status === '') || 
      a.status.toLowerCase().includes(filters.status.toLowerCase());

    return searchMatch && passengerMatch && rangeMatch && manufacturerMatch && statusMatch;
  });

  const toggleManufacturer = (manufacturer: string) => {
    setFilters(prev => ({
      ...prev,
      manufacturer: prev.manufacturer === manufacturer ? undefined : manufacturer,
    }));
  };

  const toggleStatus = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status === status ? undefined : status,
    }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
    });
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search aircraft by model, manufacturer, or registration"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            size="small"
          />
          <Button
            variant="outlined"
            onClick={() => setActiveFilter(activeFilter === 'advanced' ? 'basic' : 'advanced')}
            startIcon={<TuneIcon />}
          >
            Advanced
          </Button>
          {(filters.searchTerm || filters.manufacturer || filters.status) && (
            <Button
              variant="text"
              onClick={resetFilters}
              startIcon={<CloseIcon />}
            >
              Reset
            </Button>
          )}
        </Box>

        {activeFilter === 'advanced' && (
          <Paper sx={{ p: 3, bgcolor: 'background.neutral' }} variant="outlined">
            <Stack spacing={3}>
              <Grid container spacing={3}>
                <Grid
                  component="div"
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                    Passenger Capacity
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      type="number"
                      placeholder="Min"
                      value={filters.minPassengers || ''}
                      onChange={(e) => handleFilterChange('minPassengers', parseInt(e.target.value) || 0)}
                      size="small"
                      sx={{ width: 100 }}
                    />
                    <Typography variant="body2">to</Typography>
                    <TextField
                      type="number"
                      placeholder="Max"
                      value={filters.maxPassengers || ''}
                      onChange={(e) => handleFilterChange('maxPassengers', parseInt(e.target.value) || 100)}
                      size="small"
                      sx={{ width: 100 }}
                    />
                  </Box>
                </Grid>

                <Grid
                  component="div"
                  size={{
                    xs: 12,
                    md: 6
                  }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                    Range (nm)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      type="number"
                      placeholder="Min"
                      value={filters.minRange || ''}
                      onChange={(e) => handleFilterChange('minRange', parseInt(e.target.value) || 0)}
                      size="small"
                      sx={{ width: 100 }}
                    />
                    <Typography variant="body2">to</Typography>
                    <TextField
                      type="number"
                      placeholder="Max"
                      value={filters.maxRange || ''}
                      onChange={(e) => handleFilterChange('maxRange', parseInt(e.target.value) || 10000)}
                      size="small"
                      sx={{ width: 100 }}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                  Manufacturer
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {manufacturers.map((manufacturer) => (
                    <Chip
                      key={manufacturer}
                      label={manufacturer}
                      onClick={() => toggleManufacturer(manufacturer)}
                      color={filters.manufacturer === manufacturer ? 'primary' : 'default'}
                      variant={filters.manufacturer === manufacturer ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                  Status
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {statuses.map((status) => (
                    <Chip
                      key={status}
                      label={status}
                      onClick={() => toggleStatus(status)}
                      color={filters.status === status ? 'primary' : 'default'}
                      variant={filters.status === status ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Box>
            </Stack>
          </Paper>
        )}
      </Stack>
      <Grid container spacing={3}>
        {filteredAircraft.map((aircraft) => (
          <Grid
            key={aircraft.id}
            component="div"
            size={{
              xs: 12,
              md: 6,
              lg: 4
            }}>
            <Card 
              component={Link} 
              href={`/dashboard/aircraft/${aircraft.id}`}
              sx={{ 
                height: '100%', 
                textDecoration: 'none',
                transition: 'box-shadow 0.3s',
                '&:hover': {
                  boxShadow: 6
                }
              }}
            >
              <Box sx={{ position: 'relative', paddingTop: '56.25%' }}> {/* 16:9 aspect ratio */}
                {aircraft.images[0] && typeof aircraft.images[0] === 'string' ? (
                  <CardMedia
                    component="img"
                    image={getImageUrl(aircraft.images[0])}
                    alt={`${aircraft.manufacturer} ${aircraft.model}`}
                    sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'background.neutral'
                  }}>
                    <ImageIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                  </Box>
                )}
                <Chip
                  label={aircraft.status}
                  size="small"
                  sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    bgcolor: 'rgba(0, 0, 0, 0.7)', 
                    color: 'white' 
                  }}
                />
              </Box>
              <CardContent>
                <Typography variant="h6" color="text.primary" gutterBottom>
                  {aircraft.manufacturer} {aircraft.model}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Registration: {aircraft.registration}
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid component="div" size={6}>
                    <Typography variant="body2" color="text.secondary">Passengers</Typography>
                    <Typography variant="body1" fontWeight="medium">{aircraft.maxPassengers}</Typography>
                  </Grid>
                  <Grid component="div" size={6}>
                    <Typography variant="body2" color="text.secondary">Range</Typography>
                    <Typography variant="body1" fontWeight="medium">{aircraft.maxRange} nm</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {filteredAircraft.length === 0 && (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No aircraft found matching your criteria
          </Typography>
        </Box>
      )}
    </Stack>
  );
} 