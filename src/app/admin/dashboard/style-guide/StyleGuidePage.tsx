'use client';

import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Grid,
  Button,
  Alert,
  InputAdornment,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  TextField,
  IconButton,
  Divider,
  styled,
  type GridProps,
  Container,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Banner from '@/components/Banner';
import { colors } from '@/theme/theme';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import tokens from '@/styles/tokens';
import { ThemeProvider, useTheme } from '@mui/material/styles';
import { lightTheme, darkTheme } from '@/theme/theme';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`style-guide-tabpanel-${index}`}
      aria-labelledby={`style-guide-tab-${index}`}
      sx={{ width: '100%', p: 3 }}
      {...other}
    >
      {value === index && children}
    </Box>
  );
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

// Define the GridItem component props type for Material UI v7
interface GridItemProps extends GridProps {
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  children?: React.ReactNode;
}

// Create a custom GridItem component to work with Material UI v7
const GridItem: React.FC<GridItemProps> = ({ children, ...props }) => (
  <Grid component="div" item {...props}>{children}</Grid>
);

// Color palette rendering
const renderColorPalette = () => {
  const theme = useTheme();
  const paletteTokens = tokens.color;
  const swatchSize = theme.spacing(6);
  return (
    <StyledGrid container spacing={3}>
      {Object.entries(paletteTokens).map(([tokenName, token]) => (
        <GridItem xs={12} md={6} key={tokenName}>
          <Paper sx={{ p: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom>{tokenName}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: swatchSize,
                        height: swatchSize,
                  bgcolor: token.value,
                        borderRadius: '50%',
                        mr: theme.spacing(2),
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    />
                    <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary }}>{tokenName}</Typography>
                <Typography variant="body2" color="text.secondary">{token.value}</Typography>
                    </Box>
                  </Box>
          </Paper>
        </GridItem>
      ))}
    </StyledGrid>
  );
};

// Typography rendering
const renderTypography = () => {
  const theme = useTheme();
  
  return (
    <StyledGrid container spacing={3}>
      <GridItem xs={12}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom>Heading 3</Typography>
          <Typography variant="h4" gutterBottom>Heading 4</Typography>
          <Typography variant="h5" gutterBottom>Heading 5</Typography>
          <Typography variant="h6" gutterBottom>Heading 6</Typography>
          <Typography variant="subtitle1" gutterBottom>Subtitle 1</Typography>
          <Typography variant="subtitle2" gutterBottom>Subtitle 2</Typography>
          <Typography variant="body1" gutterBottom>Body 1: Lorem ipsum dolor sit amet, consectetur adipiscing elit.</Typography>
          <Typography variant="body2" gutterBottom>Body 2: Lorem ipsum dolor sit amet, consectetur adipiscing elit.</Typography>
          <Typography variant="button" display="block" gutterBottom>Button Text</Typography>
          <Typography variant="caption" display="block" gutterBottom>Caption Text</Typography>
          <Typography variant="overline" display="block" gutterBottom>Overline Text</Typography>
        </Paper>
      </GridItem>
      <GridItem xs={12}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>Font Properties</Typography>
          <Grid container spacing={2}>
            {Object.entries(theme.typography).map(([name, value]) => {
              // Only show simple properties, not objects or functions
              if (typeof value === 'string' || typeof value === 'number') {
                return (
                  <GridItem xs={6} md={4} key={name}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 120 }}>{name}:</Typography>
                      <Typography variant="body2" color="text.secondary">{value.toString()}</Typography>
                    </Box>
                  </GridItem>
                );
              }
              return null;
            })}
          </Grid>
        </Paper>
      </GridItem>
    </StyledGrid>
  );
};

