/* eslint-disable react-hooks/rules-of-hooks */
'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase'; // Import Firebase auth instance
import { sendEmailVerification as firebaseSendEmailVerification } from 'firebase/auth'; // Firebase SDK function
import Banner from '@/components/ui/Banner';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext'; // To get user object for logging or other purposes if needed

interface EmailVerificationBannerProps {
  // email: string; // No longer needed directly if we use currentUser
  // userId: string; // No longer needed directly
  // userCode: string; // No longer needed directly
  isVerified: boolean;
}

export default function EmailVerificationBanner({ isVerified }: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const { user } = useAuth(); // Get the full user object from context

  if (isVerified || !showBanner || !user) return null; // Don't show if verified, dismissed, or no user

  const handleResend = async () => {
    if (!auth.currentUser) {
      toast.error('No user logged in to send verification email.');
      return;
    }
    setIsResending(true);
    try {
      // Use Firebase's own sendEmailVerification
      await firebaseSendEmailVerification(auth.currentUser);
      toast.success(
        'Verification email sent successfully. Please check your inbox (and spam folder).'
      );
      // Optionally, you could log this action using your storeEmailNotification if desired,
      // but Firebase handles the sending itself.
      // Example: await storeEmailNotification(...);
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      toast.error(error.message || 'Failed to send verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Banner
      variant="info"
      action={{
        label: isResending ? 'SENDING...' : 'RESEND EMAIL',
        onClick: handleResend,
        loading: isResending,
      }}
      onDismiss={() => setShowBanner(false)}
    >
      Please verify your email address. We've sent a verification link to{' '}
      <span className="font-medium break-all">{user.email}</span>.
    </Banner>
  );
}
