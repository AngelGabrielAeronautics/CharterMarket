'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Skeleton, Divider } from '@mui/material';
import {
  WbSunny as SunnyIcon,
  Cloud as CloudyIcon,
  Thunderstorm as ThunderstormIcon,
  AcUnit as SnowIcon,
  WaterDrop as RainIcon,
  Visibility as FogIcon,
} from '@mui/icons-material';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

interface WeatherWidgetProps {
  departureAirport?: string;
  arrivalAirport?: string;
  departureDate?: Date;
}

export default function WeatherWidget({
  departureAirport,
  arrivalAirport,
  departureDate,
}: WeatherWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [departureWeather, setDepartureWeather] = useState<WeatherData | null>(null);
  const [arrivalWeather, setArrivalWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    // This would be replaced with a real API call in production
    const fetchWeatherData = async () => {
      setLoading(true);

      // Simulating API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data for demonstration purposes
      if (departureAirport) {
        setDepartureWeather({
          location: departureAirport,
          temperature: 22,
          condition: 'Mostly Sunny',
          icon: 'sunny',
          humidity: 55,
          windSpeed: 12,
        });
      }

      if (arrivalAirport) {
        setArrivalWeather({
          location: arrivalAirport,
          temperature: 18,
          condition: 'Partly Cloudy',
          icon: 'cloudy',
          humidity: 65,
          windSpeed: 8,
        });
      }

      setLoading(false);
    };

    if (departureAirport || arrivalAirport) {
      fetchWeatherData();
    }
  }, [departureAirport, arrivalAirport]);

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'sunny':
        return <SunnyIcon sx={{ color: '#F59E0B', fontSize: 36 }} />;
      case 'cloudy':
        return <CloudyIcon sx={{ color: '#6B7280', fontSize: 36 }} />;
      case 'rain':
        return <RainIcon sx={{ color: '#3B82F6', fontSize: 36 }} />;
      case 'storm':
        return <ThunderstormIcon sx={{ color: '#7C3AED', fontSize: 36 }} />;
      case 'snow':
        return <SnowIcon sx={{ color: '#E5E7EB', fontSize: 36 }} />;
      case 'fog':
        return <FogIcon sx={{ color: '#9CA3AF', fontSize: 36 }} />;
      default:
        return <SunnyIcon sx={{ color: '#F59E0B', fontSize: 36 }} />;
    }
  };

  const renderWeatherCard = (weather: WeatherData | null) => {
    if (!weather) return null;

    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>
          {weather.location}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
          {getWeatherIcon(weather.icon)}
          <Typography variant="h4" sx={{ ml: 1, fontWeight: 'bold' }}>
            {weather.temperature}°C
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {weather.condition}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Box sx={{ textAlign: 'center', px: 2 }}>
            <Typography variant="caption" color="text.secondary">
              HUMIDITY
            </Typography>
            <Typography variant="body2">{weather.humidity}%</Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Box sx={{ textAlign: 'center', px: 2 }}>
            <Typography variant="caption" color="text.secondary">
              WIND
            </Typography>
            <Typography variant="body2">{weather.windSpeed} km/h</Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderSkeleton = () => (
    <Box sx={{ textAlign: 'center' }}>
      <Skeleton variant="text" width={80} height={28} sx={{ mx: 'auto', mb: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
        <Skeleton variant="circular" width={36} height={36} />
        <Skeleton variant="text" width={60} height={42} sx={{ ml: 1 }} />
      </Box>
      <Skeleton variant="text" width={100} height={20} sx={{ mx: 'auto', mb: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Skeleton variant="text" width={40} height={16} sx={{ mx: 2 }} />
        <Skeleton variant="text" width={40} height={16} sx={{ mx: 2 }} />
      </Box>
    </Box>
  );

  if (!departureAirport && !arrivalAirport) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight="medium" gutterBottom>
        Weather Forecast
        {departureDate && (
          <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
            ({departureDate.toLocaleDateString()})
          </Typography>
        )}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={6}>
          {loading ? renderSkeleton() : renderWeatherCard(departureWeather)}
        </Grid>

        {arrivalWeather && (
          <Grid item xs={6}>
            {loading ? renderSkeleton() : renderWeatherCard(arrivalWeather)}
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
