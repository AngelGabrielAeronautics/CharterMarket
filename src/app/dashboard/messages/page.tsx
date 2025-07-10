'use client';

import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import MessagingInterface from '@/components/messaging/MessagingInterface';
import { useAuth } from '@/contexts/AuthContext';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Authentication Required
          </Typography>
          <Typography color="text.secondary">
            Please log in to access the messaging system.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        height: 'calc(100vh - 64px)', // Subtract header height
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Page Header */}
      <Box
        sx={{
          py: 2,
          px: 3,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
          Messages
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Communicate with operators, passengers, and agents
        </Typography>
      </Box>

      {/* Messaging Interface */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <MessagingInterface />
      </Box>
    </Box>
  );
};

export default MessagesPage; 