'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { Offer, QuoteRequest } from '@/types/flight';

interface SubmitOfferModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (price: number) => void;
  request: QuoteRequest | null;
}

const SubmitOfferModal: React.FC<SubmitOfferModalProps> = ({
  open,
  onClose,
  onSubmit,
  request,
}) => {
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError('Please enter a valid price.');
      return;
    }
    setError('');
    onSubmit(numericPrice);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and a single decimal point
    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
      setPrice(value);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Submit Your Offer</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          You are submitting an offer for request <strong>{request.requestCode}</strong>.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Route: {request.routing.departureAirport} → {request.routing.arrivalAirport}
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          id="price"
          label="Your Price (USD)"
          type="text"
          fullWidth
          variant="outlined"
          value={price}
          onChange={handlePriceChange}
          error={!!error}
          helperText={error}
          InputProps={{
            startAdornment: <Box sx={{ mr: 1 }}>$</Box>,
          }}
        />
        <Typography variant="caption" color="text.secondary">
          A 3% service fee will be added to this price for the client.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Submit Offer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubmitOfferModal; 