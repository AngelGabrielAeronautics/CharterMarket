'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';

export default function RegisterPage() {
  const router = useRouter();
  const { openRegisterModal } = useModal();

  useEffect(() => {
    openRegisterModal();
    router.replace('/');
  }, [openRegisterModal, router]);

  return null;
} 