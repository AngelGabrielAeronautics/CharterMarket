'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/Calendar';
import { Box, Paper, Typography, Stack, Grid, Select, MenuItem, TextField, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, DialogProps, IconButton, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { AircraftAvailability } from '@/types/aircraft';
import { getAircraftAvailability, createAvailabilityBlock } from '@/lib/aircraft';
import { addDays, format } from 'date-fns';

interface AircraftAvailabilityProps {
  aircraftId: string;
}

export default function AircraftAvailabilityCalendar({ aircraftId }: AircraftAvailabilityProps) {
  const [availability, setAvailability] = useState<AircraftAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [blockType, setBlockType] = useState<'blocked' | 'maintenance' | 'charter'>('blocked');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadAvailability();
  }, [aircraftId]);

  const loadAvailability = async () => {
    try {
      const data = await getAircraftAvailability(aircraftId);
      setAvailability(data);
    } catch (err) {
      console.error('Error loading availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlock = async () => {
    if (selectedDates.length !== 2) {
      setError('Please select both start and end dates');
      return;
    }

    setIsAddingBlock(true);
    try {
      await createAvailabilityBlock({
        aircraftId,
        startDate: selectedDates[0],
        endDate: selectedDates[1],
        type: blockType,
        notes,
      });
      await loadAvailability();
      setSelectedDates([]);
      setNotes('');
      setBlockType('blocked');
    } catch (err) {
      console.error('Error adding availability block:', err);
      setError(err instanceof Error ? err.message : 'Failed to add availability block');
    } finally {
      setIsAddingBlock(false);
    }
  };

  const getDateClass = (date: Date) => {
    const classes = ['cursor-pointer hover:bg-gray-100 rounded-lg'];
    
    availability.forEach(block => {
      const start = block.startDate.toDate();
      const end = block.endDate.toDate();
      
      if (date >= start && date <= end) {
        switch (block.type) {
          case 'blocked':
            classes.push('bg-red-100 hover:bg-red-200');
            break;
          case 'maintenance':
            classes.push('bg-yellow-100 hover:bg-yellow-200');
            break;
          case 'charter':
            classes.push('bg-blue-100 hover:bg-blue-200');
            break;
        }
      }
    });

    if (selectedDates.some(d => d.toDateString() === date.toDateString())) {
      classes.push('bg-blue-500 text-white hover:bg-blue-600');
    }

    return classes.join(' ');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 384 }}>
        <CircularProgress color="primary" size={32} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h5" fontWeight="bold">Availability Calendar</Typography>
        <Dialog open={isAddingBlock} onClose={() => setIsAddingBlock(false)}>
          <DialogTitle>Add Availability Block</DialogTitle>
          <DialogContent>
            <Stack spacing={3} py={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" mb={1} display="block">Block Type</Typography>
                <Select
                  value={blockType}
                  onChange={e => setBlockType(e.target.value as 'blocked' | 'maintenance' | 'charter')}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="blocked">Blocked</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="charter">Charter</MenuItem>
                </Select>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" mb={1} display="block">Notes</Typography>
                <TextField
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  multiline
                  minRows={3}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setIsAddingBlock(false)} color="inherit">Cancel</Button>
            <Button
              onClick={handleAddBlock}
              disabled={isAddingBlock || selectedDates.length !== 2}
              variant="contained"
              color="primary"
            >
              {isAddingBlock ? 'Adding...' : 'Add Block'}
            </Button>
          </DialogActions>
        </Dialog>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddingBlock(true)}
        >
          Add Block
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      <Paper elevation={1} sx={{ borderRadius: 2, p: 2, mb: 4 }}>
        <Calendar
          mode="range"
          selected={selectedDates}
          onSelect={dates => setSelectedDates(dates || [])}
          numberOfMonths={2}
          disabled={{ before: new Date() }}
          classNames={{
            day: date => getDateClass(date),
          }}
        />
      </Paper>
      <Grid container spacing={3}>
        {availability.map((block) => (
          <Grid
            key={block.id}
            size={{
              xs: 12,
              md: 4
            }}>
            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor:
                  block.type === 'blocked' ? 'error.light' :
                  block.type === 'maintenance' ? 'warning.light' :
                  'info.light',
                bgcolor:
                  block.type === 'blocked' ? 'error.lighter' :
                  block.type === 'maintenance' ? 'warning.lighter' :
                  'info.lighter',
              }}
            >
              <Typography variant="subtitle1" fontWeight="medium" textTransform="capitalize">
                {block.type}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {format(block.startDate.toDate(), 'MMM d, yyyy')} - {format(block.endDate.toDate(), 'MMM d, yyyy')}
              </Typography>
              {block.notes && (
                <Typography variant="body2" color="text.secondary" mt={1}>{block.notes}</Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
} 