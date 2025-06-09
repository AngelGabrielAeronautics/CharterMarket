'use client';

import Link from 'next/link';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

export default function NotFound() {
  return (
    <Container maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          borderRadius: 2,
        }}
      >
        <ErrorIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          404 - Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Sorry, the page you are looking for does not exist or has been moved.
        </Typography>
        <Button component={Link} href="/dashboard" variant="contained" color="primary">
          Go to Dashboard
        </Button>
      </Paper>
    </Container>
  );
}
