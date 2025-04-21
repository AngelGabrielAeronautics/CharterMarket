'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { uploadAircraftImage, deleteAircraftImage } from '@/lib/aircraft';
import { AircraftImage } from '@/types/aircraft';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface AircraftImageGalleryProps {
  aircraftId: string;
  images: AircraftImage[];
  onImagesUpdate: () => void;
  type: 'exterior' | 'interior' | 'layout' | 'cockpit';
}

export default function AircraftImageGallery({ aircraftId, images, onImagesUpdate, type }: AircraftImageGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(file => {
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
      const updatePromises = images.map(img => 
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Aircraft Images</h3>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            multiple
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Upload Images
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative group rounded-lg overflow-hidden border border-gray-200"
          >
            <div className="aspect-w-16 aspect-h-9 relative">
              <Image
                src={image.url}
                alt={`${image.type} view`}
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex space-x-2">
                {!image.isPrimary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetPrimary(image)}
                    className="bg-white text-gray-900 hover:bg-gray-100"
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Set Primary
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteImage(image)}
                  className="bg-white text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {image.isPrimary && (
              <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 text-xs rounded">
                Primary
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 text-xs rounded">
              {image.type}
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
} 