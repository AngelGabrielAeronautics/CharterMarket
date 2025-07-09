'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DataUsage, Group, Flight, Business, AdminPanelSettings } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

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

const TestDataGenerator: React.FC = () => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<TestDataResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const generateTestData = async () => {
    if (!user?.role || !['admin', 'superAdmin'].includes(user.role)) {
      setError('Insufficient permissions. Admin access required.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const token = await user.getIdToken();
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

  const roleIcons = {
    passengers: <Group color="primary" />,
    agents: <Business color="secondary" />,
    operators: <Flight color="success" />,
    admins: <AdminPanelSettings color="warning" />
  };

  if (!user?.role || !['admin', 'superAdmin'].includes(user.role)) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Access denied. This feature requires admin privileges.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <DataUsage fontSize="large" color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a2b3c' }}>
              Test Data Generator
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This will create comprehensive test data including 20 user accounts across all roles, 
              aircraft, quote requests, and offers. All test accounts use the password: <strong>TestPassword123!</strong>
            </Typography>
          </Alert>

          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            What will be created:
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
            <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Group fontSize="large" color="primary" />
              <Typography variant="h6">20 Users</Typography>
              <Typography variant="body2" color="text.secondary">
                8 Passengers, 4 Agents, 6 Operators, 2 Admins
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Flight fontSize="large" color="secondary" />
              <Typography variant="h6">~20 Aircraft</Typography>
              <Typography variant="body2" color="text.secondary">
                2-5 aircraft per operator with realistic specs
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Business fontSize="large" color="success" />
              <Typography variant="h6">30 Quote Requests</Typography>
              <Typography variant="body2" color="text.secondary">
                From passengers and agents with realistic routes
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <DataUsage fontSize="large" color="warning" />
              <Typography variant="h6">~60 Offers</Typography>
              <Typography variant="body2" color="text.secondary">
                1-3 offers per request with response times
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleGenerateClick}
              disabled={isGenerating}
              startIcon={isGenerating ? <CircularProgress size={20} /> : <DataUsage />}
              sx={{ 
                backgroundColor: '#1a2b3c',
                '&:hover': { backgroundColor: '#2a3b4c' }
              }}
            >
              {isGenerating ? 'Generating Test Data...' : 'Generate Test Data'}
            </Button>
            
            {result && (
              <Chip 
                label="Generation Complete!" 
                color="success" 
                variant="outlined"
              />
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Error:</strong> {error}
              </Typography>
            </Alert>
          )}

          {result && (
            <Card sx={{ mt: 3, backgroundColor: '#f8fafc' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#16a34a', fontWeight: 'bold' }}>
                  ✅ Test Data Generated Successfully!
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Summary:
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary={`${result.summary.users} Users Created`}
                          secondary="Across all user roles"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary={`${result.summary.aircraft} Aircraft Added`}
                          secondary="Distributed among operators"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary={`${result.summary.quoteRequests} Quote Requests`}
                          secondary="With realistic routing"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary={`${result.summary.offers} Offers Submitted`}
                          secondary="With response time tracking"
                        />
                      </ListItem>
                    </List>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Users by Role:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {Object.entries(result.details.usersByRole).map(([role, count]) => (
                        <Box key={role} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {roleIcons[role as keyof typeof roleIcons]}
                          <Typography variant="body2">
                            <strong>{count}</strong> {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Login Credentials:
                    </Typography>
                    <Alert severity="info">
                      <Typography variant="body2">
                        <strong>Sample Email:</strong> {result.details.sampleCredentials.email}<br />
                        <strong>Password:</strong> {result.details.sampleCredentials.password}<br />
                        <em>{result.details.sampleCredentials.note}</em>
                      </Typography>
                    </Alert>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Test Data Generation</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will create 20+ user accounts and associated data in your Firebase project. 
            Make sure you're ready to clean this up later.
          </Alert>
          <Typography variant="body2">
            Are you sure you want to proceed with generating comprehensive test data?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button 
            onClick={generateTestData} 
            variant="contained" 
            disabled={isGenerating}
            sx={{ backgroundColor: '#1a2b3c' }}
          >
            Generate Test Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestDataGenerator; 