'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AircraftFormMaterial from '@/components/forms/AircraftFormMaterial';
import { AircraftFormData } from '@/types/aircraft';
import { getSingleOperatorAircraft, updateAircraft } from '@/lib/aircraft';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Box, Container, Typography } from '@mui/material';
import toast from 'react-hot-toast';

export default function EditAircraftPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const [aircraftData, setAircraftData] = useState<AircraftFormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const aircraftId = params.id as string;

  useEffect(() => {
    const loadAircraft = async () => {
      if (!user?.userCode || !aircraftId) {
        setError('User not authenticated or aircraft ID missing');
        setIsLoading(false);
        return;
      }

      try {
        const aircraft = await getSingleOperatorAircraft(aircraftId, user.userCode);
        if (!aircraft) {
          setError('Aircraft not found');
          setIsLoading(false);
          return;
        }

        // Convert the Aircraft type to AircraftFormData for the form
        const formData: AircraftFormData = {
          registration: aircraft.registration,
          type: aircraft.type,
          make: aircraft.make,
          model: aircraft.model,
          year: aircraft.year,
          baseAirport: aircraft.baseAirport,
          status: aircraft.status,
          specifications: aircraft.specifications,
          images: aircraft.images || [],
        };

        setAircraftData(formData);
      } catch (error) {
        console.error('Error loading aircraft:', error);
        setError('Failed to load aircraft data');
        toast.error('Failed to load aircraft data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.userCode && aircraftId && !loading) {
      loadAircraft();
    }
  }, [user?.userCode, aircraftId, loading]);

  const handleSubmit = async (data: AircraftFormData, shouldSave: boolean = false) => {
    try {
      setIsSubmitting(true);
      if (!user?.userCode || !aircraftId) {
        toast.error('You must be logged in to update an aircraft');
        return;
      }

      await updateAircraft(aircraftId, data, user.userCode);
      toast.success('Aircraft updated successfully');
      
      if (!shouldSave) {
        router.push('/dashboard/aircraft');
      } else {
        // Reload the aircraft data after saving
        const updatedAircraft = await getSingleOperatorAircraft(aircraftId, user.userCode);
        if (updatedAircraft) {
          const formData: AircraftFormData = {
            registration: updatedAircraft.registration,
            type: updatedAircraft.type,
            make: updatedAircraft.make,
            model: updatedAircraft.model,
            year: updatedAircraft.year,
            baseAirport: updatedAircraft.baseAirport,
            status: updatedAircraft.status,
            specifications: updatedAircraft.specifications,
            images: updatedAircraft.images || [],
          };
          setAircraftData(formData);
        }
      }
    } catch (error) {
      console.error('Error updating aircraft:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update aircraft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    router.push('/dashboard/aircraft');
  };

  if (loading || isLoading) {
    return <LoadingSpinner fullscreen />;
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ maxWidth: '4xl', mx: 'auto' }}>
          <Box sx={{ bgcolor: 'error.light', border: '1px solid', borderColor: 'error.main', color: 'error.main', p: 2, borderRadius: 2 }}>
            Please sign in to edit an aircraft.
          </Box>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ maxWidth: '4xl', mx: 'auto' }}>
          <Box sx={{ bgcolor: 'error.light', border: '1px solid', borderColor: 'error.main', color: 'error.main', p: 2, borderRadius: 2 }}>
            {error}
          </Box>
        </Box>
      </Container>
    );
  }

  if (!aircraftData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ maxWidth: '4xl', mx: 'auto' }}>
          <Box sx={{ bgcolor: 'warning.light', border: '1px solid', borderColor: 'warning.main', color: 'warning.main', p: 2, borderRadius: 2 }}>
            Aircraft data not found.
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
            Edit Aircraft - {aircraftData.registration}
          </Typography>
        </Box>

        <Box sx={{ bgcolor: 'transparent', boxShadow: 1, borderRadius: 2, p: 3, border: '1px solid', borderColor: 'divider' }}>
          <AircraftFormMaterial 
            initialData={aircraftData}
            onSubmit={handleSubmit} 
            onClose={handleClose}
            aircraftId={aircraftId}
            isSubmitting={isSubmitting}
          />
        </Box>
      </Box>
    </Container>
  );
} 