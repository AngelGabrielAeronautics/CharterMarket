import React, { useCallback, useState } from 'react';
import { GoogleMap, LoadScript, Polyline, Marker, Libraries } from '@react-google-maps/api';
import tokens from '@/styles/tokens';

interface MapProps {
  departureLocation: {
    lat: number;
    lng: number;
    name: string;
  };
  arrivalLocation: {
    lat: number;
    lng: number;
    name: string;
  };
  height?: string;
  width?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Get brand colors from tokens
const brandColors = {
  primary: tokens.color.primary.value, // #0b3746 - dark blue
  primaryLight: tokens.color['primary-light'].value, // #0f4657 - medium blue
  primaryDark: tokens.color['primary-dark'].value, // #072530 - very dark blue
  background: tokens.color.background.value, // #f9efe4 - light cream
  backgroundLight: tokens.color['background-light'].value, // #f2efe7 - lighter cream
  border: tokens.color.border.value, // #e6d2b4 - light tan
};

// Required libraries for the map
const libraries: Libraries = ['geometry'];

export default function Map({
  departureLocation,
  arrivalLocation,
  height = '300px',
  width = '100%',
}: MapProps): React.ReactElement {
  const [loadError, setLoadError] = useState<Error | null>(null);
  
  // We calculate the center point between the two airports
  const center = {
    lat: (departureLocation.lat + arrivalLocation.lat) / 2,
    lng: (departureLocation.lng + arrivalLocation.lng) / 2,
  };

  // Flight path as a curve (simple direct line)
  const path = [
    { lat: departureLocation.lat, lng: departureLocation.lng },
    { lat: arrivalLocation.lat, lng: arrivalLocation.lng },
  ];

  // Calculate appropriate zoom level based on distance
  const calculateZoomLevel = () => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (departureLocation.lat * Math.PI) / 180;
    const φ2 = (arrivalLocation.lat * Math.PI) / 180;
    const Δφ = ((arrivalLocation.lat - departureLocation.lat) * Math.PI) / 180;
    const Δλ = ((arrivalLocation.lng - departureLocation.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c / 1000; // distance in km

    // Logarithmic scale for zoom based on distance
    let zoom = 9 - Math.log(distance) / Math.log(2);
    return Math.min(Math.max(Math.round(zoom), 1), 10); // Constrain between 1 and 10
  };

  // Get the Google Maps API key from environment variables
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // Handle API loading error
  const handleLoadError = (error: Error) => {
    console.error("Error loading Google Maps API:", error);
    setLoadError(error);
  };

  // Create marker icons with proper anchor points
  const createMarkerIcon = useCallback((color: string) => {
    return {
      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
      fillColor: color,
      fillOpacity: 1,
      strokeColor: "#FFFFFF",
      strokeWeight: 1,
      scale: 2,
    };
  }, []);

  const departureIcon = createMarkerIcon(brandColors.primary);
  const arrivalIcon = createMarkerIcon(brandColors.primaryLight);

  // Custom map styles using brand colors
  const mapStyles = [
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [
        { color: '#e9e9e9' }
      ]
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [
        { color: brandColors.backgroundLight }
      ]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [
        { color: brandColors.border },
        { lightness: 20 }
      ]
    },
    {
      featureType: 'administrative',
      elementType: 'geometry.stroke',
      stylers: [
        { color: brandColors.border },
        { weight: 1.2 }
      ]
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [
        { color: brandColors.primaryLight },
        { lightness: 50 }
      ]
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [
        { color: brandColors.background },
        { lightness: 20 }
      ]
    },
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [
        { color: brandColors.primary }
      ]
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [
        { color: '#ffffff' },
        { lightness: 20 }
      ]
    }
  ];

  // If no API key, show a message instead
  if (!apiKey) {
    return (
      <div 
        style={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: brandColors.backgroundLight,
          border: `1px solid ${brandColors.border}`,
          borderRadius: '4px',
          padding: '16px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: brandColors.primary }}>Google Maps API key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.</p>
      </div>
    );
  }

  // If there was an error loading the API, show an error message
  if (loadError) {
    return (
      <div 
        style={{ 
          width, 
          height, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: brandColors.backgroundLight,
          border: `1px solid ${brandColors.border}`,
          borderRadius: '4px',
          padding: '16px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#d32f2f', fontWeight: 'bold', marginBottom: '8px' }}>
          Error loading Google Maps
        </p>
        <p style={{ fontSize: '0.875rem', color: brandColors.primary }}>
          Please check that your API key is correct and has the Maps JavaScript API enabled.
        </p>
        <p style={{ fontSize: '0.75rem', color: brandColors.primaryLight, marginTop: '8px' }}>
          Error details: {loadError.message}
        </p>
      </div>
    );
  }

  return (
    <div style={{ width, height }}>
      <LoadScript
        googleMapsApiKey={apiKey}
        onError={handleLoadError}
        libraries={libraries}
        id="google-map-script"
        language="en"
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={calculateZoomLevel()}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            styles: mapStyles
          }}
        >
          {/* Departure Marker */}
          <Marker
            position={{ lat: departureLocation.lat, lng: departureLocation.lng }}
            icon={departureIcon}
            title={departureLocation.name}
          />

          {/* Arrival Marker */}
          <Marker
            position={{ lat: arrivalLocation.lat, lng: arrivalLocation.lng }}
            icon={arrivalIcon}
            title={arrivalLocation.name}
          />

          {/* Flight Path */}
          <Polyline
            path={path}
            options={{
              strokeColor: brandColors.primary,
              strokeOpacity: 0.8,
              strokeWeight: 3,
              geodesic: true,
              icons: [
                {
                  icon: {
                    path: "M 0,0 0,1",
                    strokeOpacity: 1,
                    scale: 4,
                  },
                  offset: "0",
                  repeat: "20px",
                },
              ],
            }}
          />
        </GoogleMap>
      </LoadScript>
    </div>
  );
} 