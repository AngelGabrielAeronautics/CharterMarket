"use client";

import React, { useCallback, useEffect, useRef } from 'react';
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

export default function Map({
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
    console.log("Map loaded, initializing...");
    mapRef.current = map;
    // Slight delay to ensure map is fully loaded
    setTimeout(() => {
      console.log("Fitting bounds after map load");
      fitBounds();
    }, 300); // Increased timeout for better reliability
  }, [fitBounds]);

  useEffect(() => {
    console.log("Map component mounted/updated", { isMultiCity, multiCityLocations });
    // If map is already loaded, refit bounds when props change
    if (mapRef.current) {
      console.log("Map already loaded, refitting bounds after prop change");
      setTimeout(() => {
        fitBounds();
      }, 300);
    }
  }, [departureLocation, arrivalLocation, returnLocation, isReturn, isMultiCity, multiCityLocations, fitBounds]);

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
    // Get the maximum distance between any two points
    let maxDistance = 0;
    
    // Calculate distance between departure and arrival
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (departureLocation.lat * Math.PI) / 180;
    const φ2 = (arrivalLocation.lat * Math.PI) / 180;
    const Δφ = ((arrivalLocation.lat - departureLocation.lat) * Math.PI) / 180;
    const Δλ = ((arrivalLocation.lng - departureLocation.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    maxDistance = R * c / 1000; // distance in km
    
    // If there's a return leg, consider its distance too
    if (isReturn && returnLocation) {
      const φ3 = (returnLocation.lat * Math.PI) / 180;
      const Δφ2 = ((returnLocation.lat - arrivalLocation.lat) * Math.PI) / 180;
      const Δλ2 = ((returnLocation.lng - arrivalLocation.lng) * Math.PI) / 180;
      
      const a2 =
        Math.sin(Δφ2 / 2) * Math.sin(Δφ2 / 2) +
        Math.cos(φ2) * Math.cos(φ3) * Math.sin(Δλ2 / 2) * Math.sin(Δλ2 / 2);
      const c2 = 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));
      const returnDistance = R * c2 / 1000;
      
      maxDistance = Math.max(maxDistance, returnDistance);
    }

    // Improved zoom calculation with better scaling for different distances
    // For shorter distances, zoom in more
    if (maxDistance < 500) {
      return 6;
    } else if (maxDistance < 1000) {
      return 5;
    } else if (maxDistance < 2000) {
      return 4;
    } else if (maxDistance < 5000) {
      return 3;
    } else {
      return 2;
    }
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

  // Function to check if two locations are very close to each other
  const areLocationsClose = (loc1: {lat: number, lng: number}, loc2: {lat: number, lng: number}, threshold = 0.1) => {
    const latDiff = Math.abs(loc1.lat - loc2.lat);
    const lngDiff = Math.abs(loc1.lng - loc2.lng);
    console.log(`Checking distance between points: ${latDiff},${lngDiff} vs threshold ${threshold}`);
    return latDiff < threshold && lngDiff < threshold;
  };
  
  // Function to slightly offset a location if it's too close to another one
  const getOffsetLocation = (location: {lat: number, lng: number}, index: number, allLocations: {lat: number, lng: number}[]) => {
    // Never offset the very first marker (A)
    if (index === 0) {
      return location;
    }

    // Check if this location is close to any previous location
    let needsOffset = false;
    let closestPointIndex = -1;
    
    for (let i = 0; i < allLocations.length; i++) {
      if (i !== index && areLocationsClose(location, allLocations[i])) {
        needsOffset = true;
        closestPointIndex = i;
        break;
      }
    }
    
    if (needsOffset) {
      // Use a larger offset if this point is EXACTLY the same as the previous one (distance == 0)
      const baseOffset = 0.05; // default offset ~5-6 km
      const offsetFactor = closestPointIndex >= 0 && areLocationsClose(location, allLocations[closestPointIndex], 0.00001)
        ? 0.15 // identical point – move ~15-20 km
        : baseOffset;
      
      // If we found a specific close point, offset away from it
      if (closestPointIndex >= 0) {
        const closePoint = allLocations[closestPointIndex];
        
        // Calculate direction away from close point
        const latDiff = location.lat - closePoint.lat;
        const lngDiff = location.lng - closePoint.lng;
        
        // Normalize the direction
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        
        if (distance > 0) {
          // Offset in the direction away from the close point
          const offsetLat = location.lat + (latDiff / distance) * offsetFactor;
          const offsetLng = location.lng + (lngDiff / distance) * offsetFactor;
          
          console.log(`Offsetting marker ${index} from ${location.lat},${location.lng} to ${offsetLat},${offsetLng}`);
          
          return {
            lat: offsetLat,
            lng: offsetLng
          };
        }
      }
      
      // Fallback: use angle-based offset if we can't calculate direction
      const angle = (index * Math.PI / 3); // Distribute in different directions
      const offsetLat = location.lat + offsetFactor * Math.sin(angle);
      const offsetLng = location.lng + offsetFactor * Math.cos(angle);
      
      console.log(`Angle-offsetting marker ${index} from ${location.lat},${location.lng} to ${offsetLat},${offsetLng}`);
      
      return {
        lat: offsetLat,
        lng: offsetLng
      };
    }
    
    // No close locations found, return original
    return location;
  };

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
            {multiCityLocations.map((location, index) => {
              // Use letters A, B, C, etc. for markers
              const label = String.fromCharCode(65 + index); // ASCII 'A' starts at 65
              
              // Different colors for different points
              let fillColor;
              if (index === 0) fillColor = brandColors.primary; // First point (A)
              else if (index === multiCityLocations.length - 1) fillColor = brandColors.primaryDark; // Last point
              else fillColor = brandColors.primaryLight; // Middle points
              
              // Get potentially offset position to avoid overlap
              const markerPosition = getOffsetLocation(location, index, multiCityLocations);
              
              return (
                <Marker
                  key={`marker-${index}`}
                  position={{ lat: markerPosition.lat, lng: markerPosition.lng }}
                  icon={{
                    path: "M -10,0 A 10,10 0 1,1 10,0 A 10,10 0 1,1 -10,0", // Simple circle
                    fillColor: fillColor,
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2,
                    scale: 1.5,
                    rotation: 0,
                    // Anchor in the center of the circle
                    anchor: new google.maps.Point(0, 0),
                  }}
                  title={location.name}
                  label={{
                    text: label,
                    color: "#FFFFFF",
                    fontWeight: "bold",
                    fontSize: "14px"
                  }}
                  // Slightly offset markers that might overlap
                  options={{
                    zIndex: 1000 - index // Higher index = lower z-index to prioritize first markers
                  }}
                />
              );
            })}
            
            {/* Create paths between consecutive points */}
            {(() => {
              // Create adjusted paths with offset positions
              const adjustedPaths = [];
              
              for (let i = 0; i < multiCityLocations.length - 1; i++) {
                const startPos = getOffsetLocation(multiCityLocations[i], i, multiCityLocations);
                const endPos = getOffsetLocation(multiCityLocations[i + 1], i + 1, multiCityLocations);
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
            {/* Create an array of all locations for offset calculation */}
            {(() => {
              const allLocations = [departureLocation];
              if (arrivalLocation) allLocations.push(arrivalLocation);
              if (isReturn && returnLocation) allLocations.push(returnLocation);
              
              // Departure Marker - Circle with A
              const departurePos = getOffsetLocation(departureLocation, 0, allLocations);
              return (
                <Marker
                  position={{ lat: departurePos.lat, lng: departurePos.lng }}
                  icon={{
                    path: "M -10,0 A 10,10 0 1,1 10,0 A 10,10 0 1,1 -10,0", // Simple circle
                    fillColor: brandColors.primary,
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2,
                    scale: 1.5,
                    rotation: 0,
                    // Anchor in the center of the circle
                    anchor: new google.maps.Point(0, 0),
                  }}
                  title={departureLocation.name}
                  label={{
                    text: "A",
                    color: "#FFFFFF",
                    fontWeight: "bold",
                    fontSize: "14px"
                  }}
                  options={{
                    zIndex: 1000 // Highest z-index for departure
                  }}
                />
              );
            })()}

            {/* Arrival Marker - Circle with B */}
            {(() => {
              const allLocations = [departureLocation, arrivalLocation];
              if (isReturn && returnLocation) allLocations.push(returnLocation);
              
              const arrivalPos = getOffsetLocation(arrivalLocation, 1, allLocations);
              return (
                <Marker
                  position={{ lat: arrivalPos.lat, lng: arrivalPos.lng }}
                  icon={{
                    path: "M -10,0 A 10,10 0 1,1 10,0 A 10,10 0 1,1 -10,0", // Simple circle
                    fillColor: brandColors.primaryLight,
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2,
                    scale: 1.5,
                    rotation: 0,
                    // Anchor in the center of the circle
                    anchor: new google.maps.Point(0, 0),
                  }}
                  title={arrivalLocation.name}
                  label={{
                    text: "B",
                    color: "#FFFFFF",
                    fontWeight: "bold",
                    fontSize: "14px"
                  }}
                  options={{
                    zIndex: 999 // Lower z-index than departure
                  }}
                />
              );
            })()}

            {/* Flight Path */}
            {(() => {
              const allLocations = [departureLocation];
              if (arrivalLocation) allLocations.push(arrivalLocation);
              if (isReturn && returnLocation) allLocations.push(returnLocation);
              
              const departurePos = getOffsetLocation(departureLocation, 0, allLocations);
              const arrivalPos = getOffsetLocation(arrivalLocation, 1, allLocations);
              
              // Create path with offset positions
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
                  const allLocations = [departureLocation, arrivalLocation, returnLocation];
                  const arrivalPos = getOffsetLocation(arrivalLocation, 1, allLocations);
                  const returnPos = getOffsetLocation(returnLocation, 2, allLocations);
                  
                  // Create return path with offset positions
                  const adjustedReturnPath = createFlightPath(arrivalPos, returnPos);
                  
                  return (
                    <>
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

                      {/* Return Marker - Circle with C */}
                      <Marker
                        position={{ lat: returnPos.lat, lng: returnPos.lng }}
                        icon={{
                          path: "M -10,0 A 10,10 0 1,1 10,0 A 10,10 0 1,1 -10,0", // Simple circle
                          fillColor: brandColors.primaryDark,
                          fillOpacity: 1,
                          strokeColor: '#FFFFFF',
                          strokeWeight: 2,
                          scale: 1.5,
                          rotation: 0,
                          // Anchor in the center of the circle
                          anchor: new google.maps.Point(0, 0),
                        }}
                        title={returnLocation.name}
                        label={{
                          text: "C",
                          color: "#FFFFFF",
                          fontWeight: "bold",
                          fontSize: "14px"
                        }}
                        options={{
                          zIndex: 1001 // Ensure return marker is on top if overlapping
                        }}
                      />
                    </>
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