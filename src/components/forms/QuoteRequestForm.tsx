import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Grid, Typography, Paper, Button } from '@mui/material';
import AirportSelect from '@/components/ui/AirportSelect';
import { Airport } from '@/types/airport';

interface QuoteRequestFormData {
  departureAirport: string;
  arrivalAirport: string;
}

const QuoteRequestForm = () => {
  const {
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<QuoteRequestFormData>({
    defaultValues: {
      departureAirport: '',
      arrivalAirport: '',
    },
  });

  const departureAirport = watch('departureAirport');
  const arrivalAirport = watch('arrivalAirport');

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 2,
        backgroundColor: 'background.paper',
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        Request a Quote
      </Typography>
      <Grid container spacing={3}>
        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <Box sx={{ mb: 3 }}>
            <AirportSelect
              label="Departure Airport"
              value={departureAirport}
              onChange={(value) => setValue('departureAirport', value)}
              required
              error={errors.departureAirport?.message}
              showCityImages={true}
              placeholder="Search for departure city or airport"
            />
          </Box>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <Box sx={{ mb: 3 }}>
            <AirportSelect
              label="Arrival Airport"
              value={arrivalAirport}
              onChange={(value) => setValue('arrivalAirport', value)}
              required
              error={errors.arrivalAirport?.message}
              showCityImages={true}
              placeholder="Search for destination city or airport"
            />
          </Box>
        </Grid>
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={() => reset()}>
          Reset
        </Button>
      </Box>
    </Paper>
  );
};

export default QuoteRequestForm;
