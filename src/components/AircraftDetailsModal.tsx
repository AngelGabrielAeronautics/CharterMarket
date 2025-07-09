'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ImageList,
  ImageListItem,
} from '@mui/material';
import { Button } from '@/components/ui/Button';
import {
  X,
  Edit3,
  Plane,
  Calendar,
  MapPin,
  Users,
  Fuel,
  Clock,
  Star,
  FileText,
  Settings,
} from 'lucide-react';
import { AircraftFormData, AircraftStatus, AircraftType } from '@/types/aircraft';
import { getImageUrl } from '@/utils/image-utils';

interface Aircraft extends AircraftFormData {
  id: string;
}

interface AircraftDetailsModalProps {
  aircraft: Aircraft | null;
  open: boolean;
  onClose: () => void;
}

const getStatusColor = (
  status: AircraftStatus
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'MAINTENANCE':
      return 'warning';
    case 'INACTIVE':
      return 'error';
    default:
      return 'default';
  }
};

const getCustomStatusSx = (status: AircraftStatus) => {
  const baseStyle = {
    border: '1px solid',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    fontWeight: 600,
    fontSize: '0.875rem',
  };
  
  switch (status) {
    case 'ACTIVE':
      return {
        ...baseStyle,
        backgroundColor: '#e8f5e8',
        color: '#2e7d32',
        borderColor: '#4caf50',
      };
    case 'MAINTENANCE':
      return {
        ...baseStyle,
        backgroundColor: '#fff3e0',
        color: '#e65100',
        borderColor: '#ff9800',
      };
    case 'INACTIVE':
      return {
        ...baseStyle,
        backgroundColor: '#ffebee',
        color: '#c62828',
        borderColor: '#ef5350',
      };
    default:
      return baseStyle;
  }
};

const formatAircraftType = (type: AircraftType): string => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function AircraftDetailsModal({ aircraft, open, onClose }: AircraftDetailsModalProps) {
  const router = useRouter();

  if (!aircraft) return null;

  const handleEdit = () => {
    router.push(`/dashboard/aircraft/${aircraft.id}/edit`);
    onClose();
  };

  const specifications = [
    { icon: Users, label: 'Max Passengers', value: aircraft.specifications.maxPassengers },
    { icon: Fuel, label: 'Max Range', value: `${aircraft.specifications.maxRange} nm` },
    { icon: Clock, label: 'Max Speed', value: `${aircraft.specifications.maxSpeed} kts` },
    { icon: Star, label: 'Service Ceiling', value: aircraft.specifications.cabinHeight ? `${aircraft.specifications.cabinHeight} ft` : 'N/A' },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 3,
          pb: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={aircraft.images && aircraft.images.length > 0 && typeof aircraft.images[0] === 'string' ? getImageUrl(aircraft.images[0]) : undefined}
              alt={`${aircraft.make} ${aircraft.model}`}
              variant="rounded"
              sx={{ width: 56, height: 56, bgcolor: 'background.default' }}
            >
              <Plane size={28} />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {aircraft.registration}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {aircraft.make} {aircraft.model} ({aircraft.year})
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={aircraft.status}
              color={getStatusColor(aircraft.status)}
              sx={getCustomStatusSx(aircraft.status)}
            />
            <IconButton onClick={onClose} size="small">
              <X size={20} />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 0 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileText size={20} />
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Plane size={18} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Aircraft Type" 
                      secondary={formatAircraftType(aircraft.type)} 
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <MapPin size={18} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Base Airport" 
                      secondary={aircraft.baseAirport} 
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Calendar size={18} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Year Built" 
                      secondary={aircraft.year} 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Specifications */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Settings size={20} />
                  Specifications
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  {specifications.map((spec, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <spec.icon size={18} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={spec.label} 
                        secondary={spec.value} 
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Description */}
          {aircraft.specifications.blurb && (
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {aircraft.specifications.blurb}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Images Gallery */}
          {aircraft.images && aircraft.images.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Aircraft Images
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <ImageList 
                    cols={3} 
                    rowHeight={200}
                    sx={{
                      '& .MuiImageListItem-root': {
                        borderRadius: 2,
                        overflow: 'hidden',
                      },
                    }}
                  >
                    {aircraft.images
                      .filter((image): image is string => typeof image === 'string')
                      .map((image, index) => (
                      <ImageListItem key={index}>
                        <Box sx={{ position: 'relative', width: '100%', height: 200 }}>
                          <Image
                            src={getImageUrl(image)}
                            alt={`${aircraft.make} ${aircraft.model} - Image ${index + 1}`}
                            fill
                            style={{
                              objectFit: 'cover',
                            }}
                            sizes="(max-width: 600px) 50vw, 33vw"
                          />
                        </Box>
                      </ImageListItem>
                    ))}
                  </ImageList>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
        <Button 
          variant="contained" 
          startIcon={<Edit3 size={18} />}
          onClick={handleEdit}
        >
          Edit Aircraft
        </Button>
      </DialogActions>
    </Dialog>
  );
} 