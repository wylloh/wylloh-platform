import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  IconButton,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Divider,
  Tab,
  Tabs,
  LinearProgress,
} from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PermMediaIcon from '@mui/icons-material/PermMedia';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedIcon from '@mui/icons-material/Verified';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format } from 'date-fns';
import { libraryService, LibraryItem } from '../../services/library.service';
import LibraryContentCard from './LibraryContentCard';
import { WalletContext } from '../../contexts/WalletContext';
import { ownershipVerificationService, VerificationResult } from '../../services/ownershipVerification.service';
import { userSettingsService } from '../../services/userSettings.service';
import { filterWyllohMovieTokens } from '../../utils/tokenFilters';

// Sample data for development
const SAMPLE_CONTENT = [
  {
    contentId: '1',
    title: 'The Silent Echo',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1',
    purchaseDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    purchasePrice: 250,
    currentValue: 320,
    licenseType: 'perpetual',
    isLent: false,
    genre: 'Drama',
    director: 'Sarah Johnson',
    year: 2022,
  },
  {
    contentId: '2',
    title: 'Digital Horizons',
    thumbnailUrl: 'https://images.unsplash.com/photo-1605106702734-205df224ecce',
    purchaseDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    purchasePrice: 180,
    currentValue: 195,
    licenseType: 'limited',
    isLent: true,
    lentTo: 'alex@example.com',
    genre: 'Sci-Fi',
    director: 'Michael Chang',
    year: 2021,
  },
  {
    contentId: '3',
    title: 'Nature\'s Symphony',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
    purchaseDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    purchasePrice: 300,
    currentValue: 275,
    licenseType: 'personal',
    isLent: false,
    genre: 'Documentary',
    director: 'Emily Roberts',
    year: 2023,
  },
];

interface ContentItem extends LibraryItem {
  title: string;
  thumbnailUrl: string;
  genre?: string;
  director?: string;
  year?: number;
}

interface LibraryContentProps {
  libraryId: string;
}

// Tab values
type TabValue = 'all' | 'verified' | 'unverified' | 'sold';

// Extend the Snackbar severity type to include 'info' and 'warning'
type SnackbarSeverity = 'success' | 'error' | 'info' | 'warning';

