import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  FlightTakeoff as FlightIcon,
} from '@mui/icons-material';
import { useOperatorBookings } from '@/hooks/useBookings';
import { getOperatorSubmittedQuotes } from '@/lib/quote';
import { getUserDataByUserCode } from '@/lib/user';
import { formatCurrency } from '../../../shared/utils/utils';

interface ClientValue {
  clientId: string;
  clientName: string;
  company: string | null;
  totalValue: number;
  bookingCount: number;
}

interface ClientQuoteStats {
  clientId: string;
  clientName: string;
  company: string | null;
  acceptedQuotes: number;
  totalQuotes: number;
  acceptanceRate: number;
}

interface OperatorKPIsProps {
  operatorUserCode: string;
}

const OperatorKPIs: React.FC<OperatorKPIsProps> = ({ operatorUserCode }) => {
  const { bookings, loading: bookingsLoading, error: bookingsError } = useOperatorBookings(operatorUserCode);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [quotesError, setQuotesError] = useState<string | null>(null);
  const [clientNames, setClientNames] = useState<Record<string, { name: string; company: string | null }>>({});
  const [topClientsByValue, setTopClientsByValue] = useState<ClientValue[]>([]);
  const [topClientsByQuotes, setTopClientsByQuotes] = useState<ClientQuoteStats[]>([]);
  const [totalSales, setTotalSales] = useState(0);

  // Fetch quotes
  useEffect(() => {
    const fetchQuotes = async () => {
      if (!operatorUserCode) return;
      
      try {
        setQuotesLoading(true);
        const operatorQuotes = await getOperatorSubmittedQuotes(operatorUserCode);
        setQuotes(operatorQuotes);
      } catch (error) {
        console.error('Error fetching quotes:', error);
        setQuotesError('Failed to load quotes');
      } finally {
        setQuotesLoading(false);
      }
    };

    fetchQuotes();
  }, [operatorUserCode]);

  // Fetch client names for all unique client IDs
  useEffect(() => {
    const fetchClientNames = async () => {
      const uniqueClientIds = new Set<string>();
      
      // Collect client IDs from bookings
      bookings.forEach(booking => {
        if (booking.clientId) {
          uniqueClientIds.add(booking.clientId);
        }
      });

      // Collect client IDs from quotes
      quotes.forEach(quote => {
        if (quote.clientUserCode) {
          uniqueClientIds.add(quote.clientUserCode);
        }
      });

      const namePromises = Array.from(uniqueClientIds).map(async (clientId) => {
        try {
          const userData = await getUserDataByUserCode(clientId);
          return {
            clientId,
            name: userData ? `${userData.firstName} ${userData.lastName}` : clientId,
            company: userData?.company || null,
          };
        } catch (error) {
          console.error(`Error fetching user data for ${clientId}:`, error);
          return {
            clientId,
            name: clientId,
            company: null,
          };
        }
      });

      try {
        const resolvedNames = await Promise.all(namePromises);
        const nameMap = resolvedNames.reduce((acc, item) => {
          acc[item.clientId] = { name: item.name, company: item.company };
          return acc;
        }, {} as Record<string, { name: string; company: string | null }>);
        
        setClientNames(nameMap);
      } catch (error) {
        console.error('Error resolving client names:', error);
      }
    };

    if (bookings.length > 0 || quotes.length > 0) {
      fetchClientNames();
    }
  }, [bookings, quotes]);

  // Calculate KPIs
  useEffect(() => {
    if (!bookings.length && !quotes.length) return;

    // Calculate total sales from confirmed bookings
    const confirmedBookings = bookings.filter(
      booking => booking.status === 'confirmed' || booking.status === 'client-ready' || booking.status === 'flight-ready'
    );
    
    const totalRevenue = confirmedBookings.reduce((sum, booking) => {
      return sum + (booking.payment?.totalAmount || 0);
    }, 0);
    
    setTotalSales(totalRevenue);

    // Calculate top clients by value
    const clientValueMap = new Map<string, ClientValue>();
    
    confirmedBookings.forEach(booking => {
      const clientId = booking.clientId;
      const value = booking.payment?.totalAmount || 0;
      
      if (!clientValueMap.has(clientId)) {
        clientValueMap.set(clientId, {
          clientId,
          clientName: clientNames[clientId]?.name || clientId,
          company: clientNames[clientId]?.company || null,
          totalValue: 0,
          bookingCount: 0,
        });
      }
      
      const client = clientValueMap.get(clientId)!;
      client.totalValue += value;
      client.bookingCount += 1;
      clientValueMap.set(clientId, client);
    });

    const sortedByValue = Array.from(clientValueMap.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
    
    setTopClientsByValue(sortedByValue);

    // Calculate top clients by number of accepted quotes
    const clientQuoteMap = new Map<string, ClientQuoteStats>();
    
    quotes.forEach(quote => {
      const clientId = quote.clientUserCode;
      if (!clientId) return;
      
      if (!clientQuoteMap.has(clientId)) {
        clientQuoteMap.set(clientId, {
          clientId,
          clientName: clientNames[clientId]?.name || clientId,
          company: clientNames[clientId]?.company || null,
          acceptedQuotes: 0,
          totalQuotes: 0,
          acceptanceRate: 0,
        });
      }
      
      const client = clientQuoteMap.get(clientId)!;
      client.totalQuotes += 1;
      
      if (quote.offerStatus === 'accepted-by-client') {
        client.acceptedQuotes += 1;
      }
      
      client.acceptanceRate = (client.acceptedQuotes / client.totalQuotes) * 100;
      clientQuoteMap.set(clientId, client);
    });

    const sortedByQuotes = Array.from(clientQuoteMap.values())
      .sort((a, b) => b.acceptedQuotes - a.acceptedQuotes)
      .slice(0, 5);
    
    setTopClientsByQuotes(sortedByQuotes);
  }, [bookings, quotes, clientNames]);

  const isLoading = bookingsLoading || quotesLoading;
  const hasError = bookingsError || quotesError;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (hasError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {bookingsError || quotesError}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Key Performance Indicators
      </Typography>
      
             <Grid container spacing={3}>
         {/* Total Sales Card */}
         <Grid size={{ xs: 12, md: 4 }}>
           <Card sx={{ height: '100%' }}>
             <CardContent>
               <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                 <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                   <MoneyIcon />
                 </Avatar>
                 <Box>
                   <Typography variant="h6" fontWeight="medium">
                     Total Sales
                   </Typography>
                   <Typography variant="body2" color="text.secondary">
                     Confirmed bookings
                   </Typography>
                 </Box>
               </Box>
               <Typography variant="h4" fontWeight="bold" color="success.main">
                 {formatCurrency(totalSales)}
               </Typography>
               <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                 From {bookings.filter(b => 
                   b.status === 'confirmed' || b.status === 'client-ready' || b.status === 'flight-ready'
                 ).length} confirmed bookings
               </Typography>
             </CardContent>
           </Card>
         </Grid>

         {/* Top 5 Clients by Value */}
         <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="medium">
                    Top Clients by Revenue
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Highest revenue clients
                  </Typography>
                </Box>
              </Box>
              
              {topClientsByValue.length > 0 ? (
                <List dense>
                  {topClientsByValue.map((client, index) => (
                    <React.Fragment key={client.clientId}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight="medium">
                                {client.clientName}
                              </Typography>
                              {client.company && (
                                <Chip
                                  label={client.company}
                                  size="small"
                                  variant="outlined"
                                  sx={{ ml: 1, fontSize: 10 }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="success.main" fontWeight="medium">
                                {formatCurrency(client.totalValue)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {client.bookingCount} booking{client.bookingCount !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < topClientsByValue.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No confirmed bookings yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

                 {/* Top 5 Clients by Accepted Quotes */}
         <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <FlightIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="medium">
                    Top Clients by Quotes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Most accepted quotes
                  </Typography>
                </Box>
              </Box>
              
              {topClientsByQuotes.length > 0 ? (
                <List dense>
                  {topClientsByQuotes.map((client, index) => (
                    <React.Fragment key={client.clientId}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight="medium">
                                {client.clientName}
                              </Typography>
                              {client.company && (
                                <Chip
                                  label={client.company}
                                  size="small"
                                  variant="outlined"
                                  sx={{ ml: 1, fontSize: 10 }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="primary.main" fontWeight="medium">
                                {client.acceptedQuotes} accepted quotes
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {client.acceptanceRate.toFixed(1)}% rate ({client.totalQuotes} total)
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < topClientsByQuotes.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No quote data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OperatorKPIs; 