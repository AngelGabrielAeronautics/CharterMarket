'use client';

import { useState, useEffect } from 'react';
import { QuoteRequest } from '@/types/flight';
import { Airport } from '@/types/airport';
import { format } from 'date-fns';
import { getCityImageUrlWithFallback } from '@/lib/cityImages';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Icon,
  Tooltip,
  Stack,
  FormControlLabel,
  Checkbox,
  TextField,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  FlightTakeoff,
  FlightLand,
  CalendarToday,
  People,
  ExpandMore,
  Info,
  ArrowForward,
  Luggage,
} from '@mui/icons-material';
import Image from 'next/image';

interface QuoteRequestDetailsProps {
  request: QuoteRequest;
  departureAirportDetails: Airport | null;
  arrivalAirportDetails: Airport | null;
}

const DetailItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
    <Box sx={{ mr: 1.5, color: 'text.secondary' }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight="medium">
        {value}
      </Typography>
    </Box>
  </Box>
);

const StatusHelp = () => (
  <Box sx={{ p: 1.5, maxWidth: 320 }}>
    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
      Status Guide
    </Typography>
    <Stack spacing={1.5}>
      <Box>
        <Chip label="Submitted" size="small" variant="outlined" sx={{ mb: 0.5 }} />
        <Typography variant="body2" color="text.secondary">
          Your request has been sent to operators and is awaiting review.
        </Typography>
      </Box>
      <Divider />
      <Box>
        <Chip label="Under Offer" size="small" variant="outlined" color="info" sx={{ mb: 0.5 }} />
        <Typography variant="body2" color="text.secondary">
          You have received one or more quotes from operators for this request.
        </Typography>
      </Box>
      <Divider />
      <Box>
        <Chip label="Accepted" size="small" variant="outlined" color="primary" sx={{ mb: 0.5 }} />
        <Typography variant="body2" color="text.secondary">
          You have accepted an offer. The booking process has now been initiated.
        </Typography>
      </Box>
      <Divider />
      <Box>
        <Chip label="Booked" size="small" variant="filled" color="success" sx={{ mb: 0.5 }} />
        <Typography variant="body2" color="text.secondary">
          Your flight is confirmed and booked.
        </Typography>
      </Box>
      <Divider />
      <Box>
        <Chip label="Cancelled" size="small" variant="outlined" color="error" sx={{ mb: 0.5 }} />
        <Typography variant="body2" color="text.secondary">
          This request has been cancelled by you or the operator.
        </Typography>
      </Box>
    </Stack>
  </Box>
);