const LibraryContent: React.FC<LibraryContentProps> = ({ libraryId }) => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [verificationResults, setVerificationResults] = useState<Record<string, VerificationResult>>({});
  const [showExternalProtocol, setShowExternalProtocol] = useState(true);
  
  // Get wallet context for blockchain interactions
  const { provider, account } = useContext(WalletContext);
  
  // Dialog states
  const [lendDialogOpen, setLendDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as SnackbarSeverity
  });
  
  // Form states for lending
  const [lendToEmail, setLendToEmail] = useState('');
  const [lendDuration, setLendDuration] = useState(7);
  const [lendPrice, setLendPrice] = useState(10);
  
  // Form states for selling
  const [sellPrice, setSellPrice] = useState(0);
  const [buyerEmail, setBuyerEmail] = useState('');

  // Set provider when it's available
  useEffect(() => {
    if (provider) {
      ownershipVerificationService.setProvider(provider);
    }
  }, [provider]);

  // Get user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await userSettingsService.getAllSettings();
        setShowExternalProtocol(settings.tokenDisplay.includeExternalProtocolTokens);
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const libraryItems = await libraryService.getLibraryItems(libraryId);
        
        // In a real implementation, we would fetch content details for each item
        // For now, we'll enhance the items with mock data for display purposes
        const enhancedItems = libraryItems.map((item: any) => {
          // This would typically come from a content service lookup by contentId
          return {
            ...item,
            title: `Content ${item.contentId.substring(0, 8)}`,
            thumbnailUrl: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}`,
            genre: ['Drama', 'Comedy', 'Action', 'Sci-Fi', 'Documentary'][Math.floor(Math.random() * 5)],
            director: ['John Doe', 'Jane Smith', 'Robert Johnson', 'Alice Brown'][Math.floor(Math.random() * 4)],
            year: 2020 + Math.floor(Math.random() * 4)
          };
        });
        
        // If we have a provider and a wallet connected, verify token ownership
        if (provider && account) {
          await verifyContentOwnership(enhancedItems);
        }
        
        setContent(enhancedItems);
        setError(null);
      } catch (err) {
        console.error('Error fetching library content:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching content');
        
        // Fall back to sample data in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log('Using sample data for library content due to error');
          setContent(SAMPLE_CONTENT as unknown as ContentItem[]);
          setError(null);
        }
      } finally {
        setLoading(false);
      }
    };

    // In development, use sample data if the environment flag is set
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_SAMPLE_DATA === 'true') {
      setTimeout(() => {
        setContent(SAMPLE_CONTENT as unknown as ContentItem[]);
        setLoading(false);
      }, 1000); // Simulate network delay
    } else {
      fetchContent();
    }
  }, [libraryId, provider, account]);

  // Verify ownership of content items
  const verifyContentOwnership = async (items: ContentItem[]) => {
    if (!provider || !account) {
      setSnackbar({
        open: true,
        message: 'Wallet not connected. Cannot verify token ownership.',
        severity: 'error'
      });
      return;
    }

    try {
      setVerifying(true);
      
      // Only verify items with token data
      const tokenItems = items.filter(item => item.tokenData);
      
      if (tokenItems.length === 0) {
        setVerifying(false);
        return;
      }
      
      // Verify each item in parallel
      const verificationPromises = tokenItems.map(item => {
        if (!item.tokenData) return null;
        
        return ownershipVerificationService.verifyContentOwnership(
          item.contentId,
          item.title,
          account,
          item.tokenData.tokenId,
          item.tokenData.contractAddress,
          item.tokenData.standard,
          item.tokenData.chain,
          { includeHistory: true }
        );
      });
      
      // Filter out null promises and await results
      const results = await Promise.all(verificationPromises.filter(Boolean) as Promise<VerificationResult>[]);
      
      // Convert results to a map for easier lookup
      const resultsMap = results.reduce((map, result) => {
        map[result.contentId] = result;
        return map;
      }, {} as Record<string, VerificationResult>);
      
      setVerificationResults(resultsMap);
      
      // Update content items with verification results
      const updatedItems = items.map(item => {
        const result = resultsMap[item.contentId];
        
        if (result && item.tokenData) {
          return {
            ...item,
            tokenData: {
              ...item.tokenData,
              ownershipVerified: result.isOwned,
              ownershipLastChecked: result.verificationTimestamp,
              owner: result.isOwned ? account : result.newOwnerAddress
            }
          };
        }
        
        return item;
      });
      
      setContent(updatedItems);
      
      // Show notification if any ownership changes were detected
      const changedItems = results.filter(result => result.ownershipChanged);
      if (changedItems.length > 0) {
        setSnackbar({
          open: true,
          message: `Ownership changes detected for ${changedItems.length} item(s). Content has been moved to the "Sold" section.`,
          severity: 'info'
        });
      }
    } catch (error) {
      console.error('Error verifying content ownership:', error);
      setSnackbar({
        open: true,
        message: 'Failed to verify token ownership. Please try again.',
        severity: 'error'
      });
    } finally {
      setVerifying(false);
    }
  };

  // Handle manual verification request for a single item
  const handleVerifyOwnership = (item: LibraryItem) => {
    // Convert LibraryItem to ContentItem if needed
    const contentItem = content.find(c => c.contentId === item.contentId);
    if (!contentItem || !contentItem.tokenData) return;
    
    // Now verify the found content item
    verifyContentItemOwnership(contentItem);
  };
  
  // Helper method to verify a specific content item
  const verifyContentItemOwnership = async (item: ContentItem) => {
    if (!item.tokenData) return;
    
    try {
      setVerifying(true);
      
      const result = await ownershipVerificationService.verifyContentOwnership(
        item.contentId,
        item.title,
        account || '',
        item.tokenData.tokenId,
        item.tokenData.contractAddress,
        item.tokenData.standard,
        item.tokenData.chain,
        { forceReverify: true, includeHistory: true }
      );
      
      // Update verification results
      setVerificationResults(prev => ({
        ...prev,
        [item.contentId]: result
      }));
      
      // Update content item with verification result
      const updatedContent = content.map(contentItem => {
        if (contentItem.contentId === item.contentId && contentItem.tokenData) {
          return {
            ...contentItem,
            tokenData: {
              ...contentItem.tokenData,
              ownershipVerified: result.isOwned,
              ownershipLastChecked: result.verificationTimestamp,
              owner: result.isOwned ? account || '' : result.newOwnerAddress
            }
          };
        }
        return contentItem;
      });
      
      setContent(updatedContent);
      
      // Show success message
      setSnackbar({
        open: true,
        message: result.isOwned 
          ? 'Ownership verified successfully!' 
          : 'Ownership verification failed. You may no longer own this token.',
        severity: result.isOwned ? 'success' : 'error'
      });
      
      // If ownership changed, update UI accordingly
      if (result.ownershipChanged) {
        setSnackbar({
          open: true,
          message: 'This token appears to have been sold on an external marketplace. It has been moved to the "Sold" section.',
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Error verifying ownership:', error);
      setSnackbar({
        open: true,
        message: 'Failed to verify token ownership. Please try again.',
        severity: 'error'
      });
    } finally {
      setVerifying(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  };

  // Filter content based on active tab
  const filteredContent = content.filter(item => {
    // Filter by verification status
    switch (activeTab) {
      case 'verified':
        return item.tokenData?.ownershipVerified === true;
      case 'unverified':
        return item.tokenData?.ownershipVerified === false && !verificationResults[item.contentId]?.ownershipChanged;
      case 'sold':
        return verificationResults[item.contentId]?.ownershipChanged === true;
      case 'all':
      default:
        return !verificationResults[item.contentId]?.ownershipChanged;
    }
  });

  // Filter out non-Wylloh tokens based on user settings
  const displayContent = showExternalProtocol
    ? filteredContent
    : filteredContent.filter(item => {
        if (!item.tokenData) return true;
        
        return item.tokenData.origin === 'wylloh' || !item.tokenData.origin;
      });

  // Handle opening the lend dialog
  const handleOpenLendDialog = (item: LibraryItem) => {
    // Find the content item with full metadata
    const contentItem = content.find(c => c.contentId === item.contentId);
    if (!contentItem) return;
    
    setSelectedItem(contentItem);
    setLendPrice(Math.round(contentItem.currentValue * 0.05)); // Default to 5% of current value
    setLendDialogOpen(true);
  };

  // Handle opening the sell dialog
  const handleOpenSellDialog = (item: LibraryItem) => {
    // Find the content item with full metadata
    const contentItem = content.find(c => c.contentId === item.contentId);
    if (!contentItem) return;
    
    setSelectedItem(contentItem);
    setSellPrice(contentItem.currentValue);
    setSellDialogOpen(true);
  };

  // Handle opening the info dialog
  const handleOpenInfoDialog = (item: LibraryItem) => {
    // Find the content item with full metadata
    const contentItem = content.find(c => c.contentId === item.contentId);
    if (!contentItem) return;
    
    setSelectedItem(contentItem);
    setInfoDialogOpen(true);
  };

  const handleCloseLendDialog = () => {
    setLendDialogOpen(false);
    setLendToEmail('');
    setLendDuration(7);
    setLendPrice(10);
  };

  const handleCloseSellDialog = () => {
    setSellDialogOpen(false);
    setSellPrice(0);
    setBuyerEmail('');
  };

  const handleCloseInfoDialog = () => {
    setInfoDialogOpen(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  // Get license type label
  const getLicenseTypeLabel = (type: string) => {
    switch (type) {
      case 'personal':
        return 'Personal Use';
      case 'commercial':
        return 'Commercial Use';
      case 'perpetual':
        return 'Perpetual License';
      case 'limited':
        return 'Limited License';
      default:
        return type;
    }
  };

  const getLicenseTypeColor = (type: string) => {
    switch (type) {
      case 'perpetual':
        return 'success';
      case 'limited':
        return 'primary';
      case 'personal':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (content.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="h6" color="text.secondary" gutterBottom>
          This library is empty
        </Typography>
        <Typography color="text.secondary" paragraph>
          When you add content to this library, it will appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Verification status bar */}
      {verifying && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress color="primary" />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Verifying token ownership on blockchain...
          </Typography>
        </Box>
      )}
      
      {/* Filter tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="library content tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Content" value="all" />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VerifiedIcon fontSize="small" sx={{ mr: 0.5 }} />
                Verified
              </Box>
            } 
            value="verified" 
          />
          <Tab label="Unverified" value="unverified" />
          <Tab label="Sold Items" value="sold" />
        </Tabs>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : displayContent.length === 0 ? (
        <Alert severity="info" sx={{ my: 2 }}>
          {activeTab === 'sold' 
            ? 'No sold items found.' 
            : activeTab === 'verified'
              ? 'No verified items found. Try connecting your wallet to verify ownership.'
              : 'No content found in this library.'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {displayContent.map(item => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.contentId}>
              <LibraryContentCard
                item={item}
                onLend={handleOpenLendDialog}
                onSell={handleOpenSellDialog}
                onInfo={handleOpenInfoDialog}
                onVerifyOwnership={handleVerifyOwnership}
              />
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Manual verify button */}
      {!loading && content.some(item => item.tokenData) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => verifyContentOwnership(content)}
            disabled={verifying || !account}
          >
            {verifying ? 'Verifying...' : 'Verify All Ownership'}
          </Button>
        </Box>
      )}
      
      {/* Lend Dialog */}
      <Dialog open={lendDialogOpen} onClose={handleCloseLendDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Lend Content
          {selectedItem && (
            <Typography variant="subtitle1" color="text.secondary">
              {selectedItem.title}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Lend to (Email)"
              value={lendToEmail}
              onChange={(e) => setLendToEmail(e.target.value)}
              margin="normal"
              variant="outlined"
              type="email"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Lend Duration</InputLabel>
              <Select
                value={lendDuration}
                label="Lend Duration"
                onChange={(e) => setLendDuration(Number(e.target.value))}
              >
                <MenuItem value={1}>1 day</MenuItem>
                <MenuItem value={3}>3 days</MenuItem>
                <MenuItem value={7}>1 week</MenuItem>
                <MenuItem value={14}>2 weeks</MenuItem>
                <MenuItem value={30}>1 month</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Lending Price"
              value={lendPrice}
              onChange={(e) => setLendPrice(Number(e.target.value))}
              margin="normal"
              variant="outlined"
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            {selectedItem && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Current value: {formatCurrency(selectedItem.currentValue)}
                </Typography>
                <Typography variant="body2">
                  License type: {getLicenseTypeLabel(selectedItem.licenseType)}
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLendDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleCloseLendDialog}
          >
            Lend Content
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Sell Dialog */}
      <Dialog open={sellDialogOpen} onClose={handleCloseSellDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Sell Content
          {selectedItem && (
            <Typography variant="subtitle1" color="text.secondary">
              {selectedItem.title}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Buyer Email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              margin="normal"
              variant="outlined"
              type="email"
              required
            />
            <TextField
              fullWidth
              label="Selling Price"
              value={sellPrice}
              onChange={(e) => setSellPrice(Number(e.target.value))}
              margin="normal"
              variant="outlined"
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            {selectedItem && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Once sold, this content will be removed from your library and transferred to the buyer's account.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Purchase price: {formatCurrency(selectedItem.purchasePrice)}
                </Typography>
                <Typography variant="body2">
                  Current value: {formatCurrency(selectedItem.currentValue)}
                </Typography>
                {sellPrice > 0 && selectedItem.purchasePrice > 0 && (
                  <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                    {sellPrice > selectedItem.purchasePrice 
                      ? `Profit: ${formatCurrency(sellPrice - selectedItem.purchasePrice)}`
                      : `Loss: ${formatCurrency(selectedItem.purchasePrice - sellPrice)}`}
                  </Typography>
                )}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSellDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleCloseSellDialog}
          >
            Sell Content
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onClose={handleCloseInfoDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Content Details
          <IconButton
            aria-label="close"
            onClick={handleCloseInfoDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Box>
              <CardMedia
                component="img"
                height="200"
                image={selectedItem.thumbnailUrl}
                alt={selectedItem.title}
                sx={{ borderRadius: 1, mb: 2 }}
              />
              
              <Typography variant="h5" gutterBottom>{selectedItem.title}</Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {selectedItem.director && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Director</Typography>
                    <Typography variant="body1">{selectedItem.director}</Typography>
                  </Grid>
                )}
                {selectedItem.year && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Year</Typography>
                    <Typography variant="body1">{selectedItem.year}</Typography>
                  </Grid>
                )}
                {selectedItem.genre && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Genre</Typography>
                    <Typography variant="body1">{selectedItem.genre}</Typography>
                  </Grid>
                )}
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Ownership Information</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Purchase Date</Typography>
                  <Typography variant="body1">{formatDate(selectedItem.purchaseDate)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">License Type</Typography>
                  <Chip 
                    label={getLicenseTypeLabel(selectedItem.licenseType)} 
                    color={getLicenseTypeColor(selectedItem.licenseType) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Purchase Price</Typography>
                  <Typography variant="body1">{formatCurrency(selectedItem.purchasePrice)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Current Value</Typography>
                  <Typography 
                    variant="body1"
                    color={selectedItem.currentValue > selectedItem.purchasePrice ? 'success.main' : 
                        selectedItem.currentValue < selectedItem.purchasePrice ? 'error.main' : 
                        'text.primary'}
                  >
                    {formatCurrency(selectedItem.currentValue)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Typography variant="body1">
                    {selectedItem.isLent 
                      ? `Currently lent to ${selectedItem.lentTo}` 
                      : 'In your library'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInfoDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Status Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LibraryContent; 