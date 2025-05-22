import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  WarningAmber as WarningIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Article as ArticleIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { format, addDays, isBefore } from 'date-fns';

// Mock data for operators
const mockOperators = [
  {
    id: 'op1',
    name: 'Luxury Jets',
    code: 'OP-JETS-ABCD',
    contactPerson: 'John Doe',
    email: 'john@luxuryjets.com',
    phone: '+27 82 123 4567',
    status: 'active',
    approvalDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    documentStatus: 'valid',
    documentsExpiry: addDays(new Date(), 90),
    alertSent: false,
  },
  {
    id: 'op2',
    name: 'AirStar Executive',
    code: 'OP-AIRS-EFGH',
    contactPerson: 'Jane Smith',
    email: 'jane@airstar.com',
    phone: '+27 83 987 6543',
    status: 'active',
    approvalDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    documentStatus: 'expiring',
    documentsExpiry: addDays(new Date(), 15),
    alertSent: true,
  },
  {
    id: 'op3',
    name: 'Elite Air',
    code: 'OP-ELIT-IJKL',
    contactPerson: 'Robert Johnson',
    email: 'robert@eliteair.com',
    phone: '+27 84 567 8901',
    status: 'pending',
    approvalDate: null,
    documentStatus: 'incomplete',
    documentsExpiry: null,
    alertSent: false,
  },
  {
    id: 'op4',
    name: 'Sky High Jets',
    code: 'OP-SKYH-MNOP',
    contactPerson: 'Michael Brown',
    email: 'michael@skyhigh.com',
    phone: '+27 85 432 1098',
    status: 'suspended',
    approvalDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    documentStatus: 'expired',
    documentsExpiry: addDays(new Date(), -10),
    alertSent: true,
  },
];

// Mock data for documents
const mockDocuments = [
  {
    id: 'doc1',
    operatorId: 'op1',
    type: 'Air Operator Certificate',
    issueDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    expiryDate: addDays(new Date(), 90),
    documentNumber: 'AOC-12345-2023',
    status: 'valid',
    fileUrl: '/documents/aoc-luxury-jets.pdf',
  },
  {
    id: 'doc2',
    operatorId: 'op1',
    type: 'Insurance Certificate',
    issueDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    expiryDate: addDays(new Date(), 180),
    documentNumber: 'INS-67890-2023',
    status: 'valid',
    fileUrl: '/documents/insurance-luxury-jets.pdf',
  },
  {
    id: 'doc3',
    operatorId: 'op2',
    type: 'Air Operator Certificate',
    issueDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
    expiryDate: addDays(new Date(), 65),
    documentNumber: 'AOC-54321-2023',
    status: 'valid',
    fileUrl: '/documents/aoc-airstar.pdf',
  },
  {
    id: 'doc4',
    operatorId: 'op2',
    type: 'Insurance Certificate',
    issueDate: new Date(Date.now() - 350 * 24 * 60 * 60 * 1000),
    expiryDate: addDays(new Date(), 15),
    documentNumber: 'INS-09876-2023',
    status: 'expiring',
    fileUrl: '/documents/insurance-airstar.pdf',
  },
];

interface OperatorManagementProps {
  onViewDetails?: (operatorId: string) => void;
}

