import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { QuoteRequest, Offer } from '@/types/flight';
import { Airport } from '@/types/airport';
import { getCityImageUrlWithFallback } from '@/lib/cityImages';
import Image from 'next/image';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Divider, 
  Paper, 
  Chip,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton
} from '@mui/material';
import { getAirportByICAO } from '@/lib/airport';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import MultipleStopIcon from '@mui/icons-material/MultipleStop';
import LuggageIcon from '@mui/icons-material/Luggage';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AirplaneTicketIcon from '@mui/icons-material/AirplaneTicket';
import Map from '@/components/Map/Map';
import tokens from '@/styles/tokens';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SortIcon from '@mui/icons-material/Sort';
import BusinessIcon from '@mui/icons-material/Business';
import CloseIcon from '@mui/icons-material/Close';

// Define brand colors from tokens
const brandColors = {
  primary: tokens.color.primary.value,
  primaryLight: tokens.color['primary-light'].value,
  border: tokens.color.border.value,
  backgroundLight: tokens.color['background-light'].value,
};

interface QuoteRequestDetailsProps {
  request: QuoteRequest;
}

const QuoteRequestDetails: React.FC<QuoteRequestDetailsProps> = ({ request }) => {
  const [departureAirport, setDepartureAirport] = useState<Airport | null>(null);
  const [arrivalAirport, setArrivalAirport] = useState<Airport | null>(null);
  const [departureImageUrl, setDepartureImageUrl] = useState<string | null>(null);
  const [arrivalImageUrl, setArrivalImageUrl] = useState<string | null>(null);
  const [multiCityAirports, setMultiCityAirports] = useState<Airport[]>([]);
  const [multiCityImages, setMultiCityImages] = useState<(string | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price' | 'date' | 'status'>('price');
  const [selectedQuote, setSelectedQuote] = useState<Offer | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const isReturn = request.tripType === 'return';
  const isMultiCity = request.tripType === 'multiCity';
  const flightDetailsRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Add useEffect to adjust map height
  useEffect(() => {
    const adjustMapHeight = () => {
      if (flightDetailsRef.current && mapContainerRef.current) {
        const detailsHeight = flightDetailsRef.current.offsetHeight;
        // Only set explicit height on desktop (md breakpoint and above)
        if (window.innerWidth >= 900) {
          mapContainerRef.current.style.height = `${detailsHeight}px`;
        } else {
          mapContainerRef.current.style.height = '320px'; // Mobile default height
        }
      }
    };

    // Use a timeout to ensure DOM is fully rendered before measuring
    const timeoutId = setTimeout(() => {
      adjustMapHeight();
    }, 100);

    // Also adjust on window resize
    window.addEventListener('resize', adjustMapHeight);

    // Clean up
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', adjustMapHeight);
    };
  }, [isReturn, isMultiCity, loading]); // Re-run when trip type changes or when loading completes

  // Additional useEffect to adjust height when content changes
  useEffect(() => {
    const adjustMapHeight = () => {
      if (flightDetailsRef.current && mapContainerRef.current) {
        const detailsHeight = flightDetailsRef.current.offsetHeight;
        if (window.innerWidth >= 900) {
          mapContainerRef.current.style.height = `${detailsHeight}px`;
        }
      }
    };

    // Use ResizeObserver to detect when the flight details container changes size
    let resizeObserver: ResizeObserver | null = null;
    
    if (flightDetailsRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        adjustMapHeight();
      });
      resizeObserver.observe(flightDetailsRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [request, multiCityAirports, loading]); // Re-run when request data changes

  useEffect(() => {
    const loadAirportDetails = async () => {
      setLoading(true);
      try {
        if (isMultiCity && request.multiCityRoutes && request.multiCityRoutes.length > 0) {
          // Handle multi-city routes
          const airports: Airport[] = [];
          const images: (string | null)[] = [];
          const processedCities = new Set<string>();
          
          // For Leg 1, add both departure and arrival airports
          try {
            const firstRoute = request.multiCityRoutes[0];
            
            // Add departure airport of first leg
            const departureAirport = await getAirportByICAO(firstRoute.departureAirport);
            if (departureAirport) {
              airports.push(departureAirport);
              processedCities.add(firstRoute.departureAirport);
              const depImage = await getCityImageUrlWithFallback(departureAirport);
              images.push(depImage);
            }
            
            // Add arrival airport of first leg
            const arrivalAirport = await getAirportByICAO(firstRoute.arrivalAirport);
            if (arrivalAirport) {
              airports.push(arrivalAirport);
              processedCities.add(firstRoute.arrivalAirport);
              const arrImage = await getCityImageUrlWithFallback(arrivalAirport);
              images.push(arrImage);
            }
          } catch (err) {
            console.error("Error loading first leg airports:", err);
          }
          
          // For subsequent legs, add only arrival airports
          for (let i = 1; i < request.multiCityRoutes.length; i++) {
            try {
              const route = request.multiCityRoutes[i];
              const arrivalAirport = await getAirportByICAO(route.arrivalAirport);
              if (arrivalAirport) {
                airports.push(arrivalAirport);
                processedCities.add(route.arrivalAirport);
                const arrImage = await getCityImageUrlWithFallback(arrivalAirport);
                images.push(arrImage);
              }
            } catch (err) {
              console.error("Error loading arrival airport:", err);
            }
          }
          
          setMultiCityAirports(airports.filter(Boolean) as Airport[]);
          setMultiCityImages(images.filter(Boolean) as string[]);
          
          // Also set first and last airports for map display
          if (airports.length >= 2) {
            setDepartureAirport(airports[0]);
            setArrivalAirport(airports[airports.length - 1]);
            setDepartureImageUrl(images[0]);
            setArrivalImageUrl(images[images.length - 1]);
          }
        } else {
          // Handle one-way and return flights
          const [dep, arr] = await Promise.all([
            getAirportByICAO(request.routing.departureAirport),
            getAirportByICAO(request.routing.arrivalAirport)
          ]);
          
          setDepartureAirport(dep);
          setArrivalAirport(arr);

          // Fetch city images in parallel
          const [depImageUrl, arrImageUrl] = await Promise.all([
            getCityImageUrlWithFallback(dep),
            getCityImageUrlWithFallback(arr)
          ]);

          setDepartureImageUrl(depImageUrl);
          setArrivalImageUrl(arrImageUrl);
        }
      } catch (error) {
        console.error("Error loading airport details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAirportDetails();
  }, [request, isMultiCity]);

  // Helper to get trip type icon
  const getTripTypeIcon = () => {
    switch (request.tripType) {
      case 'oneWay':
        return <ArrowForwardIcon />;
      case 'return':
        return <SwapHorizIcon />;
      case 'multiCity':
        return <MultipleStopIcon />;
      default:
        return <ArrowForwardIcon />;
    }
  };

  // Helper to format trip type for display
  const formatTripType = (tripType: string) => {
    switch (tripType) {
      case 'oneWay':
        return 'One Way';
      case 'return':
        return 'Return';
      case 'multiCity':
        return 'Multi-City';
      default:
        return tripType;
    }
  };

  // Helper to get color for offer status
  const getOfferStatusColor = (status: string) => {
    if (status === 'accepted-by-client') return 'success';
    if (status === 'rejected-by-client' || status === 'expired') return 'error';
    return 'primary';
  };

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Date not available';
    
    // Handle Firestore Timestamp
    if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
      return timestamp.toDate().toLocaleDateString();
    }
    
    // Handle JavaScript Date
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    
    // Handle string or number timestamp
    try {
      return new Date(timestamp).toLocaleDateString();
    } catch (e) {
      return 'Date not available';
    }
  };

  // Sort offers function
  const getSortedOffers = () => {
    if (!request.offers) return [];
    
    const offers = [...request.offers];
    
    switch (sortBy) {
      case 'price':
        return offers.sort((a, b) => a.totalPrice - b.totalPrice);
      case 'date':
        return offers.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt as any);
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt as any);
          return bTime.getTime() - aTime.getTime(); // Most recent first
        });
      case 'status':
        return offers.sort((a, b) => {
          const statusOrder = {
            'pending-client-acceptance': 1,
            'accepted-by-client': 2,
            'awaiting-acknowledgement': 3,
            'rejected-by-client': 4,
            'expired': 5
          };
          return (statusOrder[a.offerStatus] || 6) - (statusOrder[b.offerStatus] || 6);
        });
      default:
        return offers;
    }
  };

  // Quote modal handlers
  const handleQuoteClick = (offer: Offer) => {
    setSelectedQuote(offer);
    setQuoteModalOpen(true);
  };

  const handleCloseQuoteModal = () => {
    setQuoteModalOpen(false);
    setSelectedQuote(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* City Images */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: { xs: 2, md: isReturn ? 1 : isMultiCity ? 1 : 2 },
        mb: 2,
        flexWrap: 'wrap'
      }}>
        {isMultiCity && multiCityAirports.length > 0 ? (
          // Multi-city images
          multiCityAirports.map((airport, index) => {
            const imageUrl = multiCityImages[index] || null;
            const label = String.fromCharCode(65 + index); // A, B, C, D, etc.
            
            return (
              <Box 
                key={`city-${index}`} 
                sx={{ 
                  flex: { 
                    xs: '1 1 100%', 
                    md: multiCityImages.length <= 2 
                      ? '1 1 calc(50% - 8px)' 
                      : multiCityImages.length <= 3 
                        ? '1 1 calc(33% - 8px)' 
                        : multiCityImages.length <= 4
                          ? '1 1 calc(25% - 8px)'
                          : '1 1 calc(20% - 8px)'
                  },
                  minWidth: { 
                    xs: '100%', 
                    md: multiCityImages.length <= 2 
                      ? '45%' 
                      : multiCityImages.length <= 3 
                        ? '30%' 
                        : multiCityImages.length <= 4
                          ? '22%'
                          : '18%'
                  },
                  maxWidth: { 
                    md: multiCityImages.length <= 2 
                      ? '50%' 
                      : multiCityImages.length <= 3 
                        ? '33%' 
                        : multiCityImages.length <= 4
                          ? '25%'
                          : '20%'
                  },
                  mb: { xs: 2, md: 0 }
                }}
              >
                <Box 
                  sx={{ 
                    position: 'relative', 
                    height: multiCityImages.length <= 3 ? 180 : 160,
                    borderRadius: 2, 
                    overflow: 'hidden',
                    backgroundColor: 'grey.200',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(11, 55, 70, 0.2)', // Brand primary color with opacity
                      zIndex: 1,
                    }
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress />
                    </Box>
                  ) : imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={airport?.city || ''}
                      fill
                      sizes={`(max-width: 768px) 100vw, ${
                        multiCityImages.length <= 2 ? '50vw' : 
                        multiCityImages.length <= 3 ? '33vw' : 
                        multiCityImages.length <= 4 ? '25vw' : '20vw'
                      }`}
                      style={{ 
                        objectFit: 'cover',
                        objectPosition: 'center',
                        filter: 'saturate(1.2) contrast(1.1)',
                        transition: 'transform 0.5s ease-in-out',
                      }}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography variant="caption">Image not available</Typography>
                    </Box>
                  )}
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      right: 0, 
                      padding: 2,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                      color: 'white',
                      zIndex: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: 'transparent',
                        color: 'white',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: '2px solid white',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        lineHeight: 1,
                        textAlign: 'center'
                      }}>{label}</Box>
                      <Box sx={{ color: 'white', display: 'flex', flexDirection: 'column' }}>
                        {airport?.city || airport?.name || ''}
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                          {index === 0 ? 'Leg 1 Departure' : 
                           index === 1 ? 'Leg 1 Destination' :
                           index === 2 ? 'Leg 2 Destination' :
                           index === 3 ? 'Leg 3 Destination' :
                           index === 4 ? 'Leg 4 Destination' :
                           `Leg ${index - 1} Destination`}
                        </Typography>
                      </Box>
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })
        ) : (
          // One-way or return flight images
          <>
            {/* Departure City */}
            <Box sx={{ flex: 1, minWidth: isReturn ? { xs: '100%', md: '30%' } : { xs: '100%', md: '48%' } }}>
              <Box 
                sx={{ 
                  position: 'relative', 
                  height: 200, 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  backgroundColor: 'grey.200',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(11, 55, 70, 0.2)', // Brand primary color with opacity
                    zIndex: 1,
                  }
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : departureImageUrl ? (
                  <Image
                    src={departureImageUrl}
                    alt={departureAirport?.city || request.routing.departureAirport}
                    fill
                    sizes={isReturn ? "(max-width: 768px) 100vw, 33vw" : "(max-width: 768px) 100vw, 50vw"}
                    style={{ 
                      objectFit: 'cover',
                      objectPosition: 'center',
                      filter: 'saturate(1.2) contrast(1.1)',
                      transition: 'transform 0.5s ease-in-out',
                    }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="caption">Image not available</Typography>
                  </Box>
                )}
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    padding: 2,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                    color: 'white',
                    zIndex: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: 'transparent',
                      color: 'white',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: '2px solid white',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      lineHeight: 1,
                      textAlign: 'center'
                    }}>A</Box>
                    <Box sx={{ color: 'white', display: 'flex', flexDirection: 'column' }}>
                      {departureAirport?.city || request.routing.departureAirportName?.split('(')[0] || request.routing.departureAirport}
                      {isReturn && (
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                          Departure
                        </Typography>
                      )}
                    </Box>
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Arrival City */}
            <Box sx={{ flex: 1, minWidth: isReturn ? { xs: '100%', md: '30%' } : { xs: '100%', md: '48%' } }}>
              <Box 
                sx={{ 
                  position: 'relative', 
                  height: 200, 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  backgroundColor: 'grey.200',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(11, 55, 70, 0.2)', // Brand primary color with opacity
                    zIndex: 1,
                  }
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : arrivalImageUrl ? (
                  <Image
                    src={arrivalImageUrl}
                    alt={arrivalAirport?.city || request.routing.arrivalAirport}
                    fill
                    sizes={isReturn ? "(max-width: 768px) 100vw, 33vw" : "(max-width: 768px) 100vw, 50vw"}
                    style={{ 
                      objectFit: 'cover',
                      objectPosition: 'center',
                      filter: 'saturate(1.2) contrast(1.1)',
                      transition: 'transform 0.5s ease-in-out',
                    }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="caption">Image not available</Typography>
                  </Box>
                )}
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    padding: 2,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                    color: 'white',
                    zIndex: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: 'transparent',
                      color: 'white',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: '2px solid white',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      lineHeight: 1,
                      textAlign: 'center'
                    }}>B</Box>
                    <Box sx={{ color: 'white', display: 'flex', flexDirection: 'column' }}>
                      {arrivalAirport?.city || request.routing.arrivalAirportName?.split('(')[0] || request.routing.arrivalAirport}
                      {isReturn && (
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                          Arrival / Return Departure
                        </Typography>
                      )}
                    </Box>
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {/* Return City (same as departure city) - Only shown for return flights */}
            {isReturn && (
              <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '30%' } }}>
                <Box 
                  sx={{ 
                    position: 'relative', 
                    height: 200, 
                    borderRadius: 2, 
                    overflow: 'hidden',
                    backgroundColor: 'grey.200',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(11, 55, 70, 0.2)', // Brand primary color with opacity
                      zIndex: 1,
                    }
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress />
                    </Box>
                  ) : departureImageUrl ? (
                    <Image
                      src={departureImageUrl}
                      alt={departureAirport?.city || request.routing.departureAirport}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{ 
                        objectFit: 'cover',
                        objectPosition: 'center',
                        filter: 'saturate(1.2) contrast(1.1)',
                        transition: 'transform 0.5s ease-in-out',
                      }}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography variant="caption">Image not available</Typography>
                    </Box>
                  )}
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      right: 0, 
                      padding: 2,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                      color: 'white',
                      zIndex: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: 'transparent',
                        color: 'white',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: '2px solid white',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        lineHeight: 1,
                        textAlign: 'center'
                      }}>C</Box>
                      <Box sx={{ color: 'white', display: 'flex', flexDirection: 'column' }}>
                        {departureAirport?.city || request.routing.departureAirportName?.split('(')[0] || request.routing.departureAirport}
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                          Return Arrival
                        </Typography>
                      </Box>
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Request Details Card */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        {/* Trip Type */}
        <Box sx={{ mb: 3 }}>
          <ToggleButtonGroup
            value={request.tripType}
            exclusive
            disabled
            sx={{ 
              display: 'flex', 
              justifyContent: 'flex-start', 
              gap: 1,
              '& .MuiToggleButtonGroup-grouped': {
                border: 'none',
                '&:not(:first-of-type)': {
                  borderRadius: 1,
                  borderLeft: 'none',
                },
                '&:first-of-type': {
                  borderRadius: 1,
                }
              }
            }}
          >
            <ToggleButton 
              value="oneWay"
              sx={{ 
                textTransform: 'none', 
                fontFamily: 'inherit', 
                borderRadius: 1, 
                px: 2,
                opacity: request.tripType === 'oneWay' ? 1 : 0.5,
                '&.Mui-disabled': {
                  color: request.tripType === 'oneWay' ? 'primary.main' : 'text.secondary',
                  borderColor: request.tripType === 'oneWay' ? 'transparent' : 'transparent'
                },
                border: 'none'
              }}
            >
              <ArrowForwardIcon />
              <Typography sx={{ ml: 1, fontFamily: 'inherit' }}>One Way</Typography>
            </ToggleButton>
            <ToggleButton 
              value="return"
              sx={{ 
                textTransform: 'none', 
                fontFamily: 'inherit', 
                borderRadius: 1, 
                px: 2,
                opacity: request.tripType === 'return' ? 1 : 0.5,
                '&.Mui-disabled': {
                  color: request.tripType === 'return' ? 'primary.main' : 'text.secondary',
                  borderColor: request.tripType === 'return' ? 'transparent' : 'transparent'
                },
                border: 'none'
              }}
            >
              <SwapHorizIcon />
              <Typography sx={{ ml: 1, fontFamily: 'inherit' }}>Return</Typography>
            </ToggleButton>
            <ToggleButton 
              value="multiCity"
              sx={{ 
                textTransform: 'none', 
                fontFamily: 'inherit', 
                borderRadius: 1, 
                px: 2,
                opacity: request.tripType === 'multiCity' ? 1 : 0.5,
                '&.Mui-disabled': {
                  color: request.tripType === 'multiCity' ? 'primary.main' : 'text.secondary',
                  borderColor: request.tripType === 'multiCity' ? 'transparent' : 'transparent'
                },
                border: 'none'
              }}
            >
              <MultipleStopIcon />
              <Typography sx={{ ml: 1, fontFamily: 'inherit' }}>Multi-city</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Main Flight Details with Map */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: { xs: 3, md: 3 },
          mb: 4,
          position: 'relative'
        }}>
          {/* Flight Details */}
          <Box 
            ref={flightDetailsRef}
            sx={{ 
              flex: { xs: '1 1 100%', md: '0 0 45%' }, 
              maxWidth: { md: '45%' },
              display: 'flex', 
              flexDirection: 'column'
            }}
          >
            {isMultiCity && request.multiCityRoutes && request.multiCityRoutes.length > 0 ? (
              // Multi-city legs
              request.multiCityRoutes.map((route, index) => (
                <React.Fragment key={`leg-${index}`}>
                  {/* Show arrow between legs */}
                  {index > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                      <ArrowDownwardIcon color="primary" />
                    </Box>
                  )}
                  
                  {/* Leg box */}
                  <Box 
                    sx={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: 2, 
                      p: 2, 
                      mb: index < (request.multiCityRoutes?.length || 0) - 1 ? 2 : 0,
                      backgroundColor: 'background.paper'
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, color: 'primary.main' }}>
                      Leg {index + 1}
                    </Typography>
                    
                    <Box sx={{ pl: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <FlightTakeoffIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                        <Typography variant="body2">
                          {route.departureAirportName || route.departureAirport} ({route.departureAirport})
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <FlightLandIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                        <Typography variant="body2">
                          {route.arrivalAirportName || route.arrivalAirport} ({route.arrivalAirport})
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <EventIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                        <Typography variant="body2">
                          {formatDate(route.departureDate)}
                          {route.flexibleDate && " (Flexible)"}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <PersonOutlineIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                        <Typography variant="body2">{request.passengerCount} Passenger{request.passengerCount !== 1 ? 's' : ''}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </React.Fragment>
              ))
            ) : (
              // One-way or return flight
              <>
                {/* Leg 1 */}
                <Box 
                  sx={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 2, 
                    p: 2, 
                    mb: isReturn ? 2 : 0,
                    backgroundColor: 'background.paper'
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, color: 'primary.main' }}>
                    Leg 1
                  </Typography>
                  
                  <Box sx={{ pl: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <FlightTakeoffIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                      <Typography variant="body2">
                        {request.routing.departureAirportName || request.routing.departureAirport} ({request.routing.departureAirport})
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <FlightLandIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                      <Typography variant="body2">
                        {request.routing.arrivalAirportName || request.routing.arrivalAirport} ({request.routing.arrivalAirport})
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <EventIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                      <Typography variant="body2">
                        {formatDate(request.routing.departureDate)}
                        {request.routing.flexibleDates && " (Flexible)"}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <PersonOutlineIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                      <Typography variant="body2">{request.passengerCount} Passenger{request.passengerCount !== 1 ? 's' : ''}</Typography>
                    </Box>
                  </Box>
                </Box>
                
                {/* Arrow between legs - Only shown for return flights */}
                {isReturn && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                    <ArrowDownwardIcon color="primary" />
                  </Box>
                )}
                
                {/* Leg 2 - Only shown for return flights */}
                {isReturn && request.routing.returnDate && (
                  <Box 
                    sx={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: 2, 
                      p: 2,
                      backgroundColor: 'background.paper'
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, color: 'primary.main' }}>
                      Leg 2
                    </Typography>
                    
                    <Box sx={{ pl: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <FlightTakeoffIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                        <Typography variant="body2">
                          {request.routing.arrivalAirportName || request.routing.arrivalAirport} ({request.routing.arrivalAirport})
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <FlightLandIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                        <Typography variant="body2">
                          {request.routing.departureAirportName || request.routing.departureAirport} ({request.routing.departureAirport})
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <EventIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                        <Typography variant="body2">
                          {formatDate(request.routing.returnDate)}
                          {request.routing.flexibleDates && " (Flexible)"}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <PersonOutlineIcon color="primary" sx={{ mt: 0.3, fontSize: '1.1rem' }} />
                        <Typography variant="body2">{request.passengerCount} Passenger{request.passengerCount !== 1 ? 's' : ''}</Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* Flight Route Map */}
          <Box 
            ref={mapContainerRef}
            sx={{ 
              flex: { xs: '1 1 100%', md: '0 0 55%' },
              maxWidth: { md: '55%' },
              height: { xs: '320px', md: 'auto' },
              border: '1px solid #e0e0e0', 
              borderRadius: 2,
              overflow: 'hidden',
              mt: { xs: 0, md: 0 },
              display: 'flex',
              alignItems: 'stretch',
              position: 'relative'
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (departureAirport && arrivalAirport) ? (
              <Box sx={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <Map 
                  departureLocation={{
                    lat: departureAirport.latitude,
                    lng: departureAirport.longitude,
                    name: departureAirport.name
                  }}
                  arrivalLocation={{
                    lat: arrivalAirport.latitude,
                    lng: arrivalAirport.longitude,
                    name: arrivalAirport.name
                  }}
                  returnLocation={isReturn ? {
                    lat: departureAirport.latitude,
                    lng: departureAirport.longitude,
                    name: departureAirport.name
                  } : undefined}
                  isReturn={isReturn}
                  isMultiCity={isMultiCity}
                  multiCityLocations={isMultiCity && multiCityAirports.length > 0 ? 
                    (() => {
                      const locations = multiCityAirports.map(airport => ({
                        lat: airport.latitude,
                        lng: airport.longitude,
                        name: airport.name
                      }));
                      console.log("Multi-city locations:", locations);
                      return locations;
                    })() : undefined}
                  height="100%"
                  width="100%"
                  disableInteraction={true}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
                <Typography variant="caption">Map not available - airport coordinates missing</Typography>
              </Box>
            )}
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />

        {/* Additional Options */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Additional Options
          </Typography>
          
          {/* Aircraft Options */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 'medium',
              }}
            >
              <FlightTakeoffIcon fontSize="small" />
              Aircraft Options
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ ml: 1 }}>
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  opacity: request.twinEngineMin ? 1 : 0.5,
                  transition: 'opacity 0.2s ease'
                }}>
                  {request.twinEngineMin ? (
                    <CheckCircleIcon sx={{ color: brandColors.primary }} fontSize="small" />
                  ) : (
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      border: '2px solid',
                      borderColor: 'text.disabled',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                  )}
                  <Typography variant="body2" color={request.twinEngineMin ? 'textPrimary' : 'text.disabled'}>
                    Twin Engine Minimum
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  opacity: request.pressurisedCabin ? 1 : 0.5,
                  transition: 'opacity 0.2s ease'
                }}>
                  {request.pressurisedCabin ? (
                    <CheckCircleIcon sx={{ color: brandColors.primary }} fontSize="small" />
                  ) : (
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      border: '2px solid',
                      borderColor: 'text.disabled',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                  )}
                  <Typography variant="body2" color={request.pressurisedCabin ? 'textPrimary' : 'text.disabled'}>
                    Pressurised Cabin
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  opacity: request.twoCrewMin ? 1 : 0.5,
                  transition: 'opacity 0.2s ease'
                }}>
                  {request.twoCrewMin ? (
                    <CheckCircleIcon sx={{ color: brandColors.primary }} fontSize="small" />
                  ) : (
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      border: '2px solid',
                      borderColor: 'text.disabled',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                  )}
                  <Typography variant="body2" color={request.twoCrewMin ? 'textPrimary' : 'text.disabled'}>
                    Two Crew Minimum
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
          
          {/* Baggage Options */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 'medium',
              }}
            >
              <LuggageIcon fontSize="small" />
              Baggage Options
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ ml: 1 }}>
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  opacity: request.hasExtraBaggage ? 1 : 0.5,
                  transition: 'opacity 0.2s ease'
                }}>
                  {request.hasExtraBaggage ? (
                    <CheckCircleIcon sx={{ color: brandColors.primary }} fontSize="small" />
                  ) : (
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      border: '2px solid',
                      borderColor: 'text.disabled',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                  )}
                  <Typography variant="body2" color={request.hasExtraBaggage ? 'textPrimary' : 'text.disabled'}>
                    Extra Baggage
                  </Typography>
                </Box>
                {request.hasExtraBaggage && request.baggageDetails && (
                  <Typography variant="caption" sx={{ ml: 3, display: 'block' }}>
                    {request.baggageDetails}
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  opacity: request.hasPets ? 1 : 0.5,
                  transition: 'opacity 0.2s ease'
                }}>
                  {request.hasPets ? (
                    <CheckCircleIcon sx={{ color: brandColors.primary }} fontSize="small" />
                  ) : (
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      border: '2px solid',
                      borderColor: 'text.disabled',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                  )}
                  <Typography variant="body2" color={request.hasPets ? 'textPrimary' : 'text.disabled'}>
                    Traveling with Pets
                  </Typography>
                </Box>
                {request.hasPets && request.petDetails && (
                  <Typography variant="caption" sx={{ ml: 3, display: 'block' }}>
                    {request.petDetails}
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  opacity: request.hasHardBags ? 1 : 0.5,
                  transition: 'opacity 0.2s ease'
                }}>
                  {request.hasHardBags ? (
                    <CheckCircleIcon sx={{ color: brandColors.primary }} fontSize="small" />
                  ) : (
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      border: '2px solid',
                      borderColor: 'text.disabled',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />
                  )}
                  <Typography variant="body2" color={request.hasHardBags ? 'textPrimary' : 'text.disabled'}>
                    Hard Bags
                  </Typography>
                </Box>
                {request.hasHardBags && request.hardBagsDetails && (
                  <Typography variant="caption" sx={{ ml: 3, display: 'block' }}>
                    {request.hardBagsDetails}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>
          
          {/* Additional Notes */}
          {request.additionalNotes && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Additional Notes
              </Typography>
              <Paper 
                variant="outlined" 
                elevation={0}
                sx={{ 
                  p: 2, 
                  borderRadius: 1,
                  boxShadow: 'none' 
                }}
              >
                <Typography variant="body2">
                  {request.additionalNotes}
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Received Quotes Section */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            Received Quotes
            {request.offers && request.offers.length > 0 && (
              <Chip 
                label={`${request.offers.length} quote${request.offers.length !== 1 ? 's' : ''}`}
                size="small"
                sx={{ ml: 2 }}
                color="primary"
              />
            )}
          </Typography>
          
          {/* Sort Controls */}
          {request.offers && request.offers.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="sort-select-label">Sort by</InputLabel>
              <Select
                labelId="sort-select-label"
                value={sortBy}
                label="Sort by"
                onChange={(e) => setSortBy(e.target.value as 'price' | 'date' | 'status')}
                startAdornment={<SortIcon sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="price">Price (Low to High)</MenuItem>
                <MenuItem value="date">Date (Newest First)</MenuItem>
                <MenuItem value="status">Status</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>

        {(!request.offers || request.offers.length === 0) ? (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 4, 
              textAlign: 'center', 
              borderRadius: 2,
              bgcolor: 'grey.50' 
            }}
          >
            <LocalOfferIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Quotes Received Yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Operators will submit their quotes here. You'll be notified when new quotes arrive.
            </Typography>
          </Paper>
        ) : (
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)'
              },
              gap: 2
            }}
          >
            {getSortedOffers().map((offer: Offer, index: number) => (
              <Card 
                key={offer.offerId}
                elevation={2} 
                onClick={() => handleQuoteClick(offer)}
                sx={{ 
                  height: '100%',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    elevation: 4,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  },
                  border: offer.offerStatus === 'accepted-by-client' ? '2px solid' : '1px solid transparent',
                  borderColor: offer.offerStatus === 'accepted-by-client' ? 'success.main' : 'transparent'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Quote Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        <BusinessIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Quote #{index + 1}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {offer.operatorUserCode}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Status Chip */}
                    <Chip 
                      label={offer.offerStatus.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                      size="small" 
                      variant={offer.offerStatus === 'accepted-by-client' ? 'filled' : 'outlined'}
                      color={getOfferStatusColor(offer.offerStatus)}
                    />
                  </Box>

                  {/* Price Display */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      ${offer.totalPrice.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Base: ${offer.price.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Commission: ${offer.commission.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Quote Details */}
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Received: {formatDate(offer.createdAt)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {offer.offerId.split('-').slice(-1)[0]}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Quote Details Modal */}
      <Dialog 
        open={quoteModalOpen} 
        onClose={handleCloseQuoteModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <AirplaneTicketIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Quote Details
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedQuote?.offerId}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleCloseQuoteModal} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selectedQuote && (
            <Box sx={{ py: 2 }}>
              {/* Quote Header Info */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    ${selectedQuote.totalPrice.toLocaleString()}
                  </Typography>
                  <Chip 
                    label={selectedQuote.offerStatus.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                    variant={selectedQuote.offerStatus === 'accepted-by-client' ? 'filled' : 'outlined'}
                    color={getOfferStatusColor(selectedQuote.offerStatus)}
                    size="medium"
                  />
                </Box>
                
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Operator: {selectedQuote.operatorUserCode}
                </Typography>
              </Box>

              {/* Price Breakdown */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Price Breakdown
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1">Base Price:</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      ${selectedQuote.price.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1">Charter Commission (3%):</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      ${selectedQuote.commission.toLocaleString()}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight="bold">Total Price:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      ${selectedQuote.totalPrice.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Quote Information */}
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Quote Information
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Quote ID:</Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {selectedQuote.offerId}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Operator:</Typography>
                    <Typography variant="body2">
                      {selectedQuote.operatorUserCode}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Status:</Typography>
                    <Typography variant="body2">
                      {selectedQuote.offerStatus.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Received:</Typography>
                    <Typography variant="body2">
                      {formatDate(selectedQuote.createdAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Last Updated:</Typography>
                    <Typography variant="body2">
                      {formatDate(selectedQuote.updatedAt)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleCloseQuoteModal} variant="outlined">
            Close
          </Button>
          {selectedQuote?.offerStatus === 'pending-client-acceptance' && (
            <>
              <Button variant="outlined" color="error">
                Reject Quote
              </Button>
              <Button variant="contained" color="primary">
                Accept Quote
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuoteRequestDetails; 