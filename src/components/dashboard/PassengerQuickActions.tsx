'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  Avatar,
} from '@mui/material';
import Link from 'next/link';
import { FlightTakeoff, Person, ReceiptLong, Support, Flight, Phone } from '@mui/icons-material';

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  primary?: boolean;
}

const QuickAction: React.FC<QuickActionProps> = ({
  title,
  description,
  icon,
  href,
  primary = false,
}) => (
  <Card
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 4,
      },
      ...(primary && {
        borderColor: 'primary.main',
        borderWidth: 1,
        borderStyle: 'solid',
      }),
    }}
  >
    <CardContent sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
        <Avatar
          sx={{
            bgcolor: primary ? 'primary.main' : 'action.selected',
            color: primary ? 'primary.contrastText' : 'text.primary',
            width: 40,
            height: 40,
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ ml: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Box>
    </CardContent>
    <CardActions sx={{ p: 2, pt: 0 }}>
      <Button
        component={Link}
        href={href}
        variant={primary ? 'contained' : 'outlined'}
        color={primary ? 'primary' : 'inherit'}
        fullWidth
      >
        {primary ? 'Get Started' : 'View'}
      </Button>
    </CardActions>
  </Card>
);

export default function PassengerQuickActions() {
  const actions: QuickActionProps[] = [
    {
      title: 'Book a Flight',
      description: 'Request quotes for your next journey',
      icon: <FlightTakeoff />,
      href: '/dashboard/quotes/request',
      primary: true,
    },
    {
      title: 'Manage Passengers',
      description: 'Add or edit passenger information',
      icon: <Person />,
      href: '/dashboard/passengers',
    },
    {
          title: 'View Invoices & Payments',
    description: 'Access and download your invoices and payment information',
      icon: <ReceiptLong />,
      href: '/dashboard/invoices',
    },
    {
      title: 'Track Your Flights',
      description: 'Get real-time updates on your bookings',
      icon: <Flight />,
      href: '/dashboard/bookings',
    },
    {
      title: 'Contact Support',
      description: '24/7 assistance for your travel needs',
      icon: <Support />,
      href: '/support',
    },
    {
      title: 'Emergency Contact',
      description: 'Immediate assistance for urgent matters',
      icon: <Phone />,
      href: '/emergency',
    },
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight="medium" gutterBottom>
        Quick Actions
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {actions.map((action) => (
          <Grid key={action.title} component="div" size={{ xs: 12, sm: 6, md: 4 }}>
            <QuickAction {...action} />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
