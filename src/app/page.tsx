'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
  styled
} from '@mui/material';
import type { GridProps as MuiGridProps } from '@mui/material';
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import BookingForm from '@/components/BookingForm';

// Define props that are specific to Grid containers and should be omitted for items
type GridContainerPropsKeys = 'container' | 'columns' | 'columnSpacing' | 'direction' | 'rowSpacing' | 'spacing' | 'wrap';
// Define breakpoint props that GridItem will handle and convert to the 'size' object
type BreakpointKeys = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Props that are allowed to be passed through to the underlying Grid item,
// omitting container-specific props and the breakpoint/size props we're transforming.
type AllowedPassthroughGridProps = Omit<MuiGridProps, GridContainerPropsKeys | BreakpointKeys | 'size'>;

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
    <Grid {...otherProps} {...(Object.keys(sizeBreakpoints).length > 0 ? { size: sizeBreakpoints } : {})}>
      {children}
    </Grid>
  );
};

const PLACEHOLDER_BASE = "https://placehold.co";
const BRAND_COLORS = {
  navy: "1A2B3C",
  gold: "C4A962",
};

const destinations = [
  { 
    name: 'Cape Town', 
    image: `${PLACEHOLDER_BASE}/800x1200/1A2B3C/FFFFFF?text=Cape+Town`,
    description: 'Experience the Mother City'
  },
  { 
    name: 'Johannesburg', 
    image: `${PLACEHOLDER_BASE}/800x1200/1A2B3C/FFFFFF?text=Johannesburg`,
    description: 'The City of Gold'
  },
  { 
    name: 'Durban', 
    image: `${PLACEHOLDER_BASE}/800x1200/1A2B3C/FFFFFF?text=Durban`,
    description: 'The Warmest Place to Be'
  }
];

