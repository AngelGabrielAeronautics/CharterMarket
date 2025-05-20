'use client';

import { useState } from 'react';
import { useBookingPassengers } from '@/hooks/usePassengers';
import { Passenger } from '@/types/passenger';
import PassengerForm from './PassengerForm';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

// Helper to parse Firestore Timestamp, raw JSON object, or ISO string into JS Date
const toJsDate = (value: any): Date => {
  if (!value) return new Date(); // Or handle as an error/invalid date
  // Firestore Timestamp instance
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  // Raw Firestore JSON format: { seconds: number, nanoseconds: number }
  if (typeof value.seconds === 'number' && typeof value.nanoseconds === 'number') {
    return new Date(value.seconds * 1000 + value.nanoseconds / 1e6);
  }
  // Fallback for SDK v8 legacy JSON: { _seconds, _nanoseconds }
  if (typeof value._seconds === 'number' && typeof value._nanoseconds === 'number') {
    return new Date(value._seconds * 1000 + value._nanoseconds / 1e6);
  }
  // ISO string or timestamp number
  return new Date(value);
};

interface PassengerManifestProps {
  bookingId: string;
  userCode: string;
  passengerCount: number;
  readOnly?: boolean;
}

export default function PassengerManifest({
  bookingId,
  userCode,
  passengerCount,
  readOnly = false,
}: PassengerManifestProps) {
  const { passengers, loading, error } = useBookingPassengers(bookingId);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const theme = useTheme();

  const openAddForm = () => {
    setSelectedPassenger(null);
    setIsFormOpen(true);
  };

  const openEditForm = (passenger: Passenger) => {
    setSelectedPassenger(passenger);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedPassenger(null);
  };

  const openDeleteDialog = (passengerId: string) => {
    setDeleteId(passengerId);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const handleDeletePassenger = async () => {
    if (deleteId) {
      try {
        const res = await fetch(`/api/passengers/${deleteId}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        // Refresh passenger list
        window.location.reload();
      } catch (err) {
        console.error('Error deleting passenger:', err);
      } finally {
        closeDeleteDialog();
      }
    }
  };

  const renderManifestStatus = () => {
    const passengersAdded = passengers.length;
    const passengersNeeded = passengerCount;
    const isComplete = passengersAdded >= passengersNeeded;

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          bgcolor: isComplete ? 'success.50' : 'warning.50',
          borderRadius: 1,
          border: 1,
          borderColor: isComplete ? 'success.200' : 'warning.200',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ color: isComplete ? 'success.main' : 'warning.main', mr: 1 }} />
          <Typography>
            <strong>{passengersAdded}</strong> of <strong>{passengersNeeded}</strong> passengers
            added to manifest
          </Typography>
        </Box>

        {!isComplete && !readOnly && (
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openAddForm}>
            Add Passenger
          </Button>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading passenger manifest...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Error loading passenger manifest: {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Passenger Manifest
      </Typography>

      {renderManifestStatus()}

      {passengers.length > 0 ? (
        <TableContainer component={Paper} elevation={0} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Passport</TableCell>
                <TableCell>Nationality</TableCell>
                <TableCell>Contact</TableCell>
                {!readOnly && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {passengers.map((passenger) => (
                <TableRow key={passenger.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {passenger.firstName} {passenger.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      DOB: {format(toJsDate(passenger.dateOfBirth), 'dd MMM yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{passenger.passportNumber}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Expires: {format(toJsDate(passenger.passportExpiry), 'dd MMM yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>{passenger.nationality}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{passenger.contactEmail}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {passenger.contactPhone}
                    </Typography>
                  </TableCell>
                  {!readOnly && (
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => openEditForm(passenger)}
                        aria-label="Edit passenger"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openDeleteDialog(passenger.id)}
                        aria-label="Remove passenger"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }} variant="outlined">
          <Typography color="text.secondary" gutterBottom>
            No passengers have been added yet
          </Typography>
          {!readOnly && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={openAddForm}
              sx={{ mt: 1 }}
            >
              Add First Passenger
            </Button>
          )}
        </Paper>
      )}

      {!readOnly && passengers.length > 0 && passengers.length < passengerCount && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openAddForm}>
            Add Passenger
          </Button>
        </Box>
      )}

      {/* Add/Edit Passenger Form Dialog */}
      <Dialog open={isFormOpen} onClose={closeForm} maxWidth="md" fullWidth>
        <DialogContent>
          <PassengerForm
            bookingId={bookingId}
            userCode={userCode}
            initialData={
              selectedPassenger
                ? {
                    firstName: selectedPassenger.firstName,
                    lastName: selectedPassenger.lastName,
                    dateOfBirth: toJsDate(selectedPassenger.dateOfBirth),
                    nationality: selectedPassenger.nationality,
                    passportNumber: selectedPassenger.passportNumber,
                    passportExpiry: toJsDate(selectedPassenger.passportExpiry),
                    specialRequirements: selectedPassenger.specialRequirements,
                    contactEmail: selectedPassenger.contactEmail,
                    contactPhone: selectedPassenger.contactPhone,
                    emergencyContactName: selectedPassenger.emergencyContactName,
                    emergencyContactPhone: selectedPassenger.emergencyContactPhone,
                  }
                : undefined
            }
            passengerId={selectedPassenger?.id}
            onSuccess={() => {
              closeForm();
              window.location.reload();
            }}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Remove Passenger</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this passenger from the manifest?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeletePassenger} color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
