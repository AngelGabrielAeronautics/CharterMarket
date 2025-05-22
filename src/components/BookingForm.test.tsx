/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BookingForm from './BookingForm';
import { AuthContext } from '@/contexts/AuthContext';
import { ModalContext } from '@/contexts/ModalContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';

// Mock next/router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Add mock for firebase to avoid real initialization errors
jest.mock('@/lib/firebase', () => ({
  auth: { onAuthStateChanged: jest.fn((cb) => () => {}) },
  db: {},
  storage: {},
}));

// Mock userCode to avoid nanoid issues
jest.mock('@/lib/userCode', () => ({
  UserRole: {
    PASSENGER: 'passenger',
    OPERATOR: 'operator',
    AGENT: 'agent',
  },
}));

describe('BookingForm', () => {
  beforeEach(() => {
    // Provide a dummy push function
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });

  // Default mocks for context
  const defaultAuth = {
    user: { uid: 'test-user' },
    userRole: 'passenger',
    loading: false,
    error: null,
    logout: jest.fn(),
    profile: undefined,
  };
  const defaultModal = {
    isRegisterModalOpen: false,
    isLoginModalOpen: false,
    openRegisterModal: jest.fn(),
    closeRegisterModal: jest.fn(),
    openLoginModal: jest.fn(),
    closeLoginModal: jest.fn(),
  };

  const renderWithProviders = (authOverrides = {}, modalOverrides = {}) => {
    const mockAuth = { ...defaultAuth, ...authOverrides };
    const mockModal = { ...defaultModal, ...modalOverrides };

    render(
      <ThemeProvider theme={createTheme()}>
        <AuthContext.Provider value={mockAuth}>
          <ModalContext.Provider value={mockModal}>
            <BookingForm />
          </ModalContext.Provider>
        </AuthContext.Provider>
      </ThemeProvider>
    );
    return { mockAuth, mockModal };
  };

  it('renders submit and reset buttons and initial state', () => {
    renderWithProviders();
    const submitBtn = screen.getByRole('button', { name: /Submit Quote Request/i });
    const resetBtn = screen.getByRole('button', { name: /Reset Form/i });

    expect(submitBtn).toBeDisabled();
    expect(resetBtn).toBeEnabled();
  });

  it('does not throw when clicking reset', () => {
    renderWithProviders();
    const resetBtn = screen.getByRole('button', { name: /Reset Form/i });
    expect(() => fireEvent.click(resetBtn)).not.toThrow();
  });

  it('opens login modal when no user is present', async () => {
    const { mockModal } = renderWithProviders({ user: null, userRole: null });
    const form = screen.getByTestId('booking-form');
    // Ensure the submit button is actually clickable by the user (form is complete enough)
    // For this specific test, we expect submission even if not all fields are valid because user is null
    fireEvent.submit(form);
    expect(mockModal.openLoginModal).toHaveBeenCalled();
  });

  it('shows operator dialog and triggers register flow', async () => {
    const { mockModal } = renderWithProviders({ user: { uid: 'u' }, userRole: 'operator' });
    const form = screen.getByTestId('booking-form');
    // For this specific test, we expect submission even if not all fields are valid because user is an operator
    fireEvent.submit(form);
    expect(await screen.findByText(/Operator Account Restriction/i)).toBeInTheDocument();
    const registerBtn = await screen.findByRole('button', { name: /Register as Passenger/i });
    fireEvent.click(registerBtn);
    expect(mockModal.openRegisterModal).toHaveBeenCalledWith('passenger');
  });
}); 