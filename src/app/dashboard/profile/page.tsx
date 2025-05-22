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
import Link from 'next/link';
import { Box, Typography, Button, Grid, Paper, Alert, Chip, Stack, Container } from '@mui/material';
import { UserRole } from '@/lib/userCode';
import { Business as BusinessIcon } from '@mui/icons-material';

interface UserProfile {
  uid: string; // Firebase Authentication UID
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
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
        phoneNumber:
          profile.role === 'operator' || profile.role === 'agent' ? formData.phoneNumber : null,
        updatedAt: new Date(),
      });

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              firstName: formData.firstName,
              lastName: formData.lastName,
              company:
                profile.role === 'operator' || profile.role === 'agent' ? formData.company : null,
              phoneNumber:
                profile.role === 'operator' || profile.role === 'agent'
                  ? formData.phoneNumber
                  : null,
              updatedAt: new Date(),
            }
          : null
      );

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
    return <LoadingSpinner fullscreen />;
  }

  if (!profile) {
    return (
      <Typography color="error" variant="h6" align="center" sx={{ mt: 4 }}>
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
            <Box component="span" fontWeight="medium">
              User Code:
            </Box>{' '}
            {profile.userCode}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <Box component="span" fontWeight="medium">
              Account Type:
            </Box>{' '}
            <Box component="span" sx={{ textTransform: 'capitalize' }}>
              {profile.role}
            </Box>
          </Typography>
        </Stack>
      </Box>

      <Stack spacing={3}>
        {(error || success) && (
          <Alert severity={error ? 'error' : 'success'} sx={{ mb: 2 }}>
            {error || success}
          </Alert>
        )}

        {/* User Profile Information Section */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Typography variant="h6" fontWeight="medium" color="text.primary">
              User Profile Information
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {(profile.role === 'operator' || profile.role === 'agent') && (
                <Button
                  component={Link}
                  href="/dashboard/company-profile"
                  variant="outlined"
                  color="secondary"
                  size="medium"
                  startIcon={<BusinessIcon />}
                >
                  Company Profile
                </Button>
              )}
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
          </Box>

          {isEditing ? (
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
                    value={profile.email}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled
                  />
                </div>
                <div className="w-full sm:w-1/2 px-2 mb-4">
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
                    label="Company"
                    name="company"
                    value={formData.company}
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
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </Box>
            </Box>
          ) : (
            <div className="flex flex-wrap -mx-2">
              <div className="w-full sm:w-1/2 px-2 mb-4">
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{profile.email}</Typography>
                </Stack>
              </div>
              <div className="w-full sm:w-1/2 px-2 mb-4">
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Phone Number
                  </Typography>
                  <Typography variant="body1">{profile.phoneNumber || 'Not provided'}</Typography>
                </Stack>
              </div>
              <div className="w-full sm:w-1/2 px-2 mb-4">
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    First Name
                  </Typography>
                  <Typography variant="body1">{profile.firstName}</Typography>
                </Stack>
              </div>
              <div className="w-full sm:w-1/2 px-2 mb-4">
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Name
                  </Typography>
                  <Typography variant="body1">{profile.lastName}</Typography>
                </Stack>
              </div>
              <div className="w-full sm:w-1/2 px-2 mb-4">
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Role
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {profile.role}
                  </Typography>
                </Stack>
              </div>
              <div className="w-full sm:w-1/2 px-2 mb-4">
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User Code
                  </Typography>
                  <Typography variant="body1">{profile.userCode}</Typography>
                </Stack>
              </div>

              {(profile.role === 'operator' || profile.role === 'agent') && (
                <div className="w-full sm:w-1/2 px-2 mb-4">
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Company
                    </Typography>
                    <Typography variant="body1">{profile.company}</Typography>
                  </Stack>
                </div>
              )}

              <div className="w-full sm:w-1/2 px-2 mb-4">
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
              </div>

              <div className="w-full sm:w-1/2 px-2 mb-4">
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Account Created
                  </Typography>
                  <Typography variant="body1">{profile.createdAt.toLocaleDateString()}</Typography>
                </Stack>
              </div>

              <div className="w-full sm:w-1/2 px-2 mb-4">
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {profile.updatedAt.toLocaleDateString()} at{' '}
                    {profile.updatedAt.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Stack>
              </div>
            </div>
          )}
        </Paper>

        {/* Password Maintenance Section */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
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
              <div className="flex flex-wrap -mx-2">
                <div className="w-full px-2 mb-4">
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
                </div>
                <div className="w-full px-2 mb-4">
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
                </div>
                <div className="w-full px-2 mb-4">
                  <PasswordStrengthChecker
                    password={passwordData.newPassword}
                    isVisible={isPasswordFocused || passwordData.newPassword.length > 0}
                  />
                </div>
                <div className="w-full px-2 mb-4">
                  <Input
                    label="Confirm New Password"
                    type="password"
                    name="confirmNewPassword"
                    value={passwordData.confirmNewPassword}
                    onChange={handlePasswordChange}
                    required
                    helperText="Re-enter your new password"
                    autoComplete="new-password"
                    error={
                      passwordData.confirmNewPassword !== '' &&
                      passwordData.newPassword !== passwordData.confirmNewPassword
                        ? "Passwords don't match"
                        : ''
                    }
                  />
                </div>
              </div>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button
                  type="button"
                  variant="outlined"
                  color="inherit"
                  onClick={() => setIsChangingPassword(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary" disabled={loading}>
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
