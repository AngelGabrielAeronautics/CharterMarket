import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Box, Typography, TextField, Button, IconButton, InputAdornment, Stepper, Step, StepLabel } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useModal } from '@/contexts/ModalContext';
import AnimatedBackground from './AnimatedBackground';
import tokens from '@/styles/tokens';
import Image from 'next/image';
import Fade from '@mui/material/Fade';
import { grey } from '@mui/material/colors';
import { alpha } from '@mui/material/styles';

export default function RegisterModal() {
  const { isRegisterModalOpen, closeRegisterModal, openLoginModal } = useModal();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<'passenger' | 'agent' | 'operator' | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [company, setCompany] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const accountImages: Record<'passenger'|'agent'|'operator', string> = {
    passenger: '/images/register/passenger.mp4',
    agent: '/images/register/agent.mp4',
    operator: '/images/register/operator.png'
  };
  const accountDescriptions: Record<'passenger'|'agent'|'operator', string> = {
    passenger: 'Book your flights quickly and easily.',
    agent: 'Manage bookings and client relationships.',
    operator: 'Oversee aircraft operations and schedules.'
  };

  const handleTogglePassword = () => setShowPassword(prev => !prev);
  const handleToggleConfirm = () => setShowConfirm(prev => !prev);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    // TODO: call registration API with { userType, email, password, company }
    setIsLoading(true);
    try {
      // await registerUser({ userType, email, password, company });
      router.push('/dashboard');
      closeRegisterModal();
    } catch (err) {
      setError('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const switchToLogin = () => {
    closeRegisterModal();
    openLoginModal();
  };

  return (
    <Dialog 
      open={isRegisterModalOpen}
      onClose={closeRegisterModal}
      maxWidth="xl"
      fullWidth
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)'
        }
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
          height: { xs: '60vh', md: '50vh' }
        }
      }}
    >
      {/* Two-column layout */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
          height: '100%'
        }}
      >
        {/* Left side - Image */}
        <Box
          component="div"
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {!userType ? (
            <AnimatedBackground />
          ) : (
            <Fade in timeout={500} key={userType}>
              <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                {accountImages[userType].endsWith('.mp4') ? (
                  <video
                    src={accountImages[userType]}
                    autoPlay
                    muted
                    loop
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  />
                ) : (
                  <Image
                    key={userType}
                    src={accountImages[userType]}
                    alt={`${userType} illustration`}
                    fill
                    sizes="(min-width: 900px) 700px, 100vw"
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                )}
                {/* Overlay light logo */}
                <Image
                  src="/branding/logos/light/charter logo - dark mode.png"
                  alt="Charter Logo"
                  width={140}
                  height={40}
                  priority
                  style={{
                    objectFit: 'contain',
                    position: 'absolute',
                    bottom: tokens.spacing[3].value,
                    left: tokens.spacing[3].value,
                    zIndex: 2
                  }}
                />
              </Box>
            </Fade>
          )}
        </Box>
        {/* Right side - Dynamic Form */}
        <Box sx={{ position: 'relative', p: { xs: tokens.spacing[3].value, sm: tokens.spacing[4].value }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <IconButton
            onClick={closeRegisterModal}
            sx={{ position: 'absolute', top: 8, right: 16, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
          <Stepper activeStep={step - 1} alternativeLabel sx={{ mb: 3, pt: 2 }}>
            <Step key="select">
              <StepLabel>Select Type</StepLabel>
            </Step>
            <Step key="details">
              <StepLabel>Details</StepLabel>
            </Step>
          </Stepper>
          {/* Content Area */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'auto', gap: 2 }}>
            {step === 1 ? (
              <>
                <Typography variant="h5" gutterBottom>Select your account type</Typography>
                <Box sx={{ display: 'flex', gap: tokens.spacing[2].value, width: '100%' }}>
                  <Button
                    color="primary"
                    variant="outlined"
                    onClick={() => setUserType('passenger')}
                    size="large"
                    sx={(theme) => ({
                      flex: 1,
                      flexDirection: 'column',
                      alignItems: 'center',
                      py: tokens.spacing[4].value,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.common.white, 0.04)
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.common.white, 0.08)
                          : grey[100],
                        borderColor: theme.palette.primary.main,
                      },
                      ...(userType === 'passenger' && {
                        borderWidth: '3px',
                        borderStyle: 'solid',
                        borderColor: theme.palette.mode === 'dark'
                          ? theme.palette.primary.contrastText
                          : theme.palette.primary.main,
                      })
                    })}
                  >
                    <Typography variant="h6" gutterBottom>Passenger</Typography>
                    <Typography variant="body2" color="text.secondary">{accountDescriptions.passenger}</Typography>
                  </Button>
                  <Button
                    color="primary"
                    variant="outlined"
                    onClick={() => setUserType('agent')}
                    size="large"
                    sx={(theme) => ({
                      flex: 1,
                      flexDirection: 'column',
                      alignItems: 'center',
                      py: tokens.spacing[4].value,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.common.white, 0.04)
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.common.white, 0.08)
                          : grey[100],
                        borderColor: theme.palette.primary.main,
                      },
                      ...(userType === 'agent' && {
                        borderWidth: '3px',
                        borderStyle: 'solid',
                        borderColor: theme.palette.mode === 'dark'
                          ? theme.palette.primary.contrastText
                          : theme.palette.primary.main,
                      })
                    })}
                  >
                    <Typography variant="h6" gutterBottom>Agent/Broker</Typography>
                    <Typography variant="body2" color="text.secondary">{accountDescriptions.agent}</Typography>
                  </Button>
                  <Button
                    color="primary"
                    variant="outlined"
                    onClick={() => setUserType('operator')}
                    size="large"
                    sx={(theme) => ({
                      flex: 1,
                      flexDirection: 'column',
                      alignItems: 'center',
                      py: tokens.spacing[4].value,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.common.white, 0.04)
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.common.white, 0.08)
                          : grey[100],
                        borderColor: theme.palette.primary.main,
                      },
                      ...(userType === 'operator' && {
                        borderWidth: '3px',
                        borderStyle: 'solid',
                        borderColor: theme.palette.mode === 'dark'
                          ? theme.palette.primary.contrastText
                          : theme.palette.primary.main,
                      })
                    })}
                  >
                    <Typography variant="h6" gutterBottom>Operator</Typography>
                    <Typography variant="body2" color="text.secondary">{accountDescriptions.operator}</Typography>
                  </Button>
                </Box>
              </>
            ) : (
              <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="text" onClick={() => setStep(1)} startIcon={<ArrowBackIcon />} sx={{ textTransform: 'none' }}>Back</Button>
                <Typography variant="h5" mb={2}>Register as {userType.charAt(0).toUpperCase() + userType.slice(1)}</Typography>
                {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
                {(userType === 'agent' || userType === 'operator') && (
                  <TextField label="Company Name" fullWidth size="small" value={company} onChange={e => setCompany(e.target.value)} required />
                )}
                <TextField label={userType === 'agent' || userType === 'operator' ? 'Responsible Person First Name' : 'First Name'} fullWidth size="small" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                <TextField label={userType === 'agent' || userType === 'operator' ? 'Responsible Person Last Name' : 'Last Name'} fullWidth size="small" value={lastName} onChange={e => setLastName(e.target.value)} required />
                <TextField label="Email" type="email" fullWidth size="small" value={email} onChange={e => setEmail(e.target.value)} required />
                <TextField label="Password" type={showPassword ? 'text' : 'password'} fullWidth size="small" value={password} onChange={e => setPassword(e.target.value)} required InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={handleTogglePassword} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} />
                <TextField label="Confirm Password" type={showConfirm ? 'text' : 'password'} fullWidth size="small" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={handleToggleConfirm} edge="end">{showConfirm ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} />
              </Box>
            )}
          </Box>
          {/* Footer Area */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {step === 1 ? (
              <>
                {userType && (<Button fullWidth variant="contained" onClick={() => setStep(2)}>Next</Button>)}
                <Button fullWidth variant="text" onClick={switchToLogin} sx={{ textTransform: 'none' }}>Already have an account? Sign In</Button>
              </>
            ) : (
              <>
                <Button type="submit" fullWidth variant="contained" color="primary" disabled={isLoading}>{isLoading ? 'Registering...' : 'Register'}</Button>
                <Button fullWidth variant="text" onClick={switchToLogin} sx={{ textTransform: 'none' }}>Already have an account? Sign In</Button>
              </>
            )}
          </Box>
        </Box>
      </Box>  {/* end two-column grid */}
    </Dialog>
  );
} 