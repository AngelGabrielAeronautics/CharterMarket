'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Message,
  Phone,
  Email,
  Check,
  Close,
  MoreVert,
  Business,
  AttachMoney,
  AccessTime,
  FlightTakeoff,
  FlightLand,
  ArrowForward,
  SwapHoriz,
  MultipleStop,
  PersonOutline,
  Event,
  CheckCircle,
  Luggage,
  ArrowDownward,
} from '@mui/icons-material';
import { Offer, QuoteRequest } from '@/types/flight';
import { Airport } from '@/types/airport';
import { useAuth } from '@/contexts/AuthContext';
import { useConversationManager } from '@/hooks/useMessaging';
import { formatDistanceToNow } from 'date-fns';
import { getQuoteRequest } from '@/lib/flight';
import { getAirportByICAO } from '@/lib/airport';
import { getCityImageUrlWithFallback } from '@/lib/cityImages';
import Map from '@/components/Map/Map';
import Image from 'next/image';
import toast from 'react-hot-toast';
import tokens from '@/styles/tokens';

const brandColors = tokens.color;

interface QuoteCardProps {
  offer: Offer;
  onAccept?: (offerId: string) => void;
  onReject?: (offerId: string) => void;
  onMessageClick?: (conversationId: string) => void;
  requestId: string;
  isClientView?: boolean;
  showActions?: boolean;
}

// Memoized Map component to prevent unnecessary re-renders
const MemoizedMap = React.memo(Map);

