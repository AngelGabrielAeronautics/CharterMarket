'use client';

import { Aircraft } from '@/types/aircraft';
import { Box, Paper, Typography, Stack, Grid, Chip, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import Link from 'next/link';
import AircraftImageGallery from './AircraftImageGallery';

interface AircraftDetailsProps {
  aircraft: Aircraft;
}

export default function AircraftDetails({ aircraft }: AircraftDetailsProps) {
  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Aircraft Information</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Last updated: {aircraft.updatedAt.toDate().toLocaleDateString()}
          </Typography>
        </Box>
        <Button
          component={Link}
          href={`/dashboard/aircraft/${aircraft.id}/edit`}
          variant="outlined"
          size="small"
          startIcon={<EditIcon fontSize="small" />}
        >
            Edit Aircraft
          </Button>
      </Stack>
      <Grid container spacing={4} mb={4}>
        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="h6" fontWeight="medium" mb={2}>Basic Information</Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">Registration</Typography>
                  <Typography variant="body2">{aircraft.registration}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">Manufacturer</Typography>
                  <Typography variant="body2">{aircraft.make}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">Model</Typography>
                  <Typography variant="body2">{aircraft.model}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">Year</Typography>
                  <Typography variant="body2">{aircraft.year}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Chip
                    label={aircraft.status.charAt(0).toUpperCase() + aircraft.status.slice(1)}
                    size="small"
                    sx={{
                      bgcolor:
                        aircraft.status === 'ACTIVE' ? 'success.lighter' :
                        aircraft.status === 'MAINTENANCE' ? 'warning.lighter' :
                        'error.lighter',
                      color:
                        aircraft.status === 'ACTIVE' ? 'success.dark' :
                        aircraft.status === 'MAINTENANCE' ? 'warning.dark' :
                        'error.dark',
                      fontWeight: 500
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box>
              <Typography variant="h6" fontWeight="medium" mb={2}>Performance</Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">Maximum Passengers</Typography>
                  <Typography variant="body2">{aircraft.specifications.maxPassengers}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">Range</Typography>
                  <Typography variant="body2">{aircraft.specifications.maxRange} nm</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">Maximum Speed</Typography>
                  <Typography variant="body2">{aircraft.specifications.maxSpeed} kts</Typography>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="h6" fontWeight="medium" mb={2}>Cabin Dimensions</Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">Height</Typography>
                  <Typography variant="body2">{aircraft.specifications.cabinHeight} ft</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">Width</Typography>
                  <Typography variant="body2">{aircraft.specifications.cabinWidth} ft</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">Length</Typography>
                  <Typography variant="body2">{aircraft.specifications.cabinLength} ft</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">Baggage Capacity</Typography>
                  <Typography variant="body2">{aircraft.specifications.baggageCapacity} cu ft</Typography>
                </Grid>
              </Grid>
            </Box>

          {aircraft.specifications.features && aircraft.specifications.features.length > 0 && (
              <Box>
                <Typography variant="h6" fontWeight="medium" mb={2}>Features & Amenities</Typography>
                <Grid container spacing={1}>
                {aircraft.specifications.features.map((feature, index) => (
                    <Grid
                      key={index}
                      size={{
                        xs: 12,
                        sm: 6
                      }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <Box sx={{ width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%', mr: 1.5 }} />
                        <Typography variant="body2">{feature}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Stack>
        </Grid>
      </Grid>
      <Box>
        <Typography variant="h6" fontWeight="medium" mb={2}>Aircraft Images</Typography>
        <AircraftImageGallery
          aircraftId={aircraft.id}
          images={aircraft.images.map((url, index) => ({
            id: `${index}`,
            url,
            type: index === 0 ? 'exterior' : 'interior',
            fileName: url.split('/').pop() || '',
            isPrimary: index === 0,
            uploadedAt: aircraft.updatedAt.toDate().toISOString(),
          }))}
          type="exterior"
          onImagesUpdate={() => {}}
        />
      </Box>
    </Box>
  );
} 