'use client';

import React, { useState } from 'react';
import { useClientDetail } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Business,
  Place,
  Notes,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  Flight as FlightIcon,
  FlightTakeoff as FlightTakeoffIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import Link from 'next/link';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`client-tabpanel-${index}`}
      aria-labelledby={`client-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ClientDetailsPage() {
  const { id } = useParams();
  const clientId = Array.isArray(id) ? id[0] : id;
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

  const { client, loading, error } = useClientDetail(clientId);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Check if user is authorized
  if (userRole !== 'agent' && userRole !== 'admin' && userRole !== 'superAdmin') {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          You are not authorized to access this page. Only agents and admins can view client
          details.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 4 }}>
        {error}
      </Alert>
    );
  }

  if (!client) {
    return (
      <Alert severity="info" sx={{ my: 4 }}>
        Client not found. The client may have been deleted or you don't have permission to view it.
      </Alert>
    );
  }

  // Format dates for display
  const createdAt = client.createdAt.toDate
    ? client.createdAt.toDate()
    : new Date(client.createdAt as any);
  const updatedAt = client.updatedAt.toDate
    ? client.updatedAt.toDate()
    : new Date(client.updatedAt as any);

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/dashboard/clients')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            {client.firstName} {client.lastName}
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Edit Client">
            <IconButton
              component={Link}
              href={`/dashboard/clients/${client.id}/edit`}
              color="primary"
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FlightTakeoffIcon />}
            component={Link}
            href={`/dashboard/quotes/request?client=${client.id}`}
          >
            Book Flight
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                }}
              >
                {client.clientType === 'corporate' ? (
                  <Business sx={{ fontSize: 32 }} />
                ) : (
                  <Person sx={{ fontSize: 32 }} />
                )}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="medium">
                  {client.firstName} {client.lastName}
                </Typography>
                <Chip
                  label={client.clientType === 'corporate' ? 'Corporate' : 'Individual'}
                  size="small"
                  color={client.clientType === 'corporate' ? 'primary' : 'default'}
                  variant="outlined"
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Client ID
            </Typography>
            <Typography variant="body1" fontFamily="monospace" sx={{ mb: 2 }}>
              {client.clientId}
            </Typography>

            <List disablePadding>
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Email fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={client.email}
                  secondary="Email"
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                />
              </ListItem>

              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Phone fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={client.phone || 'Not provided'}
                  secondary="Phone"
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                />
              </ListItem>

              {client.company && (
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Business fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={client.company}
                    secondary="Company"
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                </ListItem>
              )}

              {client.preferredAirport && (
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Place fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={client.preferredAirport}
                    secondary="Preferred Airport"
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                </ListItem>
              )}
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Created
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {format(createdAt, 'PPP')}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Last Updated
            </Typography>
            <Typography variant="body2">{format(updatedAt, 'PPP')}</Typography>

            {userRole === 'admin' || userRole === 'superAdmin' ? (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Agent
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {client.agentUserCode}
                </Typography>
              </>
            ) : null}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius: 2 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            >
              <Tab label="Details" id="client-tab-0" />
              <Tab label="Bookings" id="client-tab-1" />
              <Tab label="Documents" id="client-tab-2" />
            </Tabs>

            <Box sx={{ px: 3 }}>
              <TabPanel value={activeTab} index={0}>
                <Grid container spacing={3}>
                  {client.notes ? (
                    <Grid item xs={12}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          Notes
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                            {client.notes}
                          </Typography>
                        </Paper>
                      </Box>
                    </Grid>
                  ) : (
                    <Grid item xs={12}>
                      <Alert severity="info">No additional notes for this client.</Alert>
                    </Grid>
                  )}
                </Grid>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Client Bookings
                  </Typography>

                  {/* This would be populated with actual booking data in a production app */}
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No bookings found for this client.
                  </Alert>

                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<FlightTakeoffIcon />}
                    component={Link}
                    href={`/dashboard/quotes/request?client=${client.id}`}
                  >
                    Create New Booking
                  </Button>
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Client Documents
                  </Typography>

                  {/* This would be populated with actual document data in a production app */}
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No documents found for this client.
                  </Alert>

                  <Button variant="outlined" color="primary">
                    Upload Document
                  </Button>
                </Box>
              </TabPanel>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
