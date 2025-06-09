'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';

export default function LoginPage() {
  const router = useRouter();
  const { openLoginModal } = useModal();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (redirect) {
      sessionStorage.setItem('postAuthRedirect', redirect);
    }
    openLoginModal();
    // Don't immediately navigate away; keep user on this lightweight page
  }, [openLoginModal, searchParams]);

  return null;
}