// Button rendering
const renderButtons = () => {
  return (
    <StyledGrid container spacing={3}>
      <GridItem xs={12}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>Button Variants</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
            <Button variant="contained">Contained</Button>
            <Button variant="outlined">Outlined</Button>
            <Button variant="text">Text</Button>
          </Box>
          
          <Typography variant="h6" gutterBottom>Button Colors</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
            <Button variant="contained" color="primary">Primary</Button>
            <Button variant="contained" color="secondary">Secondary</Button>
            <Button variant="contained" color="success">Success</Button>
            <Button variant="contained" color="error">Error</Button>
            <Button variant="contained" color="warning">Warning</Button>
            <Button variant="contained" color="info">Info</Button>
          </Box>
          
          <Typography variant="h6" gutterBottom>Button Sizes</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4, alignItems: 'center' }}>
            <Button variant="contained" size="small">Small</Button>
            <Button variant="contained" size="medium">Medium</Button>
            <Button variant="contained" size="large">Large</Button>
          </Box>

          <Typography variant="h6" gutterBottom>Disabled Buttons</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button variant="contained" disabled>Disabled Contained</Button>
            <Button variant="outlined" disabled>Disabled Outlined</Button>
            <Button variant="text" disabled>Disabled Text</Button>
          </Box>
          <Typography variant="h6" gutterBottom>Modal Action Buttons</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Button variant="contained" fullWidth>Next</Button>
            <Button variant="text" fullWidth>Already have an account? Sign In</Button>
          </Box>
          <Typography variant="h6" gutterBottom>Select Account Type Buttons</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 4 }}>
            <Button variant="outlined" sx={{ flex: 1, flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <Typography variant="h6">Passenger</Typography>
              <Typography variant="body2">Book your flights quickly and easily.</Typography>
            </Button>
            <Button variant="outlined" sx={{ flex: 1, flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <Typography variant="h6">Agent/Broker</Typography>
              <Typography variant="body2">Manage bookings and client relationships.</Typography>
            </Button>
            <Button variant="outlined" sx={{ flex: 1, flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <Typography variant="h6">Operator</Typography>
              <Typography variant="body2">Oversee aircraft operations and schedules.</Typography>
            </Button>
          </Box>
        </Paper>
      </GridItem>
    </StyledGrid>
  );
};

// Form components rendering as React component
const ComponentsSection: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <StyledGrid container spacing={3} alignItems="flex-start">
      <GridItem xs={12}>
        <Alert severity="info" sx={{ mb: 3 }}>
          This section demonstrates the form components used throughout the application.
        </Alert>
      </GridItem>
      
      <GridItem xs={12} md={6}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>Text Inputs</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Standard" variant="outlined" />
            <TextField label="With Placeholder" placeholder="Enter text here" variant="outlined" />
            <TextField label="Disabled" disabled variant="outlined" />
            <TextField label="Error" error helperText="This field has an error" variant="outlined" />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      aria-label={showPassword ? 'hide password' : 'show password'}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </Paper>
      </GridItem>
      
      <GridItem xs={12} md={6}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>Selection Components</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Select</InputLabel>
              <Select label="Select" defaultValue="">
                <MenuItem value="">None</MenuItem>
                <MenuItem value="option1">Option 1</MenuItem>
                <MenuItem value="option2">Option 2</MenuItem>
                <MenuItem value="option3">Option 3</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl component="fieldset">
              <FormLabel component="legend">Checkboxes</FormLabel>
              <FormGroup>
                <FormControlLabel control={<Checkbox defaultChecked />} label="Option 1" />
                <FormControlLabel control={<Checkbox />} label="Option 2" />
                <FormControlLabel control={<Checkbox disabled />} label="Disabled" />
              </FormGroup>
            </FormControl>
            
            <FormControl component="fieldset">
              <FormLabel component="legend">Radio Buttons</FormLabel>
              <RadioGroup defaultValue="option1">
                <FormControlLabel value="option1" control={<Radio />} label="Option 1" />
                <FormControlLabel value="option2" control={<Radio />} label="Option 2" />
                <FormControlLabel value="disabled" control={<Radio disabled />} label="Disabled" />
              </RadioGroup>
            </FormControl>
          </Box>
        </Paper>
      </GridItem>
    </StyledGrid>
  );
};

// Insert renderShadows function
const renderShadows = () => {
  return (
    <StyledGrid container spacing={3}>
      <GridItem xs={12}>
        <Typography variant="h6" gutterBottom>Shadows & Elevation</Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Use consistent box-shadow styles across components.
        </Alert>
      </GridItem>
      {Object.entries(tokens.shadow).map(([key, token]) => (
        <GridItem xs={12} md={6} key={key}>
          <Typography variant="subtitle1" gutterBottom>
            {key.charAt(0).toUpperCase() + key.slice(1) + ' Shadow'}
          </Typography>
          <Paper sx={{ p: 4, boxShadow: token.value, borderRadius: 2, backgroundColor: 'background.paper', mb: 1 }}>
            <Typography variant="body2">Demo</Typography>
          </Paper>
          <Box component="pre" sx={{ fontFamily: 'monospace', p: 1 }}>
            {'box-shadow: ' + token.value + ';'}
          </Box>
        </GridItem>
      ))}
    </StyledGrid>
  );
};

// Define toast helper functions for notifications preview
const showToast = () => toast.success('This is a success toast notification!');
const showErrorToast = () => toast.error('This is an error toast notification!');
const showInfoToast = () => toast('This is an info toast notification!');
const showLoadingToast = () => {
  const loadingId = toast.loading('This is a loading toast notification...');
  setTimeout(() => toast.dismiss(loadingId), 2000);
};

// Notifications rendering helper
const renderNotifications = () => (
  <StyledGrid container spacing={3}>
    <GridItem xs={12}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>Toast Notifications</Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Toast notifications are used to provide feedback to users after actions or to show important information.
        </Alert>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Button variant="contained" color="success" onClick={showToast}>Show Success Toast</Button>
          <Button variant="contained" color="error" onClick={showErrorToast}>Show Error Toast</Button>
          <Button variant="contained" color="info" onClick={showInfoToast}>Show Info Toast</Button>
          <Button variant="contained" color="warning" onClick={showLoadingToast}>Show Loading Toast</Button>
        </Box>
      </Paper>
    </GridItem>
    <GridItem xs={12}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>Alert Types</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="success">This is a success alert — check it out!</Alert>
          <Alert severity="info">This is an info alert — check it out!</Alert>
          <Alert severity="warning">This is a warning alert — check it out!</Alert>
          <Alert severity="error">This is an error alert — check it out!</Alert>
        </Box>
      </Paper>
    </GridItem>
  </StyledGrid>
);

// Banners rendering helper
const renderBanners = () => (
  <StyledGrid container spacing={3}>
    <GridItem xs={12}>
      <Banner title="Default Banner" message="This is a default banner used throughout the application." variant="default" />
    </GridItem>
    <GridItem xs={12}>
      <Banner title="Success Banner" message="This is a success banner used to display successful operations." variant="success" />
    </GridItem>
    <GridItem xs={12}>
      <Banner title="Warning Banner" message="This is a warning banner used to alert users about potential issues." variant="warning" />
    </GridItem>
    <GridItem xs={12}>
      <Banner title="Error Banner" message="This is an error banner used to display critical errors." variant="error" />
    </GridItem>
  </StyledGrid>
);

// Shared style-guide content renderer
const renderStyleGuide = (value: number, onChange: (event: React.SyntheticEvent, newValue: number) => void) => (
  <Box sx={{ width: '100%', typography: 'body1' }}>
    <Typography variant="h4" gutterBottom>Design System</Typography>
    <Alert severity="info" sx={{ mb: 3 }}>
      This page provides an overview of the design elements and components used throughout the application.
      All components use Material-UI with our custom theme.
    </Alert>
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs value={value} onChange={onChange} aria-label="style guide tabs">
        <Tab label="Color System" />
        <Tab label="Typography" />
        <Tab label="Buttons" />
        <Tab label="Elevation" />
        <Tab label="Components" />
        <Tab label="Notifications" />
        <Tab label="Banners" />
      </Tabs>
    </Box>
    <TabPanel value={value} index={0}>{renderColorPalette()}</TabPanel>
    <TabPanel value={value} index={1}>{renderTypography()}</TabPanel>
    <TabPanel value={value} index={2}>{renderButtons()}</TabPanel>
    <TabPanel value={value} index={3}>{renderShadows()}</TabPanel>
    <TabPanel value={value} index={4}>
      <StyledGrid container spacing={3} alignItems="flex-start" justifyContent="center">
        <GridItem xs={12}>
          <Typography variant="h5" gutterBottom>Form Components</Typography>
          <ComponentsSection />
        </GridItem>
        <GridItem xs={12}>
          <Typography variant="h5" gutterBottom>Cards</Typography>
        </GridItem>
        <GridItem xs={12} md={6}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>Cards</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="subtitle1">Card Title</Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">Card content goes here.</Typography>
              </Card>
            </Box>
          </Paper>
        </GridItem>
      </StyledGrid>
    </TabPanel>
    <TabPanel value={value} index={5}>{renderNotifications()}</TabPanel>
    <TabPanel value={value} index={6}>{renderBanners()}</TabPanel>
  </Box>
);

const StyleGuidePage = () => {
  const [value, setValue] = useState(0);
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => setValue(newValue);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <GridItem xs={12} md={6}>
          <ThemeProvider theme={lightTheme}>
            <Typography variant="h5" color="text.primary" gutterBottom>Light Mode</Typography>
            {renderStyleGuide(value, handleChange)}
          </ThemeProvider>
        </GridItem>
        <GridItem xs={12} md={6}>
          <ThemeProvider theme={darkTheme}>
            <Typography variant="h5" color="text.primary" gutterBottom>Dark Mode</Typography>
            {renderStyleGuide(value, handleChange)}
          </ThemeProvider>
        </GridItem>
      </Grid>
    </Container>
  );
};

export default StyleGuidePage;