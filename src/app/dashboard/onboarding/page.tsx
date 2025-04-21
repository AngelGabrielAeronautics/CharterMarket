import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logEvent } from '@/lib/events';
import { createUserProfile } from '@/lib/user';
import { OnboardingFormData } from '@/types/user';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: OnboardingFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Log onboarding start event
      await logEvent({
        category: 'onboarding',
        type: 'start',
        severity: 'info',
        description: 'User started onboarding process',
        data: {
          step: 'initial',
          formData: data
        },
        userId: data.userId,
        operatorId: data.operatorId
      });

      // Create user profile
      const userProfile = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      await createUserProfile(userProfile);

      // Log onboarding completion event
      await logEvent({
        category: 'onboarding',
        type: 'complete',
        severity: 'info',
        description: 'User completed onboarding process',
        data: {
          profile: userProfile
        },
        userId: data.userId,
        operatorId: data.operatorId
      });

      router.push('/dashboard');
    } catch (err) {
      // Log onboarding error event
      await logEvent({
        category: 'onboarding',
        type: 'error',
        severity: 'error',
        description: 'Error during onboarding process',
        data: {
          error: err instanceof Error ? err.message : 'Unknown error'
        },
        userId: data.userId,
        operatorId: data.operatorId
      });

      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the component code ...
} 