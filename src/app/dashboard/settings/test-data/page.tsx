'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import {
  DataUsage as DataIcon,
  Group as PeopleIcon,
  Flight as AircraftIcon,
  Business as QuoteIcon,
  LocalOffer as OfferIcon,
  AdminPanelSettings as AdminIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  ArrowBack as BackIcon,
  PlayArrow as GenerateIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

interface TestDataResult {
  success: boolean;
  message: string;
  summary: {
    users: number;
    aircraft: number;
    quoteRequests: number;
    offers: number;
  };
  details: {
    usersByRole: {
      passengers: number;
      agents: number;
      operators: number;
      admins: number;
    };
    sampleCredentials: {
      email: string;
      password: string;
      note: string;
    };
  };
}

export default function TestDataGeneratorPage() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<TestDataResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Only super admins can access this page
  if (!user || user.role !== 'superAdmin') {
    return (
      <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Alert severity="error">
          Access denied. This page is only accessible to Super Administrators.
        </Alert>
      </Box>
    );
  }

  const generateTestData = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        setError('User not authenticated');
        return;
      }
      
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/debug/create-comprehensive-test-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to generate test data');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setIsGenerating(false);
      setConfirmOpen(false);
    }
  };

  const handleGenerateClick = () => {
    setConfirmOpen(true);
  };

  const resetResults = () => {
    setResult(null);
    setError(null);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            component={Link}
            href="/dashboard/settings"
            variant="outlined"
            startIcon={<BackIcon />}
          >
            Back to Settings
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <DataIcon fontSize="large" color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a2b3c' }}>
            Test Data Generator
          </Typography>
        </Box>
        
        <Typography variant="body1" color="text.secondary">
          Generate comprehensive test data for development and testing purposes.
        </Typography>
      </Box>

      {/* Warning Alert */}
      <Alert severity="warning" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Important:</strong> This will create real data in your Firestore database. 
          Make sure you're running this in a development/testing environment. 
          All test accounts use the password: <strong>TestPassword123!</strong>
        </Typography>
      </Alert>

      {/* What will be created */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#1a2b3c' }}>
          Data to be Generated
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
          <Box sx={{ textAlign: 'center', p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <PeopleIcon fontSize="large" color="primary" sx={{ mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>20 Users</Typography>
            <Typography variant="body2" color="text.secondary">
              8 Passengers, 4 Agents<br/>6 Operators, 2 Admins
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <AircraftIcon fontSize="large" color="secondary" sx={{ mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>~20 Aircraft</Typography>
            <Typography variant="body2" color="text.secondary">
              2-5 aircraft per operator<br/>with realistic specifications
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <QuoteIcon fontSize="large" color="success" sx={{ mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>30 Quote Requests</Typography>
            <Typography variant="body2" color="text.secondary">
              From passengers and agents<br/>with realistic routes
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <OfferIcon fontSize="large" color="warning" sx={{ mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>~60 Offers</Typography>
            <Typography variant="body2" color="text.secondary">
              1-3 offers per request<br/>with response times
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Generation Button */}
      {!result && !error && (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleGenerateClick}
            disabled={isGenerating}
            startIcon={isGenerating ? <CircularProgress size={20} /> : <GenerateIcon />}
            sx={{ 
              backgroundColor: '#1a2b3c',
              '&:hover': { backgroundColor: '#2a3b4c' },
              px: 4,
              py: 1.5
            }}
          >
            {isGenerating ? 'Generating Test Data...' : 'Generate Test Data'}
          </Button>
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          <Typography variant="body2">
            <strong>Error:</strong> {error}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" size="small" onClick={resetResults}>
              Try Again
            </Button>
          </Box>
        </Alert>
      )}

      {/* Success Results */}
      {result && (
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <SuccessIcon color="success" fontSize="large" />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              Test Data Generated Successfully!
            </Typography>
          </Box>
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            {result.message}
          </Typography>

          {/* Summary Stats */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a2b3c' }}>
                {result.summary.users}
              </Typography>
              <Typography variant="body2" color="text.secondary">Users Created</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a2b3c' }}>
                {result.summary.aircraft}
              </Typography>
              <Typography variant="body2" color="text.secondary">Aircraft Added</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a2b3c' }}>
                {result.summary.quoteRequests}
              </Typography>
              <Typography variant="body2" color="text.secondary">Quote Requests</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a2b3c' }}>
                {result.summary.offers}
              </Typography>
              <Typography variant="body2" color="text.secondary">Offers Created</Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* User Breakdown */}
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Users by Role:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={result.details.usersByRole.passengers} size="small" color="primary" />
              <Typography variant="body2">Passengers</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={result.details.usersByRole.agents} size="small" color="secondary" />
              <Typography variant="body2">Agents</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={result.details.usersByRole.operators} size="small" color="success" />
              <Typography variant="body2">Operators</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={result.details.usersByRole.admins} size="small" color="warning" />
              <Typography variant="body2">Admins</Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Sample Credentials */}
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Sample Login Credentials:
          </Typography>
          <Box sx={{ p: 2, backgroundColor: '#f9f9f9', borderRadius: 1, mb: 3 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              <strong>Email:</strong> {result.details.sampleCredentials.email}<br/>
              <strong>Password:</strong> {result.details.sampleCredentials.password}<br/>
              <strong>Note:</strong> {result.details.sampleCredentials.note}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={resetResults}>
              Generate More Data
            </Button>
            <Button
              component={Link}
              href="/dashboard/users"
              variant="contained"
              sx={{ backgroundColor: '#1a2b3c', '&:hover': { backgroundColor: '#2a3b4c' } }}
            >
              View Users
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WarningIcon color="warning" />
          Confirm Test Data Generation
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This will create comprehensive test data in your Firestore database including:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><PeopleIcon color="primary" /></ListItemIcon>
              <ListItemText primary="20 user accounts across all roles" />
            </ListItem>
            <ListItem>
              <ListItemIcon><AircraftIcon color="secondary" /></ListItemIcon>
              <ListItemText primary="~20 aircraft with realistic specifications" />
            </ListItem>
            <ListItem>
              <ListItemIcon><QuoteIcon color="success" /></ListItemIcon>
              <ListItemText primary="30 quote requests with realistic routes" />
            </ListItem>
            <ListItem>
              <ListItemIcon><OfferIcon color="warning" /></ListItemIcon>
              <ListItemText primary="~60 offers with response times" />
            </ListItem>
          </List>
          <Alert severity="info" sx={{ mt: 2 }}>
            All test accounts will use the password: <strong>TestPassword123!</strong>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={generateTestData}
            variant="contained"
            sx={{ backgroundColor: '#1a2b3c', '&:hover': { backgroundColor: '#2a3b4c' } }}
          >
            Generate Test Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 