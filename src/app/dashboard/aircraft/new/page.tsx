'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AircraftFormMaterial from '@/components/forms/AircraftFormMaterial';
import { AircraftFormData } from '@/types/aircraft';
import { createAircraft } from '@/lib/aircraft';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Box, Container, Typography } from '@mui/material';
import toast from 'react-hot-toast';

export default function NewAircraftPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [aircraftId, setAircraftId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: AircraftFormData, shouldSave: boolean = false) => {
    try {
      setIsSubmitting(true);
      if (!user?.userCode) {
        toast.error('You must be logged in to create an aircraft');
        return;
      }

      const newAircraftId = await createAircraft(data, user.userCode);
      setAircraftId(newAircraftId);
      toast.success('Aircraft saved successfully');
      
      if (!shouldSave) {
        router.push('/dashboard/aircraft');
      }
    } catch (error) {
      console.error('Error creating aircraft:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create aircraft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    router.push('/dashboard/aircraft');
  };

  if (loading) {
    return <LoadingSpinner fullscreen />;
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ maxWidth: '4xl', mx: 'auto' }}>
          <Box sx={{ bgcolor: 'error.light', border: '1px solid', borderColor: 'error.main', color: 'error.main', p: 2, borderRadius: 2 }}>
            Please sign in to create an aircraft.
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ maxWidth: '4xl', mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Add New Aircraft
          </Typography>
        </Box>
        
        {error && (
          <Box sx={{ bgcolor: 'error.light', border: '1px solid', borderColor: 'error.main', color: 'error.main', p: 2, borderRadius: 2, mb: 3 }}>
            {error}
          </Box>
        )}

        <Box sx={{ bgcolor: 'transparent', boxShadow: 1, borderRadius: 2, p: 3, border: '1px solid', borderColor: 'divider' }}>
          <AircraftFormMaterial 
            onSubmit={handleSubmit} 
            onClose={handleClose}
            aircraftId={aircraftId || undefined}
            isSubmitting={isSubmitting}
          />
        </Box>
      </Box>
    </Container>
  );
} 