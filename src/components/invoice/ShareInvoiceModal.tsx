import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface ShareInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceAmount: number;
  currency: string;
}

const ShareInvoiceModal: React.FC<ShareInvoiceModalProps> = ({
  open,
  onClose,
  invoiceId,
  invoiceAmount,
  currency,
}) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Get the current URL to share
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    // Show temporary success message
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleSendEmail = async () => {
    // Basic email validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // This would be replaced with an actual API call to send the email
      // For now, we'll just simulate the API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Invoice #{invoiceId}</DialogTitle>
      <DialogContent>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {email ? 'Email sent successfully!' : 'Link copied to clipboard!'}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body1" gutterBottom>
          Share invoice for {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(invoiceAmount)}
        </Typography>

        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Invoice Link:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              value={shareUrl}
              InputProps={{
                readOnly: true,
              }}
            />
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyLink}
              size="small"
            >
              Copy
            </Button>
          </Box>
        </Box>

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
          Share via Email:
        </Typography>
        <TextField
          fullWidth
          label="Recipient Email"
          variant="outlined"
          margin="normal"
          value={email}
          onChange={handleEmailChange}
          disabled={loading}
        />
        <TextField
          fullWidth
          label="Message (optional)"
          variant="outlined"
          margin="normal"
          multiline
          rows={3}
          value={message}
          onChange={handleMessageChange}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <EmailIcon />}
          onClick={handleSendEmail}
          disabled={loading || !email}
        >
          {loading ? 'Sending...' : 'Send Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareInvoiceModal; 