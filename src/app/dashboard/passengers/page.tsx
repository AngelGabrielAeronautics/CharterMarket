'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { UserRole } from '@/lib/userCode';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DateInput from '@/components/ui/DateInput';
import PhoneInput from '@/components/ui/PhoneInput';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Grid,
  Alert,
  Chip,
  Container,
  CircularProgress,
} from '@mui/material';

interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  passportNumber: string;
  passportExpiry: string;
  nationality: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function PassengersPage() {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAddingPassenger, setIsAddingPassenger] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    passportNumber: '',
    passportExpiry: '',
    nationality: '',
  });

  useEffect(() => {
    fetchPassengers();
  }, []);

  const fetchPassengers = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // First, get the user's details to create default passenger
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', user.email));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        
        // Then get all passengers
        const passengersRef = collection(db, 'users', userData.userCode, 'passengers');
        const passengersSnapshot = await getDocs(passengersRef);
        
        const passengersData = passengersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Passenger[];

        // If no passengers exist, create default passenger from user data
        if (passengersData.length === 0) {
          const defaultPassenger = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phoneNumber: userData.phoneNumber || '',
            dateOfBirth: '',
            passportNumber: '',
            passportExpiry: '',
            nationality: '',
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const docRef = await addDoc(collection(db, 'users', userData.userCode, 'passengers'), defaultPassenger);
          passengersData.push({ id: docRef.id, ...defaultPassenger });
        }

        setPassengers(passengersData);
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(error.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', user.email));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        const passengersRef = collection(db, 'users', userData.userCode, 'passengers');
        
        const newPassenger = {
          ...formData,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const docRef = await addDoc(passengersRef, newPassenger);
        
        setPassengers(prev => [...prev, { id: docRef.id, ...newPassenger }]);
        setIsAddingPassenger(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          dateOfBirth: '',
          passportNumber: '',
          passportExpiry: '',
          nationality: '',
        });
        setSuccess('Passenger added successfully');
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(error.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDelete = async (passengerId: string) => {
    if (!confirm('Are you sure you want to delete this passenger?')) return;
    
    setError('');
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', user.email));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        await deleteDoc(doc(db, 'users', userData.userCode, 'passengers', passengerId));
        setPassengers(prev => prev.filter(p => p.id !== passengerId));
        setSuccess('Passenger deleted successfully');
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(error.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && passengers.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Passengers
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Manage your passenger list for bookings
        </Typography>
      </Box>

      {(error || success) && (
        <Alert severity={error ? 'error' : 'success'} sx={{ mb: 3 }}>
          {error || success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant={isAddingPassenger ? 'outlined' : 'contained'}
          color="primary"
          onClick={() => setIsAddingPassenger(!isAddingPassenger)}
          sx={{ minWidth: 140 }}
        >
          {isAddingPassenger ? 'Cancel' : 'Add Passenger'}
        </Button>
      </Box>

      {isAddingPassenger ? (
        <Paper elevation={1} sx={{ p: 3, borderRadius: 1, mb: 3 }}>
          <Typography variant="h6" fontWeight="medium" color="text.primary" sx={{ mb: 3 }}>
            Add New Passenger
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <div className="flex flex-wrap -mx-2">
              <div className="w-full sm:w-1/2 px-2 mb-4">
                <Input
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </div>
              <div className="w-full sm:w-1/2 px-2 mb-4">
                <Input
                  label="Last Name" 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </div>
              <div className="w-full px-2 mb-4">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </div>
              <div className="w-full px-2 mb-4">
                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  fullWidth
                />
              </div>
              <div className="w-full sm:w-1/2 px-2 mb-4">
                <Input
                  label="Passport Number"
                  name="passportNumber"
                  value={formData.passportNumber}
                  onChange={handleChange}
                  fullWidth
                />
              </div>
              <div className="w-full sm:w-1/2 px-2 mb-4">
                <Input
                  label="Nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  fullWidth
                />
              </div>
            </div>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button
                type="button"
                variant="outlined"
                color="inherit"
                onClick={() => setIsAddingPassenger(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Passenger'}
              </Button>
            </Box>
          </Box>
        </Paper>
      ) : (
        passengers.length === 0 ? (
          <Paper 
            elevation={1} 
            sx={{ 
              p: 4, 
              textAlign: 'center', 
              borderRadius: 1,
              mb: 2
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No passengers found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add passengers to manage your flight bookings
            </Typography>
          </Paper>
        ) : (
          <Paper elevation={1} sx={{ borderRadius: 1, overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="medium" color="text.primary">
                Passenger List
              </Typography>
            </Box>
            <Stack sx={{ p: 0 }}>
              {passengers.map((passenger) => (
                <Box 
                  key={passenger.id} 
                  sx={{ 
                    p: 3, 
                    borderBottom: '1px solid', 
                    borderColor: 'divider',
                    '&:last-child': { 
                      borderBottom: 'none' 
                    },
                    '&:hover': { 
                      bgcolor: 'action.hover' 
                    } 
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {passenger.firstName} {passenger.lastName}
                      </Typography>
                      <div className="flex flex-wrap -mx-1 mt-1">
                        <div className="w-full sm:w-1/2 px-1 mb-2">
                          <Typography variant="body2" color="text.secondary"><b>Email:</b> {passenger.email}</Typography>
                        </div>
                        <div className="w-full sm:w-1/2 px-1 mb-2">
                          <Typography variant="body2" color="text.secondary"><b>Phone:</b> {passenger.phoneNumber || 'Not provided'}</Typography>
                        </div>
                        <div className="w-full sm:w-1/2 px-1 mb-2">
                          <Typography variant="body2" color="text.secondary"><b>Passport:</b> {passenger.passportNumber || 'Not provided'}</Typography>
                        </div>
                        <div className="w-full sm:w-1/2 px-1 mb-2">
                          <Typography variant="body2" color="text.secondary"><b>Nationality:</b> {passenger.nationality || 'Not provided'}</Typography>
                        </div>
                      </div>
                    </Box>
                    {!passenger.isDefault && (
                      <Button
                        color="error"
                        onClick={() => handleDelete(passenger.id)}
                        sx={{ minWidth: 80 }}
                      >
                        Delete
                      </Button>
                    )}
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>
        )
      )}
    </Container>
  );
} 