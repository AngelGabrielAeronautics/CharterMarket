import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { QuoteRequest, Offer } from '@/types/flight';
import { Airport } from '@/types/airport';
import { getCityImageUrlWithFallback } from '@/lib/cityImages';
import Image from 'next/image';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Divider, 
  Paper, 
  Chip,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  Alert
} from '@mui/material';
import { getAirportByICAO } from '@/lib/airport';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import MultipleStopIcon from '@mui/icons-material/MultipleStop';
import LuggageIcon from '@mui/icons-material/Luggage';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AirplaneTicketIcon from '@mui/icons-material/AirplaneTicket';
import Map from '@/components/Map/Map';
import tokens from '@/styles/tokens';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SortIcon from '@mui/icons-material/Sort';
import BusinessIcon from '@mui/icons-material/Business';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '@/contexts/AuthContext';
import { submitOffer } from '@/lib/quote';
import { createNotification } from '@/lib/notification';
import toast from 'react-hot-toast';
import { getUserDataByUserCode } from '@/lib/user';
import { uploadQuoteAttachment, uploadMultipleQuoteAttachments, testStorageConnection, verifyQuoteAttachments } from '@/lib/aircraft';
import { UserProfile } from '@/types/user';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DescriptionIcon from '@mui/icons-material/Description';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import NotesIcon from '@mui/icons-material/Notes';

import { getOperatorAircraft } from '@/lib/aircraft';
import { Aircraft } from '@/types/aircraft';

// Define brand colors from tokens
const brandColors = {
  primary: tokens.color.primary.value,
  primaryLight: tokens.color['primary-light'].value,
  border: tokens.color.border.value,
  backgroundLight: tokens.color['background-light'].value,
};

// Operator Quote Submission Form Component
interface OperatorQuoteFormProps {
  request: QuoteRequest;
  onSuccess?: () => void;
}

