'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  LinearProgress,
  alpha,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CloudUpload, Delete, Star, StarBorder, Image as ImageIcon, PhotoCamera } from '@mui/icons-material';
import { Control, FieldValues, UseFormSetValue } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '@/utils/image-utils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`image-tabpanel-${index}`}
      aria-labelledby={`image-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface ImageUploadSectionProps {
  type: 'exterior' | 'interior' | 'layout' | 'cockpit';
  images: (string | File)[];
  onImagesChange: (images: (string | File)[]) => void;
  aircraftId?: string;
  disabled?: boolean;
}

function ImageUploadSection({ type, images, onImagesChange, aircraftId, disabled }: ImageUploadSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [blobUrls, setBlobUrls] = useState<Map<number, string>>(new Map());
  const theme = useTheme();

  const typeLabels = {
    exterior: 'Exterior Views',
    interior: 'Interior Views',
    layout: 'Cabin Layout',
    cockpit: 'Cockpit Views',
  };

  const typeIcons = {
    exterior: '✈️',
    interior: '🛋️',
    layout: '📐',
    cockpit: '🕹️',
  };

  // Create blob URLs for File objects when needed
  const getImageSrc = useCallback((item: string | File, index: number): string => {
    if (typeof item === 'string') {
      return getImageUrl(item); // Use proxy for Firebase Storage URLs
    }
    
    // It's a File object, create or reuse blob URL
    const existingUrl = blobUrls.get(index);
    if (existingUrl) {
      return existingUrl;
    }
    
    const blobUrl = URL.createObjectURL(item);
    setBlobUrls(prev => new Map(prev).set(index, blobUrl));
    console.log(`Created blob URL for index ${index}:`, blobUrl);
    return blobUrl;
  }, [blobUrls]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      blobUrls.forEach((url, index) => {
        console.log(`Cleaning up blob URL ${index}:`, url);
        URL.revokeObjectURL(url);
      });
    };
  }, [blobUrls]);

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;

    console.log('Files selected:', files.length);
    setUploading(true);
    setError(null);

    try {
      const newImageFiles: (string | File)[] = [];

      // Store File objects directly instead of creating blob URLs
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log('Processing file:', file.name, file.type, file.size);
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not a valid image file`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }

        // Store the File object directly
        console.log('Adding File object:', file.name);
        newImageFiles.push(file);
      }

      console.log('New image files:', newImageFiles);
      console.log('Existing images:', images);
      
      // Update form data
      const updatedImages = [...images, ...newImageFiles];
      console.log('Updated images:', updatedImages);
      onImagesChange(updatedImages);
      
      if (newImageFiles.length > 0) {
        toast.success(`${newImageFiles.length} image(s) added to ${typeLabels[type]}`);
      }
    } catch (error) {
      console.error('Error handling files:', error);
      setError('Failed to process images');
      toast.error('Failed to process images');
    } finally {
      setUploading(false);
    }
  }, [images, onImagesChange, type, typeLabels, setError, setUploading]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFileSelect(files);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = event.dataTransfer.files;
    if (files) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDeleteImage = (index: number) => {
    const imageToDelete = images[index];
    console.log('Deleting image at index', index, ':', imageToDelete);
    
    // Clean up blob URL if we created one for this File
    const blobUrl = blobUrls.get(index);
    if (blobUrl) {
      console.log('Revoking blob URL:', blobUrl);
      URL.revokeObjectURL(blobUrl);
      setBlobUrls(prev => {
        const newMap = new Map(prev);
        newMap.delete(index);
        return newMap;
      });
    }
    
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.success('Image removed');
  };

  const handleSetPrimary = (index: number) => {
    // Move selected image to first position
    const newImages = [...images];
    const [primaryImage] = newImages.splice(index, 1);
    newImages.unshift(primaryImage);
    onImagesChange(newImages);
    toast.success('Primary image updated');
  };

  const handleImageError = (index: number) => {
    const imageItem = images[index];
    console.error(`Failed to load image at index ${index}:`, imageItem);
    
    if (typeof imageItem === 'string') {
      console.log('Image URL starts with blob:', imageItem.startsWith('blob:'));
    } else {
      console.log('Image is a File object:', imageItem.name, imageItem.type);
    }
    
    console.log('All images:', images);
    setError(`Failed to load image ${index + 1}`);
  };

  const handleImageLoad = (index: number) => {
    console.log(`Successfully loaded image at index ${index}:`, images[index]);
    setError(null);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upload Area */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          border: `2px dashed ${dragOver ? theme.palette.primary.main : theme.palette.divider}`,
          backgroundColor: dragOver 
            ? alpha(theme.palette.primary.main, 0.05) 
            : alpha(theme.palette.background.default, 0.5),
          transition: theme.transitions.create(['border-color', 'background-color']),
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />
        
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ fontSize: '3rem', mb: 1 }}>{typeIcons[type]}</Box>
          <CloudUpload 
            sx={{ 
              fontSize: 48, 
              color: dragOver ? 'primary.main' : 'text.secondary',
              mb: 2 
            }} 
          />
          <Typography variant="h6" gutterBottom>
            {dragOver ? `Drop ${typeLabels[type]} here` : `Upload ${typeLabels[type]}`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Drag and drop images here, or click to browse
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supports: JPG, PNG, GIF • Max size: 10MB each
          </Typography>
        </Box>

        {uploading && (
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <LinearProgress />
          </Box>
        )}
      </Paper>

      {/* Image Grid */}
      {images.length > 0 && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {images.length} image(s) uploaded
          </Typography>
          <Grid container spacing={2}>
            {images.map((imageItem, index) => {
              console.log(`Rendering image ${index}:`, imageItem);
              const key = typeof imageItem === 'string' ? imageItem : `file-${index}-${imageItem.name}`;
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={key}>
                  <Card 
                    sx={{ 
                      position: 'relative',
                      '&:hover .image-actions': {
                        opacity: 1,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        height: 200,
                        position: 'relative',
                        overflow: 'hidden',
                        backgroundColor: 'grey.100',
                      }}
                    >
                      <Image
                        src={getImageSrc(imageItem, index)}
                        alt={`${typeLabels[type]} ${index + 1}`}
                        fill
                        style={{
                          objectFit: 'cover',
                        }}
                        onError={() => handleImageError(index)}
                        onLoad={() => handleImageLoad(index)}
                        sizes="(max-width: 600px) 100vw, 50vw"
                      />
                    </Box>
                    
                    {/* Primary Badge */}
                    {index === 0 && (
                      <Chip
                        icon={<Star />}
                        label="Primary"
                        size="small"
                        color="primary"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                        }}
                      />
                    )}

                    {/* Image Actions Overlay */}
                    <Box
                      className="image-actions"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: theme.transitions.create('opacity'),
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {index !== 0 && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetPrimary(index);
                            }}
                            sx={{
                              backgroundColor: 'white',
                              '&:hover': { backgroundColor: 'grey.100' },
                            }}
                          >
                            <StarBorder />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(index);
                          }}
                          sx={{
                            backgroundColor: 'white',
                            color: 'error.main',
                            '&:hover': { backgroundColor: 'error.light', color: 'white' },
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            color: 'text.secondary',
          }}
        >
          <ImageIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
          <Typography variant="body1">
            No {typeLabels[type].toLowerCase()} uploaded yet
          </Typography>
          <Typography variant="body2">
            Upload images to showcase your aircraft
          </Typography>
        </Box>
      )}
    </Box>
  );
}

