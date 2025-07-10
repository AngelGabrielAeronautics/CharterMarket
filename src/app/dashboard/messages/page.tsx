"use client";

import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import MessagingInterface from '@/components/messaging/MessagingInterface';

export default function MessagesPage() {
  return (
    <Container maxWidth="xl" sx={{ py: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Messages
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Communicate with operators, passengers, and agents
        </Typography>
      </Box>

      <Paper sx={{ flex: 1, overflow: 'hidden' }}>
        <MessagingInterface />
      </Paper>
    </Container>
  );
} 