const aircraft = [
  { 
    name: 'Light Jets', 
    image: `${PLACEHOLDER_BASE}/600x400/1A2B3C/FFFFFF?text=Light+Jets`,
    description: 'Perfect for short trips'
  },
  { 
    name: 'Midsize Jets', 
    image: `${PLACEHOLDER_BASE}/600x400/1A2B3C/FFFFFF?text=Midsize+Jets`,
    description: 'Ideal for regional flights'
  },
  { 
    name: 'Heavy Jets', 
    image: `${PLACEHOLDER_BASE}/600x400/1A2B3C/FFFFFF?text=Heavy+Jets`,
    description: 'Long-range luxury'
  },
  { 
    name: 'VIP Airliners', 
    image: `${PLACEHOLDER_BASE}/600x400/1A2B3C/FFFFFF?text=VIP+Airliners`,
    description: 'Ultimate luxury travel'
  }
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
    transition: 'transform 0.3s ease-in-out'
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

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    departureDate: '',
    passengers: '1'
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box 
        component="section" 
        sx={{ 
          position: 'relative', 
          minHeight: 600, 
          height: '100vh',
          mt: -12,
        }}
      >
        {/* Background with overlay */}
        <Box 
          sx={{ 
            position: 'absolute', 
            inset: 0,
            bgcolor: theme.palette.mode === 'dark' 
              ? 'primary.dark' 
              : 'cream.lighter',
            backgroundImage: theme.palette.mode === 'dark' 
              ? 'linear-gradient(to bottom right, #0b3746, #072530, #000000)'
              : 'none',
          }}
        >
          {/* Decorative elements */}
          <Box 
            sx={{ 
              position: 'absolute', 
              inset: 0, 
              opacity: 0.05,
              backgroundImage: 'url(/patterns/grid.svg)',
              backgroundRepeat: 'repeat'
            }}
          />
        </Box>
        {/* Hero Video Background */}
        <Box
          component="video"
          src="/images/hero/Charter. Landing.mp4"
          autoPlay
          muted
          loop
          playsInline
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Hero Content */}
        <Box 
          sx={{ 
            position: 'relative', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center' 
          }}
        >
          <Container>
            <Box 
              sx={{ 
                maxWidth: 1200, 
                mx: 'auto',
              }}
            >
              <Grid container spacing={2} alignItems="center" justifyContent={{ xs: 'center', md: 'flex-end' }}>
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
                        fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem', lg: '4rem' },
                        color: theme.palette.common.white,
                        mb: { xs: 2, sm: 3 },
                        lineHeight: 1.2,
                        fontWeight: 700,
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
                      }}
                    >
                      The Worlds First and Only Charter Marketplace.
                      {!isMobile && <br />}
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        color: theme.palette.common.white,
                        mb: { xs: 4, sm: 6 },
                        fontWeight: 400,
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
                      }}
                    >
                      Transparent quoting direct from aircraft operators.
                    </Typography>
                  </Box>
                </GridItem>
              </Grid>
              
              {/* Search Flight Form (remains below the two-column text) */}
              <BookingForm />
            </Box>
          </Container>
        </Box>
      </Box>

      {/* Featured Destinations */}
      <Box 
        component="section" 
        sx={{ 
          py: { xs: 6, sm: 8, md: 10 },
          bgcolor: 'background.default'
        }}
      >
        <Container>
          <Typography 
            variant="h2" 
            align="center" 
            gutterBottom
            sx={{ 
              fontFamily: 'var(--font-playfair)',
              mb: { xs: 4, sm: 6 },
              color: 'primary.main'
            }}
          >
            Popular Destinations
          </Typography>
          
          <Grid container spacing={3}>
            {destinations.map((city) => (
              <GridItem xs={12} sm={6} md={4} key={city.name}>
                <DestinationCard>
                  <Box 
                    sx={{ 
                      position: 'relative',
                      height: '100%',
                      width: '100%'
                    }}
                  >
                    <Image
                      src={city.image}
                      alt={city.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ 
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease-in-out'
                      }}
                    />
                  </Box>
                  <DestinationOverlay>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontFamily: 'var(--font-playfair)',
                        color: 'common.white',
                        mb: 0.5
                      }}
                    >
                      {city.name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    >
                      {city.description}
                    </Typography>
                  </DestinationOverlay>
                </DestinationCard>
              </GridItem>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Aircraft Showcase */}
      <Box 
        component="section" 
        sx={{ 
          py: { xs: 6, sm: 8, md: 10 },
          bgcolor: 'background.paper'
        }}
      >
        <Container>
          <Typography 
            variant="h2" 
            align="center" 
            gutterBottom
            sx={{ 
              fontFamily: 'var(--font-playfair)',
              mb: { xs: 4, sm: 6 },
              color: 'primary.main'
            }}
          >
            Our Fleet
          </Typography>
          
          <Grid container spacing={3}>
            {aircraft.map((item) => (
              <GridItem xs={12} sm={6} lg={3} key={item.name}>
                <Card 
                  sx={{ 
                    height: '100%',
                    boxShadow: 2,
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardMedia
                    component="div"
                    sx={{ 
                      height: { xs: 200, sm: 220, md: 240 },
                      position: 'relative'
                    }}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  </CardMedia>
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      align="center" 
                      gutterBottom
                      sx={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      {item.name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      align="center"
                      color="text.secondary"
                    >
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
              </GridItem>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Empty Legs Section */}
      <Box 
        component="section" 
        sx={{ 
          py: { xs: 6, sm: 8, md: 10 },
          bgcolor: 'primary.main',
          color: 'common.white'
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
                  mb: { xs: 2, sm: 3 }
                }}
              >
                Empty Leg Flights
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  mb: { xs: 3, sm: 4 }
                }}
              >
                Take advantage of exclusive deals on empty leg flights. Save up to 75% on private jet travel.
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
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                View Available Flights
              </Button>
            </GridItem>
            <GridItem xs={12} md={6}>
              <Box 
                sx={{ 
                  position: 'relative',
                  height: { xs: 300, sm: 350, md: 400 },
                  borderRadius: 3,
                  overflow: 'hidden'
                }}
              >
                <Image
                  src={`${PLACEHOLDER_BASE}/800x600/${BRAND_COLORS.gold}/${BRAND_COLORS.navy}?text=Empty+Leg+Flights`}
                  alt="Empty leg flight promotion"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                />
              </Box>
            </GridItem>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: { xs: 4, sm: 6 },
          bgcolor: 'primary.dark',
          color: 'common.white'
        }}
      >
        <Container>
          <Grid container spacing={4}>
            <GridItem xs={12} sm={6} md={3}>
              <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Image
                  src={`${PLACEHOLDER_BASE}/240x80/${BRAND_COLORS.gold}/FFFFFF?text=CHARTER`}
                  alt="Charter Logo" 
                  width={120} 
                  height={40} 
                />
              </Box>
              <Typography 
                variant="body2" 
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
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
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }} 
          />
          
          <Typography 
            variant="body2" 
            align="center"
            sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            © 2024 Charter. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
