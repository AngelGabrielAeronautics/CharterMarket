import { useModal } from '@/contexts/ModalContext';
import { Button, ButtonProps } from '@mui/material';

interface LoginButtonProps extends ButtonProps {
  children?: React.ReactNode;
}

export default function LoginButton({ children, ...props }: LoginButtonProps) {
  const { openLoginModal } = useModal();

  return (
    <Button
      variant="text"
      color="primary"
      onClick={openLoginModal}
      {...props}
    >
      {children || 'LOGIN'}
    </Button>
  );
} 