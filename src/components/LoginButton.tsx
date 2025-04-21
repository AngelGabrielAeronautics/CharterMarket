import { useModal } from '@/contexts/ModalContext';

interface LoginButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LoginButton({ className = '', children }: LoginButtonProps) {
  const { openLoginModal } = useModal();

  return (
    <button
      onClick={openLoginModal}
      className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-charade-dark dark:text-linen-dark hover:text-tiber-DEFAULT transition-colors duration-200 ${className}`}
      data-login-button
    >
      {children || 'LOGIN'}
    </button>
  );
} 