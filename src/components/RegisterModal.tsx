import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Alert,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Visibility, VisibilityOff, Check, Close } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useModal } from '@/contexts/ModalContext';
import tokens from '@/styles/tokens';
import Image from 'next/image';
import { grey } from '@mui/material/colors';
import { alpha } from '@mui/material/styles';
import { registerUser } from '@/lib/auth';
import { UserRole } from '@/lib/userCode';

interface RegisterModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultUserType?: UserRole;
}

// Password validation utilities
interface PasswordRequirement {
  text: string;
  met: boolean;
}

const validatePassword = (
  password: string
): { requirements: PasswordRequirement[]; strength: number; isValid: boolean } => {
  const requirements: PasswordRequirement[] = [
    { text: 'At least 8 characters long', met: password.length >= 8 },
    { text: 'Contains uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { text: 'Contains lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { text: 'Contains number (0-9)', met: /\d/.test(password) },
    { text: 'Contains special character (!@#$%^&*)', met: /[!@#$%^&*]/.test(password) },
  ];

  const metCount = requirements.filter((req) => req.met).length;
  const strength = Math.round((metCount / requirements.length) * 100);
  const isValid = metCount === requirements.length;

  return { requirements, strength, isValid };
};

const getStrengthColor = (strength: number): string => {
  if (strength < 40) return '#f44336'; // red
  if (strength < 60) return '#ff9800'; // orange
  if (strength < 80) return '#ffeb3b'; // yellow
  return '#4caf50'; // green
};

const getStrengthText = (strength: number): string => {
  if (strength < 40) return 'Weak';
  if (strength < 60) return 'Fair';
  if (strength < 80) return 'Good';
  return 'Strong';
};

export default function RegisterModal({ isOpen, onClose, defaultUserType }: RegisterModalProps) {
  const { isRegisterModalOpen, closeRegisterModal, openLoginModal } = useModal();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<UserRole | ''>(defaultUserType || '');
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
  const [passwordValidation, setPasswordValidation] = useState(validatePassword(''));
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const accountImages: Record<UserRole, string> = {
    passenger: '/images/register/passenger.mp4',
    agent: '/images/register/agent.mp4',
    operator: '/images/register/operator.png',
    admin: '/images/register/operator.png', // Fallback for admin
    superAdmin: '/images/register/operator.png', // Fallback for superAdmin
  };
  const accountDescriptions: Record<UserRole, string> = {
    passenger: 'Book your flights quickly and easily.',
    agent: 'Manage bookings and client relationships.',
    operator: 'Oversee aircraft operations and schedules.',
    admin: 'Manage platform administration.',
    superAdmin: 'Full platform administration access.',
  };

  useEffect(() => {
    if (defaultUserType) {
      setUserType(defaultUserType);
      setStep(2);
    } else {
      setUserType('');
      setStep(1);
    }
  }, [defaultUserType, isRegisterModalOpen]);

  // Update password validation when password changes
  useEffect(() => {
    setPasswordValidation(validatePassword(password));
  }, [password]);

  const handleTogglePassword = () => setShowPassword((prev) => !prev);
  const handleToggleConfirm = () => setShowConfirm((prev) => !prev);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(''); // Clear errors when user types
  };

  const handlePasswordFocus = () => {
    setShowPasswordRequirements(true);
  };

  const handlePasswordBlur = () => {
    // Keep requirements visible if password is not valid
    if (passwordValidation.isValid) {
      setShowPasswordRequirements(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password strength
    if (!passwordValidation.isValid) {
      setError('Password does not meet security requirements');
      setShowPasswordRequirements(true);
      return;
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate company field for agents and operators
    if ((userType === 'agent' || userType === 'operator') && !company.trim()) {
      setError('Company name is required for agents and operators');
      return;
    }

    setIsLoading(true);
    try {
      // Register user with Firebase and Firestore
      await registerUser(
        email.trim(),
        password,
        firstName.trim(),
        lastName.trim(),
        userType as UserRole,
        userType === 'agent' || userType === 'operator' ? company.trim() : undefined
      );

      // Registration successful - redirect to dashboard
      router.push('/dashboard');
      closeRegisterModal();
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchToLogin = () => {
    closeRegisterModal();
    openLoginModal();
  };

  const currentImageSrc = userType ? accountImages[userType] : '/images/register/operator.png';
  const isVideo = userType && accountImages[userType]?.endsWith('.mp4');

  const renderPasswordRequirements = () => {
    if (!showPasswordRequirements) return null;

    return (
      <Box sx={{ mt: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
          Password Requirements:
        </Typography>
        <List dense sx={{ py: 0 }}>
          {passwordValidation.requirements.map((req, index) => (
            <ListItem key={index} sx={{ py: 0.25, px: 0 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                {req.met ? (
                  <Check sx={{ fontSize: 16, color: 'success.main' }} />
                ) : (
                  <Close sx={{ fontSize: 16, color: 'error.main' }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={req.text}
                primaryTypographyProps={{
                  variant: 'body2',
                  color: req.met ? 'success.main' : 'text.secondary',
                }}
              />
            </ListItem>
          ))}
        </List>
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Strength:</Typography>
          <Box sx={{ flex: 1, mr: 1 }}>
            <LinearProgress
              variant="determinate"
              value={passwordValidation.strength}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'grey.300',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getStrengthColor(passwordValidation.strength),
                },
              }}
            />
          </Box>
          <Chip
            label={getStrengthText(passwordValidation.strength)}
            size="small"
            sx={{
              backgroundColor: getStrengthColor(passwordValidation.strength),
              color: 'white',
              fontSize: '0.75rem',
            }}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      open={isRegisterModalOpen}
      onClose={closeRegisterModal}
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
          maxHeight: { xs: '80vh', md: '70vh' },
          height: { xs: '80vh', md: '70vh' },
        },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
          height: '100%',
        }}
      >
        <Box
          component="div"
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            {isVideo ? (
              <video
                key={currentImageSrc}
                src={currentImageSrc}
                autoPlay
                muted
                loop
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              />
            ) : (
              <Image
                key={currentImageSrc}
                src={currentImageSrc}
                alt={`${userType || 'Charter'} illustration`}
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
            )}
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
                zIndex: 2,
              }}
            />
          </Box>
        </Box>
        <Box
          sx={{
            position: 'relative',
            p: { xs: tokens.spacing[3].value, sm: tokens.spacing[4].value },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
          }}
        >
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
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'auto',
              gap: 2,
            }}
          >
            {step === 1 ? (
              <>
                <Typography variant="h5" gutterBottom>
                  Select your account type
                </Typography>
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
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.common.white, 0.04)
                          : 'transparent',
                      '&:hover': {
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? alpha(theme.palette.common.white, 0.08)
                            : grey[100],
                        borderColor: theme.palette.primary.main,
                      },
                      ...(userType === 'passenger' && {
                        borderWidth: '3px',
                        borderStyle: 'solid',
                        borderColor:
                          theme.palette.mode === 'dark'
                            ? theme.palette.primary.contrastText
                            : theme.palette.primary.main,
                      }),
                    })}
                  >
                    <Typography variant="h6" gutterBottom>
                      Passenger
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {accountDescriptions.passenger}
                    </Typography>
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
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.common.white, 0.04)
                          : 'transparent',
                      '&:hover': {
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? alpha(theme.palette.common.white, 0.08)
                            : grey[100],
                        borderColor: theme.palette.primary.main,
                      },
                      ...(userType === 'agent' && {
                        borderWidth: '3px',
                        borderStyle: 'solid',
                        borderColor:
                          theme.palette.mode === 'dark'
                            ? theme.palette.primary.contrastText
                            : theme.palette.primary.main,
                      }),
                    })}
                  >
                    <Typography variant="h6" gutterBottom>
                      Agent/Broker
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {accountDescriptions.agent}
                    </Typography>
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
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.common.white, 0.04)
                          : 'transparent',
                      '&:hover': {
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? alpha(theme.palette.common.white, 0.08)
                            : grey[100],
                        borderColor: theme.palette.primary.main,
                      },
                      ...(userType === 'operator' && {
                        borderWidth: '3px',
                        borderStyle: 'solid',
                        borderColor:
                          theme.palette.mode === 'dark'
                            ? theme.palette.primary.contrastText
                            : theme.palette.primary.main,
                      }),
                    })}
                  >
                    <Typography variant="h6" gutterBottom>
                      Operator
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {accountDescriptions.operator}
                    </Typography>
                  </Button>
                </Box>
              </>
            ) : (
              <Step2Form handleSubmit={handleSubmit}>
                <Button
                  variant="text"
                  onClick={() => setStep(1)}
                  startIcon={<ArrowBackIcon />}
                  sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
                >
                  Back
                </Button>
                <Typography variant="h5" mb={2} sx={{ alignSelf: 'center' }}>
                  Register as {userType ? userType.charAt(0).toUpperCase() + userType.slice(1) : ''}
                </Typography>
                {error && (
                  <Alert severity="error" sx={{ mb: 2, alignSelf: 'stretch' }}>
                    {error}
                  </Alert>
                )}
                {(userType === 'agent' || userType === 'operator') && (
                  <TextField
                    label="Company Name"
                    fullWidth
                    size="small"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                  />
                )}
                <TextField
                  label={
                    userType === 'agent' || userType === 'operator'
                      ? 'Responsible Person First Name'
                      : 'First Name'
                  }
                  fullWidth
                  size="small"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <TextField
                  label={
                    userType === 'agent' || userType === 'operator'
                      ? 'Responsible Person Last Name'
                      : 'Last Name'
                  }
                  fullWidth
                  size="small"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  size="small"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Box>
                  <TextField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    size="small"
                    value={password}
                    onChange={handlePasswordChange}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    required
                    error={password.length > 0 && !passwordValidation.isValid}
                    helperText={
                      password.length > 0 && !passwordValidation.isValid
                        ? 'Password must meet all requirements'
                        : ''
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleTogglePassword} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {renderPasswordRequirements()}
                </Box>
                <TextField
                  label="Confirm Password"
                  type={showConfirm ? 'text' : 'password'}
                  fullWidth
                  size="small"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  error={confirmPassword.length > 0 && password !== confirmPassword}
                  helperText={
                    confirmPassword.length > 0 && password !== confirmPassword
                      ? 'Passwords do not match'
                      : ''
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleToggleConfirm} edge="end">
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Step2Form>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 'auto', pt: 2 }}>
            {step === 1 ? (
              <>
                {userType ? (
                  <Button fullWidth variant="contained" onClick={() => setStep(2)}>
                    Next
                  </Button>
                ) : (
                  <Button fullWidth variant="contained" disabled>
                    Next
                  </Button>
                )}
                <Button
                  fullWidth
                  variant="text"
                  onClick={switchToLogin}
                  sx={{ textTransform: 'none' }}
                >
                  Already have an account? Sign In
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="submit"
                  form="register-form"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={
                    isLoading || !passwordValidation.isValid || password !== confirmPassword
                  }
                >
                  {isLoading ? 'Registering...' : 'Register'}
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  onClick={switchToLogin}
                  sx={{ textTransform: 'none' }}
                >
                  Already have an account? Sign In
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

const Step2Form = ({
  handleSubmit,
  children,
}: {
  handleSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}) => (
  <Box
    component="form"
    id="register-form"
    onSubmit={handleSubmit}
    sx={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      flexGrow: 1,
      justifyContent: 'center',
    }}
  >
    {children}
  </Box>
);
