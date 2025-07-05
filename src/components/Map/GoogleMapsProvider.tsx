"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useLoadScript, Libraries } from '@react-google-maps/api';
import tokens from '@/styles/tokens';

// Get brand colors from tokens for consistent styling
const brandColors = {
  primary: tokens.color.primary.value,
  primaryLight: tokens.color['primary-light'].value,
  border: tokens.color.border.value,
  backgroundLight: tokens.color['background-light'].value,
};

// Required libraries for the map
const libraries: Libraries = ['geometry'];

// Create a context to share the Google Maps loading state
interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | null>(null);

// Hook to access the Google Maps context
export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
};

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  // Get the Google Maps API key from environment variables
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  // Load the Google Maps script once for the entire application
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
    id: 'google-map-script',
  });

  // If no API key, show a message instead
  if (!apiKey) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: brandColors.backgroundLight,
          border: `1px solid ${brandColors.border}`,
          borderRadius: '4px',
          padding: '16px',
          textAlign: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        <p style={{ color: brandColors.primary }}>Google Maps API key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.</p>
      </div>
    );
  }

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export default GoogleMapsProvider; 