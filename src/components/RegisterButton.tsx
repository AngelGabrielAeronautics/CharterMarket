import { useModal } from '@/contexts/ModalContext';
import { Button, ButtonProps } from '@mui/material';

interface RegisterButtonProps extends ButtonProps {
  children?: React.ReactNode;
}

export default function RegisterButton({ children, ...props }: RegisterButtonProps) {
  const { openRegisterModal } = useModal();

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={() => openRegisterModal()}
      {...props}
    >
      {children || 'REGISTER'}
    </Button>
  );
} 