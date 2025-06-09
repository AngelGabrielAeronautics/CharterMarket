'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { uploadAircraftImage, deleteAircraftImage } from '@/lib/aircraft';
import { AircraftImage } from '@/types/aircraft';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Box, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface AircraftImageGalleryProps {
  aircraftId: string;
  images: AircraftImage[];
  onImagesUpdate: () => void;
  type: 'exterior' | 'interior' | 'layout' | 'cockpit';
}

export default function AircraftImageGallery({
  aircraftId,
  images,
  onImagesUpdate,
  type,
}: AircraftImageGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map((file) => {
        const isPrimary = images.length === 0;
        return uploadAircraftImage(aircraftId, file, type, isPrimary);
      });

      await Promise.all(uploadPromises);
      onImagesUpdate();
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (image: AircraftImage) => {
    try {
      await deleteAircraftImage(aircraftId, image.id, image.url);
      onImagesUpdate();
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image');
    }
  };

  const handleSetPrimary = async (image: AircraftImage) => {
    try {
      // Update all images to non-primary
      const updatePromises = images.map((img) =>
        uploadAircraftImage(aircraftId, new File([], img.url), img.type, img.id === image.id)
      );
      await Promise.all(updatePromises);
      onImagesUpdate();
    } catch (err) {
      console.error('Error setting primary image:', err);
      setError('Failed to set primary image');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight="medium">
          Aircraft Images
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <input
            id="aircraft-image-upload"
            name="aircraftImages"
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              <>
                <Upload style={{ height: 20, width: 20, marginRight: 8 }} />
                Upload Images
              </>
            )}
          </Button>
        </Box>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={2}>
        {images.map((image) => (
          <Grid
            key={image.id}
            size={{
              xs: 12,
              md: 6,
              lg: 4,
            }}
          >
            <Box
              sx={{
                position: 'relative',
                borderRadius: theme.shape.borderRadius,
                overflow: 'hidden',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover .overlay': {
                  opacity: 1,
                },
              }}
            >
              <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                {' '}
                {/* 16:9 aspect ratio */}
                <Image
                  src={image.url}
                  alt={`${image.type} view`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                />
              </Box>
              <Box
                className="overlay"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0)',
                  transition: theme.transitions.create('background-color'),
                  opacity: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!image.isPrimary && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleSetPrimary(image)}
                      sx={{
                        backgroundColor: 'white',
                        color: 'text.primary',
                        '&:hover': {
                          backgroundColor: 'grey.100',
                        },
                      }}
                    >
                      <ImageIcon style={{ height: 16, width: 16, marginRight: 4 }} />
                      Set Primary
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleDeleteImage(image)}
                    sx={{
                      backgroundColor: 'white',
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'error.lighter',
                      },
                    }}
                  >
                    <X style={{ height: 16, width: 16 }} />
                  </Button>
                </Box>
              </Box>
              {image.isPrimary && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: theme.shape.borderRadius,
                    typography: 'caption',
                  }}
                >
                  Primary
                </Box>
              )}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: theme.shape.borderRadius,
                  typography: 'caption',
                }}
              >
                {image.type}
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
      {images.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            border: `2px dashed ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
          }}
        >
          <ImageIcon
            style={{ height: 48, width: 48, color: theme.palette.text.disabled, margin: '0 auto' }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No images uploaded yet
          </Typography>
        </Box>
      )}
    </Box>
  );
}
