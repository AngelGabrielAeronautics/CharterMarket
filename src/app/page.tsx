'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  Paper,
  Card,
  CardMedia,
  CardContent,
  Stack,
  List,
  ListItem,
  Divider,
  InputAdornment,
  styled,
  CircularProgress,
} from '@mui/material';
import type { GridProps as MuiGridProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import BookingForm from '@/components/BookingForm';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';

// Define props that are specific to Grid containers and should be omitted for items
type GridContainerPropsKeys =
  | 'container'
  | 'columns'
  | 'columnSpacing'
  | 'direction'
  | 'rowSpacing'
  | 'spacing'
  | 'wrap';
// Define breakpoint props that GridItem will handle and convert to the 'size' object
type BreakpointKeys = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Props that are allowed to be passed through to the underlying Grid item,
// omitting container-specific props and the breakpoint/size props we're transforming.
type AllowedPassthroughGridProps = Omit<
  MuiGridProps,
  GridContainerPropsKeys | BreakpointKeys | 'size'
>;

// Define the GridItem component props type
interface GridItemProps extends AllowedPassthroughGridProps {
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean; // Added for completeness
  children?: React.ReactNode;
}

// Create a custom GridItem component to transform breakpoint props to the 'size' object
const GridItem: React.FC<GridItemProps> = ({
  children,
  xs,
  sm,
  md,
  lg,
  xl,
  ...otherProps // These are the AllowedPassthroughGridProps
}) => {
  const sizeBreakpoints: { [key: string]: number | 'auto' } = {};

  // Helper to map boolean 'true' to 'auto' and validate numbers for GridSize (1-12)
  const mapToGridSizeValue = (val: number | boolean | undefined): number | 'auto' | undefined => {
    if (typeof val === 'number' && val >= 1 && val <= 12) return val;
    if (val === true) return 'auto';
    return undefined; // Invalid numbers, false, or undefined are ignored
  };

  const xsValue = mapToGridSizeValue(xs);
  if (xsValue !== undefined) sizeBreakpoints.xs = xsValue;

  const smValue = mapToGridSizeValue(sm);
  if (smValue !== undefined) sizeBreakpoints.sm = smValue;

  const mdValue = mapToGridSizeValue(md);
  if (mdValue !== undefined) sizeBreakpoints.md = mdValue;

  const lgValue = mapToGridSizeValue(lg);
  if (lgValue !== undefined) sizeBreakpoints.lg = lgValue;

  const xlValue = mapToGridSizeValue(xl);
  if (xlValue !== undefined) sizeBreakpoints.xl = xlValue;

  // Pass the transformed 'size' prop if any breakpoints were defined, along with other valid props
  return (
    <Grid
      {...otherProps}
      {...(Object.keys(sizeBreakpoints).length > 0 ? { size: sizeBreakpoints } : {})}
    >
      {children}
    </Grid>
  );
};

const PLACEHOLDER_BASE = 'https://placehold.co';
const BRAND_COLORS = {
  navy: '0b3847',
  gold: 'C4A962',
};

const destinations = [
  {
    name: 'Cape Town',
    image: '/images/destinations/cape-town.jpg',
    description: 'Experience the Mother City',
  },
  {
    name: 'Johannesburg',
    image: '/images/destinations/johannesburg.jpg',
    description: 'The City of Gold',
  },
  {
    name: 'Durban',
    image: '/images/destinations/durban.jpg',
    description: 'The Warmest Place to Be',
  },
];

const aircraft = [
  {
    name: 'Light Jets',
    image: '/images/aircraft/light-jets.jpg',
    description: 'Perfect for short trips',
  },
  {
    name: 'Midsize Jets',
    image: '/images/aircraft/midsize-jets.jpg',
    description: 'Ideal for regional flights',
  },
  {
    name: 'Heavy Jets',
    image: '/images/aircraft/heavy-jets.jpg',
    description: 'Long-range luxury',
  },
  {
    name: 'VIP Airliners',
    image: '/images/aircraft/vip-airliners.jpg',
    description: 'Ultimate luxury travel',
  },
];

const emptyLegs = [
  {
    operator: 'MercAir',
    verified: false,
    route: 'Johannesburg -> Cape Town',
    date: '29 July, Mon',
    passengers: 8,
    flightPrice: 3400,
    seatPrice: null,
    image: '/images/hero/landing-temp.jpg',
  },
  {
    operator: 'MercAir',
    verified: true,
    route: 'Johannesburg -> Cape Town',
    date: '29 July, Mon',
    passengers: 8,
    flightPrice: 3400,
    seatPrice: 640,
    image: '/images/hero/landing-temp.jpg',
  },
  {
    operator: 'MercAir',
    verified: true,
    route: 'Johannesburg -> Cape Town',
    date: '29 July, Mon',
    passengers: 8,
    flightPrice: 3400,
    seatPrice: 640,
    image: '/images/hero/landing-temp.jpg',
  },
];

// Styled components for destination card
const DestinationCard = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: 400,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  cursor: 'pointer',
  '&:hover img': {
    transform: 'scale(1.05)',
    transition: 'transform 0.3s ease-in-out',
  },
  [theme.breakpoints.down('md')]: {
    height: 350,
  },
  [theme.breakpoints.down('sm')]: {
    height: 300,
  },
}));

const DestinationOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'linear-gradient(to top, rgba(26, 43, 60, 0.9), transparent)',
  padding: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

// Styled components for footer links
const FooterLink = styled(Link)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.7)',
  textDecoration: 'none',
  fontSize: '0.875rem',
  '&:hover': {
    color: '#ffffff',
    transition: 'color 0.2s ease-in-out',
  },
  [theme.breakpoints.up('sm')]: {
    fontSize: '1rem',
  },
}));

interface EmptyLeg {
  operator: string;
  verified: boolean;
  route: string;
  date: string;
  passengers: number;
  flightPrice: number;
  seatPrice: number | null;
  image: string;
}

const EmptyLegCard: React.FC<{ leg: EmptyLeg }> = ({ leg }) => {
  const theme = useTheme();
  const formattedFlightPrice = leg.flightPrice.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  });
  const formattedSeatPrice = leg.seatPrice
    ? leg.seatPrice.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      })
    : 'n/a';

  return (
    <Paper
      elevation={leg.verified ? 0 : 3}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        mb: 2,
        bgcolor: leg.verified ? 'grey.50' : '#0B3D59',
        color: leg.verified ? `#${BRAND_COLORS.navy}` : 'common.white',
        border: leg.verified ? 1 : 0,
        borderColor: 'grey.300',
      }}
    >
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center' }}>
        <Typography variant="caption">{leg.operator}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption">{leg.verified ? 'VERIFIED' : 'UNVERIFIED'} OPERATOR</Typography>
        {leg.verified && (
          <CheckCircleIcon color="success" sx={{ fontSize: 16, ml: 0.5, color: '#D4AF37' }} />
        )}
      </Box>
      <Box sx={{ position: 'relative', height: 120 }}>
        <Image src={leg.image} alt={leg.route} fill style={{ objectFit: 'cover' }} />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: leg.verified
              ? 'linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.7))'
              : 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.5))',
          }}
        >
          <Typography 
            variant="h5" 
            fontWeight="bold"
            sx={{
              color: leg.verified ? `#${BRAND_COLORS.navy}` : 'common.white'
            }}
          >
            {leg.route}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <Typography 
          variant="body2"
          sx={{ color: leg.verified ? `#${BRAND_COLORS.navy}` : 'common.white' }}
        >
          {leg.date}
        </Typography>
        <Box sx={{ mx: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PeopleIcon 
            sx={{ 
              fontSize: 18,
              color: leg.verified ? `#${BRAND_COLORS.navy}` : 'common.white'
            }} 
          />
          <Typography 
            variant="body2"
            sx={{ color: leg.verified ? `#${BRAND_COLORS.navy}` : 'common.white' }}
          >
            max {leg.passengers}
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ textAlign: 'right' }}>
          <Typography 
            variant="caption"
            sx={{ color: leg.verified ? `#${BRAND_COLORS.navy}` : 'common.white' }}
          >
            Flight
          </Typography>
          <Typography 
            variant="h6" 
            fontWeight="bold" 
            lineHeight={1}
            sx={{ color: leg.verified ? `#${BRAND_COLORS.navy}` : 'common.white' }}
          >
            {formattedFlightPrice}
          </Typography>
          <Typography 
            variant="caption"
            sx={{ color: leg.verified ? `#${BRAND_COLORS.navy}` : 'common.white' }}
          >
            Seat {formattedSeatPrice}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

