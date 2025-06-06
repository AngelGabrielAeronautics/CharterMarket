'use client';

import React, { useState, useRef, useEffect } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { FaGoogle, FaEdit } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  LinearProgress,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import Image from 'next/image';

import { auth } from '@/lib/firebase';
import { useModal } from '@/contexts/ModalContext';
import tokens from '@/styles/tokens';

// Common email domain suggestions
const commonDomains = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'angelgabriel.co.za',
];

// Function to suggest email corrections
const suggestEmailCorrection = (email: string): string | null => {
  if (!email.includes('@')) return null;

  const [localPart, domain] = email.split('@');
  if (!domain) return null;

  // Find similar domains
  for (const commonDomain of commonDomains) {
    if (domain !== commonDomain && isEmailDomainSimilar(domain, commonDomain)) {
      return `${localPart}@${commonDomain}`;
    }
  }

  return null;
};

// Simple similarity check for email domains
const isEmailDomainSimilar = (domain1: string, domain2: string): boolean => {
  if (Math.abs(domain1.length - domain2.length) > 3) return false;

  let differences = 0;
  const maxLength = Math.max(domain1.length, domain2.length);

  for (let i = 0; i < maxLength; i++) {
    if (domain1[i] !== domain2[i]) {
      differences++;
      if (differences > 2) return false;
    }
  }

  return differences > 0 && differences <= 2;
};

