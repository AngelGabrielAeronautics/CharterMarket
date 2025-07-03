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
    user: {
      uid: 'test-user',
      userCode: 'TEST001',
      role: 'passenger' as const,
      email: 'test@example.com',
      emailVerified: true,
      isAnonymous: false,
      metadata: { creationTime: undefined, lastSignInTime: undefined },
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: jest.fn(),
      getIdToken: jest.fn(),
      getIdTokenResult: jest.fn(),
      reload: jest.fn(),
      toJSON: jest.fn(),
      displayName: null,
      phoneNumber: null,
      photoURL: null,
      providerId: 'firebase',
    },
    userRole: 'passenger' as const,
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

  it('renders submit and reset buttons and initial state', async () => {
    renderWithProviders();
    // Initially, buttons should not be visible
    expect(screen.queryByRole('button', { name: /Submit Quote Request/i })).toBeNull();
    // Fill the form to make buttons visible
    fireEvent.change(screen.getByLabelText(/from/i), { target: { value: 'JFK' } });
    fireEvent.change(screen.getByLabelText(/to/i), { target: { value: 'LAX' } });
    // This is a simplified way to set a date, a real scenario might need `user-event` for date pickers
    fireEvent.change(screen.getByLabelText(/departure date/i), {
      target: { value: '2023-10-27T10:00:00.000Z' },
    });
    fireEvent.change(screen.getByPlaceholderText('-'), { target: { value: '2' } });

    const submitBtn = await screen.findByRole('button', { name: /Submit Quote Request/i });
    const resetBtn = await screen.findByRole('button', { name: /Reset Form/i });
    expect(submitBtn).toBeEnabled();
    expect(resetBtn).toBeEnabled();
  });

  it('does not throw when clicking reset', async () => {
    renderWithProviders();
    // Fill the form to make the reset button visible
    fireEvent.change(screen.getByLabelText(/from/i), { target: { value: 'JFK' } });
    fireEvent.change(screen.getByLabelText(/to/i), { target: { value: 'LAX' } });
    fireEvent.change(screen.getByLabelText(/departure date/i), {
      target: { value: '2023-10-27T10:00:00.000Z' },
    });
    fireEvent.change(screen.getByPlaceholderText('-'), { target: { value: '2' } });

    const resetBtn = await screen.findByRole('button', { name: /Reset Form/i });
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
    const { mockModal } = renderWithProviders({
      user: {
        uid: 'u',
        userCode: 'OP001',
        role: 'operator' as const,
        email: 'op@example.com',
        emailVerified: true,
        isAnonymous: false,
        metadata: { creationTime: undefined, lastSignInTime: undefined },
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: jest.fn(),
        getIdToken: jest.fn(),
        getIdTokenResult: jest.fn(),
        reload: jest.fn(),
        toJSON: jest.fn(),
        displayName: null,
        phoneNumber: null,
        photoURL: null,
        providerId: 'firebase',
      },
      userRole: 'operator' as const,
    });
    const form = screen.getByTestId('booking-form');
    // For this specific test, we expect submission even if not all fields are valid because user is an operator
    fireEvent.submit(form);
    expect(await screen.findByText(/Operator Account Restriction/i)).toBeInTheDocument();
    const registerBtn = await screen.findByRole('button', { name: /Register as Passenger/i });
    fireEvent.click(registerBtn);
    expect(mockModal.openRegisterModal).toHaveBeenCalledWith('passenger');
  });
});
