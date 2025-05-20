'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { UserData } from '@/lib/auth'; // Assuming UserData type is defined here
import { format } from 'date-fns';

// Helper to parse Firestore Timestamp or ISO string into JS Date
const toJsDate = (value: any): Date => {
  if (!value) return new Date();
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number' && typeof value.nanoseconds === 'number') {
    return new Date(value.seconds * 1000 + value.nanoseconds / 1e6);
  }
  if (typeof value._seconds === 'number' && typeof value._nanoseconds === 'number') {
    return new Date(value._seconds * 1000 + value._nanoseconds / 1e6);
  }
  return new Date(value);
};

export default function UsersPage(): JSX.Element {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      if (!user || (user.role !== 'admin' && user.role !== 'superAdmin')) {
        setLoading(false);
        return; // Should be handled by layout/route guard
      }
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('createdAt', 'desc'), limit(50)); // Get latest 50 users for now
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => doc.data() as unknown as UserData);
        setUsers(data);
      } catch (err) {
        console.error('Error loading users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) fetchUsers();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Alert severity="error" sx={{ my: 4 }}>
        {error}
      </Alert>
    );
  }

  const getRoleChip = (role: string) => {
    let color: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'default' =
      'default';
    switch (role) {
      case 'admin':
      case 'superAdmin':
        color = 'error';
        break;
      case 'operator':
        color = 'primary';
        break;
      case 'agent':
        color = 'secondary';
        break;
      case 'passenger':
        color = 'success';
        break;
    }
    return <Chip label={role.charAt(0).toUpperCase() + role.slice(1)} color={color} size="small" />;
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', px: 2, py: 4 }}>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
        User Management
      </Typography>
      {users.length === 0 ? (
        <Typography>No users found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((usr) => {
                const createdAt = toJsDate(usr.createdAt);
                return (
                  <TableRow key={usr.userCode}>
                    <TableCell>{usr.userCode}</TableCell>
                    <TableCell>
                      {usr.firstName} {usr.lastName}
                    </TableCell>
                    <TableCell>{usr.email}</TableCell>
                    <TableCell>{getRoleChip(usr.role)}</TableCell>
                    <TableCell>{usr.company || '-'}</TableCell>
                    <TableCell>{format(createdAt, 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          usr.status
                            ? usr.status.charAt(0).toUpperCase() + usr.status.slice(1)
                            : 'Unknown'
                        }
                        color={
                          usr.status === 'active'
                            ? 'success'
                            : usr.status === 'pending'
                              ? 'warning'
                              : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
