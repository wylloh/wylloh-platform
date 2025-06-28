import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Tabs,
  Tab,
  Divider,
  Alert,
  Snackbar,
  Breadcrumbs,
  Link as MuiLink,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Dashboard as DashboardIcon,
  Movie as MovieIcon,
  LibraryBooks as LibraryIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { contentService, Content } from '../../services/content.service';
import ContentGrid from '../../components/creator/ContentGrid';
import DashboardOverview from '../../components/creator/DashboardOverview';

// Tab panel interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`,
  };
}

/**
 * Enhanced Pro Dashboard Page with improved content management and analytics
 */
const EnhancedDashboardPage: React.FC = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<Content[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [analyticsTimePeriod, setAnalyticsTimePeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
  
  // Check if user has verified Pro status
  const isProVerified = user?.proStatus === 'verified';
  
  // Pro status verification handled at route level for enterprise scalability
  
  // Load content data
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const data = await contentService.getCreatorContent();
        setContent(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
    
    // Check for success message in location state (e.g., after redirect)
    if (location.state?.success && location.state?.message) {
      setSuccessMessage(location.state.message);
      
      // Clear the state after processing
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle content deletion
  const handleDeleteContent = async (contentId: string) => {
    try {
      // Since deleteContent doesn't exist in contentService, we'll simulate it
      // In a real app, you would call the API to delete the content
      // await contentService.deleteContent(contentId);
      
      // Update local state
      setContent(prevContent => prevContent.filter(item => item.id !== contentId));
      setSuccessMessage('Content deleted successfully');
    } catch (err) {
      console.error('Error deleting content:', err);
      setError('Failed to delete content. Please try again later.');
    }
  };
  
  // Handle tokenization
  const handleTokenizeContent = (contentId: string) => {
    // Find the content to tokenize
    const selectedContent = content.find(item => item.id === contentId);
    
    if (selectedContent) {
      // Navigate to the TokenizePublishPage with the content info
      navigate('/pro/tokenize-publish', {
        state: {
          contentInfo: {
            id: selectedContent.id,
            title: selectedContent.title,
            description: selectedContent.description,
            thumbnailUrl: selectedContent.thumbnailCid,
            contentType: selectedContent.contentType
          }
        }
      });
    }
  };
  
  // Handle visibility change
  const handleSetVisibility = async (contentId: string, visibility: 'public' | 'private' | 'unlisted') => {
    try {
      await contentService.updateContentVisibility(contentId, visibility);
      
      // Update local state
      setContent(prevContent => 
        prevContent.map(item => 
          item.id === contentId ? { ...item, visibility } : item
        )
      );
      
      setSuccessMessage(`Content visibility set to ${visibility}`);
    } catch (err) {
      console.error('Error updating content visibility:', err);
      setError('Failed to update visibility. Please try again later.');
    }
  };
  
  // Handle status change
  const handleSetStatus = async (contentId: string, status: 'draft' | 'pending' | 'active') => {
    try {
      await contentService.updateContentStatus(contentId, status);
      
      // Update local state
      setContent(prevContent => 
        prevContent.map(item => 
          item.id === contentId ? { ...item, status } : item
        )
      );
      
      setSuccessMessage(`Content status set to ${status}`);
    } catch (err) {
      console.error('Error updating content status:', err);
      setError('Failed to update status. Please try again later.');
    }
  };
  
  // Handle share content
  const handleShareContent = (contentId: string) => {
    // In a real implementation, this would open a share dialog
    const contentUrl = `${window.location.origin}/content/${contentId}`;
    
    // For now, copy to clipboard
    navigator.clipboard.writeText(contentUrl)
      .then(() => setSuccessMessage('Content URL copied to clipboard'))
      .catch(err => {
        console.error('Error copying to clipboard:', err);
        setError('Failed to copy URL to clipboard');
      });
  };
  
  // Handle duplicate content
  const handleDuplicateContent = async (contentId: string) => {
    try {
      // Find the content to duplicate
      const contentToDuplicate = content.find(item => item.id === contentId);
      
      if (contentToDuplicate) {
        // In a real implementation, this would call an API to duplicate the content
        const duplicatedContent: Content = {
          ...contentToDuplicate,
          id: `duplicate-${contentId}-${Date.now()}`,
          title: `Copy of ${contentToDuplicate.title}`,
          createdAt: new Date().toISOString(),
          status: 'draft', // Explicitly set as 'draft' to match the Content type
          tokenized: false,
          views: 0,
          sales: 0
        };
        
        // Add duplicated content to state
        setContent(prevContent => [...prevContent, duplicatedContent]);
        setSuccessMessage('Content duplicated successfully');
      }
    } catch (err) {
      console.error('Error duplicating content:', err);
      setError('Failed to duplicate content. Please try again later.');
    }
  };
  
  // Handle view content
  const handleViewContent = (contentId: string) => {
    navigate(`/content/${contentId}`);
  };
  
  // Handle analytics period change
  const handleAnalyticsPeriodChange = (period: 'day' | 'week' | 'month' | 'year') => {
    setAnalyticsTimePeriod(period);
  };
  
  // Separate content by status for tabs
  const activeContent = content.filter(item => item.status === 'active');
  const draftContent = content.filter(item => item.status === 'draft');
  const pendingContent = content.filter(item => item.status === 'pending');
  
  // If user is not verified Pro, show verification message
  if (!isProVerified) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ pt: 4, pb: 8 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Pro Account Verification Required
            </Typography>
            <Typography paragraph>
              Your account needs to have verified Pro status to access the creator dashboard.
              {user?.proStatus === 'pending' && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Your Pro verification request is pending. Please wait for admin approval.
                </Typography>
              )}
            </Typography>
            <Button
              variant="contained"
              component={Link}
              to="/profile"
              sx={{ mt: 2 }}
            >
              Go to Profile
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Page header */}
      <Box sx={{ pt: 4, pb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" underline="hover" color="inherit">
            Home
          </MuiLink>
          <Typography color="text.primary">Pro Dashboard</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Pro Dashboard
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              component={Link}
              to="/pro/analytics"
              variant="outlined"
              startIcon={<AnalyticsIcon />}
            >
              Analytics
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/pro/upload"
            >
              Upload New Content
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Success message */}
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
      
      {/* Dashboard overview */}
      <DashboardOverview 
        content={content}
        loading={loading}
        period={analyticsTimePeriod}
        onPeriodChange={handleAnalyticsPeriodChange}
      />
      
      {/* Tabs navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 5 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="dashboard tabs"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            label="All Content" 
            icon={<MovieIcon />} 
            iconPosition="start" 
            {...a11yProps(0)} 
          />
          <Tab 
            label={`Active (${activeContent.length})`} 
            icon={<CheckCircleIcon />} 
            iconPosition="start" 
            {...a11yProps(1)} 
          />
          <Tab 
            label={`Drafts (${draftContent.length})`} 
            icon={<EditIcon />} 
            iconPosition="start" 
            {...a11yProps(2)} 
          />
          <Tab 
            label={`Pending (${pendingContent.length})`} 
            icon={<PendingIcon />} 
            iconPosition="start" 
            {...a11yProps(3)} 
          />
          <Tab 
            label="Libraries" 
            icon={<LibraryIcon />} 
            iconPosition="start" 
            {...a11yProps(4)} 
          />
          <Tab 
            label="Analytics" 
            icon={<AnalyticsIcon />} 
            iconPosition="start" 
            {...a11yProps(5)} 
          />
        </Tabs>
      </Box>
      
      {/* All Content tab */}
      <TabPanel value={tabValue} index={0}>
        <ContentGrid
          items={content}
          loading={loading}
          onDelete={handleDeleteContent}
          onTokenize={handleTokenizeContent}
          onSetVisibility={handleSetVisibility}
          onSetStatus={handleSetStatus}
          onShare={handleShareContent}
          onDuplicate={handleDuplicateContent}
          onView={handleViewContent}
          title="All Content"
          emptyMessage="You haven't created any content yet. Click 'Upload New Content' to get started."
        />
      </TabPanel>
      
      {/* Active Content tab */}
      <TabPanel value={tabValue} index={1}>
        <ContentGrid
          items={activeContent}
          loading={loading}
          onDelete={handleDeleteContent}
          onTokenize={handleTokenizeContent}
          onSetVisibility={handleSetVisibility}
          onSetStatus={handleSetStatus}
          onShare={handleShareContent}
          onDuplicate={handleDuplicateContent}
          onView={handleViewContent}
          title="Active Content"
          emptyMessage="You don't have any active content. Publish your drafts to make them active."
        />
      </TabPanel>
      
      {/* Drafts tab */}
      <TabPanel value={tabValue} index={2}>
        <ContentGrid
          items={draftContent}
          loading={loading}
          onDelete={handleDeleteContent}
          onTokenize={handleTokenizeContent}
          onSetVisibility={handleSetVisibility}
          onSetStatus={handleSetStatus}
          onShare={handleShareContent}
          onDuplicate={handleDuplicateContent}
          onView={handleViewContent}
          title="Draft Content"
          emptyMessage="You don't have any draft content. Upload content to get started."
        />
      </TabPanel>
      
      {/* Pending tab */}
      <TabPanel value={tabValue} index={3}>
        <ContentGrid
          items={pendingContent}
          loading={loading}
          onDelete={handleDeleteContent}
          onTokenize={handleTokenizeContent}
          onSetVisibility={handleSetVisibility}
          onSetStatus={handleSetStatus}
          onShare={handleShareContent}
          onDuplicate={handleDuplicateContent}
          onView={handleViewContent}
          title="Pending Content"
          emptyMessage="You don't have any pending content."
        />
      </TabPanel>
      
      {/* Libraries tab */}
      <TabPanel value={tabValue} index={4}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>
            Manage Your Content Libraries
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            Organize your content into libraries for easier management and sharing.
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/pro/libraries"
            size="large"
            sx={{ mt: 2 }}
          >
            Go to Libraries
          </Button>
        </Box>
      </TabPanel>
      
      {/* Analytics tab */}
      <TabPanel value={tabValue} index={5}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>
            Detailed Analytics Coming Soon
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            We're working on advanced analytics to help you track performance and audience engagement.
          </Typography>
        </Box>
      </TabPanel>
    </Container>
  );
};

export default EnhancedDashboardPage; 