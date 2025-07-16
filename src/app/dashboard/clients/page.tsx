'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentClients, useAllClients, useClientDeletion } from '@/hooks/useClients';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  Flight as FlightIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { format } from 'date-fns';
import { Client } from '@/types/client';

export default function ClientsPage() {
  const { user, userRole } = useAuth();
  const isAdmin = userRole === 'admin' || userRole === 'superAdmin';
  const {
    clients: agentClients,
    loading: agentLoading,
    error: agentError,
    refreshClients: refreshAgentClients,
  } = useAgentClients(user?.userCode);
  const {
    clients: allClients,
    loading: allLoading,
    error: allError,
    refreshClients: refreshAllClients,
  } = useAllClients();
  const { deleteClient, loading: deleteLoading } = useClientDeletion();
  const router = useRouter();

  // Use different data sources based on user role
  const clients = isAdmin ? allClients : agentClients;
  const loading = isAdmin ? allLoading : agentLoading;
  const error = isAdmin ? allError : agentError;
  const refreshClients = isAdmin ? refreshAllClients : refreshAgentClients;

  // State for search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Handlers for pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handler for search
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Filter clients based on search term
  const filteredClients = clients.filter((client) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      client.firstName.toLowerCase().includes(searchTermLower) ||
      client.lastName.toLowerCase().includes(searchTermLower) ||
      client.email.toLowerCase().includes(searchTermLower) ||
      (client.company && client.company.toLowerCase().includes(searchTermLower)) ||
      client.clientId.toLowerCase().includes(searchTermLower)
    );
  });

  // Paginate the filtered clients
  const paginatedClients = filteredClients.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Delete dialog handlers
  const handleOpenDeleteDialog = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const handleDeleteClient = async () => {
    if (clientToDelete) {
      await deleteClient(clientToDelete.id);
      handleCloseDeleteDialog();
      refreshClients();
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="h6">Please sign in to view clients.</Typography>
      </Box>
    );
  }

  // Check if user is authorized
  if (userRole !== 'agent' && userRole !== 'admin' && userRole !== 'superAdmin') {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          You are not authorized to access this page. Only agents and admins can manage clients.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold" color="primary.main">
          {isAdmin ? 'All Clients' : 'My Clients'}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => router.push('/dashboard/clients/add')}
        >
          Add New Client
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search clients..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ 
              minWidth: 300,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                boxShadow: 'none',
                '&:hover': {
                  borderColor: '#e0e0e0',
                  boxShadow: 'none',
                },
                '&.Mui-focused': {
                  borderColor: '#e0e0e0',
                  boxShadow: 'none',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e0e0e0',
                  borderWidth: '1px',
                },
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#e0e0e0',
                borderWidth: '1px',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={1}>
            <Chip
              icon={<PersonIcon />}
              label={`${clients.filter((c) => c.clientType === 'individual').length} Individuals`}
            />
            <Chip
              icon={<BusinessIcon />}
              label={`${clients.filter((c) => c.clientType === 'corporate').length} Corporate`}
            />
            <Tooltip title="Refresh">
              <span>
                <IconButton onClick={refreshClients} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {clients.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" gutterBottom>
                  You don't have any clients yet.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => router.push('/dashboard/clients/add')}
                  startIcon={<AddIcon />}
                  sx={{ mt: 2 }}
                >
                  Add Your First Client
                </Button>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Client ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        {isAdmin && <TableCell>Agent</TableCell>}
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedClients.map((client) => (
                        <TableRow key={client.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {client.clientId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {client.clientType === 'corporate' ? (
                                <BusinessIcon
                                  fontSize="small"
                                  sx={{ mr: 1, color: 'text.secondary' }}
                                />
                              ) : (
                                <PersonIcon
                                  fontSize="small"
                                  sx={{ mr: 1, color: 'text.secondary' }}
                                />
                              )}
                              <Box>
                                <Typography variant="body2">
                                  {client.firstName} {client.lastName}
                                </Typography>
                                {client.company && (
                                  <Typography variant="caption" color="text.secondary">
                                    {client.company}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={client.clientType === 'corporate' ? 'Corporate' : 'Individual'}
                              size="small"
                              color={client.clientType === 'corporate' ? 'primary' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>{client.phone || '-'}</TableCell>
                          {isAdmin && (
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {client.agentUserCode}
                              </Typography>
                            </TableCell>
                          )}
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <Tooltip title="Book Flight">
                                <IconButton
                                  component={Link}
                                  href={`/dashboard/quotes/request?client=${client.id}`}
                                  size="small"
                                  color="primary"
                                >
                                  <FlightIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="View Details">
                                <IconButton
                                  component={Link}
                                  href={`/dashboard/clients/${client.id}`}
                                  size="small"
                                >
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton
                                  component={Link}
                                  href={`/dashboard/clients/${client.id}/edit`}
                                  size="small"
                                  color="info"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  onClick={() => handleOpenDeleteDialog(client)}
                                  size="small"
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredClients.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Client</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {clientToDelete?.firstName} {clientToDelete?.lastName}?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteClient}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