// Image component with fallback
const ImageWithFallback: React.FC<{
  src: string;
  alt: string;
  fallbackText: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ src, alt, fallbackText, className, style }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <Box
        className={className}
        sx={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1A2B3C',
          color: 'white',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          textAlign: 'center',
          position: 'relative',
          ...style
        }}
      >
        {fallbackText}
      </Box>
    );
  }

  return (
    <>
      {isLoading && (
        <Box
          className={className}
          sx={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            position: 'absolute',
            inset: 0
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        style={{
          objectFit: 'cover',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
          ...style
        }}
        onError={handleError}
        onLoad={handleLoad}
        className={className}
      />
    </>
  );
};

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    departureDate: '',
    passengers: '1',
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        component="section"
        sx={{
          position: 'relative',
          minHeight: { xs: 450, sm: 500, md: 600 },
          height: { xs: '100vh', sm: '100vh', md: '100vh' },
          mt: { xs: -8, sm: -10, md: -12 },
          overflow: 'hidden', // Prevent any content overflow
        }}
      >
        {/* Background with overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: theme.palette.mode === 'dark' ? 'primary.dark' : 'cream.lighter',
            backgroundImage:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(to bottom right, #0b3746, #072530, #000000)'
                : 'linear-gradient(135deg, #1A2B3C 0%, #2C4155 50%, #1A2B3C 100%)',
            // Add fallback background image for mobile
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              backgroundImage: 'url(/images/hero/landing-temp.jpg), linear-gradient(135deg, #1A2B3C 0%, #2C4155 50%, #1A2B3C 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: { xs: 0.7, md: 0.3 },
              zIndex: -1
            }
          }}
        >
          {/* Decorative elements */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: 0.05,
              backgroundImage: 'url(/patterns/grid.svg)',
              backgroundRepeat: 'repeat',
            }}
          />
        </Box>
        {/* Hero Video Background */}
        <Box
          component="video"
          src="/images/hero/Charter. Landing1.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          webkit-playsinline="true"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(0.85)', // Scale down video
            width: '120%', // Slightly larger than container to maintain coverage
            height: '120%',
            objectFit: 'cover',
            // Fallback gradient background for when video doesn't load/play
            background: 'linear-gradient(135deg, #1A2B3C 0%, #2C4155 50%, #1A2B3C 100%)',
            // Hide video on very slow connections or if it fails to load
            '&:not([src])': {
              display: 'none'
            }
          }}
        />
        {/* Hero Content */}
        <Box
          sx={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Container>
            <Box
              sx={{
                maxWidth: 1200,
                mx: 'auto',
              }}
            >
              <Grid
                container
                spacing={2}
                alignItems="center"
                justifyContent={{ xs: 'center', md: 'flex-end' }}
              >
                {/* Left Column (empty or for future content) */}
                <GridItem xs={12} md={6}>
                  {/* This column can be used for an image or other content later */}
                  {/* For now, it creates the two-column effect */}
                </GridItem>

                {/* Right Column for Text */}
                <GridItem xs={12} md={6}>
                  <Box sx={{ textAlign: { xs: 'center', md: 'right' } }}>
                    <Typography
                      variant="h1"
                      sx={{
                        fontFamily: 'var(--font-playfair)',
                        fontSize: { 
                          xs: '1.5rem', // Smaller for iPhone SE
                          sm: '2.2rem', 
                          md: '3.5rem', 
                          lg: '4rem' 
                        },
                        color: theme.palette.common.white,
                        mb: { xs: 1, sm: 1.5, md: 3 }, // Reduced bottom margin for mobile
                        lineHeight: { xs: 1.05, sm: 1.15, md: 1.2 }, // Tighter line height
                        fontWeight: 700,
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
                        // Special handling for very small screens
                        '@media (max-width: 380px)': {
                          fontSize: '1.3rem',
                          lineHeight: 1.0,
                          mb: 0.5,
                        }
                      }}
                    >
                      The Worlds First and Only
                      <br />
                      <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
                        Charter Market.
                      </Box>
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        color: theme.palette.common.white,
                        mb: { xs: 2, sm: 3, md: 6 }, // Reduced spacing
                        fontSize: { 
                          xs: '0.875rem', // Smaller subtitle for mobile
                          sm: '1.1rem', 
                          md: '1.5rem' 
                        },
                        fontWeight: 400,
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
                        // Special handling for very small screens
                        '@media (max-width: 380px)': {
                          fontSize: '0.8rem',
                          mb: 1.5,
                        }
                      }}
                    >
                      Transparent quoting direct from aircraft operators.
                    </Typography>
                  </Box>
                </GridItem>
              </Grid>

              {/* Search Flight Form (remains below the two-column text) */}
              <Box sx={{ 
                mt: { xs: 2, sm: 3, md: 4 }, // Add top margin for spacing from text
                mb: { xs: 4, sm: 6, md: 8 }, // Add bottom margin for mobile scrolling
                '@media (max-width: 380px)': {
                  mt: 1.5, // Smaller margin for very small screens
                  mb: 3, // Ensure mobile has enough bottom space
                }
              }}>
                <BookingForm />
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* Empty Legs Section */}
      <Box
        component="section"
        sx={{
          py: { xs: 6, sm: 8, md: 10 },
          bgcolor: 'primary.main',
          color: 'common.white',
        }}
      >
        <Container>
          <Grid container spacing={4} alignItems="center">
            <GridItem xs={12} md={6}>
              <Typography
                variant="h2"
                gutterBottom
                sx={{
                  fontFamily: 'var(--font-playfair)',
                  color: 'common.white',
                  mb: { xs: 2, sm: 3 },
                }}
              >
                Empty Leg Flights
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  mb: { xs: 3, sm: 4 },
                }}
              >
                Take advantage of exclusive deals on empty leg flights. Save up to 75% on private
                jet travel.
              </Typography>
              <Button
                component={Link}
                href="/empty-legs"
                variant="outlined"
                color="secondary"
                size="large"
                sx={{
                  borderRadius: 2,
                  color: 'common.white',
                  borderColor: 'common.white',
                  '&:hover': {
                    borderColor: 'secondary.light',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                View Available Flights
              </Button>
            </GridItem>
            <GridItem xs={12} md={6}>
              <Grid container spacing={2}>
                {emptyLegs.slice(0, 3).map((leg, index) => (
                  <GridItem xs={12} key={index}>
                    <EmptyLegCard leg={leg} />
                  </GridItem>
                ))}
              </Grid>
            </GridItem>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: { xs: 4, sm: 6, md: 8 },
          bgcolor: `#${BRAND_COLORS.navy}`,
          color: 'common.white',
        }}
      >
        <Container>
          <Grid container spacing={4}>
            <GridItem xs={12} sm={6} md={3}>
              <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Image
                  src="/branding/logos/light/charter logo - dark mode.png"
                  alt="Charter Logo"
                  width={120}
                  height={40}
                  priority
                />
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Your trusted partner in private aviation
              </Typography>
            </GridItem>

            <GridItem xs={12} sm={6} md={3}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontFamily: 'var(--font-playfair)',
                  mb: 2,
                  color: 'common.white',
                }}
              >
                Quick Links
              </Typography>
              <Stack spacing={1}>
                <FooterLink href="/about">About Us</FooterLink>
                <FooterLink href="/fleet">Our Fleet</FooterLink>
                <FooterLink href="/contact">Contact</FooterLink>
              </Stack>
            </GridItem>

            <GridItem xs={12} sm={6} md={3}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontFamily: 'var(--font-playfair)',
                  mb: 2,
                  color: 'common.white',
                }}
              >
                Services
              </Typography>
              <Stack spacing={1}>
                <FooterLink href="/charter">Private Charter</FooterLink>
                <FooterLink href="/empty-legs">Empty Legs</FooterLink>
                <FooterLink href="/membership">Membership</FooterLink>
              </Stack>
            </GridItem>

            <GridItem xs={12} sm={6} md={3}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontFamily: 'var(--font-playfair)',
                  mb: 2,
                  color: 'common.white',
                }}
              >
                Contact Us
              </Typography>
              <Stack spacing={1} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <Typography variant="body2">+27 XXX XXX XXX</Typography>
                <Typography variant="body2">info@chartermarket.app</Typography>
                <Typography variant="body2">Cape Town, South Africa</Typography>
              </Stack>
            </GridItem>
          </Grid>

          <Divider
            sx={{
              my: { xs: 3, sm: 4 },
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          />

          <Typography variant="body2" align="center" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            © 2024 Charter. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