export default function OperatorManagement({ onViewDetails }: OperatorManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isOperatorDialogOpen, setIsOperatorDialogOpen] = useState(false);
  const [operatorAction, setOperatorAction] = useState<'approve' | 'suspend' | 'delete' | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Filter operators based on search query
  const filteredOperators = mockOperators.filter(
    (operator) =>
      operator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      operator.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      operator.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      operator.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get documents for selected operator
  const operatorDocuments = selectedOperator
    ? mockDocuments.filter((doc) => doc.operatorId === selectedOperator)
    : [];

  // Get operator details
  const operatorDetails = selectedOperator
    ? mockOperators.find((op) => op.id === selectedOperator)
    : null;

  const handleViewDocuments = (operatorId: string) => {
    setSelectedOperator(operatorId);
    setIsDocumentDialogOpen(true);
  };

  const handleOperatorAction = (operatorId: string, action: 'approve' | 'suspend' | 'delete') => {
    setSelectedOperator(operatorId);
    setOperatorAction(action);
    setIsOperatorDialogOpen(true);
  };

  const handleConfirmAction = () => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsOperatorDialogOpen(false);
      setSelectedOperator(null);
      setOperatorAction(null);
      // In a real app, we would update the operator status
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'info';
      case 'suspended':
        return 'error';
      case 'expired':
      case 'expiring':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getDocumentStatusText = (status: string) => {
    switch (status) {
      case 'valid':
        return 'Valid';
      case 'expiring':
        return 'Expiring Soon';
      case 'expired':
        return 'Expired';
      case 'incomplete':
        return 'Incomplete';
      default:
        return status;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight="bold">
            Operator Management
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} href="/admin/operators/new">
            New Operator
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search operators..."
            size="small"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="outlined" startIcon={<FilterIcon />} sx={{ minWidth: 100 }}>
            Filter
          </Button>
        </Box>
      </Box>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Operator</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Document Status</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell>Reminders</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOperators.map((operator) => (
              <TableRow key={operator.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        mr: 1.5,
                      }}
                    >
                      <BusinessIcon />
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {operator.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {operator.code}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{operator.contactPerson}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {operator.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={operator.status.charAt(0).toUpperCase() + operator.status.slice(1)}
                    color={getStatusColor(operator.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getDocumentStatusText(operator.documentStatus)}
                    color={getStatusColor(operator.documentStatus) as any}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {operator.documentsExpiry ? (
                    <Typography variant="body2">
                      {format(operator.documentsExpiry, 'dd MMM yyyy')}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      N/A
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={operator.alertSent ? 'Sent' : 'Not Sent'}
                    color={operator.alertSent ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Tooltip title="View Documents">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDocuments(operator.id)}
                        sx={{ mr: 0.5 }}
                      >
                        <ArticleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {operator.status === 'pending' ? (
                      <Tooltip title="Approve">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleOperatorAction(operator.id, 'approve')}
                          sx={{ mr: 0.5 }}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : operator.status === 'active' ? (
                      <Tooltip title="Suspend">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleOperatorAction(operator.id, 'suspend')}
                          sx={{ mr: 0.5 }}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Activate">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleOperatorAction(operator.id, 'approve')}
                          sx={{ mr: 0.5 }}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => onViewDetails && onViewDetails(operator.id)}
                      >
                        <ArrowForwardIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filteredOperators.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">No operators found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Documents Dialog */}
      <Dialog
        open={isDocumentDialogOpen}
        onClose={() => setIsDocumentDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BusinessIcon sx={{ mr: 1.5 }} />
            <Typography variant="h6">{operatorDetails?.name} Documents</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {operatorDocuments.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Document Type</TableCell>
                    <TableCell>Document #</TableCell>
                    <TableCell>Issue Date</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {operatorDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>{doc.documentNumber}</TableCell>
                      <TableCell>{format(doc.issueDate, 'dd MMM yyyy')}</TableCell>
                      <TableCell>{format(doc.expiryDate, 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <Chip
                          label={getDocumentStatusText(doc.status)}
                          color={getStatusColor(doc.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="outlined">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No documents found for this operator.</Alert>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Upload New Document
            </Typography>
            <Grid container spacing={2}>
              <Grid
                size={{
                  xs: 12,
                  sm: 6
                }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Document Type</InputLabel>
                  <Select label="Document Type" value="">
                    <MenuItem value="aoc">Air Operator Certificate</MenuItem>
                    <MenuItem value="insurance">Insurance Certificate</MenuItem>
                    <MenuItem value="maintenance">Maintenance Records</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 6
                }}>
                <Button variant="outlined" fullWidth component="label">
                  Select File
                  <input type="file" hidden />
                </Button>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDocumentDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => setIsDocumentDialogOpen(false)}
            disabled={operatorDocuments.length === 0}
          >
            Send Reminder
          </Button>
        </DialogActions>
      </Dialog>
      {/* Operator Action Dialog */}
      <Dialog open={isOperatorDialogOpen} onClose={() => setIsOperatorDialogOpen(false)}>
        <DialogTitle>
          {operatorAction === 'approve'
            ? 'Approve Operator'
            : operatorAction === 'suspend'
              ? 'Suspend Operator'
              : 'Delete Operator'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            {operatorAction === 'approve'
              ? 'Are you sure you want to approve this operator?'
              : operatorAction === 'suspend'
                ? 'Are you sure you want to suspend this operator? They will not be able to submit quotes or access their flights.'
                : 'Are you sure you want to delete this operator? This action cannot be undone.'}
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {operatorDetails?.name} ({operatorDetails?.code})
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOperatorDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={
              operatorAction === 'approve'
                ? 'success'
                : operatorAction === 'suspend'
                  ? 'warning'
                  : 'error'
            }
            onClick={handleConfirmAction}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
          >
            {isLoading
              ? 'Processing...'
              : operatorAction === 'approve'
                ? 'Approve'
                : operatorAction === 'suspend'
                  ? 'Suspend'
                  : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
