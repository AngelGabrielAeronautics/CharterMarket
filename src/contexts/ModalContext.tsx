import { createContext, useContext, useState, ReactNode } from 'react';
import RegisterModal from '@/components/RegisterModal';
import LoginModal from '@/components/LoginModal';

interface ModalContextType {
  isRegisterModalOpen: boolean;
  isLoginModalOpen: boolean;
  openRegisterModal: () => void;
  closeRegisterModal: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const openRegisterModal = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(true);
  };
  
  const closeRegisterModal = () => setIsRegisterModalOpen(false);
  
  const openLoginModal = () => {
    setIsRegisterModalOpen(false);
    setIsLoginModalOpen(true);
  };
  
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <ModalContext.Provider
      value={{
        isRegisterModalOpen,
        isLoginModalOpen,
        openRegisterModal,
        closeRegisterModal,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
      {/* Render modals here */}
      {isRegisterModalOpen && <RegisterModal isOpen={true} onClose={closeRegisterModal} />}
      {isLoginModalOpen && <LoginModal isOpen={true} onClose={closeLoginModal} />}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
} 