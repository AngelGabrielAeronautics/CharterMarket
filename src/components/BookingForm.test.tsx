/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
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

  it('renders form input fields correctly', () => {
    renderWithProviders();

    // Check that combobox inputs (from/to) are present
    const comboBoxes = screen.getAllByRole('combobox');
    expect(comboBoxes.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByLabelText(/Passengers/i)).toBeInTheDocument();
    
    // Check flight type buttons are present
    expect(screen.getByRole('button', { name: /one way/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /return/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /multi-city/i })).toBeInTheDocument();
  });

  it('allows user input in form fields', () => {
    renderWithProviders();
    
    // Test that form fields accept input
    const [fromInput, toInput] = screen.getAllByRole('combobox');
    const passengersInput = screen.getByLabelText(/Passengers/i);

    fireEvent.change(fromInput, { target: { value: 'JFK' } });
    fireEvent.change(toInput, { target: { value: 'LAX' } });
    fireEvent.change(passengersInput, { target: { value: '2' } });

    expect(fromInput).toHaveValue('JFK');
    expect(toInput).toHaveValue('LAX');
    expect(passengersInput).toHaveValue('2');
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
