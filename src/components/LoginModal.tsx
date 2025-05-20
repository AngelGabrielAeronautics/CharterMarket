'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { FaGoogle } from 'react-icons/fa';
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
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';

import { auth } from '@/lib/firebase';
import { useModal } from '@/contexts/ModalContext';
import tokens from '@/styles/tokens';

const LoginModal = () => {
  const { isLoginModalOpen, closeLoginModal, openRegisterModal } = useModal();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const togglePasswordVisibility = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully!');
      closeLoginModal();
      router.push('/dashboard');
    } catch (error: any) {
      setIsLoading(false);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setErrorMsg('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMsg('Too many failed login attempts. Please try again later');
      } else {
        setErrorMsg('Something went wrong. Please try again');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');

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
      } else {
        setErrorMsg('Failed to sign in with Google');
      }
    }
  };

  const onToggle = () => {
    closeLoginModal();
    openRegisterModal();
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
            src="/images/login-background.jpg"
            alt="Login Background"
            layout="fill"
            objectFit="cover"
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
            {errorMsg && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMsg}
              </Alert>
            )}
            <TextField
              autoFocus
              label="Email"
              type="email"
              fullWidth
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
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
                flexDirection: 'column',
                gap: tokens.spacing[2].value,
                alignItems: 'flex-start',
              }}
            >
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  closeLoginModal();
                  router.push('/forgot-password');
                }}
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
              >
                Forgot username?
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
                <Button variant="text" color="primary" onClick={onToggle}>
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