const OperatorQuoteForm: React.FC<OperatorQuoteFormProps> = ({ request, onSuccess }) => {
  const { user } = useAuth();
  const [price, setPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [operatorProfile, setOperatorProfile] = useState<UserProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>('');
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [isLoadingAircraft, setIsLoadingAircraft] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [uploadRetryCount, setUploadRetryCount] = useState(0);

  // Common currencies list
  const currencies = [
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'GBP', symbol: '£', label: 'British Pound' },
    { code: 'ZAR', symbol: 'R', label: 'South African Rand' },
    { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
    { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc' },
    { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  ];

  // Load operator profile on mount
  useEffect(() => {
    const loadOperatorProfile = async () => {
      if (user?.userCode) {
        try {
          const profile = await getUserDataByUserCode(user.userCode);
          if (profile) {
            // Manually create UserProfile object from returned data
            const userProfile: UserProfile = {
              email: profile.email || '',
              firstName: profile.firstName || '',
              lastName: profile.lastName || '',
              role: profile.role || 'operator',
              userCode: profile.userCode || user.userCode,
              company: profile.company || null,
              createdAt: profile.createdAt || new Date(),
              updatedAt: profile.updatedAt || new Date(),
              emailVerified: profile.emailVerified || false,
              lastReminderSent: profile.lastReminderSent || null,
              reminderCount: profile.reminderCount || 0,
              profileIncompleteDate: profile.profileIncompleteDate || null,
              status: profile.status || 'active',
              isProfileComplete: profile.isProfileComplete || false,
              dormantDate: profile.dormantDate || null,
              photoURL: profile.photoURL || null,
              companyName: profile.companyName || null,
              defaultCurrency: profile.defaultCurrency || 'USD',
            };
            setOperatorProfile(userProfile);
            // Set default currency from operator profile
            if (userProfile.defaultCurrency) {
              setCurrency(userProfile.defaultCurrency);
            }
          }
        } catch (error) {
          console.error('Error loading operator profile:', error);
        }
      }
    };
    loadOperatorProfile();
  }, [user?.userCode]);

  // Load operator's aircraft on component mount
  useEffect(() => {
    const loadAircraft = async () => {
      if (!user?.userCode) return;
      
      try {
        setIsLoadingAircraft(true);
        const operatorAircraft = await getOperatorAircraft(user.userCode, true); // Only active aircraft
        setAircraft(operatorAircraft);
        
        // Set default currency if user has one
        if (user.defaultCurrency && currencies.find(c => c.code === user.defaultCurrency)) {
          setCurrency(user.defaultCurrency);
        }
      } catch (error) {
        console.error('Failed to load aircraft:', error);
      } finally {
        setIsLoadingAircraft(false);
      }
    };

    // Test storage connectivity
    const testStorage = async () => {
      try {
        const isConnected = await testStorageConnection();
        if (!isConnected) {
          console.warn('Firebase Storage connectivity test failed');
          toast.error('Storage connectivity issue detected. File uploads may not work properly.');
        }
      } catch (error) {
        console.warn('Storage connectivity test failed:', error);
      }
    };

    loadAircraft();
    testStorage();
  }, [user]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and a single decimal point
    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
      setPrice(value);
      setPriceError('');
    }
  };

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    // Check total files (current + new)
    if (attachments.length + files.length > 5) {
      toast.error(`Maximum 5 files allowed. You currently have ${attachments.length} file(s).`);
      return;
    }
    
    // Validate each file
    for (const file of files) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        toast.error(`File "${file.name}" is not a PDF. Only PDF files are allowed.`);
        return;
      }
      // Validate file size (max 3MB)
      if (file.size > 3 * 1024 * 1024) {
        toast.error(`File "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Files must be less than 3MB.`);
        return;
      }
    }
    
    // Add files to attachments array
    setAttachments(prev => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllAttachments = () => {
    setAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCheckUploadStatus = async () => {
    if (!user || attachments.length === 0) return;
    
    setIsCheckingStatus(true);
    try {
      const tempQuoteId = `temp-${user.userCode}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const fileNames = attachments.map(file => file.name);
      
      console.log('Manually checking upload status for files:', fileNames);
      const verifiedAttachments = await verifyQuoteAttachments(tempQuoteId, user.userCode, fileNames);
      
      if (verifiedAttachments.length > 0) {
        toast.success(`Found ${verifiedAttachments.length} uploaded files! You can continue with quote submission.`);
        console.log('Verified attachments:', verifiedAttachments);
      } else {
        toast.error('No uploaded files found. Please try uploading again.');
      }
    } catch (error) {
      console.error('Error checking upload status:', error);
      toast.error('Could not check upload status. Please try again.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSubmit = async () => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setPriceError('Please enter a valid price.');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to submit a quote.');
      return;
    }

    if (!selectedAircraftId) {
      toast.error('Please select an aircraft for this quote.');
      return;
    }

    // Use a more unique temporary ID to avoid conflicts (define at function scope for access everywhere)
    const tempQuoteId = `temp-${user.userCode}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    setIsSubmitting(true);
    setAttachmentUploading(false);
    
    try {
      console.log('Starting quote submission process...');
      let uploadedAttachments: { url: string; fileName: string; uploadedAt: Date }[] = [];

      // Upload attachments if present
      if (attachments.length > 0) {
        console.log(`Uploading ${attachments.length} attachments...`);
        setAttachmentUploading(true);
        
        try {
          console.log(`Using temporary quote ID: ${tempQuoteId}`);
          
          // Remove the artificial timeout and let Firebase handle its own timeouts
          uploadedAttachments = await uploadMultipleQuoteAttachments(tempQuoteId, user.userCode, attachments);
          
          console.log(`Successfully uploaded ${uploadedAttachments.length} attachments`);
        } catch (error) {
          console.error('Error uploading attachments:', error);
          setAttachmentUploading(false);
          
          let shouldContinue = false;
          
          // Check if files were actually uploaded successfully despite the error
          try {
            console.log('Checking if files were uploaded successfully despite error...');
            const fileNames = attachments.map(file => file.name);
            const verifiedAttachments = await verifyQuoteAttachments(tempQuoteId, user.userCode, fileNames);
            
            if (verifiedAttachments.length === attachments.length) {
              console.log('All files were uploaded successfully despite error!');
              uploadedAttachments = verifiedAttachments;
              shouldContinue = true;
              toast.success('Files uploaded successfully!');
            } else if (verifiedAttachments.length > 0) {
              console.log(`${verifiedAttachments.length}/${attachments.length} files were uploaded successfully`);
              uploadedAttachments = verifiedAttachments;
              
              const continuePartial = window.confirm(
                `${verifiedAttachments.length} out of ${attachments.length} files were uploaded successfully. Would you like to continue with these files?`
              );
              
              if (continuePartial) {
                shouldContinue = true;
                toast.success(`Continuing with ${verifiedAttachments.length} uploaded files`);
              }
            }
          } catch (verifyError) {
            console.warn('Could not verify file uploads:', verifyError);
          }
          
          if (!shouldContinue && error instanceof Error) {
            if (error.message.includes('timeout') && uploadRetryCount < 2) {
              // Auto-retry for timeout errors (up to 2 retries)
              console.log(`Auto-retrying upload (attempt ${uploadRetryCount + 1}/2) due to timeout...`);
              setUploadRetryCount(prev => prev + 1);
              setIsSubmitting(false);
              toast.error(`Upload timed out. Retrying automatically (attempt ${uploadRetryCount + 1}/2)...`);
              
              // Auto-retry after a short delay
              setTimeout(() => {
                handleSubmit();
              }, 2000);
              return;
            } else if (error.message.includes('timeout')) {
              toast.error('File upload timed out. Please try again with smaller files or check your internet connection.');
            } else if (error.message.includes('storage/retry-limit-exceeded') || error.message.includes('retry')) {
              // Offer option to submit without attachments
              const submitWithoutAttachments = window.confirm(
                'File upload failed after multiple retries. Would you like to submit your quote without attachments? You can add attachments later.'
              );
              
              if (submitWithoutAttachments) {
                console.log('User chose to submit without attachments');
                uploadedAttachments = []; // Clear attachments array
                shouldContinue = true; // Continue with submission process
              } else {
                toast.error('Quote submission cancelled.');
              }
            } else if (error.message.includes('Firebase Storage is not properly configured')) {
              toast.error('Storage configuration error. Please contact support if this persists.');
            } else if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
              const retryUpload = window.confirm(
                'Network error occurred during upload. Would you like to try again?'
              );
              
              if (retryUpload) {
                // Reset retry count and try again
                setUploadRetryCount(0);
                console.log('User chose to retry upload');
                setIsSubmitting(false);
                return;
              } else {
                toast.error('Upload cancelled.');
              }
            } else if (error.message.includes('CORS') || error.message.includes('browser security')) {
              toast.error('Browser security error. Please refresh the page and try again.');
            } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
              toast.error('Permission denied. Please contact support if this persists.');
            } else {
              // Generic error with retry option
              const retryUpload = window.confirm(
                `Upload failed: ${error.message}\n\nWould you like to try again?`
              );
              
              if (retryUpload) {
                setUploadRetryCount(0);
                console.log('User chose to retry upload');
                setIsSubmitting(false);
                return;
              } else {
                toast.error('Upload cancelled.');
              }
            }
          } else {
            toast.error('Failed to upload attachments. Please try again.');
          }
          
          if (!shouldContinue) {
            setIsSubmitting(false);
            return;
          }
        } finally {
          setAttachmentUploading(false);
        }
      }

      console.log('Submitting quote to database...');
      
      // Submit the quote with timeout and better error handling
      try {
        const offerId = await Promise.race([
          submitOffer(request, user, numericPrice, currency, notes, uploadedAttachments, selectedAircraftId),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Quote submission timeout after 15 seconds')), 15000)
          )
        ]);
        
        console.log(`Quote submitted successfully with ID: ${offerId}`);
        
        // Create notification with timeout
        console.log('Creating notification for client...');
        try {
          await Promise.race([
            createNotification(
              request.clientUserCode,
              'QUOTE_RECEIVED',
              'You Have a New Offer!',
              `You have received a new offer for your request ${request.requestCode}.`,
              { quoteRequestId: request.id },
              `/dashboard/quotes/request?id=${request.id}`
            ),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Notification creation timeout after 10 seconds')), 10000)
            )
          ]);
          
          console.log('Notification created successfully');
        } catch (notificationError) {
          console.warn('Failed to create notification, but quote was submitted successfully:', notificationError);
          // Don't fail the entire submission if notification fails
        }

        toast.success('Quote submitted successfully!');
        
        if (onSuccess) {
          onSuccess();
        } else {
          setSubmitted(true);
        }
      } catch (quoteError: any) {
        console.error('Error submitting quote to database:', quoteError);
        
        // Handle specific duplicate submission error
        if (quoteError.message && quoteError.message.includes('already submitted an offer')) {
          toast.error('You have already submitted a quote for this request. Please refresh the page to see your existing quote.');
        } else if (quoteError.message && quoteError.message.includes('timeout')) {
          toast.error('Quote submission timed out. Please check your connection and try again.');
        } else {
          toast.error(`Failed to submit quote: ${quoteError.message}`);
        }
        
        setIsSubmitting(false);
        return;
      }
    } catch (error: any) {
      console.error('Unexpected error in quote submission:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
      setAttachmentUploading(false);
    }
  };

  const selectedCurrency = currencies.find(c => c.code === currency);
  const commission = price ? (parseFloat(price) * 0.03) : 0;
  const totalPrice = price ? (parseFloat(price) + commission) : 0;

  if (submitted) {
    return (
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 2,
          bgcolor: 'success.50',
          borderColor: 'success.main'
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
        <Typography variant="h6" color="success.main" gutterBottom>
          Quote Submitted Successfully!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your quote has been sent to the client. You'll be notified when they respond.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 4, 
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}
    >
      {/* Header with operator logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        {operatorProfile?.photoURL ? (
          <Avatar 
            src={operatorProfile.photoURL} 
            alt={operatorProfile.companyName || operatorProfile.company || 'Operator Logo'}
            sx={{ width: 48, height: 48 }}
          />
        ) : (
          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
            <BusinessIcon />
          </Avatar>
        )}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalOfferIcon color="primary" />
            Submit Your Quote
          </Typography>
          {operatorProfile && (
            <Typography variant="body2" color="text.secondary">
              {operatorProfile.companyName || operatorProfile.company || `${operatorProfile.firstName} ${operatorProfile.lastName}`}
            </Typography>
          )}
        </Box>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Provide your price for this flight request. A 3% commission will be added to your price for the client.
      </Typography>

            <Stack spacing={4}>
        {/* Section 1: Price */}
        <Paper variant="outlined" elevation={0} sx={{ p: 3, boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <AttachMoneyIcon color="primary" />
            <Typography variant="h6" fontWeight="medium">
              1. Price Information
            </Typography>
          </Box>
          
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={currency}
                  label="Currency"
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {currencies.map((curr) => (
                    <MenuItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label={`Your Price (${currency})`}
                value={price}
                onChange={handlePriceChange}
                error={!!priceError}
                helperText={priceError}
                fullWidth
                placeholder="Enter your base price"
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>{selectedCurrency?.symbol}</Typography>,
                }}
              />
            </Box>

            {price && !priceError && parseFloat(price) > 0 && (
              <Paper variant="outlined" elevation={0} sx={{ p: 2, bgcolor: 'grey.50', boxShadow: 'none' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Price Breakdown:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Your Price:</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedCurrency?.symbol}{parseFloat(price).toLocaleString()} {currency}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Charter Commission (3%):</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {selectedCurrency?.symbol}{commission.toLocaleString()} {currency}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight="bold">Client Total:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {selectedCurrency?.symbol}{totalPrice.toLocaleString()} {currency}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}
          </Stack>
        </Paper>

        {/* Section 2: Aircraft Selection */}
        <Paper variant="outlined" elevation={0} sx={{ p: 3, boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <AirplanemodeActiveIcon color="primary" />
            <Typography variant="h6" fontWeight="medium">
              2. Aircraft Selection
            </Typography>
            <Typography variant="body2" sx={{ color: 'error.main', ml: 1 }}>*</Typography>
          </Box>
          
          {isLoadingAircraft ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Loading your aircraft fleet...
              </Typography>
            </Box>
          ) : aircraft.length === 0 ? (
            <Paper variant="outlined" elevation={0} sx={{ p: 3, bgcolor: 'grey.50', textAlign: 'center', boxShadow: 'none' }}>
              <AirplanemodeActiveIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No active aircraft found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please add aircraft to your fleet first to submit quotes.
              </Typography>
            </Paper>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select the aircraft you'll use for this flight
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedAircraftId}
                  onChange={(e) => setSelectedAircraftId(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>Select an aircraft...</em>
                  </MenuItem>
                  {aircraft.map((ac) => (
                    <MenuItem key={ac.id} value={ac.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                        <AirplanemodeActiveIcon fontSize="small" color="primary" />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {ac.registration} - {ac.make} {ac.model}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ac.type} • Max {ac.specifications?.maxPassengers || 0} passengers
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </Paper>

        {/* Section 3: Notes & Comments */}
        <Paper variant="outlined" elevation={0} sx={{ p: 3, boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <NotesIcon color="primary" />
            <Typography variant="h6" fontWeight="medium">
              3. Notes & Comments
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>(Optional)</Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add any additional information, terms, or special conditions for your quote
          </Typography>
          
          <TextField
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={4}
            fullWidth
            placeholder="e.g., Special catering available, flexible departure times, additional services included..."
            variant="outlined"
          />
        </Paper>

        {/* Section 4: Attachment Uploads */}
        <Paper variant="outlined" elevation={0} sx={{ p: 3, boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <AttachFileIcon color="primary" />
            <Typography variant="h6" fontWeight="medium">
              4. Supporting Documents
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>(Optional)</Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload up to 5 PDF documents to support your quote (max 3MB each, visible to you and admin only)
          </Typography>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAttachmentSelect}
            accept=".pdf"
            multiple
            style={{ display: 'none' }}
          />
          
          {attachments.length > 0 ? (
            <Stack spacing={2}>
              {attachments.map((file, index) => (
                <Paper key={index} variant="outlined" elevation={0} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, boxShadow: 'none' }}>
                  <DescriptionIcon color="primary" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </Typography>
                  </Box>
                  <IconButton onClick={() => handleRemoveAttachment(index)} size="small">
                    <CloseIcon />
                  </IconButton>
                </Paper>
              ))}
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                {attachments.length < 5 && (
                  <Button
                    variant="outlined"
                    startIcon={<AttachFileIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ borderStyle: 'dashed' }}
                  >
                    Add More Files ({attachments.length}/5)
                  </Button>
                )}
                <Button
                  variant="text"
                  color="error"
                  onClick={handleClearAllAttachments}
                  size="small"
                >
                  Clear All
                </Button>
              </Box>
            </Stack>
          ) : (
            <Button
              variant="outlined"
              startIcon={<AttachFileIcon />}
              onClick={() => fileInputRef.current?.click()}
              fullWidth
              sx={{ borderStyle: 'dashed', py: 2 }}
            >
              Choose PDF Files (up to 5)
            </Button>
          )}
        </Paper>

        {/* Section 5: Submission */}
        <Paper variant="outlined" elevation={0} sx={{ p: 3, bgcolor: 'primary.50', boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <SendIcon color="primary" />
            <Typography variant="h6" fontWeight="medium">
              5. Submit Your Quote
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Review your quote details above and submit when ready. The client will receive your quote for review.
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            {price && !priceError && parseFloat(price) > 0 && (
              <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ textAlign: 'center' }}>
                Client Total: {selectedCurrency?.symbol}{totalPrice.toLocaleString()} {currency}
              </Typography>
            )}
          </Box>
          
          <Stack spacing={2}>
            {(attachmentUploading || isSubmitting) && attachments.length > 0 && (
              <Button
                variant="outlined"
                onClick={handleCheckUploadStatus}
                disabled={isCheckingStatus}
                startIcon={isCheckingStatus ? <CircularProgress size={20} /> : <AttachFileIcon />}
                size="medium"
                sx={{ alignSelf: 'center' }}
              >
                {isCheckingStatus ? 'Checking...' : 'Check Upload Status'}
              </Button>
            )}
            
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!price || !!priceError || parseFloat(price) <= 0 || !selectedAircraftId || isSubmitting || attachmentUploading}
              startIcon={(isSubmitting || attachmentUploading) ? <CircularProgress size={20} /> : <SendIcon />}
              size="large"
              fullWidth
              sx={{ py: 1.5 }}
            >
              {attachmentUploading ? 'Uploading...' : isSubmitting ? 'Submitting...' : 'Submit Quote'}
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
};

interface QuoteRequestDetailsProps {
  request: QuoteRequest;
  onAcceptOffer?: (offer: Offer) => Promise<void>;
  onRejectOffer?: (offer: Offer) => Promise<void>;
  onQuoteSubmitted?: () => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
}

// Memoized Map component to prevent unnecessary re-renders
const MemoizedMap = React.memo(Map);

const QuoteRequestDetails: React.FC<QuoteRequestDetailsProps> = ({ 
  request, 
  onAcceptOffer, 
  onRejectOffer, 
  onQuoteSubmitted,
  isAccepting = false, 
  isRejecting = false 
}) => {
  const { user } = useAuth();
  const [departureAirport, setDepartureAirport] = useState<Airport | null>(null);
  const [arrivalAirport, setArrivalAirport] = useState<Airport | null>(null);
  const [departureImageUrl, setDepartureImageUrl] = useState<string | null>(null);
  const [arrivalImageUrl, setArrivalImageUrl] = useState<string | null>(null);
  const [multiCityAirports, setMultiCityAirports] = useState<Airport[]>([]);
  const [multiCityImages, setMultiCityImages] = useState<(string | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price' | 'date' | 'status'>('price');
  const [selectedQuote, setSelectedQuote] = useState<Offer | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [processingOfferIds, setProcessingOfferIds] = useState<Set<string>>(new Set());
  const isReturn = request.tripType === 'return';
  const isMultiCity = request.tripType === 'multiCity';
  const flightDetailsRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Determine if current user is an operator
  const isOperatorView = user?.role === 'operator';
  // Determine if current user is a client (passenger or agent)
  const isClientView = user?.role === 'passenger' || user?.role === 'agent';

  // Memoize multi-city locations to prevent unnecessary re-calculations
  const multiCityLocations = useMemo(() => {
    if (!isMultiCity || multiCityAirports.length === 0) return undefined;
    return multiCityAirports.map(airport => ({
      lat: airport.latitude,
      lng: airport.longitude,
      name: airport.name
    }));
  }, [isMultiCity, multiCityAirports]);

  // Memoize departure location to prevent unnecessary re-renders
  const departureLocation = useMemo(() => {
    if (!departureAirport) return null;
    return {
      lat: departureAirport.latitude,
      lng: departureAirport.longitude,
      name: departureAirport.name
    };
  }, [departureAirport]);

  // Memoize arrival location to prevent unnecessary re-renders
  const arrivalLocation = useMemo(() => {
    if (!arrivalAirport) return null;
    return {
      lat: arrivalAirport.latitude,
      lng: arrivalAirport.longitude,
      name: arrivalAirport.name
    };
  }, [arrivalAirport]);

  // Memoize return location to prevent unnecessary re-renders
  const returnLocation = useMemo(() => {
    if (!isReturn || !departureAirport) return undefined;
    return {
      lat: departureAirport.latitude,
      lng: departureAirport.longitude,
      name: departureAirport.name
    };
  }, [isReturn, departureAirport]);

  // Add useEffect to adjust map height
  useEffect(() => {
    const adjustMapHeight = () => {
      if (flightDetailsRef.current && mapContainerRef.current) {
        const detailsHeight = flightDetailsRef.current.offsetHeight;
        // Only set explicit height on desktop (md breakpoint and above)
        if (window.innerWidth >= 900) {
          mapContainerRef.current.style.height = `${detailsHeight}px`;
        } else {
          mapContainerRef.current.style.height = '320px'; // Mobile default height
        }
      }
    };

    // Use a timeout to ensure DOM is fully rendered before measuring
    const timeoutId = setTimeout(() => {
      adjustMapHeight();
    }, 100);

    // Also adjust on window resize
    window.addEventListener('resize', adjustMapHeight);

    // Clean up
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', adjustMapHeight);
    };
  }, [isReturn, isMultiCity]); // Removed 'loading' dependency to prevent circular dependency

  // Additional useEffect to adjust height when content changes
  useEffect(() => {
    const adjustMapHeight = () => {
      if (flightDetailsRef.current && mapContainerRef.current) {
        const detailsHeight = flightDetailsRef.current.offsetHeight;
        if (window.innerWidth >= 900) {
          mapContainerRef.current.style.height = `${detailsHeight}px`;
        }
      }
    };

    // Use ResizeObserver to detect when the flight details container changes size
    let resizeObserver: ResizeObserver | null = null;
    
    if (flightDetailsRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        adjustMapHeight();
      });
      resizeObserver.observe(flightDetailsRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [request, multiCityAirports]); // Removed 'loading' dependency to prevent circular dependency

  useEffect(() => {
    const loadAirportDetails = async () => {
      setLoading(true);
      try {
        if (isMultiCity && request.multiCityRoutes && request.multiCityRoutes.length > 0) {
          // Handle multi-city routes
          const airports: Airport[] = [];
          const images: (string | null)[] = [];
          const processedCities = new Set<string>();
          
          // For Leg 1, add both departure and arrival airports
          try {
            const firstRoute = request.multiCityRoutes[0];
            
            // Add departure airport of first leg
            const departureAirport = await getAirportByICAO(firstRoute.departureAirport);
            if (departureAirport) {
              airports.push(departureAirport);
              processedCities.add(firstRoute.departureAirport);
              const depImage = await getCityImageUrlWithFallback(departureAirport);
              images.push(depImage);
            }
            
            // Add arrival airport of first leg
            const arrivalAirport = await getAirportByICAO(firstRoute.arrivalAirport);
            if (arrivalAirport) {
              airports.push(arrivalAirport);
              processedCities.add(firstRoute.arrivalAirport);
              const arrImage = await getCityImageUrlWithFallback(arrivalAirport);
              images.push(arrImage);
            }
          } catch (err) {
            console.error("Error loading first leg airports:", err);
          }
          
          // For subsequent legs, add only arrival airports
          for (let i = 1; i < request.multiCityRoutes.length; i++) {
            try {
              const route = request.multiCityRoutes[i];
              const arrivalAirport = await getAirportByICAO(route.arrivalAirport);
              if (arrivalAirport) {
                airports.push(arrivalAirport);
                processedCities.add(route.arrivalAirport);
                const arrImage = await getCityImageUrlWithFallback(arrivalAirport);
                images.push(arrImage);
              }
            } catch (err) {
              console.error("Error loading arrival airport:", err);
            }
          }
          
          setMultiCityAirports(airports.filter(Boolean) as Airport[]);
          setMultiCityImages(images.filter(Boolean) as string[]);
          
          // Also set first and last airports for map display
          if (airports.length >= 2) {
            setDepartureAirport(airports[0]);
            setArrivalAirport(airports[airports.length - 1]);
            setDepartureImageUrl(images[0]);
            setArrivalImageUrl(images[images.length - 1]);
          }
        } else {
          // Handle one-way and return flights
          const [dep, arr] = await Promise.all([
            getAirportByICAO(request.routing.departureAirport),
            getAirportByICAO(request.routing.arrivalAirport)
          ]);
          
          setDepartureAirport(dep);
          setArrivalAirport(arr);

          // Fetch city images in parallel
          const [depImageUrl, arrImageUrl] = await Promise.all([
            getCityImageUrlWithFallback(dep),
            getCityImageUrlWithFallback(arr)
          ]);

          setDepartureImageUrl(depImageUrl);
          setArrivalImageUrl(arrImageUrl);
        }
      } catch (error) {
        console.error("Error loading airport details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAirportDetails();
  }, [request, isMultiCity]);

  const formatAirportDisplay = (airportName: string | null | undefined, airportCode: string) => {
    // If we have an airport name and it's different from the code, show "Name (CODE)"
    if (airportName && airportName.trim() !== '' && airportName !== airportCode) {
      return `${airportName} (${airportCode})`;
    }
    // Otherwise, just show the airport code
    return airportCode;
  };

  const getTripTypeIcon = () => {
    switch (request.tripType) {
      case 'oneWay':
        return <ArrowForwardIcon />;
      case 'return':
        return <SwapHorizIcon />;
      case 'multiCity':
        return <MultipleStopIcon />;
      default:
        return <ArrowForwardIcon />;
    }
  };

  // Helper to format trip type for display
  const formatTripType = (tripType: string) => {
    switch (tripType) {
      case 'oneWay':
        return 'One Way';
      case 'return':
        return 'Return';
      case 'multiCity':
        return 'Multi-City';
      default:
        return tripType;
    }
  };

  // Helper to get color for offer status
  const getOfferStatusColor = (status: string) => {
    if (status === 'accepted-by-client') return 'success';
    if (status === 'rejected-by-client' || status === 'expired') return 'error';
    return 'primary';
  };

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Date not available';
    
    // Handle Firestore Timestamp
    if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
      return timestamp.toDate().toLocaleDateString();
    }
    
    // Handle JavaScript Date
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    
    // Handle string or number timestamp
    try {
      return new Date(timestamp).toLocaleDateString();
    } catch (e) {
      return 'Date not available';
    }
  };

  // Sort offers function
  const getSortedOffers = () => {
    if (!request.offers) return [];
    
    const offers = [...request.offers];
    
    switch (sortBy) {
      case 'price':
        return offers.sort((a, b) => a.totalPrice - b.totalPrice);
      case 'date':
        return offers.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt as any);
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
          return bTime.getTime() - aTime.getTime(); // Most recent first
        });
      case 'status':
        return offers.sort((a, b) => {
          const statusOrder = {
            'pending-client-acceptance': 1,
            'accepted-by-client': 2,
            'awaiting-acknowledgement': 3,
            'rejected-by-client': 4,
            'expired': 5
          };
          return (statusOrder[a.offerStatus] || 6) - (statusOrder[b.offerStatus] || 6);
        });
      default:
        return offers;
    }
  };

  // Quote modal handlers
  const handleQuoteClick = (offer: Offer) => {
    setSelectedQuote(offer);
    setQuoteModalOpen(true);
  };

  const handleCloseQuoteModal = () => {
    setQuoteModalOpen(false);
    setSelectedQuote(null);
  };

  const handleAcceptQuote = async (offer: Offer) => {
    if (!onAcceptOffer) return;
    
    setProcessingOfferIds(prev => new Set(prev).add(offer.offerId));
    try {
      await onAcceptOffer(offer);
      setQuoteModalOpen(false);
      setSelectedQuote(null);
    } catch (error) {
      console.error('Error accepting quote:', error);
    } finally {
      setProcessingOfferIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(offer.offerId);
        return newSet;
      });
    }
  };

  const handleRejectQuote = async (offer: Offer) => {
    if (!onRejectOffer) return;
    
    setProcessingOfferIds(prev => new Set(prev).add(offer.offerId));
    try {
      await onRejectOffer(offer);
      setQuoteModalOpen(false);
      setSelectedQuote(null);
    } catch (error) {
      console.error('Error rejecting quote:', error);
    } finally {
      setProcessingOfferIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(offer.offerId);
        return newSet;
      });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* City Images */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: { xs: 2, md: isReturn ? 1 : isMultiCity ? 1 : 2 },
        mb: 2,
        flexWrap: 'wrap'
      }}>
        {isMultiCity && multiCityAirports.length > 0 ? (
          // Multi-city images
          multiCityAirports.map((airport, index) => {
            const imageUrl = multiCityImages[index] || null;
            const label = String.fromCharCode(65 + index); // A, B, C, D, etc.
            
            return (
              <Box 
                key={`city-${index}`} 
                sx={{ 
                  flex: { 
                    xs: '1 1 100%', 
                    md: multiCityImages.length <= 2 
                      ? '1 1 calc(50% - 8px)' 
                      : multiCityImages.length <= 3 
                        ? '1 1 calc(33% - 8px)' 
                        : multiCityImages.length <= 4
                          ? '1 1 calc(25% - 8px)'
                          : '1 1 calc(20% - 8px)'
                  },
                  minWidth: { 
                    xs: '100%', 
                    md: multiCityImages.length <= 2 
                      ? '45%' 
                      : multiCityImages.length <= 3 
                        ? '30%' 
                        : multiCityImages.length <= 4
                          ? '22%'
                          : '18%'
                  },
                  maxWidth: { 
                    md: multiCityImages.length <= 2 
                      ? '50%' 
                      : multiCityImages.length <= 3 
                        ? '33%' 
                        : multiCityImages.length <= 4
                          ? '25%'
                          : '20%'
                  },
                  mb: { xs: 2, md: 0 }
                }}
              >
                <Box 
                  sx={{ 
                    position: 'relative', 
                    height: multiCityImages.length <= 3 ? 180 : 160,
                    borderRadius: 2, 
                    overflow: 'hidden',
                    backgroundColor: 'grey.200',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(11, 55, 70, 0.2)', // Brand primary color with opacity
                      zIndex: 1,
                    }
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress />
                    </Box>
                  ) : imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={airport?.city || ''}
                      fill
                      sizes={`(max-width: 768px) 100vw, ${
                        multiCityImages.length <= 2 ? '50vw' : 
                        multiCityImages.length <= 3 ? '33vw' : 
                        multiCityImages.length <= 4 ? '25vw' : '20vw'
                      }`}
                      style={{ 
                        objectFit: 'cover',
                        objectPosition: 'center',
                        filter: 'saturate(1.2) contrast(1.1)',
                        transition: 'transform 0.5s ease-in-out',
                      }}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography variant="caption">Image not available</Typography>
                    </Box>
                  )}
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      right: 0, 
                      padding: 2,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                      color: 'white',
                      zIndex: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: 'transparent',
                        color: 'white',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: '2px solid white',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        lineHeight: 1,
                        textAlign: 'center'
                      }}>{label}</Box>
                      <Box sx={{ color: 'white', display: 'flex', flexDirection: 'column' }}>
                        {airport?.city || airport?.name || ''}
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                          {index === 0 ? 'Leg 1 Departure' : 
                           index === 1 ? 'Leg 1 Destination' :
                           index === 2 ? 'Leg 2 Destination' :
                           index === 3 ? 'Leg 3 Destination' :
                           index === 4 ? 'Leg 4 Destination' :
                           `Leg ${index - 1} Destination`}
                        </Typography>
                      </Box>
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })
        ) : (
          // One-way or return flight images
          <>
            {/* Departure City */}
            <Box sx={{ flex: 1, minWidth: isReturn ? { xs: '100%', md: '30%' } : { xs: '100%', md: '48%' } }}>
              <Box 
                sx={{ 
                  position: 'relative', 
                  height: 200, 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  backgroundColor: 'grey.200',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(11, 55, 70, 0.2)', // Brand primary color with opacity
                    zIndex: 1,
                  }
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : departureImageUrl ? (
                  <Image
                    src={departureImageUrl}
                    alt={departureAirport?.city || request.routing.departureAirport}
                    fill
                    sizes={isReturn ? "(max-width: 768px) 100vw, 33vw" : "(max-width: 768px) 100vw, 50vw"}
                    style={{ 
                      objectFit: 'cover',
                      objectPosition: 'center',
                      filter: 'saturate(1.2) contrast(1.1)',
                      transition: 'transform 0.5s ease-in-out',
                    }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="caption">Image not available</Typography>
                  </Box>
                )}
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    padding: 2,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                    color: 'white',
                    zIndex: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: 'transparent',
                      color: 'white',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: '2px solid white',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      lineHeight: 1,
                      textAlign: 'center'
                    }}>A</Box>
                    <Box sx={{ color: 'white', display: 'flex', flexDirection: 'column' }}>
                      {departureAirport?.city || request.routing.departureAirportName?.split('(')[0] || request.routing.departureAirport}
                      {isReturn && (
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                          Departure
                        </Typography>
                      )}
                    </Box>
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Arrival City */}
            <Box sx={{ flex: 1, minWidth: isReturn ? { xs: '100%', md: '30%' } : { xs: '100%', md: '48%' } }}>
              <Box 
                sx={{ 
                  position: 'relative', 
                  height: 200, 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  backgroundColor: 'grey.200',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(11, 55, 70, 0.2)', // Brand primary color with opacity
                    zIndex: 1,
                  }
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : arrivalImageUrl ? (
                  <Image
                    src={arrivalImageUrl}
                    alt={arrivalAirport?.city || request.routing.arrivalAirport}
                    fill
                    sizes={isReturn ? "(max-width: 768px) 100vw, 33vw" : "(max-width: 768px) 100vw, 50vw"}
                    style={{ 
                      objectFit: 'cover',
                      objectPosition: 'center',
                      filter: 'saturate(1.2) contrast(1.1)',
                      transition: 'transform 0.5s ease-in-out',
                    }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="caption">Image not available</Typography>
                  </Box>
                )}
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    padding: 2,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                    color: 'white',
                    zIndex: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: 'transparent',
                      color: 'white',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: '2px solid white',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      lineHeight: 1,
                      textAlign: 'center'
                    }}>B</Box>
                    <Box sx={{ color: 'white', display: 'flex', flexDirection: 'column' }}>
                      {arrivalAirport?.city || request.routing.arrivalAirportName?.split('(')[0] || request.routing.arrivalAirport}
                      {isReturn && (
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                          Arrival / Return Departure
                        </Typography>
                      )}
                    </Box>
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {/* Return City (same as departure city) - Only shown for return flights */}
            {isReturn && (
              <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '30%' } }}>
                <Box 
                  sx={{ 
                    position: 'relative', 
                    height: 200, 
                    borderRadius: 2, 
                    overflow: 'hidden',
                    backgroundColor: 'grey.200',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(11, 55, 70, 0.2)', // Brand primary color with opacity
                      zIndex: 1,
                    }
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress />
                    </Box>
                  ) : departureImageUrl ? (
                    <Image
                      src={departureImageUrl}
                      alt={departureAirport?.city || request.routing.departureAirport}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{ 
                        objectFit: 'cover',
                        objectPosition: 'center',
                        filter: 'saturate(1.2) contrast(1.1)',
                        transition: 'transform 0.5s ease-in-out',
                      }}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography variant="caption">Image not available</Typography>
                    </Box>
                  )}
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      right: 0, 
                      padding: 2,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                      color: 'white',
                      zIndex: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: 'transparent',
                        color: 'white',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: '2px solid white',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        lineHeight: 1,
                        textAlign: 'center'
                      }}>C</Box>
                      <Box sx={{ color: 'white', display: 'flex', flexDirection: 'column' }}>
                        {departureAirport?.city || request.routing.departureAirportName?.split('(')[0] || request.routing.departureAirport}
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                          Return Arrival
                        </Typography>
                      </Box>
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Request Details Card */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        {/* Trip Type */}
        <Box sx={{ mb: 3 }}>
          <ToggleButtonGroup
            value={request.tripType}
            exclusive
            disabled
            sx={{ 
              display: 'flex', 
              justifyContent: 'flex-start', 
              gap: 1,
              '& .MuiToggleButtonGroup-grouped': {
                border: 'none',
                '&:not(:first-of-type)': {
                  borderRadius: 1,
                  borderLeft: 'none',
                },
                '&:first-of-type': {
                  borderRadius: 1,
                }
              }
            }}
          >
            <ToggleButton 
              value="oneWay"
              sx={{ 
                textTransform: 'none', 
                fontFamily: 'inherit', 
                borderRadius: 1, 
                px: 2,
                opacity: request.tripType === 'oneWay' ? 1 : 0.5,
                '&.Mui-disabled': {
                  color: request.tripType === 'oneWay' ? 'primary.main' : 'text.secondary',
                  borderColor: request.tripType === 'oneWay' ? 'transparent' : 'transparent'
                },
                border: 'none'
              }}
            >
              <ArrowForwardIcon />
              <Typography sx={{ ml: 1, fontFamily: 'inherit' }}>One Way</Typography>
            </ToggleButton>
            <ToggleButton 
              value="return"
              sx={{ 
                textTransform: 'none', 
                fontFamily: 'inherit', 
                borderRadius: 1, 
                px: 2,
                opacity: request.tripType === 'return' ? 1 : 0.5,
                '&.Mui-disabled': {
                  color: request.tripType === 'return' ? 'primary.main' : 'text.secondary',
                  borderColor: request.tripType === 'return' ? 'transparent' : 'transparent'
                },
                border: 'none'
              }}
            >
              <SwapHorizIcon />
              <Typography sx={{ ml: 1, fontFamily: 'inherit' }}>Return</Typography>
            </ToggleButton>
            <ToggleButton 
              value="multiCity"
              sx={{ 
                textTransform: 'none', 
                fontFamily: 'inherit', 
                borderRadius: 1, 
                px: 2,
                opacity: request.tripType === 'multiCity' ? 1 : 0.5,
                '&.Mui-disabled': {
                  color: request.tripType === 'multiCity' ? 'primary.main' : 'text.secondary',
                  borderColor: request.tripType === 'multiCity' ? 'transparent' : 'transparent'
                },
                border: 'none'
              }}
            >
              <MultipleStopIcon />
              <Typography sx={{ ml: 1, fontFamily: 'inherit' }}>Multi-city</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Main Flight Details with Map */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: { xs: 3, md: 3 },
          mb: 4,
          position: 'relative'
        }}>
          {/* Flight Details */}
          <Box 
            ref={flightDetailsRef}
            sx={{ 
              flex: { xs: '1 1 100%', md: '0 0 45%' }, 
              maxWidth: { md: '45%' },
              display: 'flex', 
              flexDirection: 'column'
            }}
          >
            {isMultiCity && request.multiCityRoutes && request.multiCityRoutes.length > 0 ? (
              // Multi-city legs
              request.multiCityRoutes.map((route, index) => (
                <React.Fragment key={`leg-${index}`}>
                  {/* Show arrow between legs */}
                  {index > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                      <ArrowDownwardIcon color="primary" />
                    </Box>
                  )}
                  
                  {/* Leg box */}
                  <Box 
                    sx={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: 2, 
                      p: 2, 
                      mb: index < (request.multiCityRoutes?.length || 0) - 1 ? 2 : 0,
                      backgroundColor: 'background.paper'
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, color: 'primary.main' }}>
                      Leg {index + 1}
                    </Typography>
                    
                    <Box sx={{ pl: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <FlightTakeoffIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                        <Typography variant="body2">
                          {formatAirportDisplay(route.departureAirportName, route.departureAirport)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <FlightLandIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                        <Typography variant="body2">
                          {formatAirportDisplay(route.arrivalAirportName, route.arrivalAirport)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <EventIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                        <Typography variant="body2">
                          {formatDate(route.departureDate)}
                          {route.flexibleDate && " (Flexible)"}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <PersonOutlineIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                        <Typography variant="body2">{request.passengerCount} Passenger{request.passengerCount !== 1 ? 's' : ''}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </React.Fragment>
              ))
            ) : (
              // One-way or return flight
              <>
                {/* Leg 1 */}
                <Box 
                  sx={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 2, 
                    p: 2, 
                    mb: isReturn ? 2 : 0,
                    backgroundColor: 'background.paper'
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, color: 'primary.main' }}>
                    Leg 1
                  </Typography>
                  
                  <Box sx={{ pl: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <FlightTakeoffIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                      <Typography variant="body2">
                        {formatAirportDisplay(request.routing.departureAirportName, request.routing.departureAirport)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <FlightLandIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                      <Typography variant="body2">
                        {formatAirportDisplay(request.routing.arrivalAirportName, request.routing.arrivalAirport)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <EventIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                      <Typography variant="body2">
                        {formatDate(request.routing.departureDate)}
                        {request.routing.flexibleDates && " (Flexible)"}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <PersonOutlineIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                      <Typography variant="body2">{request.passengerCount} Passenger{request.passengerCount !== 1 ? 's' : ''}</Typography>
                    </Box>
                  </Box>
                </Box>
                
                {/* Arrow between legs - Only shown for return flights */}
                {isReturn && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                    <ArrowDownwardIcon color="primary" />
                  </Box>
                )}
                
                {/* Leg 2 - Only shown for return flights */}
                {isReturn && request.routing.returnDate && (
                  <Box 
                    sx={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: 2, 
                      p: 2,
                      backgroundColor: 'background.paper'
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, color: 'primary.main' }}>
                      Leg 2
                    </Typography>
                    
                    <Box sx={{ pl: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <FlightTakeoffIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                        <Typography variant="body2">
                          {formatAirportDisplay(request.routing.arrivalAirportName, request.routing.arrivalAirport)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <FlightLandIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                        <Typography variant="body2">
                          {formatAirportDisplay(request.routing.departureAirportName, request.routing.departureAirport)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <EventIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                        <Typography variant="body2">
                          {formatDate(request.routing.returnDate)}
                          {request.routing.flexibleDates && " (Flexible)"}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <PersonOutlineIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                        <Typography variant="body2">{request.passengerCount} Passenger{request.passengerCount !== 1 ? 's' : ''}</Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* Flight Route Map */}
          <Box 
            ref={mapContainerRef}
            sx={{ 
              flex: { xs: '1 1 100%', md: '0 0 55%' },
              maxWidth: { md: '55%' },
              height: { xs: '320px', md: 'auto' },
              border: '1px solid #e0e0e0', 
              borderRadius: 2,
              overflow: 'hidden',
              mt: { xs: 0, md: 0 },
              display: 'flex',
              alignItems: 'stretch',
              position: 'relative'
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (departureLocation && arrivalLocation) ? (
              <Box sx={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <MemoizedMap 
                  departureLocation={departureLocation!}
                  arrivalLocation={arrivalLocation!}
                  returnLocation={returnLocation}
                  isReturn={isReturn}
                  isMultiCity={isMultiCity}
                  multiCityLocations={multiCityLocations}
                  height="100%"
                  width="100%"
                  disableInteraction={true}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
                <Typography variant="caption">Map not available - airport coordinates missing</Typography>
              </Box>
            )}
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />

        {/* Additional Options */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Additional Options
          </Typography>
          
          {/* Aircraft Options */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 'medium',
              }}
            >
              <FlightTakeoffIcon fontSize="small" />
              Aircraft Options
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ ml: 1 }}>
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  opacity: request.twinEngineMin ? 1 : 0.5,
                  transition: 'opacity 0.2s ease'
                }}>
                  {request.twinEngineMin ? (
                    <CheckCircleIcon sx={{ color: brandColors.primary }} fontSize="small" />
                  ) : (
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      border: '2px solid',
                      borderColor: 'text.disabled',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                  )}
                  <Typography variant="body2" color={request.twinEngineMin ? 'textPrimary' : 'text.disabled'}>
                    Twin Engine Minimum
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  opacity: request.pressurisedCabin ? 1 : 0.5,
                  transition: 'opacity 0.2s ease'
                }}>
                  {request.pressurisedCabin ? (
                    <CheckCircleIcon sx={{ color: brandColors.primary }} fontSize="small" />
                  ) : (
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      border: '2px solid',
                      borderColor: 'text.disabled',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                  )}
                  <Typography variant="body2" color={request.pressurisedCabin ? 'textPrimary' : 'text.disabled'}>
                    Pressurised Cabin
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  opacity: request.twoCrewMin ? 1 : 0.5,
                  transition: 'opacity 0.2s ease'
                }}>
                  {request.twoCrewMin ? (
                    <CheckCircleIcon sx={{ color: brandColors.primary }} fontSize="small" />
                  ) : (
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      border: '2px solid',
                      borderColor: 'text.disabled',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                  )}
                  <Typography variant="body2" color={request.twoCrewMin ? 'textPrimary' : 'text.disabled'}>
                    Two Crew Minimum
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
          
          {/* Baggage Options */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 'medium',
              }}
            >
              <LuggageIcon fontSize="small" />
              Baggage Options
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ ml: 1 }}>
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  opacity: request.hasExtraBaggage ? 1 : 0.5,
                  transition: 'opacity 0.2s ease'
                }}>
                  {request.hasExtraBaggage ? (
                    <CheckCircleIcon sx={{ color: brandColors.primary }} fontSize="small" />
                  ) : (
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      border: '2px solid',
                      borderColor: 'text.disabled',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                  )}
                  <Typography variant="body2" color={request.hasExtraBaggage ? 'textPrimary' : 'text.disabled'}>
                    Extra Baggage
                  </Typography>
                </Box>
                {request.hasExtraBaggage && request.baggageDetails && (
                  <Typography variant="caption" sx={{ ml: 3, display: 'block' }}>
                    {request.baggageDetails}
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  opacity: request.hasPets ? 1 : 0.5,
                  transition: 'opacity 0.2s ease'
                }}>
                  {request.hasPets ? (
                    <CheckCircleIcon sx={{ color: brandColors.primary }} fontSize="small" />
                  ) : (
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      border: '2px solid',
                      borderColor: 'text.disabled',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                  )}
                  <Typography variant="body2" color={request.hasPets ? 'textPrimary' : 'text.disabled'}>
                    Traveling with Pets
                  </Typography>
                </Box>
                {request.hasPets && request.petDetails && (
                  <Typography variant="caption" sx={{ ml: 3, display: 'block' }}>
                    {request.petDetails}
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  opacity: request.hasHardBags ? 1 : 0.5,
                  transition: 'opacity 0.2s ease'
                }}>
                  {request.hasHardBags ? (
                    <CheckCircleIcon sx={{ color: brandColors.primary }} fontSize="small" />
                  ) : (
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      border: '2px solid',
                      borderColor: 'text.disabled',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                  )}
                  <Typography variant="body2" color={request.hasHardBags ? 'textPrimary' : 'text.disabled'}>
                    Hard Bags
                  </Typography>
                </Box>
                {request.hasHardBags && request.hardBagsDetails && (
                  <Typography variant="caption" sx={{ ml: 3, display: 'block' }}>
                    {request.hardBagsDetails}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>
          
          {/* Additional Notes - Always show this section */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Additional Notes
            </Typography>
            <Paper 
              variant="outlined" 
              elevation={0}
              sx={{ 
                p: 2, 
                borderRadius: 1,
                boxShadow: 'none',
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="body2" color={request.additionalNotes ? 'text.primary' : 'text.secondary'}>
                {request.additionalNotes || 'No additional notes provided.'}
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Paper>

      {/* Quotes Section - Different content for operators vs clients */}
      <Box sx={{ mt: 4 }}>
        {isOperatorView ? (
          // Operator View: Show quote submission form
          <>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              Submit Your Quote
            </Typography>
            <OperatorQuoteForm request={request} onSuccess={onQuoteSubmitted} />
          </>
        ) : (
          // Client View: Show received quotes
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">
                Received Quotes
                {request.offers && request.offers.length > 0 && (
                  <Chip 
                    label={`${request.offers.length} quote${request.offers.length !== 1 ? 's' : ''}`}
                    size="small"
                    sx={{ ml: 2 }}
                    color="primary"
                  />
                )}
              </Typography>
              
              {/* Sort Controls */}
              {request.offers && request.offers.length > 1 && (
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="sort-select-label">Sort by</InputLabel>
                  <Select
                    labelId="sort-select-label"
                    value={sortBy}
                    label="Sort by"
                    onChange={(e) => setSortBy(e.target.value as 'price' | 'date' | 'status')}
                    startAdornment={<SortIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                  >
                    <MenuItem value="price">Price (Low to High)</MenuItem>
                    <MenuItem value="date">Date (Newest First)</MenuItem>
                    <MenuItem value="status">Status</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          </>
        )}

        {/* Only show quotes display for client view */}
        {isClientView && (
          <>
            {(!request.offers || request.offers.length === 0) ? (
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 4, 
                  textAlign: 'center', 
                  borderRadius: 2,
                  bgcolor: 'grey.50' 
                }}
              >
                <LocalOfferIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Quotes Received Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Operators will submit their quotes here. You'll be notified when new quotes arrive.
                </Typography>
              </Paper>
            ) : (
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)'
              },
              gap: 2
            }}
          >
            {getSortedOffers().map((offer: Offer, index: number) => (
              <Card 
                key={offer.offerId}
                elevation={2} 
                onClick={() => handleQuoteClick(offer)}
                sx={{ 
                  height: '100%',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    elevation: 4,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  },
                  border: offer.offerStatus === 'accepted-by-client' ? '2px solid' : '1px solid transparent',
                  borderColor: offer.offerStatus === 'accepted-by-client' ? 'success.main' : 'transparent'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Quote Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        <BusinessIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Quote #{index + 1}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {offer.operatorUserCode}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Status Chip */}
                    <Chip 
                      label={offer.offerStatus.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                      size="small" 
                      variant={offer.offerStatus === 'accepted-by-client' ? 'filled' : 'outlined'}
                      color={getOfferStatusColor(offer.offerStatus)}
                    />
                  </Box>

                  {/* Price Display */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      ${offer.totalPrice.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Base: ${offer.price.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Commission: ${offer.commission.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Quote Details */}
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Received: {formatDate(offer.createdAt)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {offer.offerId.split('-').slice(-1)[0]}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
          </>
        )}
      </Box>

      {/* Quote Details Modal - Only for client view */}
      {isClientView && (
        <Dialog 
        open={quoteModalOpen} 
        onClose={handleCloseQuoteModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <AirplaneTicketIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Quote Details
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedQuote?.offerId}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleCloseQuoteModal} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selectedQuote && (
            <Box sx={{ py: 2 }}>
              {/* Quote Header Info */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    ${selectedQuote.totalPrice.toLocaleString()}
                  </Typography>
                  <Chip 
                    label={selectedQuote.offerStatus.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                    variant={selectedQuote.offerStatus === 'accepted-by-client' ? 'filled' : 'outlined'}
                    color={getOfferStatusColor(selectedQuote.offerStatus)}
                    size="medium"
                  />
                </Box>
                
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Operator: {selectedQuote.operatorUserCode}
                </Typography>
              </Box>

              {/* Price Breakdown */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Price Breakdown
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1">Base Price:</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      ${selectedQuote.price.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1">Charter Commission (3%):</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      ${selectedQuote.commission.toLocaleString()}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight="bold">Total Price:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      ${selectedQuote.totalPrice.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Quote Information */}
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Quote Information
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Quote ID:</Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {selectedQuote.offerId}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Operator:</Typography>
                    <Typography variant="body2">
                      {selectedQuote.operatorUserCode}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Status:</Typography>
                    <Typography variant="body2">
                      {selectedQuote.offerStatus.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Received:</Typography>
                    <Typography variant="body2">
                      {formatDate(selectedQuote.createdAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Last Updated:</Typography>
                    <Typography variant="body2">
                      {formatDate(selectedQuote.updatedAt)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleCloseQuoteModal} variant="outlined">
            Close
          </Button>
          {selectedQuote?.offerStatus === 'pending-client-acceptance' && (
            <>
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => selectedQuote && handleRejectQuote(selectedQuote)}
                disabled={processingOfferIds.has(selectedQuote?.offerId || '') || isRejecting}
              >
                {processingOfferIds.has(selectedQuote?.offerId || '') ? 'Rejecting...' : 'Reject Quote'}
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => selectedQuote && handleAcceptQuote(selectedQuote)}
                disabled={processingOfferIds.has(selectedQuote?.offerId || '') || isAccepting}
              >
                {processingOfferIds.has(selectedQuote?.offerId || '') ? 'Accepting...' : 'Accept Quote'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      )}
    </Box>
  );
};

export default QuoteRequestDetails; 