const LoginModal = () => {
  const { isLoginModalOpen, closeLoginModal, openRegisterModal } = useModal();
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorType, setErrorType] = useState<'email' | 'password' | 'general' | ''>('');
  const [suggestedEmail, setSuggestedEmail] = useState<string | null>(null);

  // Clear error when user starts typing
  useEffect(() => {
    if (errorMsg) {
      setErrorMsg('');
      setErrorType('');
      setSuggestedEmail(null);
    }
  }, [email, password]);

  const togglePasswordVisibility = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setShowPassword(!showPassword);
  };

  const handleEmailSuggestionClick = () => {
    if (suggestedEmail) {
      setEmail(suggestedEmail);
      setSuggestedEmail(null);
      setErrorMsg('');
      setErrorType('');
    }
  };

  const handleEditEmail = () => {
    setErrorMsg('');
    setErrorType('');
    setSuggestedEmail(null);
    // Focus the email field
    setTimeout(() => {
      emailInputRef.current?.focus();
      emailInputRef.current?.select();
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setErrorType('');
    setSuggestedEmail(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully!');
      closeLoginModal();
      router.push('/dashboard');
    } catch (error: any) {
      setIsLoading(false);

      // Debug: Log the actual error to see what we're getting
      console.log('Firebase Auth Error:', error.code, error.message);

      if (error.code === 'auth/user-not-found') {
        const suggestion = suggestEmailCorrection(email);
        setErrorType('email');
        setErrorMsg('No account found with this email address.');
        setSuggestedEmail(suggestion);
      } else if (error.code === 'auth/wrong-password') {
        setErrorType('password');
        setErrorMsg('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorType('email');
        setErrorMsg('Please enter a valid email address.');
      } else if (error.code === 'auth/invalid-credential') {
        // This is a common error that Firebase returns for wrong email/password
        const suggestion = suggestEmailCorrection(email);
        setErrorType('email');
        setErrorMsg('Invalid email or password. Please check your credentials.');
        setSuggestedEmail(suggestion);
      } else if (error.code === 'auth/network-request-failed') {
        setErrorType('general');
        setErrorMsg('Connection failed. Please check your internet connection and try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setErrorType('general');
        setErrorMsg(
          'Too many failed login attempts. Please try again later or reset your password.'
        );
      } else if (error.code === 'auth/user-disabled') {
        setErrorType('email');
        setErrorMsg('This account has been disabled. Please contact support.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setErrorType('general');
        setErrorMsg('Sign-in method not enabled. Please contact support.');
      } else if (error.code === 'auth/weak-password') {
        setErrorType('password');
        setErrorMsg('Password is too weak. Please choose a stronger password.');
      } else {
        setErrorType('general');
        setErrorMsg('Unable to sign in. Please check your credentials and try again.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    setErrorType('');
    setSuggestedEmail(null);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Logged in successfully!');
      closeLoginModal();
      router.push('/dashboard');
    } catch (error: any) {
      setIsGoogleLoading(false);
      if (error.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in cancelled');
        setErrorType('general');
      } else {
        setErrorMsg('Failed to sign in with Google');
        setErrorType('general');
      }
    }
  };

  const onToggle = () => {
    closeLoginModal();
    openRegisterModal();
  };

  const renderErrorAlert = () => {
    if (!errorMsg) return null;

    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Box>
          {errorMsg}
          {suggestedEmail && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Did you mean:
              </Typography>
              <Chip
                label={suggestedEmail}
                onClick={handleEmailSuggestionClick}
                variant="outlined"
                size="small"
                clickable
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              />
            </Box>
          )}
          {errorType === 'password' && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Having trouble?{' '}
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    closeLoginModal();
                    router.push('/forgot-password');
                  }}
                  sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                >
                  Reset your password
                </Button>
              </Typography>
            </Box>
          )}
          {errorType === 'email' && !suggestedEmail && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Button
                  variant="text"
                  size="small"
                  onClick={onToggle}
                  sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                >
                  Register here
                </Button>
              </Typography>
            </Box>
          )}
        </Box>
      </Alert>
    );
  };

  return (
    <Dialog
      open={isLoginModalOpen}
      onClose={closeLoginModal}
      maxWidth="xl"
      fullWidth
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: tokens.borderRadius.md.value,
          boxShadow: tokens.shadow.medium.value,
          overflow: 'hidden',
          m: { xs: tokens.spacing[2].value, sm: tokens.spacing[4].value },
          maxWidth: '1200px',
          width: { xs: '100%', md: '1200px' },
          maxHeight: { xs: '60vh', md: '50vh' },
          height: { xs: '60vh', md: '50vh' },
        },
      }}
    >
      {/* Loading indicator */}
      {(isLoading || isGoogleLoading) && <LinearProgress />}
      {/* Two-column CSS grid: hidden on xs for left, form on right */}
      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, height: '100%' }}
      >
        {/* Left side - Image */}
        <Box
          component="div"
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Static Image Background */}
          <Image
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80"
            alt="Login Background"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 4,
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          >
            <Box
              component="img"
              src="/branding/logos/light/charter logo - dark mode.png"
              alt="Charter Logo"
              sx={{ mb: 3, width: 150, height: 'auto' }}
            />
            <Typography variant="h4" fontWeight={600} mb={2} textAlign="center">
              Welcome to Charter
            </Typography>
            <Typography variant="body1" textAlign="center" sx={{ maxWidth: '300px', mb: 3 }}>
              Your premier private jet charter marketplace
            </Typography>

            <Box
              sx={{
                mt: 4,
                p: 2,
                borderRadius: tokens.borderRadius.sm.value,
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                width: '100%',
                maxWidth: '300px',
              }}
            >
              <Typography variant="body2" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
                &quot;Charter has revolutionized how we book private jets. The interface is
                intuitive and the service is exceptional.&quot;
              </Typography>
              <Typography
                variant="caption"
                sx={{ display: 'block', textAlign: 'right', mt: 1, opacity: 0.8 }}
              >
                — Michael R., CEO
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right side - Login Form */}
        <Box
          component="div"
          sx={{
            position: 'relative',
            p: { xs: 3, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
          }}
        >
          {/* Header */}
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={closeLoginModal}
              sx={{ position: 'absolute', right: 16, top: 8, color: 'text.secondary' }}
            >
              <CloseIcon />
            </IconButton>
            <Box sx={{ mt: 2, mb: 4 }}>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Sign in to your account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your details below
              </Typography>
            </Box>
          </Box>
          {/* Content Area */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            {renderErrorAlert()}

            <TextField
              inputRef={emailInputRef}
              autoFocus
              label="Email"
              type="email"
              fullWidth
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              error={errorType === 'email'}
              helperText={
                errorType === 'email' && !errorMsg ? 'Please check your email address' : ''
              }
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              error={errorType === 'password'}
              helperText={errorType === 'password' && !errorMsg ? 'Please check your password' : ''}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={togglePasswordVisibility}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: tokens.spacing[2].value,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  closeLoginModal();
                  router.push('/forgot-password');
                }}
                sx={{ textTransform: 'none' }}
              >
                Forgot password?
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  closeLoginModal();
                  router.push('/forgot-username');
                }}
                sx={{ textTransform: 'none' }}
              >
                Forgot email?
              </Button>
            </Box>
          </Box>
          {/* Footer Area */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={isLoading}
              onClick={handleSubmit}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              fullWidth
              startIcon={<FaGoogle style={{ color: 'inherit' }} />}
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign in with Google'
              )}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Button
                  variant="text"
                  color="primary"
                  onClick={onToggle}
                  sx={{ textTransform: 'none' }}
                >
                  Register
                </Button>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default LoginModal;
