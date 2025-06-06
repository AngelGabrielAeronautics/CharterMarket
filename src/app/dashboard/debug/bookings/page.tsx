'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Box, Typography, Paper, Alert, TextField, CircularProgress } from '@mui/material';

export default function BookingsDebugPage() {
  const { user } = useAuth();
  const [clientId, setClientId] = useState(user?.userCode || 'PA-PAX-XSOX');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testClientBookings = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      console.log('Testing client bookings API for:', clientId);

      const response = await fetch(`/api/bookings?clientId=${clientId}`);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
      console.log('API Response:', data);
    } catch (err) {
      console.error('API Test Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testDirectFirestore = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      console.log('Testing direct Firestore query...');

      // Import Firestore functions directly
      const { db } = await import('@/lib/firebase');
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');

      // Test 1: Basic query without orderBy
      console.log('Test 1: Basic query without orderBy');
      const basicQuery = query(collection(db, 'bookings'), where('clientId', '==', clientId));

      const basicSnapshot = await getDocs(basicQuery);
      console.log(`Basic query returned ${basicSnapshot.docs.length} documents`);

      const basicResults = basicSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Test 2: Query with orderBy (might fail due to composite index)
      console.log('Test 2: Query with orderBy');
      let orderByResults = null;
      try {
        const orderByQuery = query(
          collection(db, 'bookings'),
          where('clientId', '==', clientId),
          orderBy('createdAt', 'desc')
        );

        const orderBySnapshot = await getDocs(orderByQuery);
        console.log(`OrderBy query returned ${orderBySnapshot.docs.length} documents`);

        orderByResults = orderBySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (orderByError) {
        console.error('OrderBy query failed:', orderByError);
        orderByResults = {
          error: orderByError instanceof Error ? orderByError.message : 'OrderBy failed',
        };
      }

      setResults({
        basicQuery: basicResults,
        orderByQuery: orderByResults,
        testInfo: {
          clientId,
          basicCount: basicSnapshot.docs.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error('Direct Firestore test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">Please log in to use the bookings debug tools.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1000, margin: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Bookings Debug Tools
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current User Information
        </Typography>
        <Typography>Email: {user.email}</Typography>
        <Typography>User Code: {user.userCode}</Typography>
        <Typography>Role: {user.role}</Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Client Bookings Query
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <TextField
            label="Client ID to test"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <Button onClick={testClientBookings} disabled={loading} variant="contained">
            Test API Endpoint
          </Button>
          <Button onClick={testDirectFirestore} disabled={loading} variant="outlined">
            Test Direct Firestore
          </Button>
        </Box>

        {loading && <CircularProgress size={24} />}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Error:</Typography>
            <Typography variant="body2">{error}</Typography>
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
                maxHeight: '500px',
              }}
            >
              {JSON.stringify(results, null, 2)}
            </pre>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Troubleshooting Guide
        </Typography>
        <ol>
          <li>
            <strong>Permission Denied Error:</strong> Check authentication claims on{' '}
            <code>/dashboard/debug</code>
          </li>
          <li>
            <strong>Index Required Error:</strong> Create composite index in Firebase Console for{' '}
            <code>clientId</code> + <code>createdAt</code>
          </li>
          <li>
            <strong>Network Error:</strong> Check Firebase connection and project configuration
          </li>
          <li>
            <strong>Empty Results:</strong> No bookings exist for this client ID
          </li>
        </ol>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Common Fix:</strong> If you see "requires an index" error, go to Firebase
            Console → Firestore → Indexes → Composite, and create an index with:
            <br />• Collection ID: <code>bookings</code>
            <br />• Field: <code>clientId</code> (Ascending)
            <br />• Field: <code>createdAt</code> (Descending)
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
}
