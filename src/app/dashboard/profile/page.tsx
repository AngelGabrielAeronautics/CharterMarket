'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { changePassword } from '@/lib/auth';
import { validatePassword } from '@/components/PasswordStrengthChecker';
import PasswordStrengthChecker from '@/components/PasswordStrengthChecker';
import DarkModeToggle from '@/components/DarkModeToggle';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Alert,
  Chip,
  Stack,
  Container
} from '@mui/material';
import { UserRole } from '@/lib/userCode';

interface UserProfile {
  uid: string;        // Firebase Authentication UID
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  userCode: string;
  company: string | null;
  phoneNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    phoneNumber: '',
  });
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setProfile({
            ...userData,
            uid: user.uid,
            createdAt: userData.createdAt?.toDate(),
            updatedAt: userData.updatedAt?.toDate(),
          } as UserProfile);
          setFormData({
            firstName: userData.firstName,
            lastName: userData.lastName,
            company: userData.company || '',
            phoneNumber: userData.phoneNumber || '',
          });
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!profile) throw new Error('Profile not found');

      const userRef = doc(db, 'users', profile.userCode);
      await updateDoc(userRef, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: profile.role === 'operator' || profile.role === 'agent' ? formData.company : null,
        phoneNumber: profile.role === 'operator' || profile.role === 'agent' ? formData.phoneNumber : null,
        updatedAt: new Date(),
      });

      setProfile(prev => prev ? {
        ...prev,
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: profile.role === 'operator' || profile.role === 'agent' ? formData.company : null,
        phoneNumber: profile.role === 'operator' || profile.role === 'agent' ? formData.phoneNumber : null,
        updatedAt: new Date(),
      } : null);
      
      setIsEditing(false);
      setSuccess('Profile updated successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate new password
      if (!validatePassword(passwordData.newPassword)) {
        setError('New password does not meet requirements');
        setLoading(false);
        return;
      }

      // Check if passwords match
      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        setError('New passwords do not match');
        setLoading(false);
        return;
      }

      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setIsChangingPassword(false);
      setSuccess('Password changed successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner fullscreen />
    );
  }

  if (!profile) {
    return (
      <Typography 
        color="error" 
        variant="h6" 
        align="center" 
        sx={{ mt: 4 }}
      >
        Profile not found
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 4 }, py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
          {profile.firstName} {profile.lastName}
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            <Box component="span" fontWeight="medium">User Code:</Box> {profile.userCode}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <Box component="span" fontWeight="medium">Account Type:</Box> {' '}
            <Box component="span" sx={{ textTransform: 'capitalize' }}>{profile.role}</Box>
          </Typography>
        </Stack>
      </Box>

      <Stack spacing={3}>
        {(error || success) && (
          <Alert 
            severity={error ? "error" : "success"}
            sx={{ mb: 2 }}
          >
            {error || success}
          </Alert>
        )}

        {/* User Profile Information Section */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="medium" color="text.primary">
              User Profile Information
            </Typography>
            <Button
              onClick={() => setIsEditing(true)}
              variant="outlined"
              color="primary"
              size="medium"
              disabled={isEditing}
            >
              Edit Profile
            </Button>
          </Box>

          {isEditing ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    helperText="Your legal first name"
                  />
                </Grid>
                <Grid item xs={12} sm={6} component="div">
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    helperText="Your legal last name"
                  />
                </Grid>
                <Grid item xs={12} component="div">
                  <PhoneInput
                    value={formData.phoneNumber}
                    onChange={(value) => handleChange({ target: { name: 'phoneNumber', value } } as any)}
                    required={profile.role === 'operator' || profile.role === 'agent'}
                    helperText="Your contact phone number"
                  />
                </Grid>
                {(profile.role === 'operator' || profile.role === 'agent') && (
                  <Grid item xs={12}>
                    <Input
                      label="Company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      required={profile.role === 'agent' || profile.role === 'operator'}
                      helperText="Your company or organization name"
                    />
                  </Grid>
                )}
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button
                  type="button"
                  variant="outlined"
                  color="inherit"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </Box>
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{profile.email}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Phone Number
                  </Typography>
                  <Typography variant="body1">
                    {profile.phoneNumber || 'Not provided'}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    First Name
                  </Typography>
                  <Typography variant="body1">{profile.firstName}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Name
                  </Typography>
                  <Typography variant="body1">{profile.lastName}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Role
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {profile.role}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6} component="div">
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User Code
                  </Typography>
                  <Typography variant="body1">{profile.userCode}</Typography>
                </Stack>
              </Grid>
              
              {(profile.role === 'operator' || profile.role === 'agent') && (
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Company
                    </Typography>
                    <Typography variant="body1">{profile.company}</Typography>
                  </Stack>
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email Verification
                  </Typography>
                  <Chip 
                    label={profile.emailVerified ? 'Verified' : 'Not Verified'} 
                    color={profile.emailVerified ? 'success' : 'warning'}
                    size="small"
                  />
                </Stack>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Account Created
                  </Typography>
                  <Typography variant="body1">
                    {profile.createdAt.toLocaleDateString()}
                  </Typography>
                </Stack>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {profile.updatedAt.toLocaleDateString()} at {profile.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          )}
        </Paper>

        {/* Password Maintenance Section */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="medium" color="text.primary">
              Password Maintenance
            </Typography>
            {!isEditing && !isChangingPassword && (
              <Button
                onClick={() => setIsChangingPassword(true)}
                variant="outlined"
                color="primary"
                size="medium"
              >
                Change Password
              </Button>
            )}
          </Box>

          {isChangingPassword && (
            <Box component="form" onSubmit={handlePasswordSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Input
                    label="Current Password"
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    helperText="Enter your current password"
                    autoComplete="current-password"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Input
                    label="New Password"
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    required
                    helperText="Create a new strong password"
                    autoComplete="new-password"
                  />
                </Grid>
                <Grid item xs={12}>
                  <PasswordStrengthChecker 
                    password={passwordData.newPassword}
                    isVisible={isPasswordFocused || passwordData.newPassword.length > 0}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Input
                    label="Confirm New Password"
                    type="password"
                    name="confirmNewPassword"
                    value={passwordData.confirmNewPassword}
                    onChange={handlePasswordChange}
                    required
                    helperText="Re-enter your new password"
                    autoComplete="new-password"
                    error={passwordData.confirmNewPassword !== '' && 
                           passwordData.newPassword !== passwordData.confirmNewPassword 
                           ? "Passwords don't match" : ""}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button
                  type="button"
                  variant="outlined"
                  color="inherit"
                  onClick={() => setIsChangingPassword(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Display Preferences Section */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="medium" color="text.primary" sx={{ mb: 3 }}>
            Display Preferences
          </Typography>
          <Box sx={{ maxWidth: 400 }}>
            <DarkModeToggle />
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
} 