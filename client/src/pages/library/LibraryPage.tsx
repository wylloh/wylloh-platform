import React, { useState, useEffect, useContext } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Tooltip,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  Send as SendIcon,
  AttachMoney as AttachMoneyIcon,
  Info as InfoIcon,
  Movie,
} from '@mui/icons-material';
import LibraryAnalytics from '../../components/library/LibraryAnalytics';
import EnhancedContentCard from '../../components/common/EnhancedContentCard';
import ContentStatusBadge from '../../components/common/ContentStatusBadge';
import { WalletContext } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import { libraryService, LibraryItem } from '../../services/library.service';
import { Content } from '../../services/content.service';
import { format } from 'date-fns';

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
      id={`library-tabpanel-${index}`}
      aria-labelledby={`library-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Interface to extend LibraryItem with UI-specific properties
interface ExtendedLibraryItem extends LibraryItem {
  title?: string;
  thumbnailUrl?: string;
  description?: string;
  genre?: string;
  contentType?: string;
  director?: string;
  creator?: string;
  year?: number;
}

// Convert LibraryItem to Content type for use with EnhancedContentCard
export const libraryItemToContent = (item: LibraryItem): Content => {
  const extendedItem = item as ExtendedLibraryItem;
  
  return {
    id: item.contentId,
    title: extendedItem.title || `Content ${item.contentId.substring(0, 8)}`,
    description: extendedItem.description || '',
    contentType: extendedItem.contentType || 'movie',
    creator: extendedItem.creator || '',
    creatorAddress: item.tokenData?.owner || '',
    mainFileCid: '',
    image: extendedItem.thumbnailUrl,
    metadata: {
      genres: extendedItem.genre ? [extendedItem.genre] : undefined,
      releaseYear: extendedItem.year,
      director: extendedItem.director,
      purchaseDate: item.purchaseDate,
      purchasePrice: item.purchasePrice,
      currentValue: item.currentValue,
      licenseType: item.licenseType,
      isLent: item.isLent,
      lentTo: item.lentTo,
      tokenId: item.tokenData?.tokenId,
      contractAddress: item.tokenData?.contractAddress,
      ownershipVerified: item.tokenData?.ownershipVerified,
    },
    tokenized: !!item.tokenData,
    tokenId: item.tokenData?.tokenId,
    price: item.currentValue,
    createdAt: item.purchaseDate,
    status: 'active',
    visibility: 'public',
    views: 0,
    sales: 0
  };
};

interface ContentItem extends LibraryItem {
  title: string;
  thumbnailUrl: string;
  description?: string;
  genre?: string;
  contentType?: string;
  director?: string;
  creator?: string;
  year?: number;
}

interface LibraryPageProps {
  isPro?: boolean;
}

const LibraryPage: React.FC<LibraryPageProps> = ({ isPro = false }) => {
  const { libraryId } = useParams<{ libraryId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tabFromUrl = queryParams.get('tab');
  const { provider, account, connect } = useContext(WalletContext);
  const { isAuthenticated, user } = useAuth();
  
  // Set initial tab value based on URL query param
  const initialTabValue = tabFromUrl === 'analytics' ? 1 : 0;
  const [tabValue, setTabValue] = useState(initialTabValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [libraryData, setLibraryData] = useState<any>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  
  // ENTERPRISE FIX: Use authentication state instead of just wallet connection
  // This prevents loading issues due to wallet state synchronization
  const canAccessLibrary = isAuthenticated && user;

  // Dialog states
  const [lendDialogOpen, setLendDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  
  // Form states for lending
  const [lendToEmail, setLendToEmail] = useState('');
  const [lendDuration, setLendDuration] = useState(7);
  const [lendPrice, setLendPrice] = useState(0.01);
  
  // Form states for selling
  const [sellPrice, setSellPrice] = useState(0);
  const [buyerEmail, setBuyerEmail] = useState('');

  useEffect(() => {
    // Don't fetch data if user isn't authenticated
    if (!canAccessLibrary) {
      setLoading(false);
      return;
    }

    const fetchLibraryData = async () => {
      try {
        // Fetch library metadata
        const response = await fetch(`/api/libraries/${libraryId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch library data');
        }
        const data = await response.json();
        setLibraryData(data);
        
        // Fetch library items
        if (process.env.NODE_ENV === 'development') {
          // Use mock data in development
          const mockItems: ContentItem[] = [
            {
              contentId: '1',
              title: 'The Silent Echo',
              thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1',
              description: 'A drama about a family dealing with loss and finding hope in unexpected places.',
              purchaseDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
              purchasePrice: 250,
              currentValue: 320,
              licenseType: 'perpetual',
              isLent: false,
              genre: 'Drama',
              contentType: 'movie',
              director: 'Sarah Johnson',
              creator: 'Sarah Johnson',
              year: 2022,
              tokenData: {
                tokenId: '42',
                contractAddress: '0x1234567890abcdef',
                standard: 'ERC-721',
                chain: 'Ethereum',
                ownershipVerified: true,
                ownershipLastChecked: new Date().toISOString(),
                metadata: {}
              }
            },
            {
              contentId: '2',
              title: 'Digital Horizons',
              thumbnailUrl: 'https://images.unsplash.com/photo-1605106702734-205df224ecce',
              description: 'A sci-fi adventure exploring the boundaries between reality and digital worlds.',
              purchaseDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
              purchasePrice: 180,
              currentValue: 195,
              licenseType: 'limited',
              isLent: true,
              lentTo: 'alex@example.com',
              genre: 'Sci-Fi',
              contentType: 'movie',
              director: 'Michael Chang',
              creator: 'Michael Chang',
              year: 2021,
              tokenData: {
                tokenId: '15',
                contractAddress: '0xabcdef1234567890',
                standard: 'ERC-1155',
                chain: 'Polygon',
                ownershipVerified: false,
                ownershipLastChecked: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                metadata: {}
              }
            },
            {
              contentId: '3',
              title: 'Nature\'s Symphony',
              thumbnailUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
              description: 'A breathtaking documentary showcasing the wonders of nature and wildlife across the globe.',
              purchaseDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
              purchasePrice: 300,
              currentValue: 275,
              licenseType: 'personal',
              isLent: false,
              genre: 'Documentary',
              contentType: 'documentary',
              director: 'Emily Roberts',
              creator: 'Emily Roberts',
              year: 2023,
              tokenData: undefined
            },
          ];
          setContent(mockItems);
        } else {
          // Fetch real data in production
          const items = await libraryService.getLibraryItems(libraryId!);
          setContent(items as ContentItem[]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (libraryId) {
      fetchLibraryData();
    }
  }, [libraryId, canAccessLibrary]);

  // Update tabValue when URL query changes
  useEffect(() => {
    const newTabValue = tabFromUrl === 'analytics' ? 1 : 0;
    setTabValue(newTabValue);
  }, [tabFromUrl]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Update URL query parameter
    const tabQuery = newValue === 1 ? '?tab=analytics' : '';
    navigate(`/library/${libraryId}${tabQuery}`);
  };

  const navigateToLibraries = () => {
    navigate('/library');
  };

  const handleLendContent = (contentId: string) => {
    const item = content.find(item => item.contentId === contentId);
    if (item) {
      setSelectedItem(item);
      setLendDialogOpen(true);
    }
  };

  const handleSellContent = (contentId: string) => {
    const item = content.find(item => item.contentId === contentId);
    if (item) {
      setSelectedItem(item);
      setSellPrice(item.currentValue || 0);
      setSellDialogOpen(true);
    }
  };

  const handleInfoContent = (contentId: string) => {
    const item = content.find(item => item.contentId === contentId);
    if (item) {
      setSelectedItem(item);
      setInfoDialogOpen(true);
    }
  };

  const handlePlayContent = (contentId: string) => {
    // Navigate to content player
    navigate(`/play/${contentId}`);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const formatCurrency = (value: number) => {
    return `${value.toFixed(3)} ETH`;
  };

  const handleSubmitLend = () => {
    // Implement lending logic here
    console.log('Lending content', selectedItem?.contentId, 'to', lendToEmail, 'for', lendDuration, 'days at', lendPrice, 'ETH');
    setLendDialogOpen(false);
    // Reset form
    setLendToEmail('');
    setLendDuration(7);
    setLendPrice(0.01);
  };

  const handleSubmitSell = () => {
    // Implement selling logic here
    console.log('Selling content', selectedItem?.contentId, 'for', sellPrice, 'ETH', buyerEmail ? `to ${buyerEmail}` : 'on marketplace');
    setSellDialogOpen(false);
    // Reset form
    setSellPrice(0);
    setBuyerEmail('');
  };

  // Show authentication prompt if not authenticated
  if (!canAccessLibrary) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Box sx={{ mb: 4 }}>
          <Movie sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            The vault is locked
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: '500px', mx: 'auto' }}>
            Your collection awaits behind the velvet rope. Please connect your wallet to enter.
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            onClick={connect}
            sx={{ py: 1.5, px: 4, fontSize: '1rem', fontWeight: 500 }}
          >
            Unlock Collection
          </Button>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (!libraryData) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={navigateToLibraries} 
        sx={{ mb: 2 }}
      >
        Back to Libraries
      </Button>
      
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          {libraryData.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {libraryData.description}
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Content" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {content.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.contentId}>
              <EnhancedContentCard
                content={libraryItemToContent(item)}
                context={isPro ? 'pro' : 'consumer'}
                variant="standard"
                onPlay={() => handlePlayContent(item.contentId)}
                onView={() => handleInfoContent(item.contentId)}
                elevation={3}
                showPrice={true}
              />
              <Box mt={1} display="flex" justifyContent="space-between">
                {item.tokenData && (
                  <>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      size="small"
                      startIcon={<AttachMoneyIcon />}
                      onClick={() => handleSellContent(item.contentId)}
                    >
                      Resell
                    </Button>
                    
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      size="small"
                      startIcon={<SendIcon />}
                      onClick={() => handleLendContent(item.contentId)}
                      disabled={item.isLent}
                    >
                      {item.isLent ? 'Lent Out' : 'Lend'}
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <LibraryAnalytics libraryId={libraryId!} />
      </TabPanel>

      {/* Lend Dialog */}
      <Dialog open={lendDialogOpen} onClose={() => setLendDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Lend Content</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <Typography variant="subtitle1">
              {selectedItem?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedItem?.description}
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <TextField
            label="Borrower Email"
            fullWidth
            margin="normal"
            value={lendToEmail}
            onChange={(e) => setLendToEmail(e.target.value)}
          />
          <Box display="flex" gap={2} mt={2}>
            <FormControl fullWidth>
              <InputLabel>Lending Duration (Days)</InputLabel>
              <Select
                value={lendDuration}
                label="Lending Duration (Days)"
                onChange={(e) => setLendDuration(Number(e.target.value))}
              >
                <MenuItem value={1}>1 Day</MenuItem>
                <MenuItem value={3}>3 Days</MenuItem>
                <MenuItem value={7}>1 Week</MenuItem>
                <MenuItem value={14}>2 Weeks</MenuItem>
                <MenuItem value={30}>1 Month</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Price (ETH)"
              type="number"
              fullWidth
              margin="normal"
              value={lendPrice}
              onChange={(e) => setLendPrice(Number(e.target.value))}
              InputProps={{
                inputProps: { min: 0, step: 0.001 }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLendDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitLend} variant="contained" color="primary">
            Lend Content
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sell Dialog */}
      <Dialog open={sellDialogOpen} onClose={() => setSellDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sell Content</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <Typography variant="subtitle1">
              {selectedItem?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedItem?.description}
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <TextField
            label="Selling Price (ETH)"
            type="number"
            fullWidth
            margin="normal"
            value={sellPrice}
            onChange={(e) => setSellPrice(Number(e.target.value))}
            InputProps={{
              inputProps: { min: 0, step: 0.001 }
            }}
          />
          <TextField
            label="Buyer Email (Optional)"
            fullWidth
            margin="normal"
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            helperText="Leave empty to list on marketplace"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSellDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitSell} variant="contained" color="primary">
            Sell Token
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onClose={() => setInfoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Content Details</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <>
              <Typography variant="h6">{selectedItem.title}</Typography>
              <Typography variant="body1" paragraph>
                {selectedItem.description}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Purchase Date</Typography>
                  <Typography variant="body2">{formatDate(selectedItem.purchaseDate)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Purchase Price</Typography>
                  <Typography variant="body2">{formatCurrency(selectedItem.purchasePrice)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Current Value</Typography>
                  <Typography variant="body2">{formatCurrency(selectedItem.currentValue)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">License Type</Typography>
                  <Typography variant="body2">
                    <Chip 
                      label={selectedItem.licenseType.charAt(0).toUpperCase() + selectedItem.licenseType.slice(1)} 
                      size="small" 
                      color={
                        selectedItem.licenseType === 'perpetual' ? 'success' :
                        selectedItem.licenseType === 'commercial' ? 'primary' :
                        'default'
                      }
                    />
                  </Typography>
                </Grid>
                
                {selectedItem.isLent && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Currently Lent To</Typography>
                    <Typography variant="body2">{selectedItem.lentTo}</Typography>
                  </Grid>
                )}
                
                {selectedItem.tokenData && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle1" sx={{ mt: 1 }}>Token Information</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Token ID</Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {selectedItem.tokenData.tokenId}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Standard</Typography>
                      <Typography variant="body2">{selectedItem.tokenData.standard}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Contract Address</Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {selectedItem.tokenData.contractAddress}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Blockchain</Typography>
                      <Typography variant="body2">{selectedItem.tokenData.chain}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Ownership Verified</Typography>
                      <Typography variant="body2">
                        {selectedItem.tokenData.ownershipVerified ? 'Yes' : 'No'}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
          <Button 
            onClick={() => {
              setInfoDialogOpen(false);
              if (selectedItem) handlePlayContent(selectedItem.contentId);
            }} 
            variant="contained" 
            color="primary"
            startIcon={<PlayArrowIcon />}
          >
            Play Content
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LibraryPage; 