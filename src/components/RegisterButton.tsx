import { useModal } from '@/contexts/ModalContext';

interface RegisterButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function RegisterButton({ className = '', children }: RegisterButtonProps) {
  const { openRegisterModal } = useModal();

  return (
    <button
      onClick={openRegisterModal}
      className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${className}`}
    >
      {children || 'REGISTER'}
    </button>
  );
} 