import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  Tooltip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import {
  Flag as FlagIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  Gavel as GavelIcon
} from '@mui/icons-material';
import AdminLayout from '../../components/admin/AdminLayout';

interface ContentItem {
  id: string;
  type: 'film' | 'comment' | 'user';
  title: string;
  author: string;
  status: 'pending' | 'approved' | 'rejected';
  flags: Flag[];
  createdAt: Date;
  updatedAt: Date;
  moderationHistory?: ModerationAction[];
  appealStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  appealMessage?: string;
  appealTimestamp?: Date;
}

interface Flag {
  id: string;
  type: 'inappropriate' | 'copyright' | 'spam' | 'other';
  description: string;
  reportedBy: string;
  reportedAt: Date;
}

interface ModerationAction {
  id: string;
  action: 'approve' | 'reject' | 'flag';
  notes: string;
  moderatorId: string;
  timestamp: Date;
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString();
};

const ContentModerationPage: React.FC = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const [standardsDialogOpen, setStandardsDialogOpen] = useState(false);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/moderation/content`);
      if (!response.ok) throw new Error('Failed to fetch content');
      const data = await response.json();
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      enqueueSnackbar('Failed to load content', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleReview = (content: ContentItem) => {
    setSelectedContent(content);
    setModerationNotes('');
    setReviewDialogOpen(true);
  };

  const handleModerationAction = async (action: 'approve' | 'reject') => {
    if (!selectedContent) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/moderation/content/${selectedContent.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action,
            notes: moderationNotes
          })
        }
      );

      if (!response.ok) throw new Error('Failed to moderate content');
      
      enqueueSnackbar(`Content ${action}d successfully`, { variant: 'success' });
      setReviewDialogOpen(false);
      fetchContent();
    } catch (err) {
      enqueueSnackbar('Failed to moderate content', { variant: 'error' });
    }
  };

  const handleAppeal = async (contentId: string, message: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/moderation/content/${contentId}/appeal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message })
        }
      );

      if (!response.ok) throw new Error('Failed to submit appeal');
      
      enqueueSnackbar('Appeal submitted successfully', { variant: 'success' });
      fetchContent();
    } catch (err) {
      enqueueSnackbar('Failed to submit appeal', { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Title', flex: 1 },
    { field: 'author', headerName: 'Author', flex: 1 },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={
            params.value === 'film'
              ? 'primary'
              : params.value === 'comment'
              ? 'secondary'
              : 'default'
          }
          size="small"
        />
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={
            params.value === 'approved'
              ? 'success'
              : params.value === 'pending'
              ? 'warning'
              : 'error'
          }
          size="small"
        />
      )
    },
    {
      field: 'flags',
      headerName: 'Flags',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          {params.value.length > 0 && (
            <Tooltip title={`${params.value.length} flags`}>
              <Chip
                icon={<FlagIcon />}
                label={params.value.length}
                color="error"
                size="small"
              />
            </Tooltip>
          )}
        </Box>
      )
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      flex: 1,
      valueFormatter: ({ value }) => formatDate(value as string)
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => handleReview(params.row as ContentItem)}
              color="primary"
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="View History">
            <IconButton
              size="small"
              color="info"
            >
              <HistoryIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const ContentStandards = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Content Standards
      </Typography>
      <Typography variant="body1" paragraph>
        Wylloh is dedicated to curating a library of exceptional films that exemplify the art of storytelling. Our standards are designed to ensure technical excellence while celebrating diverse voices and innovative approaches to filmmaking.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          These standards are a living document that will evolve with our community. We welcome feedback from filmmakers and viewers to help us maintain high quality while supporting diverse voices in cinema. Our goal is to create a platform that celebrates the art of filmmaking while remaining accessible to innovative creators.
        </Typography>
      </Alert>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Technical Requirements</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            To ensure optimal viewing experience, all submissions must meet these technical specifications:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>Resolution: Minimum 1920x1080 (Full HD)</li>
            <li>Frame Rate: 24fps, 25fps, or 30fps</li>
            <li>Audio: Stereo or 5.1 surround sound, minimum 48kHz/16-bit</li>
            <li>Format: MP4 (H.264) or MOV (ProRes)</li>
            <li>Subtitles: SRT or VTT format (if applicable)</li>
            <li>Runtime: Minimum 40 minutes for features</li>
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Storytelling Excellence</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            We seek films that demonstrate mastery in one or more of these areas:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>Narrative Coherence: Clear story structure and character development</li>
            <li>Visual Language: Purposeful cinematography and composition</li>
            <li>Sound Design: Thoughtful use of sound to enhance storytelling</li>
            <li>Pacing: Effective rhythm and flow of the narrative</li>
            <li>Originality: Fresh perspectives and innovative approaches</li>
            <li>Emotional Impact: Authentic connection with the audience</li>
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
            Note: These criteria are not meant to be prescriptive. We celebrate diverse storytelling approaches and recognize that excellence can manifest in many forms.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">AI Content Policy</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            Our platform prioritizes human creativity and artistic vision:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>AI-generated imagery and content will generally be rejected</li>
            <li>We value human craftsmanship and artistic intent</li>
            <li>AI tools may be used as supplementary aids (e.g., color grading, sound mixing)</li>
            <li>Bulk-generated or spam content will be rejected</li>
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
            Note: We evaluate each submission on its artistic merit and the role of AI in its creation. The focus is on the human creative vision behind the work.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Appeal Process</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            If you believe your content has been rejected in error, you may submit an appeal. Please include:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>Detailed explanation of your creative vision and approach</li>
            <li>Information about the production process and team</li>
            <li>Context about the artistic choices made in the film</li>
            <li>Any technical considerations that may have affected the submission</li>
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Appeals will be reviewed by our curation team within 48 hours. We aim to provide constructive feedback that helps filmmakers understand our decision and improve their work.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
        Wylloh's standards are designed to maintain a high-quality library while remaining inclusive of diverse voices and innovative approaches to filmmaking. We believe in the power of cinema to tell meaningful stories and connect with audiences on a profound level.
      </Typography>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Our Commitment to Growth
        </Typography>
        <Typography variant="body2" color="text.secondary">
          As we grow, we will:
          • Regularly review and update our standards based on community feedback
          • Consider emerging technologies and storytelling methods
          • Maintain transparency in our curation process
          • Support filmmakers in meeting our quality standards
        </Typography>
      </Box>
    </Box>
  );

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Content Moderation
          </Typography>
          <Button
            variant="outlined"
            startIcon={<GavelIcon />}
            onClick={() => setStandardsDialogOpen(true)}
          >
            View Standards
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Pending Review" />
            <Tab label="Approved" />
            <Tab label="Rejected" />
          </Tabs>
        </Paper>

        <Paper sx={{ height: 'calc(100vh - 250px)', width: '100%' }}>
          <DataGrid
            rows={content.filter(item => {
              if (selectedTab === 0) return item.status === 'pending';
              if (selectedTab === 1) return item.status === 'approved';
              return item.status === 'rejected';
            })}
            columns={columns}
            loading={loading}
            slots={{
              toolbar: GridToolbar
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 }
              }
            }}
            disableRowSelectionOnClick
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 }
              }
            }}
            pageSizeOptions={[10, 25, 50]}
          />
        </Paper>

        <Dialog
          open={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Review Content - {selectedContent?.title}
          </DialogTitle>
          <DialogContent>
            {selectedContent && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Content Details</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Type: {selectedContent.type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Author: {selectedContent.author}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Created: {formatDate(selectedContent.createdAt)}
                    </Typography>
                  </Grid>

                  {selectedContent.status === 'rejected' && (
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          If you believe this content has been rejected in error, please contact our moderation team at{' '}
                          <Link href="mailto:moderation@wylloh.com">moderation@wylloh.com</Link>
                        </Typography>
                      </Alert>
                    </Grid>
                  )}

                  {selectedContent.flags.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ mt: 2 }}>
                        Flags
                      </Typography>
                      {selectedContent.flags.map((flag) => (
                        <Box key={flag.id} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={flag.type}
                              color="error"
                              size="small"
                            />
                            <Typography variant="caption" color="text.secondary">
                              Reported by {flag.reportedBy} on {formatDate(flag.reportedAt)}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {flag.description}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                        </Box>
                      ))}
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Moderation Notes"
                      multiline
                      rows={4}
                      value={moderationNotes}
                      onChange={(e) => setModerationNotes(e.target.value)}
                      sx={{ mt: 2 }}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => handleModerationAction('reject')}
              color="error"
              startIcon={<CloseIcon />}
            >
              Reject
            </Button>
            <Button
              onClick={() => handleModerationAction('approve')}
              color="success"
              startIcon={<CheckIcon />}
            >
              Approve
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={standardsDialogOpen}
          onClose={() => setStandardsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Content Standards</DialogTitle>
          <DialogContent>
            <ContentStandards />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStandardsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default ContentModerationPage; 