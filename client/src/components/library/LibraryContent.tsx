import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PermMediaIcon from '@mui/icons-material/PermMedia';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import { libraryService, LibraryItem } from '../../services/library.service';

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

const LibraryContent: React.FC<LibraryContentProps> = ({ libraryId }) => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [lendDialogOpen, setLendDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  
  // Form states for lending
  const [lendToEmail, setLendToEmail] = useState('');
  const [lendDuration, setLendDuration] = useState(7);
  const [lendPrice, setLendPrice] = useState(10);
  
  // Form states for selling
  const [sellPrice, setSellPrice] = useState(0);
  const [buyerEmail, setBuyerEmail] = useState('');

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
  }, [libraryId]);

  const handleOpenLendDialog = (item: ContentItem) => {
    setSelectedItem(item);
    setLendPrice(Math.round(item.currentValue * 0.05)); // Default to 5% of current value
    setLendDialogOpen(true);
  };

  const handleOpenSellDialog = (item: ContentItem) => {
    setSelectedItem(item);
    setSellPrice(item.currentValue);
    setSellDialogOpen(true);
  };

  const handleOpenInfoDialog = (item: ContentItem) => {
    setSelectedItem(item);
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

  const handleLendContent = async () => {
    if (!selectedItem) return;
    
    // Validate input
    if (!lendToEmail.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid email address',
        severity: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      await libraryService.lendItem(selectedItem.contentId, {
        borrowerEmail: lendToEmail,
        duration: lendDuration,
        price: lendPrice
      });
      
      // Update the content list
      const updatedContent = content.map(item => {
        if (item.contentId === selectedItem.contentId) {
          return {
            ...item,
            isLent: true,
            lentTo: lendToEmail
          };
        }
        return item;
      });
      
      setContent(updatedContent);
      handleCloseLendDialog();
      
      setSnackbar({
        open: true,
        message: `Item successfully lent to ${lendToEmail}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error lending content:', error);
      setSnackbar({
        open: true,
        message: 'Failed to lend the item. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSellContent = async () => {
    if (!selectedItem) return;
    
    // Validate input
    if (buyerEmail && !buyerEmail.includes('@')) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid email address',
        severity: 'error'
      });
      return;
    }
    
    try {
      // In development, mock the API call
      if (process.env.NODE_ENV === 'development') {
        // Remove the sold item from the content list
        const updatedContent = content.filter(item => item.contentId !== selectedItem.contentId);
        
        setContent(updatedContent);
        handleCloseSellDialog();
        
        setSnackbar({
          open: true,
          message: `Content sold successfully for ${formatCurrency(sellPrice)}`,
          severity: 'success'
        });
        
        return;
      }
      
      // This would be replaced with libraryService.sellItem in a real implementation
      const response = await fetch(`/api/libraries/${libraryId}/items/${selectedItem.contentId}/sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyerEmail,
          price: sellPrice
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to sell content');
      }
      
      // Remove the sold item from the content list - renamed to avoid duplicate variable
      const filteredContent = content.filter(item => item.contentId !== selectedItem.contentId);
      
      setContent(filteredContent);
      handleCloseSellDialog();
      
      setSnackbar({
        open: true,
        message: `Content sold successfully for ${formatCurrency(sellPrice)}`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error selling content:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to sell content',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy');
  };

  const getLicenseTypeLabel = (type: string) => {
    switch (type) {
      case 'perpetual':
        return 'Perpetual License';
      case 'limited':
        return 'Limited License';
      case 'personal':
        return 'Personal Use Only';
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
    <Box>
      <Grid container spacing={3}>
        {content.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.contentId}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardMedia
                component="img"
                height="180"
                image={item.thumbnailUrl}
                alt={item.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" gutterBottom noWrap>
                  {item.title}
                </Typography>
                
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item>
                    <Chip 
                      size="small" 
                      label={getLicenseTypeLabel(item.licenseType)} 
                      color={getLicenseTypeColor(item.licenseType) as any}
                      variant="outlined"
                    />
                  </Grid>
                  {item.isLent && (
                    <Grid item>
                      <Chip 
                        size="small" 
                        label="Lent Out" 
                        color="secondary"
                        variant="outlined"
                      />
                    </Grid>
                  )}
                </Grid>
                
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Purchase Price:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(item.purchasePrice)}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Current Value:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight="medium"
                    color={item.currentValue > item.purchasePrice ? 'success.main' : 
                          item.currentValue < item.purchasePrice ? 'error.main' : 
                          'text.primary'}
                  >
                    {formatCurrency(item.currentValue)}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Purchased:
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(item.purchaseDate)}
                  </Typography>
                </Box>
                
                {item.isLent && item.lentTo && (
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Currently lent to: {item.lentTo}
                    </Typography>
                  </Box>
                )}
              </CardContent>
              <Divider />
              <CardActions>
                <Tooltip title="Item Details">
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpenInfoDialog(item)}
                  >
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
                <Box flexGrow={1} />
                <Button 
                  size="small" 
                  startIcon={<PermMediaIcon />} 
                  onClick={() => handleOpenLendDialog(item)}
                  disabled={item.isLent}
                >
                  Lend
                </Button>
                <Button 
                  size="small" 
                  color="primary" 
                  startIcon={<MonetizationOnIcon />} 
                  onClick={() => handleOpenSellDialog(item)}
                  disabled={item.isLent}
                >
                  Sell
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Lend dialog */}
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
          <Button onClick={handleLendContent} variant="contained" color="primary">
            Lend Content
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sell dialog */}
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
          <Button onClick={handleSellContent} variant="contained" color="primary">
            Sell Content
          </Button>
        </DialogActions>
      </Dialog>

      {/* Item info dialog */}
      <Dialog open={infoDialogOpen} onClose={handleCloseInfoDialog} maxWidth="sm">
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
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