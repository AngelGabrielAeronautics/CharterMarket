'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';

export default function RegisterPage() {
  const router = useRouter();
  const { openRegisterModal } = useModal();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (redirect) {
      sessionStorage.setItem('postAuthRedirect', redirect);
    }
    openRegisterModal();
  }, [openRegisterModal, searchParams]);

  return null;
}
