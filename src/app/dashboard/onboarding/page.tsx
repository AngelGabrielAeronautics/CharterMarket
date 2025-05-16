"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logEvent } from '../../../utils/eventLogger';
import { createUserProfile } from '@/lib/user';
import { OnboardingFormData } from '@/types/user';
import { EventCategory, EventType, EventSeverity, EventData } from '@/types/event';

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
        category: EventCategory.USER,
        type: EventType.REGISTER,
        severity: EventSeverity.INFO,
        description: 'User started onboarding process',
        data: {
          step: 'initial',
          formData: { ...data }
        },
        userId: data.userId,
        userCode: data.userCode,
        userRole: data.role,
        operatorCode: data.operatorId
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
        category: EventCategory.USER,
        type: EventType.REGISTER,
        severity: EventSeverity.INFO,
        description: 'User completed onboarding process',
        data: {
          profile: { ...userProfile }
        },
        userId: data.userId,
        userCode: data.userCode,
        userRole: data.role,
        operatorCode: data.operatorId
      });

      router.push('/dashboard');
    } catch (err) {
      // Log onboarding error event
      await logEvent({
        category: EventCategory.SYSTEM,
        type: EventType.ERROR,
        severity: EventSeverity.ERROR,
        description: 'Error during onboarding process',
        data: {
          error: err instanceof Error ? err.message : 'Unknown error'
        },
        userId: data.userId,
        userCode: data.userCode,
        userRole: data.role,
        operatorCode: data.operatorId
      });

      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the component code ...
} 