const QuoteCard: React.FC<QuoteCardProps> = ({
  offer,
  onAccept,
  onReject,
  onMessageClick,
  requestId,
  isClientView = false,
  showActions = true,
}) => {
  const { user } = useAuth();
  const { findOrCreateConversation, creating } = useConversationManager();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'accept' | 'reject' | null;
  }>({ open: false, action: null });

  // Quote Request Data State
  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [departureAirport, setDepartureAirport] = useState<Airport | null>(null);
  const [arrivalAirport, setArrivalAirport] = useState<Airport | null>(null);
  const [departureImageUrl, setDepartureImageUrl] = useState<string | null>(null);
  const [arrivalImageUrl, setArrivalImageUrl] = useState<string | null>(null);
  const [multiCityAirports, setMultiCityAirports] = useState<Airport[]>([]);
  const [multiCityImages, setMultiCityImages] = useState<(string | null)[]>([]);
  const [loading, setLoading] = useState(true);
  
  const flightDetailsRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Determine trip type flags
  const isReturn = request?.tripType === 'return';
  const isMultiCity = request?.tripType === 'multiCity';

  // Memoize locations for map
  const multiCityLocations = useMemo(() => {
    if (!isMultiCity || multiCityAirports.length === 0) return undefined;
    return multiCityAirports.map(airport => ({
      lat: airport.latitude,
      lng: airport.longitude,
      name: airport.name
    }));
  }, [isMultiCity, multiCityAirports]);

  const departureLocation = useMemo(() => {
    if (!departureAirport) return null;
    return {
      lat: departureAirport.latitude,
      lng: departureAirport.longitude,
      name: departureAirport.name
    };
  }, [departureAirport]);

  const arrivalLocation = useMemo(() => {
    if (!arrivalAirport) return null;
    return {
      lat: arrivalAirport.latitude,
      lng: arrivalAirport.longitude,
      name: arrivalAirport.name
    };
  }, [arrivalAirport]);

  const returnLocation = useMemo(() => {
    if (!isReturn || !departureAirport) return undefined;
    return {
      lat: departureAirport.latitude,
      lng: departureAirport.longitude,
      name: departureAirport.name
    };
  }, [isReturn, departureAirport]);

  // Load quote request data
  useEffect(() => {
    const loadQuoteRequestData = async () => {
      if (!requestId) return;
      
      setLoading(true);
      try {
        // Fetch quote request
        const quoteRequest = await getQuoteRequest(requestId);
        setRequest(quoteRequest);

        if (quoteRequest) {
          if (isMultiCity && quoteRequest.multiCityRoutes && quoteRequest.multiCityRoutes.length > 0) {
            // Handle multi-city routes
            const airports: Airport[] = [];
            const images: (string | null)[] = [];
            
            // For Leg 1, add both departure and arrival airports
            const firstRoute = quoteRequest.multiCityRoutes[0];
            const departureAirport = await getAirportByICAO(firstRoute.departureAirport);
            if (departureAirport) {
              airports.push(departureAirport);
              const depImage = await getCityImageUrlWithFallback(departureAirport);
              images.push(depImage);
            }
            
            const arrivalAirport = await getAirportByICAO(firstRoute.arrivalAirport);
            if (arrivalAirport) {
              airports.push(arrivalAirport);
              const arrImage = await getCityImageUrlWithFallback(arrivalAirport);
              images.push(arrImage);
            }
            
            // For subsequent legs, add only arrival airports
            for (let i = 1; i < quoteRequest.multiCityRoutes.length; i++) {
              const route = quoteRequest.multiCityRoutes[i];
              const arrivalAirport = await getAirportByICAO(route.arrivalAirport);
              if (arrivalAirport) {
                airports.push(arrivalAirport);
                const arrImage = await getCityImageUrlWithFallback(arrivalAirport);
                images.push(arrImage);
              }
            }
            
            setMultiCityAirports(airports);
            setMultiCityImages(images);
            
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
              getAirportByICAO(quoteRequest.routing.departureAirport),
              getAirportByICAO(quoteRequest.routing.arrivalAirport)
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
        }
      } catch (error) {
        console.error("Error loading quote request data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuoteRequestData();
  }, [requestId, isMultiCity]);

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending-client-acceptance':
        return 'warning';
      case 'accepted-by-client':
        return 'success';
      case 'rejected-by-client':
        return 'error';
      case 'expired':
        return 'default';
      default:
        return 'info';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending-client-acceptance':
        return 'Pending Review';
      case 'accepted-by-client':
        return 'Accepted';
      case 'rejected-by-client':
        return 'Declined';
      case 'expired':
        return 'Expired';
      default:
        return status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatAirportDisplay = (airportName: string | null | undefined, airportCode: string) => {
    if (airportName) {
      return `${airportName.split('(')[0].trim()} (${airportCode})`;
    }
    return airportCode;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Date not available';
    
    try {
      let date: Date;
      if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }
      
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleMessageOperator = async () => {
    if (!user) {
      toast.error('Please log in to send messages');
      return;
    }

    try {
      // Find or create conversation between client and operator for this quote
      const participantUserCodes = [offer.operatorUserCode];
      if (offer.clientUserCode && offer.clientUserCode !== user.userCode) {
        participantUserCodes.push(offer.clientUserCode);
      }

      const conversationId = await findOrCreateConversation(
        participantUserCodes,
        'quote',
        requestId
      );

      if (onMessageClick) {
        onMessageClick(conversationId);
      } else {
        // Open messaging in a new window/tab or navigate
        window.open(`/dashboard/messages?conversation=${conversationId}`, '_blank');
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleAccept = () => {
    setConfirmDialog({ open: true, action: 'accept' });
  };

  const handleReject = () => {
    setConfirmDialog({ open: true, action: 'reject' });
  };

  const handleConfirmAction = () => {
    const { action } = confirmDialog;
    if (action === 'accept' && onAccept) {
      onAccept(offer.offerId);
    } else if (action === 'reject' && onReject) {
      onReject(offer.offerId);
    }
    setConfirmDialog({ open: false, action: null });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const isAccepted = offer.offerStatus === 'accepted-by-client';
  const isPending = offer.offerStatus === 'pending-client-acceptance';
  const canAccept = isClientView && isPending && showActions;
  const canMessage = user && (user.userCode === offer.operatorUserCode || user.userCode === offer.clientUserCode);

  if (loading) {
    return (
      <Card sx={{ mb: 2, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      </Card>
    );
  }

  return (
    <>
      <Card
        sx={{
          mb: 2,
          border: isAccepted ? '2px solid' : '1px solid',
          borderColor: isAccepted ? 'success.main' : 'divider',
          bgcolor: isAccepted ? 'success.50' : 'transparent',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: 2,
          },
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Quote Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            justifyContent: 'space-between', 
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              width: { xs: '100%', sm: 'auto' }
            }}>
              <Avatar sx={{ 
                bgcolor: 'primary.main',
                width: { xs: 48, sm: 40 },
                height: { xs: 48, sm: 40 }
              }}>
                <Business />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" component="div" sx={{
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}>
                  {offer.operatorUserCode}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}>
                  Quote #{offer.offerId.slice(-8)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-end' }
            }}>
              <Chip
                label={getStatusLabel(offer.offerStatus)}
                color={getStatusColor(offer.offerStatus) as any}
                size="small"
                sx={{
                  height: { xs: 32, sm: 24 },
                  fontSize: { xs: '0.8rem', sm: '0.75rem' }
                }}
              />
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{
                  width: { xs: 44, sm: 32 },
                  height: { xs: 44, sm: 32 }
                }}
              >
                <MoreVert />
              </IconButton>
            </Box>
          </Box>

          {/* Quote Request Details - City Images */}
          {request && (
            <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'transparent', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Flight Request Details
              </Typography>
              
              {/* City Images */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                gap: { xs: 2, md: isReturn ? 1 : isMultiCity ? 1 : 2 },
                mb: 3,
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
                            height: multiCityImages.length <= 3 ? 140 : 120,
                            borderRadius: 2, 
                            overflow: 'hidden',
                            backgroundColor: 'grey.200',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: 'rgba(11, 55, 70, 0.2)',
                              zIndex: 1,
                            }
                          }}
                        >
                          {imageUrl ? (
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
                              padding: 1.5,
                              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                              color: 'white',
                              zIndex: 2,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                bgcolor: 'transparent',
                                color: 'white',
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                border: '2px solid white',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                lineHeight: 1,
                                textAlign: 'center'
                              }}>{label}</Box>
                              <Box sx={{ color: 'white', display: 'flex', flexDirection: 'column' }}>
                                {airport?.city || airport?.name || ''}
                                <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
                                  {index === 0 ? 'Leg 1 Departure' : 
                                   index === 1 ? 'Leg 1 Destination' :
                                   `Leg ${index} Destination`}
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
                          height: 160, 
                          borderRadius: 2, 
                          overflow: 'hidden',
                          backgroundColor: 'grey.200',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(11, 55, 70, 0.2)',
                            zIndex: 1,
                          }
                        }}
                      >
                        {departureImageUrl ? (
                          <Image
                            src={departureImageUrl}
                            alt={departureAirport?.city || request.routing.departureAirport}
                            fill
                            sizes={isReturn ? "(max-width: 768px) 100vw, 33vw" : "(max-width: 768px) 100vw, 50vw"}
                            style={{ 
                              objectFit: 'cover',
                              objectPosition: 'center',
                              filter: 'saturate(1.2) contrast(1.1)',
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
                            padding: 1.5,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                            color: 'white',
                            zIndex: 2,
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              bgcolor: 'transparent',
                              color: 'white',
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              border: '2px solid white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              lineHeight: 1,
                              textAlign: 'center'
                            }}>A</Box>
                            <Box sx={{ color: 'white', display: 'flex', flexDirection: 'column' }}>
                              {departureAirport?.city || request.routing.departureAirportName?.split('(')[0] || request.routing.departureAirport}
                              {isReturn && (
                                <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
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
                          height: 160, 
                          borderRadius: 2, 
                          overflow: 'hidden',
                          backgroundColor: 'grey.200',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(11, 55, 70, 0.2)',
                            zIndex: 1,
                          }
                        }}
                      >
                        {arrivalImageUrl ? (
                          <Image
                            src={arrivalImageUrl}
                            alt={arrivalAirport?.city || request.routing.arrivalAirport}
                            fill
                            sizes={isReturn ? "(max-width: 768px) 100vw, 33vw" : "(max-width: 768px) 100vw, 50vw"}
                            style={{ 
                              objectFit: 'cover',
                              objectPosition: 'center',
                              filter: 'saturate(1.2) contrast(1.1)',
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
                            padding: 1.5,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                            color: 'white',
                            zIndex: 2,
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              bgcolor: 'transparent',
                              color: 'white',
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              border: '2px solid white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              lineHeight: 1,
                              textAlign: 'center'
                            }}>B</Box>
                            <Box sx={{ color: 'white', display: 'flex', flexDirection: 'column' }}>
                              {arrivalAirport?.city || request.routing.arrivalAirportName?.split('(')[0] || request.routing.arrivalAirport}
                              {isReturn && (
                                <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
                                  Arrival / Return Departure
                                </Typography>
                              )}
                            </Box>
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    {/* Return City - Only shown for return flights */}
                    {isReturn && (
                      <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '30%' } }}>
                        <Box 
                          sx={{ 
                            position: 'relative', 
                            height: 160, 
                            borderRadius: 2, 
                            overflow: 'hidden',
                            backgroundColor: 'grey.200',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: 'rgba(11, 55, 70, 0.2)',
                              zIndex: 1,
                            }
                          }}
                        >
                          {departureImageUrl ? (
                            <Image
                              src={departureImageUrl}
                              alt={departureAirport?.city || request.routing.departureAirport}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              style={{ 
                                objectFit: 'cover',
                                objectPosition: 'center',
                                filter: 'saturate(1.2) contrast(1.1)',
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
                              padding: 1.5,
                              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                              color: 'white',
                              zIndex: 2,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                bgcolor: 'transparent',
                                color: 'white',
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                border: '2px solid white',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                lineHeight: 1,
                                textAlign: 'center'
                              }}>C</Box>
                              <Box sx={{ color: 'white', display: 'flex', flexDirection: 'column' }}>
                                {departureAirport?.city || request.routing.departureAirportName?.split('(')[0] || request.routing.departureAirport}
                                <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
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

              {/* Trip Type Routing Buttons (Read-only) */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Trip Type
                </Typography>
                <ToggleButtonGroup
                  value={request.tripType}
                  exclusive
                  sx={{ 
                    bgcolor: 'transparent',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    '& .MuiToggleButton-root': {
                      border: 'none',
                      borderRadius: 1,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        }
                      }
                    }
                  }}
                >
                  <ToggleButton 
                    value="oneWay"
                    disabled
                    sx={{ 
                      textTransform: 'none', 
                      fontFamily: 'inherit', 
                      px: 2,
                      opacity: request.tripType === 'oneWay' ? 1 : 0.5,
                    }}
                  >
                    <ArrowForward />
                    <Typography sx={{ ml: 1, fontFamily: 'inherit' }}>One-way</Typography>
                  </ToggleButton>
                  <ToggleButton 
                    value="return"
                    disabled
                    sx={{ 
                      textTransform: 'none', 
                      fontFamily: 'inherit', 
                      px: 2,
                      opacity: request.tripType === 'return' ? 1 : 0.5,
                    }}
                  >
                    <SwapHoriz />
                    <Typography sx={{ ml: 1, fontFamily: 'inherit' }}>Return</Typography>
                  </ToggleButton>
                  <ToggleButton 
                    value="multiCity"
                    disabled
                    sx={{ 
                      textTransform: 'none', 
                      fontFamily: 'inherit', 
                      px: 2,
                      opacity: request.tripType === 'multiCity' ? 1 : 0.5,
                    }}
                  >
                    <MultipleStop />
                    <Typography sx={{ ml: 1, fontFamily: 'inherit' }}>Multi-city</Typography>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Flight Details with Map */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                gap: { xs: 2, md: 3 },
                mb: 3,
              }}>
                {/* Flight Details */}
                <Box 
                  ref={flightDetailsRef}
                  sx={{ 
                    flex: { xs: '1 1 100%', md: '1' }, 
                    display: 'flex', 
                    flexDirection: 'column'
                  }}
                >
                  {isMultiCity && request.multiCityRoutes && request.multiCityRoutes.length > 0 ? (
                    // Multi-city legs
                    request.multiCityRoutes.map((route, index) => (
                      <React.Fragment key={`leg-${index}`}>
                        {index > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                            <ArrowDownward color="primary" />
                          </Box>
                        )}
                        
                        <Box 
                          sx={{ 
                            border: '1px solid #e0e0e0', 
                            borderRadius: 2, 
                            p: 1.5, 
                            mb: index < (request.multiCityRoutes?.length || 0) - 1 ? 1.5 : 0,
                            backgroundColor: 'transparent'
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'primary.main' }}>
                            Leg {index + 1}
                          </Typography>
                          
                          <Box sx={{ pl: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                              <FlightTakeoff color="primary" sx={{ mt: 0.2, fontSize: '1rem' }} />
                              <Typography variant="body2" fontSize="0.875rem">
                                {formatAirportDisplay(route.departureAirportName, route.departureAirport)}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                              <FlightLand color="primary" sx={{ mt: 0.2, fontSize: '1rem' }} />
                              <Typography variant="body2" fontSize="0.875rem">
                                {formatAirportDisplay(route.arrivalAirportName, route.arrivalAirport)}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                              <Event color="primary" sx={{ mt: 0.2, fontSize: '1rem' }} />
                              <Typography variant="body2" fontSize="0.875rem">
                                {formatDate(route.departureDate)}
                                {route.flexibleDate && " (Flexible)"}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                              <PersonOutline color="primary" sx={{ mt: 0.2, fontSize: '1rem' }} />
                              <Typography variant="body2" fontSize="0.875rem">
                                {request.passengerCount} Passenger{request.passengerCount !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </React.Fragment>
                    ))
                  ) : (
                    // One-way and return flight details
                    <>
                      <Box 
                        sx={{ 
                          border: '1px solid #e0e0e0', 
                          borderRadius: 2, 
                          p: 1.5,
                          backgroundColor: 'transparent'
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'primary.main' }}>
                          Leg 1
                        </Typography>
                        
                        <Box sx={{ pl: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                            <FlightTakeoff color="primary" sx={{ mt: 0.2, fontSize: '1rem' }} />
                            <Typography variant="body2" fontSize="0.875rem">
                              {formatAirportDisplay(request.routing.departureAirportName, request.routing.departureAirport)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                            <FlightLand color="primary" sx={{ mt: 0.2, fontSize: '1rem' }} />
                            <Typography variant="body2" fontSize="0.875rem">
                              {formatAirportDisplay(request.routing.arrivalAirportName, request.routing.arrivalAirport)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                            <Event color="primary" sx={{ mt: 0.2, fontSize: '1rem' }} />
                            <Typography variant="body2" fontSize="0.875rem">
                              {formatDate(request.routing.departureDate)}
                              {request.routing.flexibleDates && " (Flexible)"}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <PersonOutline color="primary" sx={{ mt: 0.2, fontSize: '1rem' }} />
                            <Typography variant="body2" fontSize="0.875rem">
                              {request.passengerCount} Passenger{request.passengerCount !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* Leg 2 - Only shown for return flights */}
                      {isReturn && request.routing.returnDate && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                            <ArrowDownward color="primary" />
                          </Box>
                          
                          <Box 
                            sx={{ 
                              border: '1px solid #e0e0e0', 
                              borderRadius: 2, 
                              p: 1.5,
                              backgroundColor: 'transparent'
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'primary.main' }}>
                              Leg 2
                            </Typography>
                            
                            <Box sx={{ pl: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                                <FlightTakeoff color="primary" sx={{ mt: 0.2, fontSize: '1rem' }} />
                                <Typography variant="body2" fontSize="0.875rem">
                                  {formatAirportDisplay(request.routing.arrivalAirportName, request.routing.arrivalAirport)}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                                <FlightLand color="primary" sx={{ mt: 0.2, fontSize: '1rem' }} />
                                <Typography variant="body2" fontSize="0.875rem">
                                  {formatAirportDisplay(request.routing.departureAirportName, request.routing.departureAirport)}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                                <Event color="primary" sx={{ mt: 0.2, fontSize: '1rem' }} />
                                <Typography variant="body2" fontSize="0.875rem">
                                  {formatDate(request.routing.returnDate)}
                                  {request.routing.flexibleDates && " (Flexible)"}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                <PersonOutline color="primary" sx={{ mt: 0.2, fontSize: '1rem' }} />
                                <Typography variant="body2" fontSize="0.875rem">
                                  {request.passengerCount} Passenger{request.passengerCount !== 1 ? 's' : ''}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </>
                      )}
                    </>
                  )}
                </Box>

                {/* Flight Route Map */}
                <Box 
                  ref={mapContainerRef}
                  sx={{ 
                    flex: { xs: '1 1 100%', md: '1' },
                    height: { xs: '240px', md: 'auto' },
                    border: '1px solid #e0e0e0', 
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'stretch',
                    position: 'relative'
                  }}
                >
                  {(departureLocation && arrivalLocation) ? (
                    <Box sx={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                      <MemoizedMap 
                        departureLocation={departureLocation}
                        arrivalLocation={arrivalLocation}
                        returnLocation={returnLocation}
                        isReturn={isReturn}
                        isMultiCity={isMultiCity}
                        multiCityLocations={multiCityLocations}
                        height="100%"
                        width="100%"
                        disableInteraction={true}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
                      <Typography variant="caption">Map not available</Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Additional Options */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Additional Options
                </Typography>
                
                {/* Aircraft Options */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FlightTakeoff fontSize="small" />
                    Aircraft Options
                  </Typography>
                  
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ ml: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: request.twinEngineMin ? 1 : 0.5 }}>
                      {request.twinEngineMin ? (
                        <CheckCircle sx={{ color: 'primary.main' }} fontSize="small" />
                      ) : (
                        <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid', borderColor: 'text.disabled' }} />
                      )}
                      <Typography variant="body2" fontSize="0.875rem" color={request.twinEngineMin ? 'textPrimary' : 'text.disabled'}>
                        Twin Engine Minimum
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: request.pressurisedCabin ? 1 : 0.5 }}>
                      {request.pressurisedCabin ? (
                        <CheckCircle sx={{ color: 'primary.main' }} fontSize="small" />
                      ) : (
                        <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid', borderColor: 'text.disabled' }} />
                      )}
                      <Typography variant="body2" fontSize="0.875rem" color={request.pressurisedCabin ? 'textPrimary' : 'text.disabled'}>
                        Pressurised Cabin
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: request.twoCrewMin ? 1 : 0.5 }}>
                      {request.twoCrewMin ? (
                        <CheckCircle sx={{ color: 'primary.main' }} fontSize="small" />
                      ) : (
                        <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid', borderColor: 'text.disabled' }} />
                      )}
                      <Typography variant="body2" fontSize="0.875rem" color={request.twoCrewMin ? 'textPrimary' : 'text.disabled'}>
                        Two Crew Minimum
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
                
                {/* Baggage Options */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Luggage fontSize="small" />
                    Baggage Options
                  </Typography>
                  
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ ml: 1 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: request.hasExtraBaggage ? 1 : 0.5 }}>
                        {request.hasExtraBaggage ? (
                          <CheckCircle sx={{ color: 'primary.main' }} fontSize="small" />
                        ) : (
                          <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid', borderColor: 'text.disabled' }} />
                        )}
                        <Typography variant="body2" fontSize="0.875rem" color={request.hasExtraBaggage ? 'textPrimary' : 'text.disabled'}>
                          Extra Baggage
                        </Typography>
                      </Box>
                      {request.hasExtraBaggage && request.baggageDetails && (
                        <Typography variant="caption" sx={{ ml: 2.5, display: 'block', fontSize: '0.75rem' }}>
                          {request.baggageDetails}
                        </Typography>
                      )}
                    </Box>
                    
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: request.hasPets ? 1 : 0.5 }}>
                        {request.hasPets ? (
                          <CheckCircle sx={{ color: 'primary.main' }} fontSize="small" />
                        ) : (
                          <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid', borderColor: 'text.disabled' }} />
                        )}
                        <Typography variant="body2" fontSize="0.875rem" color={request.hasPets ? 'textPrimary' : 'text.disabled'}>
                          Traveling with Pets
                        </Typography>
                      </Box>
                      {request.hasPets && request.petDetails && (
                        <Typography variant="caption" sx={{ ml: 2.5, display: 'block', fontSize: '0.75rem' }}>
                          {request.petDetails}
                        </Typography>
                      )}
                    </Box>
                    
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: request.hasHardBags ? 1 : 0.5 }}>
                        {request.hasHardBags ? (
                          <CheckCircle sx={{ color: 'primary.main' }} fontSize="small" />
                        ) : (
                          <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid', borderColor: 'text.disabled' }} />
                        )}
                        <Typography variant="body2" fontSize="0.875rem" color={request.hasHardBags ? 'textPrimary' : 'text.disabled'}>
                          Hard Bags
                        </Typography>
                      </Box>
                      {request.hasHardBags && request.hardBagsDetails && (
                        <Typography variant="caption" sx={{ ml: 2.5, display: 'block', fontSize: '0.75rem' }}>
                          {request.hardBagsDetails}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Box>
              </Box>

              {/* Passenger Notes */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Passenger Notes
                </Typography>
                <Box 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'transparent'
                  }}
                >
                  <Typography variant="body2" fontSize="0.875rem" color={request.additionalNotes ? 'text.primary' : 'text.secondary'}>
                    {request.additionalNotes || 'No additional notes provided.'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Aircraft Information */}
          {offer.aircraftDetails && (
            <Box sx={{ mb: 2, p: { xs: 2, sm: 1.5 }, bgcolor: 'transparent', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <FlightTakeoff color="primary" />
                <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.9rem', sm: '0.875rem' } }}>
                  Aircraft Details
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' }, mb: 1 }}>
                {offer.aircraftDetails.make} {offer.aircraftDetails.model}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.75rem' }, lineHeight: 1.4, display: 'block' }}>
                Registration: {offer.aircraftDetails.registration}
                <Box component="span" sx={{ display: { xs: 'block', sm: 'inline' } }}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}> • </Box>
                  Max Passengers: {offer.aircraftDetails.maxPassengers}
                </Box>
              </Typography>
            </Box>
          )}

          {/* Pricing */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <AttachMoney color="primary" />
              <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: { xs: '0.9rem', sm: '0.875rem' } }}>
                Pricing Breakdown
              </Typography>
            </Box>
            
            <Box sx={{ pl: { xs: 2, sm: 4 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0.25, sm: 0 } }}>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                  Base Price:
                </Typography>
                <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                  {formatCurrency(offer.price, offer.currency)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0.25, sm: 0 } }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                  Charter Commission (3%):
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                  {formatCurrency(offer.commission, offer.currency)}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0.5, sm: 0 } }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1rem' } }}>
                  Total Price:
                </Typography>
                <Typography variant="subtitle1" fontWeight={600} color="primary.main" sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}>
                  {formatCurrency(offer.totalPrice, offer.currency)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Notes */}
          {offer.notes && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '0.9rem', sm: '0.875rem' } }}>
                Operator Notes:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' }, lineHeight: { xs: 1.4, sm: 1.43 } }}>
                {offer.notes}
              </Typography>
            </Box>
          )}

          {/* Attachments */}
          {offer.attachments && offer.attachments.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '0.9rem', sm: '0.875rem' } }}>
                Attachments:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 1 } }}>
                {offer.attachments.map((attachment, index) => (
                  <Chip
                    key={index}
                    label={attachment.fileName}
                    size="small"
                    variant="outlined"
                    onClick={() => window.open(attachment.url, '_blank')}
                    sx={{ 
                      cursor: 'pointer',
                      height: { xs: 32, sm: 24 },
                      fontSize: { xs: '0.8rem', sm: '0.75rem' },
                      maxWidth: { xs: '100%', sm: 'none' },
                      '& .MuiChip-label': {
                        px: { xs: 1, sm: 0.75 }
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Timestamp */}
          <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1, mt: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTime fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.75rem' }, lineHeight: 1.4 }}>
                Submitted {formatDistanceToNow(offer.createdAt.toDate(), { addSuffix: true })}
              </Typography>
            </Box>
            {offer.responseTimeMinutes && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.75rem' }, pl: { xs: 2.5, sm: 0 } }}>
                Response time: {Math.round(offer.responseTimeMinutes / 60)} hours
              </Typography>
            )}
          </Box>
        </CardContent>

        {/* Actions */}
        {showActions && (
          <CardActions sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 2 }, pb: { xs: 2, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 }, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <Box sx={{ order: { xs: 2, sm: 1 }, width: { xs: '100%', sm: 'auto' } }}>
              {canMessage && (
                <Button
                  startIcon={creating ? undefined : <Message />}
                  onClick={handleMessageOperator}
                  disabled={creating}
                  size="small"
                  sx={{
                    height: { xs: 44, sm: 32 },
                    fontSize: { xs: '0.9rem', sm: '0.875rem' },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  {creating ? 'Starting...' : isClientView ? 'Message Operator' : 'Message Client'}
                </Button>
              )}
            </Box>

            {canAccept && (
              <Box sx={{ display: 'flex', gap: { xs: 2, sm: 1 }, order: { xs: 1, sm: 2 }, width: { xs: '100%', sm: 'auto' }, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Close />}
                  onClick={handleReject}
                  size="small"
                  sx={{
                    height: { xs: 44, sm: 32 },
                    fontSize: { xs: '0.9rem', sm: '0.875rem' },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Decline
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Check />}
                  onClick={handleAccept}
                  size="small"
                  sx={{
                    height: { xs: 44, sm: 32 },
                    fontSize: { xs: '0.9rem', sm: '0.875rem' },
                    fontWeight: 'medium',
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Accept Quote
                </Button>
              </Box>
            )}
          </CardActions>
        )}
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          setMenuAnchor(null);
          navigator.clipboard.writeText(offer.offerId);
          toast.success('Quote ID copied to clipboard');
        }}>
          Copy Quote ID
        </MenuItem>
        
        {canMessage && (
          <MenuItem onClick={() => {
            setMenuAnchor(null);
            handleMessageOperator();
          }}>
            <Message sx={{ mr: 1 }} />
            Send Message
          </MenuItem>
        )}
        
        <MenuItem onClick={() => {
          setMenuAnchor(null);
        }}>
          <Email sx={{ mr: 1 }} />
          Send Email
        </MenuItem>
        
        <MenuItem onClick={() => {
          setMenuAnchor(null);
        }}>
          <Phone sx={{ mr: 1 }} />
          Call Operator
        </MenuItem>
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {confirmDialog.action === 'accept' ? 'Accept Quote' : 'Decline Quote'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.action === 'accept'
              ? `Are you sure you want to accept this quote for ${formatCurrency(offer.totalPrice, offer.currency)}?`
              : 'Are you sure you want to decline this quote?'
            }
          </Typography>
          {confirmDialog.action === 'accept' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This will proceed to the booking stage and you will be asked to provide passenger details and payment.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: null })}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={confirmDialog.action === 'accept' ? 'success' : 'error'}
          >
            {confirmDialog.action === 'accept' ? 'Accept Quote' : 'Decline Quote'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuoteCard; 