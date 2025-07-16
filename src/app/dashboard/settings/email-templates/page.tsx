'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Stack,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  Edit as EditIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Visibility as VisibilityIcon,
  Category as CategoryIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { SystemEmailTemplate, EmailTemplateCategory, SYSTEM_EMAIL_TEMPLATES } from '@/types/email';
import { toast } from 'react-hot-toast';

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
      id={`template-tabpanel-${index}`}
      aria-labelledby={`template-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface TemplateWithContent extends SystemEmailTemplate {
  currentHtml: string;
  currentText: string;
  currentSubject: string;
  fileContent: string;
  lastModified: string;
  error?: string;
}

export default function EmailTemplatesPage() {
  const { user, userRole } = useAuth();
  const theme = useTheme();
  const [templates, setTemplates] = useState<TemplateWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithContent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [filterCategory, setFilterCategory] = useState<EmailTemplateCategory | 'all'>('all');
  const [editingTemplate, setEditingTemplate] = useState({
    subject: '',
    htmlContent: '',
    textContent: '',
  });
  const [previewData, setPreviewData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);

  // Check authorization
  useEffect(() => {
    if (userRole !== 'superAdmin') {
      toast.error('Access denied. Super admin privileges required.');
    }
  }, [userRole]);

  // Load templates
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/email-templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
      } else {
        toast.error('Failed to load email templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Error loading email templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'superAdmin') {
      loadTemplates();
    }
  }, [userRole]);

  const handleOpenTemplate = (template: TemplateWithContent) => {
    setSelectedTemplate(template);
    setEditingTemplate({
      subject: template.currentSubject,
      htmlContent: template.currentHtml,
      textContent: template.currentText,
    });
    setPreviewData(null); // Clear previous preview data
    setDialogOpen(true);
    setTabValue(0);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/email-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingTemplate),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Template updated successfully');
        setDialogOpen(false);
        loadTemplates(); // Reload to get updated content
      } else {
        toast.error(data.error || 'Failed to update template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Error saving template');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async (template?: TemplateWithContent, openDialog: boolean = false) => {
    if (openDialog && template) {
      setSelectedTemplate(template);
      setDialogOpen(true);
      setTabValue(2); // Switch to Preview tab
    }
    
    const templateToUse = template || selectedTemplate;
    if (!templateToUse) return;

    try {
      const sampleData: any = {};
      templateToUse.variables.forEach(variable => {
        sampleData[variable.name] = variable.example;
      });

      const response = await fetch(`/api/admin/email-templates/${templateToUse.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sampleData }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const data = await response.json();
      setPreviewData(data.preview);
      setTabValue(2); // Switch to preview tab
    } catch (error) {
      console.error('Error generating preview:', error);
      // Handle error appropriately
    }
  };

  const handleTestSend = async () => {
    if (!selectedTemplate || !user?.email) return;

    setTestSending(true);
    try {
      const sampleData: any = {};
      selectedTemplate.variables.forEach(variable => {
        sampleData[variable.name] = variable.example;
      });

      const response = await fetch(`/api/admin/email-templates/${selectedTemplate.id}/test-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          adminEmail: user.email,
          sampleData 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test email');
      }

      const data = await response.json();
      
      toast.success(`Test email sent successfully to ${user.email}!`);
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email. Please try again.');
    } finally {
      setTestSending(false);
    }
  };

  const getCategoryColor = (category: EmailTemplateCategory) => {
    const colors = {
      auth: theme.palette.primary.main,
      notification: theme.palette.info.main,
      booking: theme.palette.success.main,
      admin: theme.palette.warning.main,
      marketing: theme.palette.secondary.main,
    };
    return colors[category];
  };

  const filteredTemplates = filterCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === filterCategory);

  if (userRole !== 'superAdmin') {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          Access denied. This page requires super admin privileges.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Email Templates
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and customize email templates used throughout the Charter platform.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Tooltip title="Refresh templates">
            <IconButton onClick={loadTemplates} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 4 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Category</InputLabel>
          <Select
            value={filterCategory}
            label="Filter by Category"
            onChange={(e) => setFilterCategory(e.target.value as EmailTemplateCategory | 'all')}
          >
            <MenuItem value="all">All Categories</MenuItem>
            <MenuItem value="auth">Authentication</MenuItem>
            <MenuItem value="notification">Notifications</MenuItem>
            <MenuItem value="booking">Booking</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="marketing">Marketing</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Templates Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)'
            },
            gap: 3
          }}
        >
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id}
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderLeft: `4px solid ${getCategoryColor(template.category)}`,
                '&:hover': {
                  boxShadow: theme.shadows[4],
                }
              }}
            >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" fontWeight="bold">
                      {template.name}
                    </Typography>
                    <Chip 
                      label={template.category} 
                      size="small" 
                      sx={{ 
                        backgroundColor: getCategoryColor(template.category),
                        color: 'white',
                        textTransform: 'capitalize',
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {template.description}
                  </Typography>

                  {template.error && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {template.error}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ScheduleIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Last modified: {new Date(template.lastModified).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {template.variables.length} variable{template.variables.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenTemplate(template)}
                    disabled={!!template.error}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<PreviewIcon />}
                    onClick={() => handlePreview(template, true)}
                    disabled={!!template.error}
                  >
                    Preview
                  </Button>
                                 </CardActions>
               </Card>
           ))}
         </Box>
       )}

      {/* Edit Template Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Edit Template: {selectedTemplate?.name}
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Edit" icon={<EditIcon />} />
            <Tab label="Variables" icon={<InfoIcon />} />
            <Tab label="Preview" icon={<PreviewIcon />} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Stack spacing={3}>
              <TextField
                label="Subject"
                fullWidth
                value={editingTemplate.subject}
                onChange={(e) => setEditingTemplate(prev => ({ ...prev, subject: e.target.value }))}
              />
              
              <TextField
                label="HTML Content"
                fullWidth
                multiline
                rows={12}
                value={editingTemplate.htmlContent}
                onChange={(e) => setEditingTemplate(prev => ({ ...prev, htmlContent: e.target.value }))}
                sx={{ fontFamily: 'monospace' }}
              />
              
              <TextField
                label="Text Content (Fallback)"
                fullWidth
                multiline
                rows={8}
                value={editingTemplate.textContent}
                onChange={(e) => setEditingTemplate(prev => ({ ...prev, textContent: e.target.value }))}
                sx={{ fontFamily: 'monospace' }}
              />
            </Stack>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {selectedTemplate && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Available Variables
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Use these variables in your template by wrapping them in ${'${}'} syntax.
                </Typography>
                
                <List>
                  {selectedTemplate.variables.map((variable, index) => (
                    <React.Fragment key={variable.name}>
                      <ListItem>
                        <ListItemIcon>
                          <CodeIcon color={variable.required ? 'error' : 'action'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <code>${'{' + variable.name + '}'}</code>
                              {variable.required && (
                                <Chip label="Required" size="small" color="error" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2">{variable.description}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Example: {variable.example}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < selectedTemplate.variables.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {previewData ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Email Preview
                </Typography>
                
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>HTML Preview</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box 
                      sx={{ 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1, 
                        p: 2,
                        backgroundColor: 'background.default'
                      }}
                      dangerouslySetInnerHTML={{ __html: previewData.html }}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Text Preview</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                      <Typography 
                        component="pre" 
                        sx={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.875rem',
                          whiteSpace: 'pre-wrap',
                          margin: 0
                        }}
                      >
                        {previewData.text}
                      </Typography>
                    </Paper>
                  </AccordionDetails>
                </Accordion>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography color="text.secondary">
                  Click "Generate Preview" to see how this template will look with sample data.
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<PreviewIcon />} 
                  onClick={() => handlePreview()}
                  sx={{ mt: 2 }}
                >
                  Generate Preview
                </Button>
              </Box>
            )}
          </TabPanel>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving || testSending}>
            Cancel
          </Button>
                    <Tooltip title={`Send a test email with sample data to ${user?.email || 'your admin email'}`}>
            <span>
              <Button 
                variant="outlined" 
                startIcon={<SendIcon />} 
                onClick={handleTestSend}
                disabled={saving || testSending || !user?.email}
                color="info"
              >
                {testSending ? 'Sending...' : 'Test Send'}
              </Button>
            </span>
          </Tooltip>
          <Button 
            variant="outlined" 
            startIcon={<PreviewIcon />} 
            onClick={() => handlePreview()}
            disabled={saving || testSending}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSaveTemplate}
            disabled={saving || testSending}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 