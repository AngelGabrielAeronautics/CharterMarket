'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AdminInvitation } from '@/lib/admin';
import Input from '@/components/ui/Input';
import PasswordStrengthChecker from '@/components/PasswordStrengthChecker';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AdminRegister() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get('invitation');

  const [invitation, setInvitation] = useState<AdminInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    async function fetchInvitation() {
      if (!invitationId) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const inviteRef = doc(db, 'admin_invitations', invitationId);
        const inviteDoc = await getDoc(inviteRef);

        if (!inviteDoc.exists()) {
          setError('Invitation not found');
          setLoading(false);
          return;
        }

        const inviteData = inviteDoc.data() as AdminInvitation;

        if (inviteData.status !== 'pending') {
          setError('This invitation has already been used or has expired');
          setLoading(false);
          return;
        }

        if (new Date(inviteData.expiresAt) < new Date()) {
          setError('This invitation has expired');
          setLoading(false);
          return;
        }

        setInvitation(inviteData);
        setLoading(false);
      } catch (err) {
        setError('Error fetching invitation');
        setLoading(false);
      }
    }

    fetchInvitation();
  }, [invitationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitation) return;

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Create Firebase Auth account
      await createUserWithEmailAndPassword(auth, invitation.email, formData.password);

      // Redirect to dashboard - the user will be in a pending state
      // until the super admin approves their account
      router.push('/dashboard?message=registration_pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg max-w-md">
          {error}
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Complete Your Admin Registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Welcome {invitation.firstName}! Please set your password to complete your registration.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              type="email"
              value={invitation.email}
              disabled
              label="Email"
              name="email"
            />

            <div>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                label="Password"
                name="password"
                required
              />
              <PasswordStrengthChecker 
                password={formData.password} 
                isVisible={true}
              />
            </div>

            <Input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              label="Confirm Password"
              name="confirmPassword"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Complete Registration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 