'use client';

import { useState } from 'react';
import { sendVerificationEmail } from '@/lib/email';
import Banner from '@/components/ui/Banner';
import toast from 'react-hot-toast';

interface EmailVerificationBannerProps {
  email: string;
  userId: string;
  userCode: string;
  isVerified: boolean;
}

export default function EmailVerificationBanner({ email, userId, userCode, isVerified }: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  if (isVerified || !showBanner) return null;

  const handleResend = async () => {
    setIsResending(true);
    try {
      await sendVerificationEmail(email, userId, userCode);
      toast.success('Verification email sent successfully');
    } catch (error) {
      console.error('Error resending verification email:', error);
      toast.error('Failed to send verification email');
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
        loading: isResending
      }}
      onDismiss={() => setShowBanner(false)}
    >
      Please verify your email address. We've sent a verification link to{' '}
      <span className="font-medium break-all">{email}</span>
    </Banner>
  );
} 