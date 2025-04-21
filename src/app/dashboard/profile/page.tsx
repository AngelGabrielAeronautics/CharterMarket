'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { UserRole } from '@/lib/userCode';
import { changePassword } from '@/lib/auth';
import { validatePassword } from '@/components/PasswordStrengthChecker';
import PasswordStrengthChecker from '@/components/PasswordStrengthChecker';
import DarkModeToggle from '@/components/DarkModeToggle';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import LoadingSpinner from '@/components/LoadingSpinner';

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
      } catch (error: any) {
        setError(error.message);
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
    } catch (error: any) {
      setError(error.message);
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
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return (
      <div className="text-center text-red-500">
        Profile not found
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-900 dark:text-cream-100">
          {profile.firstName} {profile.lastName}
        </h1>
        <div className="mt-2 space-y-1">
          <p className="text-sm text-primary-600 dark:text-cream-200">
            <span className="font-medium">User Code:</span> {profile.userCode}
          </p>
          <p className="text-sm text-primary-600 dark:text-cream-200">
            <span className="font-medium">Account Type:</span> <span className="capitalize">{profile.role}</span>
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {(error || success) && (
          <div className={`p-4 rounded-md ${
            error 
              ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'
              : 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400'
          }`}>
            {error || success}
          </div>
        )}

        {/* User Profile Information Section */}
        <div className="bg-white dark:bg-dark-secondary shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-primary-900 dark:text-cream-100">User Profile Information</h2>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg shadow-sm text-sm font-medium text-primary-700 dark:text-cream-200 bg-white dark:bg-dark-primary hover:bg-gray-50 dark:hover:bg-dark-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              EDIT PROFILE
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                helperText="Your legal first name"
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                helperText="Your legal last name"
              />
              <PhoneInput
                value={formData.phoneNumber}
                onChange={(value) => handleChange({ target: { name: 'phoneNumber', value } } as any)}
                required={profile.role === 'operator' || profile.role === 'agent'}
                helperText="Your contact phone number"
              />
              {(profile.role === 'operator' || profile.role === 'agent') && (
                <Input
                  label="Company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required={profile.role === 'agent' || profile.role === 'operator'}
                  helperText="Your company or organization name"
                />
              )}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg text-primary-700 dark:text-cream-200 hover:bg-gray-50 dark:hover:bg-dark-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'UPDATING...' : 'UPDATE PROFILE'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 dark:text-cream-200">
                  Email
                </label>
                <p className="mt-1 text-sm text-primary-900 dark:text-cream-100">{profile.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 dark:text-cream-200">
                  Phone Number
                </label>
                <p className="mt-1 text-sm text-primary-900 dark:text-cream-100">
                  {profile.phoneNumber || 'Not provided'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 dark:text-cream-200">
                  First Name
                </label>
                <p className="mt-1 text-sm text-primary-900 dark:text-cream-100">{profile.firstName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 dark:text-cream-200">
                  Last Name
                </label>
                <p className="mt-1 text-sm text-primary-900 dark:text-cream-100">{profile.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 dark:text-cream-200">
                  Role
                </label>
                <p className="mt-1 text-sm text-primary-900 dark:text-cream-100 capitalize">{profile.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 dark:text-cream-200">
                  User Code
                </label>
                <p className="mt-1 text-sm text-primary-900 dark:text-cream-100">{profile.userCode}</p>
              </div>
              {(profile.role === 'operator' || profile.role === 'agent') && (
                <div>
                  <label className="block text-sm font-medium text-primary-700 dark:text-cream-200">
                    Company
                  </label>
                  <p className="mt-1 text-sm text-primary-900 dark:text-cream-100">{profile.company}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-primary-700 dark:text-cream-200">
                  Email Verification
                </label>
                <p className="mt-1 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile.emailVerified
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {profile.emailVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 dark:text-cream-200">
                  Account Created
                </label>
                <p className="mt-1 text-sm text-primary-900 dark:text-cream-100">
                  {profile.createdAt.toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 dark:text-cream-200">
                  Last Updated
                </label>
                <p className="mt-1 text-sm text-primary-900 dark:text-cream-100">
                  {profile.updatedAt.toLocaleDateString()} at {profile.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Password Maintenance Section */}
        <div className="bg-white dark:bg-dark-secondary shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-primary-900 dark:text-cream-100">Password Maintenance</h2>
            {!isEditing && !isChangingPassword && (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm text-sm font-medium text-primary-700 dark:text-cream-200 bg-white dark:bg-dark-primary hover:bg-gray-50 dark:hover:bg-dark-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                CHANGE PASSWORD
              </button>
            )}
          </div>

          {isChangingPassword && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
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
              <PasswordStrengthChecker 
                password={passwordData.newPassword}
                isVisible={isPasswordFocused || passwordData.newPassword.length > 0}
              />
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg text-primary-700 dark:text-cream-200 hover:bg-gray-50 dark:hover:bg-dark-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Display Preferences Section */}
        <div className="bg-white dark:bg-dark-secondary shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-xl font-semibold text-primary-900 dark:text-cream-100 mb-4">Display Preferences</h2>
            <div className="mt-4 max-w-xl">
              <div className="space-y-4">
                <DarkModeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 