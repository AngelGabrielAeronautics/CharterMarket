'use client';

import React from 'react';
import { Box, Typography, Paper, Chip, Grid, Divider, IconButton, Tooltip } from '@mui/material';
import {
  FlightTakeoff,
  FlightLand,
  AccessTime,
  CheckCircle,
  Warning,
  ArrowForward,
  Cancel,
  Schedule,
  Paid,
  PendingActions,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface FlightStatusCardProps {
  bookingId: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: Date;
  status: string;
  flightNumber?: string;
  operatorName?: string;
  isPaid?: boolean;
  onClick?: () => void;
}

export default function FlightStatusCard({
  bookingId,
  departureAirport,
  arrivalAirport,
  departureDate,
  status,
  flightNumber,
  operatorName,
  isPaid = false,
  onClick,
}: FlightStatusCardProps) {
  // Get status color and icon
  const getStatusInfo = () => {
    switch (status) {
      case 'confirmed':
        return {
          color: 'success',
          icon: <CheckCircle fontSize="small" />,
          text: 'Confirmed',
        };
      case 'pending':
        return {
          color: 'warning',
          icon: <PendingActions fontSize="small" />,
          text: 'Pending',
        };
      case 'cancelled':
        return {
          color: 'error',
          icon: <Cancel fontSize="small" />,
          text: 'Cancelled',
        };
      case 'scheduled':
        return {
          color: 'info',
          icon: <Schedule fontSize="small" />,
          text: 'Scheduled',
        };
      default:
        return {
          color: 'default',
          icon: <Warning fontSize="small" />,
          text: status,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick
          ? {
              boxShadow: 2,
              borderColor: 'primary.main',
            }
          : {},
      }}
      onClick={onClick}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FlightTakeoff color="primary" fontSize="small" sx={{ mr: 1 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                From
              </Typography>
              <Typography variant="subtitle1" fontWeight="medium">
                {departureAirport}
              </Typography>
            </Box>

            <ArrowForward
              sx={{
                mx: 2,
                color: 'text.disabled',
              }}
              fontSize="small"
            />

            <FlightLand color="primary" fontSize="small" sx={{ mr: 1 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                To
              </Typography>
              <Typography variant="subtitle1" fontWeight="medium">
                {arrivalAirport}
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTime color="action" fontSize="small" sx={{ mr: 1 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Departure Date
              </Typography>
              <Typography variant="subtitle1">{format(departureDate, 'dd MMM yyyy')}</Typography>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={6} md={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Chip
              icon={statusInfo.icon}
              label={statusInfo.text}
              size="small"
              color={statusInfo.color as any}
              variant={status === 'confirmed' ? 'filled' : 'outlined'}
              sx={{ mb: 1 }}
            />

            {isPaid ? (
              <Chip
                icon={<Paid fontSize="small" />}
                label="Paid"
                size="small"
                color="success"
                variant="outlined"
              />
            ) : status !== 'cancelled' ? (
              <Chip label="Payment Required" size="small" color="warning" variant="outlined" />
            ) : null}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              {flightNumber && (
                <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                  Flight:{' '}
                  <Typography component="span" variant="caption" fontWeight="medium">
                    {flightNumber}
                  </Typography>
                </Typography>
              )}
              {operatorName && (
                <Typography variant="caption" color="text.secondary">
                  Operator:{' '}
                  <Typography component="span" variant="caption" fontWeight="medium">
                    {operatorName}
                  </Typography>
                </Typography>
              )}
            </Box>

            <Typography variant="caption" fontFamily="monospace" color="text.secondary">
              {bookingId}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
