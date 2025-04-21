import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser, signInWithGoogle } from '@/lib/auth';
import { UserRole } from '@/lib/utils';
import Link from 'next/link';
import PasswordStrengthChecker, { validatePassword } from '@/components/PasswordStrengthChecker';
import EmailValidator, { validateEmail } from '@/components/EmailValidator';
import RoleSelector from './RoleSelector';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  TextField, 
  Button, 
  Grid, 
  IconButton, 
  FormControl,
  Box,
  Typography,
  Alert,
  InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: '' as UserRole,
    company: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleSelect = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role,
    }));
  };

  const handleNext = () => {
    if (!formData.role) {
      setError('Please select a role to continue');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if ((formData.role === 'agent' || formData.role === 'operator') && !formData.company.trim()) {
      setError('Company name is required for travel agents and aircraft operators');
      return;
    }

    setLoading(true);

    try {
      const userData = await registerUser(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.role,
        formData.company
      );
      
      router.push('/dashboard');
      onClose();
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      if (!formData.role) {
        setError('Please select a role before continuing with Google');
        setLoading(false);
        return;
      }
      
      await signInWithGoogle();
      router.push('/dashboard');
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = formData.password === formData.confirmPassword;
  const showPasswordMismatch = formData.confirmPassword.length > 0 && !passwordsMatch;
  const showCompanyField = formData.role === 'agent' || formData.role === 'operator';

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: 640,
          m: 2,
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h5" component="div" fontWeight="bold">
          Create your account
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {error && (
          <Alert severity="error" sx={{ mx: 3, mt: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ 
          display: 'flex', 
          height: '100%',
          p: 3
        }}>
          {/* Left side - Role selector */}
          <Box sx={{ width: '50%', pr: 2 }}>
            <RoleSelector
              selectedRole={formData.role || null}
              onRoleSelect={handleRoleSelect}
              showOptions={step === 1}
            />
          </Box>

          {/* Right side - Form */}
          <Box sx={{ width: '50%', pl: 2 }}>
            {step === 1 ? (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>
                  Select your role
                </Typography>
                <Box sx={{ mt: 'auto' }}>
                  <Button
                    onClick={handleNext}
                    disabled={!formData.role}
                    variant="contained"
                    fullWidth
                    size="large"
                  >
                    CONTINUE
                  </Button>
                </Box>
              </Box>
            ) : (
              <form onSubmit={handleSubmit} style={{ height: '100%' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <Grid container spacing={2}>
                      <Grid component="div" xs={6}>
                        <FormControl fullWidth>
                          <TextField
                            label="First name"
                            name="firstName"
                            required
                            value={formData.firstName}
                            onChange={handleChange}
                            helperText="Enter your legal first name"
                            autoComplete="given-name"
                          />
                        </FormControl>
                      </Grid>
                      <Grid component="div" xs={6}>
                        <FormControl fullWidth>
                          <TextField
                            label="Last name"
                            name="lastName"
                            required
                            value={formData.lastName}
                            onChange={handleChange}
                            helperText="Enter your legal last name"
                            autoComplete="family-name"
                          />
                        </FormControl>
                      </Grid>

                      <Grid component="div" xs={12}>
                        <FormControl fullWidth>
                          <TextField
                            label="Email"
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            onFocus={() => setIsEmailFocused(true)}
                            onBlur={() => setIsEmailFocused(false)}
                            helperText="This will be your login email"
                            autoComplete="email"
                          />
                        </FormControl>
                        {isEmailFocused && <EmailValidator email={formData.email} isVisible={isEmailFocused} />}
                      </Grid>

                      <Grid component="div" xs={12}>
                        <FormControl fullWidth>
                          <TextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => setIsPasswordFocused(false)}
                            helperText="Create a strong password"
                            autoComplete="new-password"
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={() => setShowPassword(!showPassword)}
                                    onMouseDown={(e) => e.preventDefault()}
                                    edge="end"
                                  >
                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </FormControl>
                        <PasswordStrengthChecker 
                          password={formData.password}
                          isVisible={isPasswordFocused || formData.password.length > 0}
                        />
                      </Grid>

                      <Grid component="div" xs={12}>
                        <FormControl fullWidth>
                          <TextField
                            label="Confirm Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            onFocus={() => setIsConfirmPasswordFocused(true)}
                            onBlur={() => setIsConfirmPasswordFocused(false)}
                            error={showPasswordMismatch}
                            helperText={showPasswordMismatch ? "Passwords don't match" : "Re-enter your password"}
                            autoComplete="new-password"
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label="toggle confirm password visibility"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    onMouseDown={(e) => e.preventDefault()}
                                    edge="end"
                                  >
                                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </FormControl>
                      </Grid>

                      {showCompanyField && (
                        <Grid component="div" xs={12}>
                          <FormControl fullWidth>
                            <TextField
                              label="Company"
                              name="company"
                              required
                              value={formData.company}
                              onChange={handleChange}
                              helperText="Enter your company or organization name"
                              autoComplete="organization"
                            />
                          </FormControl>
                        </Grid>
                      )}
                    </Grid>
                  </Box>

                  <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      type="submit"
                      disabled={loading}
                      variant="contained"
                      size="large"
                      fullWidth
                    >
                      {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                    </Button>
                    <Button
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      variant="outlined"
                      size="large"
                      fullWidth
                      startIcon={<GoogleIcon />}
                    >
                      {loading ? 'SIGNING IN...' : 'CONTINUE WITH GOOGLE'}
                    </Button>
                  </Box>
                </Box>
              </form>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
} 