// @ts-nocheck
import * as React from 'react';
import { createContext, useContext, useState, ReactNode } from 'react';
import RegisterModal from '@/components/RegisterModal';
import LoginModal from '@/components/LoginModal';

type UserType = 'passenger' | 'agent' | 'operator';

interface ModalContextType {
  isRegisterModalOpen: boolean;
  isLoginModalOpen: boolean;
  openRegisterModal: (defaultUserType?: UserType) => void;
  closeRegisterModal: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [defaultUserType, setDefaultUserType] = useState<UserType | undefined>(undefined);

  const openRegisterModal = (type?: UserType) => {
    setIsLoginModalOpen(false);
    setDefaultUserType(type);
    setIsRegisterModalOpen(true);
  };

  const closeRegisterModal = () => {
    setIsRegisterModalOpen(false);
    setDefaultUserType(undefined);
  };

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
      {isRegisterModalOpen && (
        <RegisterModal
          isOpen={true}
          onClose={closeRegisterModal}
          defaultUserType={defaultUserType}
        />
      )}
      {/* Always mount LoginModal so internal state persists; control visibility via isOpen */}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
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