interface ImprovedAircraftImageUploadProps {
  aircraftId?: string;
  disabled?: boolean;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  images: (string | File)[];
}

export default function ImprovedAircraftImageUpload({ 
  aircraftId, 
  disabled = false,
  control,
  setValue,
  images
}: ImprovedAircraftImageUploadProps) {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();

  const imageTypes = [
    { key: 'exterior' as const, label: 'Exterior', icon: '✈️' },
    { key: 'interior' as const, label: 'Interior', icon: '🛋️' },
    { key: 'layout' as const, label: 'Layout', icon: '📐' },
    { key: 'cockpit' as const, label: 'Cockpit', icon: '🕹️' },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // For now, we'll store all images in a single array
  // In a real implementation, you might want to categorize them
  const handleImagesChange = (newImages: (string | File)[]) => {
    setValue('images', newImages, { shouldDirty: true });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ImageIcon />
        Aircraft Images
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
            },
          }}
        >
          {imageTypes.map((type, index) => (
            <Tab
              key={type.key}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{type.icon}</span>
                  {type.label}
                </Box>
              }
            />
          ))}
        </Tabs>

        {imageTypes.map((type, index) => (
          <TabPanel key={type.key} value={activeTab} index={index}>
            <ImageUploadSection
              type={type.key}
              images={images} // For now using single array
              onImagesChange={handleImagesChange}
              aircraftId={aircraftId}
              disabled={disabled}
            />
          </TabPanel>
        ))}
      </Paper>
    </Box>
  );
} 