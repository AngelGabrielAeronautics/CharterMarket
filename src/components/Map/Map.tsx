"use client";

import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { GoogleMap, Polyline, Marker, useGoogleMap } from '@react-google-maps/api';
import tokens from '@/styles/tokens';
import { useGoogleMaps } from './GoogleMapsProvider';

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
  returnLocation?: {
    lat: number;
    lng: number;
    name: string;
  };
  isReturn?: boolean;
  isMultiCity?: boolean;
  multiCityLocations?: {
    lat: number;
    lng: number;
    name: string;
  }[];
  height?: string;
  width?: string;
  disableInteraction?: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Container style for the outer div
const containerStyle = {
  width: '100%',
  height: '100%',
  position: 'relative' as const,
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

// Helper function for deep comparison of location objects
const locationsEqual = (
  loc1: { lat: number; lng: number; name: string } | undefined,
  loc2: { lat: number; lng: number; name: string } | undefined
): boolean => {
  if (!loc1 && !loc2) return true;
  if (!loc1 || !loc2) return false;
  return loc1.lat === loc2.lat && loc1.lng === loc2.lng && loc1.name === loc2.name;
};

// Helper function for comparing multi-city locations
const multiCityLocationsEqual = (
  locs1: { lat: number; lng: number; name: string }[] | undefined,
  locs2: { lat: number; lng: number; name: string }[] | undefined
): boolean => {
  if (!locs1 && !locs2) return true;
  if (!locs1 || !locs2) return false;
  if (locs1.length !== locs2.length) return false;
  
  return locs1.every((loc1, index) => {
    const loc2 = locs2[index];
    return loc1.lat === loc2.lat && loc1.lng === loc2.lng && loc1.name === loc2.name;
  });
};

function Map({
  departureLocation,
  arrivalLocation,
  returnLocation,
  isReturn = false,
  isMultiCity = false,
  multiCityLocations = [],
  height = '300px',
  width = '100%',
  disableInteraction = false,
}: MapProps): React.ReactElement {
  // Get Google Maps loading state from context
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map | null>(null);
  
  // Store previous location data to prevent unnecessary fitBounds calls
  const prevLocationsRef = useRef({
    departure: departureLocation,
    arrival: arrivalLocation,
    return: returnLocation,
    multiCity: multiCityLocations,
    isReturn,
    isMultiCity
  });

  // Check if locations have actually changed
  const locationsChanged = useMemo(() => {
    const prev = prevLocationsRef.current;
    const changed = !locationsEqual(prev.departure, departureLocation) ||
                   !locationsEqual(prev.arrival, arrivalLocation) ||
                   !locationsEqual(prev.return, returnLocation) ||
                   !multiCityLocationsEqual(prev.multiCity, multiCityLocations) ||
                   prev.isReturn !== isReturn ||
                   prev.isMultiCity !== isMultiCity;
    
    if (changed) {
      prevLocationsRef.current = {
        departure: departureLocation,
        arrival: arrivalLocation,
        return: returnLocation,
        multiCity: multiCityLocations,
        isReturn,
        isMultiCity
      };
    }
    
    return changed;
  }, [departureLocation, arrivalLocation, returnLocation, multiCityLocations, isReturn, isMultiCity]);

  // Calculate the center point between all locations with better weighting
  const center = (() => {
    // For multi-city routes, consider all points
    if (isMultiCity && multiCityLocations && multiCityLocations.length > 0) {
      const totalLat = multiCityLocations.reduce((sum, loc) => sum + loc.lat, 0);
      const totalLng = multiCityLocations.reduce((sum, loc) => sum + loc.lng, 0);
      
      return {
        lat: totalLat / multiCityLocations.length,
        lng: totalLng / multiCityLocations.length
      };
    }
    // For return trips, we need to consider all three points
    else if (isReturn && returnLocation) {
      // Find the geographic midpoint using the centroid method
      const totalLat = departureLocation.lat + arrivalLocation.lat + returnLocation.lat;
      const totalLng = departureLocation.lng + arrivalLocation.lng + returnLocation.lng;
      
      return {
        lat: totalLat / 3,
        lng: totalLng / 3
      };
    } 
    // For regular trips, just use the midpoint between departure and arrival
    else {
      return {
        lat: (departureLocation.lat + arrivalLocation.lat) / 2,
        lng: (departureLocation.lng + arrivalLocation.lng) / 2
      };
    }
  })();

  // Function to fit map to bounds of all markers
  const fitBounds = useCallback(() => {
    if (mapRef.current) {
      const bounds = new google.maps.LatLngBounds();
      
      if (isMultiCity && multiCityLocations && multiCityLocations.length > 0) {
        // Add all multi-city points to bounds
        multiCityLocations.forEach(location => {
          bounds.extend(new google.maps.LatLng(location.lat, location.lng));
        });
      } else {
        // Add regular points to bounds
        bounds.extend(new google.maps.LatLng(departureLocation.lat, departureLocation.lng));
        bounds.extend(new google.maps.LatLng(arrivalLocation.lat, arrivalLocation.lng));
        
        if (isReturn && returnLocation) {
          bounds.extend(new google.maps.LatLng(returnLocation.lat, returnLocation.lng));
        }
      }
      
      // Calculate padding as percentage of the map's width/height
      const mapDiv = mapRef.current.getDiv();
      const mapWidth = mapDiv.offsetWidth;
      const mapHeight = mapDiv.offsetHeight;
      
      const padding = {
        top: mapHeight * 0.1,     // 10% of height
        right: mapWidth * 0.1,    // 10% of width
        bottom: mapHeight * 0.1,  // 10% of height
        left: mapWidth * 0.1      // 10% of width
      };
      
      // Fit the map to the bounds with padding
      mapRef.current.fitBounds(bounds, padding);
      
      // Adjust zoom level slightly to ensure better fit
      setTimeout(() => {
        if (mapRef.current) {
          const currentZoom = mapRef.current.getZoom();
          if (currentZoom && currentZoom > 10) {
            mapRef.current.setZoom(currentZoom - 0.5);
          }
        }
      }, 200);
    }
  }, [departureLocation, arrivalLocation, returnLocation, isReturn, isMultiCity, multiCityLocations]);

  // Handle map load
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    // Slight delay to ensure map is fully loaded
    setTimeout(() => {
      fitBounds();
    }, 300); // Increased timeout for better reliability
  }, [fitBounds]);

  useEffect(() => {
    // Only refit bounds if map is already loaded AND locations have actually changed
    if (mapRef.current && locationsChanged) {
      setTimeout(() => {
        fitBounds();
      }, 300);
    }
  }, [locationsChanged, fitBounds]); // Only depend on whether locations changed

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        // Trigger a resize event on the map
        google.maps.event.trigger(mapRef.current, 'resize');
        // Re-fit bounds after resize
        setTimeout(() => {
          fitBounds();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [fitBounds]);

  // Create a flight path for the outbound leg
  const createFlightPath = (start: {lat: number, lng: number}, end: {lat: number, lng: number}) => {
    // For short to medium distances, a simple path is sufficient as the geodesic option handles the curve
    if (Math.abs(start.lng - end.lng) < 50) {
      return [
        { lat: start.lat, lng: start.lng },
        { lat: end.lat, lng: end.lng },
      ];
    }
    
    // For longer distances, add intermediate points for a smoother curve
    const points = [];
    const steps = 10; // Number of points to add
    
    for (let i = 0; i <= steps; i++) {
      const fraction = i / steps;
      
      // Calculate intermediate point - this is a simple linear interpolation
      // The geodesic option will convert this to a proper curved path
      points.push({
        lat: start.lat + (end.lat - start.lat) * fraction,
        lng: start.lng + (end.lng - start.lng) * fraction,
      });
    }
    
    return points;
  };
  
  // Create paths for all routes
  const createPaths = () => {
    if (isMultiCity && multiCityLocations && multiCityLocations.length > 1) {
      const paths = [];
      
      // Create paths between consecutive points
      for (let i = 0; i < multiCityLocations.length - 1; i++) {
        paths.push(createFlightPath(multiCityLocations[i], multiCityLocations[i + 1]));
      }
      
      return paths;
    } else {
      const outboundPath = createFlightPath(departureLocation, arrivalLocation);
      const returnPath = isReturn && returnLocation ? 
        createFlightPath(arrivalLocation, returnLocation) : [];
      
      return [outboundPath, returnPath];
    }
  };
  
  const paths = createPaths();

  // Calculate appropriate zoom level based on distance
  const calculateZoomLevel = () => {
    // Calculate bounds for all locations
    const bounds = new google.maps.LatLngBounds();
    
    // Add all relevant locations to bounds
    bounds.extend(new google.maps.LatLng(departureLocation.lat, departureLocation.lng));
    bounds.extend(new google.maps.LatLng(arrivalLocation.lat, arrivalLocation.lng));
    
    if (isReturn && returnLocation) {
      bounds.extend(new google.maps.LatLng(returnLocation.lat, returnLocation.lng));
    }
    
    if (isMultiCity && multiCityLocations && multiCityLocations.length > 0) {
      multiCityLocations.forEach(location => {
        bounds.extend(new google.maps.LatLng(location.lat, location.lng));
      });
    }
    
    // Calculate zoom level based on bounds
    const GLOBE_WIDTH = 256; // a constant in Google's map projection
    const ZOOM_MAX = 18;
    
    const latRad = (bounds.getNorthEast().lat() - bounds.getSouthWest().lat()) * Math.PI / 180;
    const lngRad = (bounds.getNorthEast().lng() - bounds.getSouthWest().lng()) * Math.PI / 180;
    
    const latZoom = Math.floor(Math.log(400 / (GLOBE_WIDTH * latRad)) / Math.LN2);
    const lngZoom = Math.floor(Math.log(600 / (GLOBE_WIDTH * lngRad)) / Math.LN2);
    
    const zoom = Math.min(Math.min(latZoom, lngZoom), ZOOM_MAX);
    
    // Set reasonable minimum and maximum zoom levels
    return Math.max(Math.min(zoom, 16), 3);
  };

  // Create a combined dropper icon for multiple route letters
  const createCombinedDropperIcon = (fillColor: string, letters: string[], strokeColor: string = '#FFFFFF', strokeWeight: number = 2) => {
    const multiLetterText = letters.join(',');
    const isMultiLetter = letters.length > 1;
    
    return {
      // Slightly larger dropper for multiple letters
      path: isMultiLetter 
        ? "M 0,0 C -8,-15 -15,-22 -15,-28 C -15,-36 -8,-43 0,-43 C 8,-43 15,-36 15,-28 C 15,-22 8,-15 0,0 Z"
        : "M 0,0 C -6,-12 -12,-18 -12,-24 C -12,-30 -6,-36 0,-36 C 6,-36 12,-30 12,-24 C 12,-18 6,-12 0,0 Z",
      fillColor: fillColor,
      fillOpacity: 1,
      strokeColor: strokeColor,
      strokeWeight: strokeWeight,
      scale: isMultiLetter ? 0.9 : 0.8,
      rotation: 0,
      anchor: new google.maps.Point(0, 0),
      labelOrigin: new google.maps.Point(0, isMultiLetter ? -28 : -24),
    };
  };

  // Function to group locations that are at the same coordinates
  const groupLocations = (locations: Array<{lat: number, lng: number, name: string, letter: string, color: string}>) => {
    const groups: Array<{
      lat: number;
      lng: number;
      name: string;
      letters: string[];
      colors: string[];
      isGrouped: boolean;
    }> = [];

    locations.forEach((location) => {
      // Find if there's already a group at this exact location (very precise threshold)
      const existingGroup = groups.find(group => 
        Math.abs(group.lat - location.lat) < 0.0001 && 
        Math.abs(group.lng - location.lng) < 0.0001
      );

      if (existingGroup) {
        // Add to existing group
        existingGroup.letters.push(location.letter);
        existingGroup.colors.push(location.color);
        existingGroup.isGrouped = true;
      } else {
        // Create new group
        groups.push({
          lat: location.lat,
          lng: location.lng,
          name: location.name,
          letters: [location.letter],
          colors: [location.color],
          isGrouped: false
        });
      }
    });

    return groups;
  };

  // Function to create small visual clusters for closely located (but not identical) pins
  const createVisualCluster = (groups: Array<any>) => {
    const clusteredGroups = [...groups];
    const clusterRadius = 0.001; // Very small radius for visual clustering only (~100m)
    
    groups.forEach((group, index) => {
      if (group.isGrouped) return; // Skip already grouped pins
      
      // Check for nearby groups (close but not identical)
      groups.forEach((otherGroup, otherIndex) => {
        if (index === otherIndex || otherGroup.isGrouped) return;
        
        const distance = Math.sqrt(
          Math.pow(group.lat - otherGroup.lat, 2) + 
          Math.pow(group.lng - otherGroup.lng, 2)
        );
        
        // If close but not identical, apply small visual offset
        if (distance > 0.0001 && distance < 0.01) {
          const angle = (otherIndex - index) * (Math.PI / 3); // 60-degree separation
          clusteredGroups[otherIndex] = {
            ...otherGroup,
            lat: otherGroup.lat + clusterRadius * Math.sin(angle),
            lng: otherGroup.lng + clusterRadius * Math.cos(angle),
          };
        }
      });
    });
    
    return clusteredGroups;
  };

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

  // If the script is still loading, show a loading indicator
  if (!isLoaded) {
    return (
      <div 
        style={{ 
          width, 
          height, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: brandColors.backgroundLight,
          border: `1px solid ${brandColors.border}`,
          borderRadius: '4px',
        }}
      >
        <p style={{ color: brandColors.primary }}>Loading map...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={calculateZoomLevel()}
        options={{
          disableDefaultUI: true,
          zoomControl: !disableInteraction,
          styles: mapStyles,
          draggable: !disableInteraction,
          scrollwheel: !disableInteraction,
          disableDoubleClickZoom: disableInteraction,
          gestureHandling: disableInteraction ? 'none' : 'auto'
        }}
        onLoad={onMapLoad}
      >
        {isMultiCity && multiCityLocations && multiCityLocations.length > 0 ? (
          // Multi-city route markers and paths
          <>
            {(() => {
              // Prepare locations with letters and colors
              const locations = multiCityLocations.map((location, index) => ({
                lat: location.lat,
                lng: location.lng,
                name: location.name,
                letter: String.fromCharCode(65 + index), // A, B, C, etc.
                color: index === 0 ? brandColors.primary : 
                       index === multiCityLocations.length - 1 ? brandColors.primaryDark : 
                       brandColors.primaryLight
              }));

              // Group overlapping locations
              const groups = groupLocations(locations);
              const clusteredGroups = createVisualCluster(groups);

              return clusteredGroups.map((group, groupIndex) => {
                const primaryColor = group.colors[0]; // Use first color for grouped pins
                const labelText = group.letters.join(',');
                
                return (
                  <Marker
                    key={`grouped-marker-${groupIndex}`}
                    position={{ lat: group.lat, lng: group.lng }}
                    icon={createCombinedDropperIcon(primaryColor, group.letters)}
                    title={group.name}
                    label={{
                      text: labelText,
                      color: "#FFFFFF",
                      fontWeight: "bold",
                      fontSize: group.letters.length > 1 ? "12px" : "14px"
                    }}
                    options={{
                      zIndex: 1000 - groupIndex
                    }}
                  />
                );
              });
            })()}
            
            {/* Create paths between consecutive points */}
            {(() => {
              const adjustedPaths = [];
              
              for (let i = 0; i < multiCityLocations.length - 1; i++) {
                const startPos = multiCityLocations[i];
                const endPos = multiCityLocations[i + 1];
                adjustedPaths.push(createFlightPath(startPos, endPos));
              }
              
              return adjustedPaths.map((path, index) => (
                <Polyline
                  key={`path-${index}`}
                  path={path}
                  options={{
                    strokeColor: index % 2 === 0 ? brandColors.primary : brandColors.primaryLight,
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
              ));
            })()}
          </>
        ) : (
          // Regular route (one-way or return)
          <>
            {(() => {
              // Prepare all locations with letters and colors
              const locations = [];
              
              // Add departure (A)
              locations.push({
                lat: departureLocation.lat,
                lng: departureLocation.lng,
                name: departureLocation.name,
                letter: "A",
                color: brandColors.primary
              });
              
              // Add arrival (B)
              locations.push({
                lat: arrivalLocation.lat,
                lng: arrivalLocation.lng,
                name: arrivalLocation.name,
                letter: "B",
                color: brandColors.primaryLight
              });
              
              // Add return (C) if it exists
              if (isReturn && returnLocation) {
                locations.push({
                  lat: returnLocation.lat,
                  lng: returnLocation.lng,
                  name: returnLocation.name,
                  letter: "C",
                  color: brandColors.primaryDark
                });
              }

              // Group overlapping locations and create visual clusters
              const groups = groupLocations(locations);
              const clusteredGroups = createVisualCluster(groups);

              return clusteredGroups.map((group, groupIndex) => {
                const primaryColor = group.colors[0]; // Use first color for grouped pins
                const labelText = group.letters.join(',');
                
                return (
                  <Marker
                    key={`grouped-marker-${groupIndex}`}
                    position={{ lat: group.lat, lng: group.lng }}
                    icon={createCombinedDropperIcon(primaryColor, group.letters)}
                    title={group.name}
                    label={{
                      text: labelText,
                      color: "#FFFFFF",
                      fontWeight: "bold",
                      fontSize: group.letters.length > 1 ? "12px" : "14px"
                    }}
                    options={{
                      zIndex: 1000 - groupIndex
                    }}
                  />
                );
              });
            })()}

            {/* Flight Path */}
            {(() => {
              const departurePos = departureLocation;
              const arrivalPos = arrivalLocation;
              
              // Create path with original positions
              const adjustedPath = createFlightPath(departurePos, arrivalPos);
              
              return (
                <Polyline
                  path={adjustedPath}
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
              );
            })()}

            {/* Return Flight Path */}
            {isReturn && returnLocation && (
              <>
                {(() => {
                  const arrivalPos = arrivalLocation;
                  const returnPos = returnLocation;
                  
                  // Create return path with original positions
                  const adjustedReturnPath = createFlightPath(arrivalPos, returnPos);
                  
                  return (
                    <Polyline
                      path={adjustedReturnPath}
                      options={{
                        strokeColor: brandColors.primaryLight,
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
                  );
                })()}
              </>
            )}
          </>
        )}
      </GoogleMap>
    </div>
  );
} 

// Memoized Map component export to prevent unnecessary re-renders
export default React.memo(Map); 