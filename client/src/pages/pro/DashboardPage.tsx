import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions, 
  Chip, 
  Divider, 
  Tab, 
  Tabs,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  ListItemIcon,
  AlertTitle,
  Skeleton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PlayArrow as PlayArrowIcon,
  TokenOutlined as TokenIcon,
  CloudUpload as CloudUploadIcon,
  Dashboard as DashboardIcon,
  InsertChart as InsertChartIcon,
  Sell as SellIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { contentService, Content } from '../../services/content.service';
import { getProjectIpfsUrl } from '../../utils/ipfs';
import { generatePlaceholderImage } from '../../utils/placeholders';

// Tab content interface
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
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
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

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<Content[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Check if user has verified Pro status
  const isProVerified = user?.proStatus === 'verified';
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<string | null>(null);
  
  // Tokenize dialog state
  const [tokenizeDialogOpen, setTokenizeDialogOpen] = useState(false);
  const [contentToTokenize, setContentToTokenize] = useState<string | null>(null);
  
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
  }, []);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle menu open
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, contentId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedContentId(contentId);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedContentId(null);
  };
  
  // Handle delete dialog
  const handleOpenDeleteDialog = (contentId: string) => {
    setContentToDelete(contentId);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setContentToDelete(null);
  };
  
  const handleDeleteContent = () => {
    // In a real app, this would call an API
    setContent(prevContent => prevContent.filter(item => item.id !== contentToDelete));
    setActionSuccess('Content deleted successfully');
    handleCloseDeleteDialog();
  };
  
  // Handle tokenize dialog
  const handleOpenTokenizeDialog = (contentId: string) => {
    setContentToTokenize(contentId);
    setTokenizeDialogOpen(true);
    handleMenuClose();
  };
  
  const handleCloseTokenizeDialog = () => {
    setTokenizeDialogOpen(false);
    setContentToTokenize(null);
  };
  
  const handleTokenizeContent = () => {
    // Find the content to tokenize
    const selectedContent = content.find(item => item.id === contentToTokenize);
    
    if (selectedContent) {
      // Navigate to the TokenizePublishPage with the content info
      navigate('/creator/tokenize-publish', {
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
    
    handleCloseTokenizeDialog();
  };
  
  // Handle visibility toggle
  const handleToggleVisibility = async (contentId: string, currentVisibility: Content['visibility']) => {
    try {
      const newVisibility = currentVisibility === 'public' ? 'private' : 'public';
      await contentService.updateContentVisibility(contentId, newVisibility);
      
      setContent(prevContent => 
        prevContent.map(item => 
          item.id === contentId 
            ? {...item, visibility: newVisibility} 
            : item
        )
      );
      
      setActionSuccess(`Content is now ${newVisibility}`);
    } catch (err) {
      console.error('Error updating visibility:', err);
      setError('Failed to update visibility. Please try again.');
    }
    handleMenuClose();
  };
  
  // Handle status change
  const handleSetStatus = async (contentId: string, newStatus: Content['status']) => {
    try {
      await contentService.updateContentStatus(contentId, newStatus);
      
      setContent(prevContent => 
        prevContent.map(item => 
          item.id === contentId 
            ? {...item, status: newStatus} 
            : item
        )
      );
      
      setActionSuccess(`Content status changed to ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
    }
    handleMenuClose();
  };
  
  // Helper to filter content based on tab
  const getFilteredContent = () => {
    switch (tabValue) {
      case 0: // All content
        return content;
      case 1: // Active
        return content.filter(item => item.status === 'active');
      case 2: // Drafts
        return content.filter(item => item.status === 'draft');
      case 3: // Pending
        return content.filter(item => item.status === 'pending');
      case 4: // Tokenized
        return content.filter(item => item.tokenized);
      default:
        return content;
    }
  };
  
  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Show content status chip
  const renderStatusChip = (status: string) => {
    switch (status) {
      case 'active':
        return <Chip label="Active" size="small" color="success" />;
      case 'draft':
        return <Chip label="Draft" size="small" color="default" />;
      case 'pending':
        return <Chip label="Pending" size="small" color="warning" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };
  
  // Show visibility chip
  const renderVisibilityChip = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Chip icon={<VisibilityIcon />} label="Public" size="small" color="primary" />;
      case 'private':
        return <Chip icon={<VisibilityOffIcon />} label="Private" size="small" />;
      case 'unlisted':
        return <Chip icon={<VisibilityOffIcon />} label="Unlisted" size="small" color="info" />;
      default:
        return <Chip label={visibility} size="small" />;
    }
  };
  
  // Function to get content image URL
  const getContentImageUrl = (item: Content) => {
    if (item.thumbnailCid) {
      return getProjectIpfsUrl(item.thumbnailCid);
    }
    
    if (item.image) {
      return item.image;
    }
    
    return generatePlaceholderImage(item.title);
  };
  
  // Render stats cards
  const renderStatistics = () => {
    const totalContent = content.length;
    const activeContent = content.filter(item => item.status === 'active').length;
    const tokenizedContent = content.filter(item => item.tokenized).length;
    const totalViews = content.reduce((sum, item) => sum + item.views, 0);
    const totalSales = content.reduce((sum, item) => sum + item.sales, 0);
    
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6" color="text.secondary">
                Content Stats
              </Typography>
              <DashboardIcon color="primary" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Content
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {totalContent}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Active Content
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {activeContent}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Tokenized
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {tokenizedContent}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6" color="text.secondary">
                Performance
              </Typography>
              <InsertChartIcon color="primary" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Views
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {totalViews}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Sales
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {totalSales}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Revenue (est.)
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {(totalSales * 0.01).toFixed(2)} MATIC
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140, justifyContent: 'center', alignItems: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<CloudUploadIcon />}
              component={Link}
              to="/creator/upload"
              sx={{ width: '80%', mb: 2 }}
            >
              Upload Film Package
            </Button>
            
            <Button
              variant="outlined"
              component={Link}
              to="/marketplace"
              sx={{ width: '80%' }}
            >
              View Marketplace
            </Button>
          </Paper>
        </Grid>
      </Grid>
    );
  };
  
  // Render content cards
  const renderContentCards = () => {
    const filteredContent = getFilteredContent();
    
    if (filteredContent.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No content yet in this category.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {filteredContent.map((item) => (
          <Grid item key={item.id} xs={12} sm={6} md={4}>
            <Card sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                height="140"
                image={getContentImageUrl(item)}
                alt={item.title}
              />
              
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" component="h2" noWrap sx={{ maxWidth: '70%' }}>
                    {item.title}
                  </Typography>
                  <Box>
                    {renderStatusChip(item.status)}
                    {renderVisibilityChip(item.visibility)}
                  </Box>
                </Box>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mt: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {item.description || 'No description'}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Chip 
                    label={item.contentType} 
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Uploaded {formatDate(item.createdAt)}
                  </Typography>
                </Box>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'space-between' }}>
                <Box>
                  {item.tokenized ? (
                    <Tooltip title="Content is tokenized">
                      <Chip
                        icon={<SellIcon />}
                        label={`${item.price} ETH`}
                        size="small"
                        color="primary"
                      />
                    </Tooltip>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SellIcon />}
                      onClick={() => handleOpenTokenizeDialog(item.id)}
                    >
                      Tokenize
                    </Button>
                  )}
                </Box>
                
                <Box>
                  <Tooltip title="Edit">
                    <IconButton
                      component={Link}
                      to={`/creator/edit/${item.id}`}
                      size="small"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Preview">
                    <IconButton 
                      component={Link}
                      to={`/player/${item.id}`}
                      size="small"
                    >
                      <PlayArrowIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <IconButton 
                    aria-label="more" 
                    onClick={(e) => handleMenuClick(e, item.id)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>Creator Dashboard</Typography>
          <Grid container spacing={4}>
            {[...Array(4)].map((_, index) => (
              <Grid item key={index} xs={12}>
                <Card>
                  <Skeleton variant="rectangular" height={140} />
                  <CardContent>
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ pt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Creator Dashboard
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {!isAuthenticated ? (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Alert severity="warning">
              <AlertTitle>Authentication Required</AlertTitle>
              You need to be logged in to access the creator dashboard.
            </Alert>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                component={Link}
                to="/login"
              >
                Go to Login
              </Button>
            </Box>
          </Paper>
        ) : !isProVerified ? (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Alert severity="info">
              <AlertTitle>Pro Status Verification Required</AlertTitle>
              Your account needs to have verified Pro status to access the creator dashboard.
              {user?.proStatus === 'pending' && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Your Pro verification request is pending. Please wait for admin approval.
                </Typography>
              )}
            </Alert>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                component={Link}
                to="/profile"
              >
                Go to Profile
              </Button>
            </Box>
          </Paper>
        ) : (
          <>
            {/* Statistics Section */}
            {renderStatistics()}
            
            {/* Content Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="content management tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="All Content" {...a11yProps(0)} />
                <Tab label="Active" {...a11yProps(1)} />
                <Tab label="Drafts" {...a11yProps(2)} />
                <Tab label="Pending" {...a11yProps(3)} />
                <Tab label="Tokenized" {...a11yProps(4)} />
              </Tabs>
            </Box>
            
            {/* Tab Panels */}
            <TabPanel value={tabValue} index={0}>
              {renderContentCards()}
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              {renderContentCards()}
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              {renderContentCards()}
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              {renderContentCards()}
            </TabPanel>
            <TabPanel value={tabValue} index={4}>
              {renderContentCards()}
            </TabPanel>
          </>
        )}
        
        {/* Content Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem 
            onClick={(e) => selectedContentId && handleToggleVisibility(
              selectedContentId, 
              content.find(item => item.id === selectedContentId)?.visibility || 'private'
            )}
          >
            <ListItemIcon>
              {content.find(item => item.id === selectedContentId)?.visibility === 'public' 
                ? <VisibilityOffIcon fontSize="small" /> 
                : <VisibilityIcon fontSize="small" />}
            </ListItemIcon>
            {content.find(item => item.id === selectedContentId)?.visibility === 'public' 
              ? 'Make Private' 
              : 'Make Public'}
          </MenuItem>
          
          {content.find(item => item.id === selectedContentId)?.status === 'draft' && (
            <MenuItem onClick={() => selectedContentId && handleSetStatus(selectedContentId, 'active')}>
              <ListItemIcon>
                <VisibilityIcon fontSize="small" />
              </ListItemIcon>
              Publish Content
            </MenuItem>
          )}
          
          {!content.find(item => item.id === selectedContentId)?.tokenized && (
            <MenuItem onClick={() => selectedContentId && handleOpenTokenizeDialog(selectedContentId)}>
              <ListItemIcon>
                <TokenIcon fontSize="small" />
              </ListItemIcon>
              Tokenize
            </MenuItem>
          )}
          
          <Divider />
          
          <MenuItem onClick={() => selectedContentId && handleOpenDeleteDialog(selectedContentId)} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            Delete
          </MenuItem>
        </Menu>
        
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
        >
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this content? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button onClick={handleDeleteContent} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Tokenize Dialog */}
        <Dialog
          open={tokenizeDialogOpen}
          onClose={handleCloseTokenizeDialog}
        >
          <DialogTitle>Tokenize & Publish Content</DialogTitle>
          <DialogContent>
            <DialogContentText>
              You're about to tokenize and publish your content to the marketplace. This will allow you to set licensing terms, token supply, and pricing.
            </DialogContentText>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                In the next steps, you'll be able to configure:
              </Typography>
              <Typography variant="body2">
                • License terms for different use cases
              </Typography>
              <Typography variant="body2">
                • Token supply amount and pricing
              </Typography>
              <Typography variant="body2">
                • Royalty percentages for secondary sales
              </Typography>
              <Typography variant="body2">
                • Marketplace listing details
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTokenizeDialog}>Cancel</Button>
            <Button onClick={handleTokenizeContent} color="primary" variant="contained">
              Proceed to Tokenize
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Success Snackbar */}
        <Snackbar
          open={actionSuccess !== null}
          autoHideDuration={4000}
          onClose={() => setActionSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setActionSuccess(null)} severity="success">
            {actionSuccess}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default DashboardPage;