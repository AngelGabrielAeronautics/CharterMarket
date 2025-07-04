import React, { useState, useEffect } from 'react';
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
  Avatar
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

interface QuoteRequestDetailsProps {
  request: QuoteRequest;
}

const QuoteRequestDetails: React.FC<QuoteRequestDetailsProps> = ({ request }) => {
  const [departureAirport, setDepartureAirport] = useState<Airport | null>(null);
  const [arrivalAirport, setArrivalAirport] = useState<Airport | null>(null);
  const [departureImageUrl, setDepartureImageUrl] = useState<string | null>(null);
  const [arrivalImageUrl, setArrivalImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAirportDetails = async () => {
      setLoading(true);
      try {
        // Fetch departure and arrival airport details
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
      } catch (error) {
        console.error("Error loading airport details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAirportDetails();
  }, [request]);

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
    if (!timestamp) return 'N/A';
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* City Images */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        {/* Departure City */}
        <Box sx={{ flex: 1 }}>
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
                sizes="(max-width: 768px) 100vw, 50vw"
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
              <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {departureAirport?.city || request.routing.departureAirportName?.split('(')[0] || request.routing.departureAirport}
              </Typography>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FlightTakeoffIcon fontSize="small" />
                Departure
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Arrival City */}
        <Box sx={{ flex: 1 }}>
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
                sizes="(max-width: 768px) 100vw, 50vw"
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
              <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {arrivalAirport?.city || request.routing.arrivalAirportName?.split('(')[0] || request.routing.arrivalAirport}
              </Typography>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FlightLandIcon fontSize="small" />
                Arrival
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Request Details Card */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        {/* Trip Type */}
        <Box sx={{ mb: 3 }}>
          <ToggleButtonGroup
            value={request.tripType}
            exclusive
            disabled
            sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1 }}
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
                  borderColor: request.tripType === 'oneWay' ? 'primary.main' : 'divider'
                }
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
                  borderColor: request.tripType === 'return' ? 'primary.main' : 'divider'
                }
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
                  borderColor: request.tripType === 'multiCity' ? 'primary.main' : 'divider'
                }
              }}
            >
              <MultipleStopIcon />
              <Typography sx={{ ml: 1, fontFamily: 'inherit' }}>Multi-city</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Main Flight Details with Map */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 3 }}>
          {/* Flight Details */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FlightTakeoffIcon color="primary" />
                <Typography variant="body1" fontWeight="medium">
                  {request.routing.departureAirportName || request.routing.departureAirport}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FlightLandIcon color="primary" />
                <Typography variant="body1" fontWeight="medium">
                  {request.routing.arrivalAirportName || request.routing.arrivalAirport}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon color="primary" />
                <Typography variant="body1">
                  {request.routing.departureDate.toDate().toLocaleDateString()} 
                  {request.routing.returnDate && ` - ${request.routing.returnDate.toDate().toLocaleDateString()}`}
                  {request.routing.flexibleDates && " (Flexible Dates)"}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonOutlineIcon color="primary" />
                <Typography variant="body1">{request.passengerCount} Passenger{request.passengerCount !== 1 ? 's' : ''}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Flight Route Map */}
          <Box sx={{ 
            flex: 1, 
            height: { xs: '250px', md: '280px' }, 
            border: '1px solid #e0e0e0', 
            borderRadius: 1,
            overflow: 'hidden',
            mt: { xs: 0, md: '-16px' }, // Move the map up to align with the top of the routing icons
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (departureAirport && arrivalAirport) ? (
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
                height="100%"
                width="100%"
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {request.twinEngineMin ? <CheckCircleIcon color="success" fontSize="small" /> : null}
                  <Typography variant="body2" color={request.twinEngineMin ? 'textPrimary' : 'text.secondary'}>
                    Twin Engine Minimum
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {request.pressurisedCabin ? <CheckCircleIcon color="success" fontSize="small" /> : null}
                  <Typography variant="body2" color={request.pressurisedCabin ? 'textPrimary' : 'text.secondary'}>
                    Pressurised Cabin
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {request.twoCrewMin ? <CheckCircleIcon color="success" fontSize="small" /> : null}
                  <Typography variant="body2" color={request.twoCrewMin ? 'textPrimary' : 'text.secondary'}>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {request.hasExtraBaggage ? <CheckCircleIcon color="success" fontSize="small" /> : null}
                  <Typography variant="body2" color={request.hasExtraBaggage ? 'textPrimary' : 'text.secondary'}>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {request.hasPets ? <CheckCircleIcon color="success" fontSize="small" /> : null}
                  <Typography variant="body2" color={request.hasPets ? 'textPrimary' : 'text.secondary'}>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {request.hasHardBags ? <CheckCircleIcon color="success" fontSize="small" /> : null}
                  <Typography variant="body2" color={request.hasHardBags ? 'textPrimary' : 'text.secondary'}>
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

      {/* Quotes/Offers Section */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Badge 
            badgeContent={request.offers?.length || 0} 
            color="primary"
            sx={{ mr: 2 }}
          >
            <LocalOfferIcon color="primary" />
          </Badge>
          <Typography variant="h6">
            Quotes Received
          </Typography>
        </Box>

        {(!request.offers || request.offers.length === 0) ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No quotes have been received for this request yet.
          </Typography>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {request.offers.length} quote{request.offers.length !== 1 ? 's' : ''} received for this flight request.
            </Typography>
            
            <List disablePadding>
              {request.offers.map((offer: Offer, index: number) => (
                <React.Fragment key={offer.offerId}>
                  {index > 0 && <Divider />}
                  <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                    <ListItemIcon sx={{ minWidth: 'auto', mr: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <AirplaneTicketIcon />
                      </Avatar>
                    </ListItemIcon>
                    <Box sx={{ flex: 1 }}>
                      {/* Quote header with price */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          Quote #{index + 1}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold">
                          ${offer.totalPrice.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      {/* Status with chip */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="body2" component="span">
                          Status:
                        </Typography>
                        <Chip 
                          label={offer.offerStatus.replace(/-/g, ' ')} 
                          size="small" 
                          variant="outlined"
                          color={getOfferStatusColor(offer.offerStatus)}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                      
                      {/* Received date */}
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        Received: {formatDate(offer.createdAt)}
                      </Typography>
                    </Box>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default QuoteRequestDetails; 