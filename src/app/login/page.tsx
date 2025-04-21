'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';

export default function LoginPage() {
  const router = useRouter();
  const { openLoginModal } = useModal();

  useEffect(() => {
    openLoginModal();
    router.replace('/');
  }, [openLoginModal, router]);

  return null;
} 