const TopBar = ({
  request,
  departureAirportDetails,
  arrivalAirportDetails,
}: {
  request: QuoteRequest;
  departureAirportDetails: Airport | null;
  arrivalAirportDetails: Airport | null;
}) => (
  <Box sx={{ p: 2, mb: 3, borderRadius: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
        <Chip
          icon={<ArrowForward />}
          label={request.tripType === 'oneWay' ? 'One Way' : 'Return'}
          color="primary"
          variant="outlined"
          sx={{ border: 'none' }}
        />
      </Box>
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Tooltip
          title={<StatusHelp />}
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: 'white',
                color: 'text.primary',
                boxShadow: 3,
                border: '1px solid #ddd',
              },
            },
            arrow: {
              sx: {
                color: 'white',
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <Icon sx={{ color: 'text.secondary', mr: 1 }}>
              <Info />
            </Icon>
            <Typography variant="caption" color="text.secondary">
              Status:{' '}
            </Typography>
            <Chip label={request.status} size="small" variant="outlined" sx={{ ml: 0.5 }} />
          </Box>
        </Tooltip>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {request.requestCode}
        </Typography>
      </Box>
    </Box>
    <Divider sx={{ mb: 2 }} />
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <DetailItem
        icon={<FlightTakeoff />}
        label="From"
        value={departureAirportDetails?.name || request.routing.departureAirport}
      />
      <DetailItem
        icon={<FlightLand />}
        label="To"
        value={arrivalAirportDetails?.name || request.routing.arrivalAirport}
      />
      <DetailItem
        icon={<CalendarToday />}
        label="Departure Date & Time"
        value={format(request.routing.departureDate.toDate(), 'dd MMM yyyy, HH:mm')}
      />
      <DetailItem icon={<People />} label="Passengers" value={request.passengerCount} />
    </Box>
  </Box>
);

const RouteVisualizer = ({
  departureAirportDetails,
  arrivalAirportDetails,
}: {
  departureAirportDetails: Airport | null;
  arrivalAirportDetails: Airport | null;
}) => {
  const [departureCityImageUrl, setDepartureCityImageUrl] = useState<string | null>(null);
  const [arrivalCityImageUrl, setArrivalCityImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      const [depUrl, arrUrl] = await Promise.all([
        departureAirportDetails
          ? getCityImageUrlWithFallback(departureAirportDetails)
          : Promise.resolve(null),
        arrivalAirportDetails
          ? getCityImageUrlWithFallback(arrivalAirportDetails)
          : Promise.resolve(null),
      ]);
      setDepartureCityImageUrl(depUrl);
      setArrivalCityImageUrl(arrUrl);
      setLoading(false);
    };
    fetchImages();
  }, [departureAirportDetails, arrivalAirportDetails]);

  const staticMapUrl =
    departureAirportDetails && arrivalAirportDetails && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      ? `https://maps.googleapis.com/maps/api/staticmap?size=600x300&maptype=roadmap&markers=color:red|label:A|${departureAirportDetails.latitude},${departureAirportDetails.longitude}&markers=color:red|label:B|${arrivalAirportDetails.latitude},${arrivalAirportDetails.longitude}&path=color:0x0000ff|weight:2|${departureAirportDetails.latitude},${departureAirportDetails.longitude}|${arrivalAirportDetails.latitude},${arrivalAirportDetails.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      : '';

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box
      sx={{
        mb: 3,
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: '1fr auto 1fr auto 1fr',
        },
        gap: 2,
        alignItems: 'stretch',
      }}
    >
      {/* From Image */}
      <Box
        sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
      >
        <Box sx={{ height: 200, position: 'relative', backgroundColor: 'grey.200' }}>
          {departureCityImageUrl && (
            <Image
              src={departureCityImageUrl}
              alt={departureAirportDetails?.name || 'Departure'}
              layout="fill"
              objectFit="cover"
            />
          )}
        </Box>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {departureAirportDetails?.city || 'Departure'}
          </Typography>
          {departureAirportDetails?.icao && (
            <Typography variant="body2" color="text.secondary">
              {departureAirportDetails.name} ({departureAirportDetails.icao})
            </Typography>
          )}
        </Box>
      </Box>

      {/* Arrow */}
      <Box
        sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center' }}
      >
        <ArrowForward sx={{ fontSize: 32, color: 'text.secondary' }} />
      </Box>

      {/* To Image */}
      <Box
        sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
      >
        <Box sx={{ height: 200, position: 'relative', backgroundColor: 'grey.200' }}>
          {arrivalCityImageUrl && (
            <Image
              src={arrivalCityImageUrl}
              alt={arrivalAirportDetails?.name || 'Arrival'}
              layout="fill"
              objectFit="cover"
            />
          )}
        </Box>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {arrivalAirportDetails?.city || 'Arrival'}
          </Typography>
          {arrivalAirportDetails?.icao && (
            <Typography variant="body2" color="text.secondary">
              {arrivalAirportDetails.name} ({arrivalAirportDetails.icao})
            </Typography>
          )}
        </Box>
      </Box>

      {/* Spacer */}
      <Box
        sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center' }}
      >
        <ArrowForward sx={{ fontSize: 32, visibility: 'hidden' }} />
      </Box>

      {/* Map */}
      <Box
        sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
      >
        <Box sx={{ height: 200, position: 'relative', backgroundColor: 'grey.200' }}>
          {staticMapUrl && (
            <Image src={staticMapUrl} alt="Route Map" layout="fill" objectFit="cover" />
          )}
        </Box>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Route Map
          </Typography>
          <Typography variant="body2" color="text.secondary">
            &nbsp;
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const AdditionalOptions = ({ request }: { request: QuoteRequest }) => {
  const hasDetails =
    request.baggageDetails ||
    request.petDetails ||
    request.hardBagsDetails ||
    request.additionalNotes;

  const hasTickedOptions =
    request.twinEngineMin ||
    request.pressurisedCabin ||
    request.twoCrewMin ||
    request.hasExtraBaggage ||
    request.hasPets ||
    request.hasHardBags;

  // Render nothing if no options were selected and no details provided.
  if (!hasDetails && !hasTickedOptions) {
    return null;
  }

  return (
    <Accordion
      defaultExpanded
      sx={{
        mb: 3,
        backgroundColor: 'transparent',
        backgroundImage: 'none',
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        '&:before': {
          display: 'none',
        },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="h6">Additional Options</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <FlightTakeoff fontSize="small" />
              Aircraft Options
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', pl: 2 }}>
              <FormControlLabel
                control={<Checkbox checked={!!request.twinEngineMin} disabled />}
                label="Twin Engine Minimum"
              />
              <FormControlLabel
                control={<Checkbox checked={!!request.pressurisedCabin} disabled />}
                label="Pressurised Cabin"
              />
              <FormControlLabel
                control={<Checkbox checked={!!request.twoCrewMin} disabled />}
                label="Two Crew Minimum"
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Luggage fontSize="small" />
              Baggage Options
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', pl: 2 }}>
              <FormControlLabel
                control={<Checkbox checked={!!request.hasExtraBaggage} disabled />}
                label="Extra Baggage"
              />
              <FormControlLabel
                control={<Checkbox checked={!!request.hasPets} disabled />}
                label="Traveling with Pets"
              />
              <FormControlLabel
                control={<Checkbox checked={!!request.hasHardBags} disabled />}
                label="Hard Bags"
              />
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          {request.baggageDetails && (
            <TextField
              label="Extra Baggage Details"
              value={request.baggageDetails}
              fullWidth
              multiline
              InputProps={{ readOnly: true }}
              variant="outlined"
              sx={{ mb: 2 }}
            />
          )}
          {request.petDetails && (
            <TextField
              label="Pet Details"
              value={request.petDetails}
              fullWidth
              multiline
              InputProps={{ readOnly: true }}
              variant="outlined"
              sx={{ mb: 2 }}
            />
          )}
          {request.hardBagsDetails && (
            <TextField
              label="Hard Bag Details"
              value={request.hardBagsDetails}
              fullWidth
              multiline
              InputProps={{ readOnly: true }}
              variant="outlined"
              sx={{ mb: 2 }}
            />
          )}
          {request.additionalNotes && (
            <TextField
              label="Additional Notes"
              value={request.additionalNotes}
              fullWidth
              multiline
              InputProps={{ readOnly: true }}
              variant="outlined"
              sx={{ mb: 2 }}
            />
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default function QuoteRequestDetails({
  request,
  departureAirportDetails,
  arrivalAirportDetails,
}: QuoteRequestDetailsProps) {
  return (
    <Box>
      <TopBar
        request={request}
        departureAirportDetails={departureAirportDetails}
        arrivalAirportDetails={arrivalAirportDetails}
      />
      <RouteVisualizer
        departureAirportDetails={departureAirportDetails}
        arrivalAirportDetails={arrivalAirportDetails}
      />
      <AdditionalOptions request={request} />
    </Box>
  );
}
