'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Box, Typography, Paper, Alert, CircularProgress } from '@mui/material';

export default function DebugPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUserClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/debug/user-claims', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to check claims: ${response.statusText}`);
      }

      const claims = await response.json();
      setResults(claims);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fixUserClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/auth/fix-user-claims', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fix claims: ${response.statusText}`);
      }

      const result = await response.json();
      setResults(result);

      // Force token refresh to get updated claims
      await auth.currentUser?.getIdToken(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testBookingAccess = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/debug/test-booking', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to test booking access: ${response.statusText}`);
      }

      const result = await response.json();
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testFirestoreRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/debug/test-rules', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to test Firestore rules: ${response.statusText}`
        );
      }

      const result = await response.json();
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const checkFirebaseConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug/firebase-config');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to check Firebase config: ${response.statusText}`
        );
      }

      const result = await response.json();
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const forceTokenRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/debug/force-token-refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to force token refresh: ${response.statusText}`);
      }

      const result = await response.json();
      setResults(result);

      // Log out user after forcing token refresh
      await auth.signOut();
      window.location.href = '/login?message=token_refreshed';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createTestData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/debug/create-test-data', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create test data: ${response.statusText}`);
      }

      const result = await response.json();
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">Please log in to use the debug tools.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 800, margin: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Debug Tools
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current User Information
        </Typography>
        <Typography>Email: {user.email}</Typography>
        <Typography>User Code: {user.userCode}</Typography>
        <Typography>Role: {user.role}</Typography>
        <Typography>UID: {user.uid}</Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Authentication Claims
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Button onClick={checkUserClaims} disabled={loading}>
            Check Claims
          </Button>
          <Button onClick={fixUserClaims} disabled={loading} variant="outlined">
            Fix Claims
          </Button>
          <Button onClick={testBookingAccess} disabled={loading} variant="outlined">
            Test Booking Access
          </Button>
          <Button onClick={testFirestoreRules} disabled={loading} variant="outlined">
            Test Firestore Rules
          </Button>
          <Button onClick={checkFirebaseConfig} disabled={loading} variant="outlined">
            Check Firebase Config
          </Button>
          <Button onClick={createTestData} disabled={loading} variant="outlined" color="success">
            Create Test Bookings
          </Button>
          <Button onClick={forceTokenRefresh} disabled={loading} variant="outlined" color="warning">
            Force Token Refresh
          </Button>
        </Box>

        {loading && <CircularProgress size={24} />}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {results && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Results:
            </Typography>
            <pre
              style={{
                background: '#f5f5f5',
                padding: '16px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
              }}
            >
              {JSON.stringify(results, null, 2)}
            </pre>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Troubleshooting Steps
        </Typography>
        <ol>
          <li>
            Click "Check Firebase Config" to verify your app is connecting to the right project
          </li>
          <li>Click "Check Claims" to verify your authentication status</li>
          <li>If claims are missing or invalid, click "Fix Claims"</li>
          <li>Click "Test Booking Access" to verify permissions for the latest booking</li>
          <li>Click "Test Firestore Rules" to verify Firestore rules</li>
          <li>After fixing claims, refresh the page and try the booking process again</li>
          <li>
            If Firestore rules still block access, click "Force Token Refresh" (will log you out)
          </li>
          <li>If issues persist, try logging out and logging back in</li>
        </ol>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Common Issues & Solutions
        </Typography>
        <ul>
          <li>
            <strong>Wrong Project:</strong> Check "Firebase Config" - should show charter-ef2c2
          </li>
          <li>
            <strong>Missing Custom Claims:</strong> Click "Fix Claims" and refresh
          </li>
          <li>
            <strong>Permission Denied:</strong> Check that userCode matches booking
            clientId/operatorId
          </li>
          <li>
            <strong>500 Server Errors:</strong> Usually caused by missing Firestore composite
            indexes
          </li>
          <li>
            <strong>Booking Not Found:</strong> Ensure the booking ID exists in Firestore
          </li>
        </ul>
      </Paper>
    </Box>
  );
}
