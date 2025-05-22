'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { sendAdminInvitation, type AdminPermissions } from '@/lib/admin';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Button,
  Typography,
  Alert,
  Grid
} from '@mui/material';

interface AdminInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const adminPermissions = [
  {
    id: 'users',
    label: 'User Management',
    description: 'View and manage user accounts.',
  },
  {
    id: 'operators',
    label: 'Operator Management',
    description: 'View and manage operator accounts and their aircraft.',
  },
  {
    id: 'bookings',
    label: 'Booking Management',
    description: 'View and manage all bookings in the system.',
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Access financial and operational reports.',
  },
  {
    id: 'notifications',
    label: 'System Notifications',
    description: 'Manage system-wide notifications and announcements.',
  },
];

export default function AdminInviteModal({ isOpen, onClose }: AdminInviteModalProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { user } = useAuth();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckboxChange = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      if (!user) throw new Error('Not authenticated');
      // Convert selected permission IDs to AdminPermissions object
      const permissionsObj: AdminPermissions = {
        userManagement: selectedPermissions.includes('users'),
        bookingManagement: selectedPermissions.includes('bookings'),
        financialAccess: selectedPermissions.includes('reports'),
        systemConfig: selectedPermissions.includes('operators'),
        contentManagement: selectedPermissions.includes('notifications'),
      };
      await sendAdminInvitation(
        email,
        firstName,
        lastName,
        permissionsObj,
        { uid: user.uid, email: user.email || '', userCode: user.userCode || '' }
      );
      setSuccess(true);
      // Reset form
      setEmail('');
      setFirstName('');
      setLastName('');
      setSelectedPermissions([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while sending the invitation.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      aria-labelledby="admin-invite-dialog-title"
    >
      <DialogTitle id="admin-invite-dialog-title">
        Invite Admin User
      </DialogTitle>
      <DialogContent>
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
          >
            Invitation sent successfully! The user will receive an email with instructions.
          </Alert>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            margin="dense"
          />
          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 12,
                sm: 6
              }}>
              <TextField
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                fullWidth
                required
                margin="dense"
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                sm: 6
              }}>
              <TextField
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                fullWidth
                required
                margin="dense"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Permissions
            </Typography>
            <FormGroup>
              {adminPermissions.map((permission) => (
                <FormControlLabel
                  key={permission.id}
                  control={
                    <Checkbox
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => handleCheckboxChange(permission.id)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">{permission.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {permission.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
            <Button 
              type="button" 
              variant="outlined" 
              color="inherit"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
} 