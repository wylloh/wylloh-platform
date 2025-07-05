import React, { useState, useEffect, useContext, Suspense, useMemo, useCallback } from 'react';
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  Send as SendIcon,
  AttachMoney as AttachMoneyIcon,
  Verified as VerifiedIcon,
  ErrorOutline as ErrorOutlineIcon,
  AccessTime as AccessTimeIcon,
  Info as InfoIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { WalletContext } from '../../contexts/WalletContext';
import { libraryService, LibraryItem } from '../../services/library.service';
import { ownershipVerificationService, type VerificationResult } from '../../services/ownershipVerification.service';
import { usePerformanceOptimization } from '../../hooks/usePerformanceOptimization';
import LazyLoadWrapper from '../../components/common/LazyLoadWrapper';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { TokenCollection } from '../../components/library/ContentSelectionToolbar';
import { organizeTokenCollections, updateCollectionSelections } from '../../components/library/ContentCollectionHelper';

// Lazy load heavy components
const LibraryAnalytics = React.lazy(() => import('../../components/library/LibraryAnalytics'));
const EnhancedContentCard = React.lazy(() => import('../../components/common/EnhancedContentCard'));
const ContentSelectionToolbar = React.lazy(() => import('../../components/library/ContentSelectionToolbar'));
const BatchActionModals = React.lazy(() => import('../../components/library/BatchActionModals'));
const CollectionCard = React.lazy(() => import('../../components/library/CollectionCard'));

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

const EnhancedLibraryPage: React.FC = () => {
  const { libraryId } = useParams<{ libraryId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tabFromUrl = queryParams.get('tab');
  const { provider, account } = useContext(WalletContext);
  
  // Performance optimization hooks
  const { debounce, createMemoizedFilter, createPagination, createPerformanceMonitor } = usePerformanceOptimization();
  
  // Set initial tab value based on URL query param
  const initialTabValue = tabFromUrl === 'analytics' ? 1 : 0;
  const [tabValue, setTabValue] = useState(initialTabValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [libraryData, setLibraryData] = useState<any>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [verificationResults, setVerificationResults] = useState<Record<string, VerificationResult>>({});
  
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

  // Batch operation state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [collections, setCollections] = useState<TokenCollection[]>([]);
  const [collectionView, setCollectionView] = useState(false);
  
  // Batch operation dialog state
  const [batchLendOpen, setBatchLendOpen] = useState(false);
  const [batchSellOpen, setBatchSellOpen] = useState(false);
  const [batchTagOpen, setBatchTagOpen] = useState(false);
  const [batchCreateCollectionOpen, setBatchCreateCollectionOpen] = useState(false);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  
  // Batch operation processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  // Snackbar for notifications
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Set provider when it's available
  useEffect(() => {
    if (provider) {
      ownershipVerificationService.setProvider(provider);
    }
  }, [provider]);

  useEffect(() => {
    const fetchLibraryData = async () => {
      try {
        setLoading(true);
        
        // In a real app, fetch from API
        // const response = await fetch(`/api/libraries/${libraryId}`);
        // if (!response.ok) {
        //   throw new Error('Failed to fetch library data');
        // }
        // const data = await response.json();
        
        // Mock data for development
        const data = {
          id: libraryId,
          name: 'My Movie Collection',
          description: 'A collection of my favorite movies and documentaries',
          isPublic: true,
          itemCount: 12,
          totalValue: 2450
        };
        
        setLibraryData(data);
        
        // Fetch library items
        const libraryItems = await fetchLibraryItems(libraryId!);
        setContent(libraryItems);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching library data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (libraryId) {
      fetchLibraryData();
    }
  }, [libraryId, provider, account]);

  // Update tabValue when URL query changes
  useEffect(() => {
    const newTabValue = tabFromUrl === 'analytics' ? 1 : 0;
    setTabValue(newTabValue);
  }, [tabFromUrl]);

  const fetchLibraryItems = async (libraryId: string): Promise<ContentItem[]> => {
    try {
      const items = await libraryService.getLibraryItems(libraryId);
      
      // In development, use mock data
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
            contractAddress: '0x624c5C6395EB28b9952FE9ae0d87B12520b55Bfc', // WyllohFilmRegistry
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
            contractAddress: '0xE171E9db4f2f64d3Fc80AA6E2bdF2770Bb006EC8', // WyllohMarketplace
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
      
      // If provider is available, verify token ownership
      if (provider && account) {
        await verifyContentOwnership(mockItems);
      }
      
      return mockItems;
    } catch (error) {
      console.error('Error fetching library items:', error);
      throw error;
    }
  };

  const verifyContentOwnership = async (items: ContentItem[]) => {
    try {
      // Filter items that have token data
      const tokenizedItems = items.filter(item => item.tokenData);
      
      if (tokenizedItems.length === 0) return;
      
      // For each tokenized item, verify ownership
      const verificationPromises = tokenizedItems.map(async (item) => {
        if (!item.tokenData) return null;
        
        try {
          // Call verification service with all required params
          const result = await ownershipVerificationService.verifyContentOwnership(
            item.contentId,                   // contentId
            item.title,                       // contentTitle
            account!,                         // walletAddress
            item.tokenData.tokenId,           // tokenId
            item.tokenData.contractAddress,   // contractAddress
            item.tokenData.standard,          // tokenStandard
            item.tokenData.chain,             // blockchain
            { forceReverify: true }           // options
          );
          
          return { itemId: item.contentId, result };
        } catch (error) {
          console.error(`Error verifying token ${item.contentId}:`, error);
          // Create a compatible result object for failed verifications
          return { 
            itemId: item.contentId, 
            result: { 
              contentId: item.contentId,
              contentTitle: item.title,
              isOwned: false, 
              previouslyOwned: false,
              verificationTimestamp: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Verification error' 
            } as VerificationResult
          };
        }
      });
      
      const results = await Promise.all(verificationPromises);
      
      // Update verification results
      const verificationMap: Record<string, VerificationResult> = {};
      results.forEach(result => {
        if (result) {
          verificationMap[result.itemId] = result.result;
        }
      });
      
      setVerificationResults(verificationMap);
      
      // Update content items with verification results
      setContent(prevContent => 
        prevContent.map(item => {
          if (verificationMap[item.contentId]) {
            return {
              ...item,
              tokenData: {
                ...item.tokenData!,
                ownershipVerified: verificationMap[item.contentId].isOwned,
                ownershipLastChecked: verificationMap[item.contentId].verificationTimestamp
              }
            };
          }
          return item;
        })
      );
    } catch (error) {
      console.error('Error in batch verification:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Update URL query parameter
    const tabQuery = newValue === 1 ? '?tab=analytics' : '';
    navigate(`/library/${libraryId}${tabQuery}`);
  };

  const navigateToLibraries = () => {
    navigate('/library');
  };

  // Handle lending dialog
  const handleLendContent = (contentId: string) => {
    const item = content.find(item => item.contentId === contentId);
    if (item) {
      setSelectedItem(item);
      setLendDialogOpen(true);
    }
  };

  // Handle selling dialog
  const handleSellContent = (contentId: string) => {
    const item = content.find(item => item.contentId === contentId);
    if (item) {
      setSelectedItem(item);
      setSellPrice(item.currentValue);
      setSellDialogOpen(true);
    }
  };

  // Handle info dialog
  const handleInfoContent = (contentId: string) => {
    const item = content.find(item => item.contentId === contentId);
    if (item) {
      setSelectedItem(item);
      setInfoDialogOpen(true);
    }
  };

  // Handle playing content
  const handlePlayContent = (contentId: string) => {
    console.log('Play content:', contentId);
    // In a real app, this would navigate to a player or streaming URL
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Submit lending form
  const handleSubmitLend = () => {
    console.log('Lending content:', selectedItem?.contentId, 'to:', lendToEmail, 'for', lendDuration, 'days at', lendPrice, 'ETH');
    // In a real app, this would call a lending service
    setLendDialogOpen(false);
    setLendToEmail('');
    setLendDuration(7);
    setLendPrice(0.01);
  };

  // Submit selling form
  const handleSubmitSell = () => {
    console.log('Selling content:', selectedItem?.contentId, 'to:', buyerEmail, 'for', sellPrice, 'USD');
    // In a real app, this would call a selling service
    setSellDialogOpen(false);
    setBuyerEmail('');
    setSellPrice(0);
  };

  // Effect to organize tokens into collections when content changes
  useEffect(() => {
    if (content.length > 0) {
      const tokenCollections = organizeTokenCollections(content);
      setCollections(tokenCollections);
    }
  }, [content]);

  // Update collections when selection changes
  useEffect(() => {
    if (collections.length > 0) {
      const updatedCollections = updateCollectionSelections(collections, selectedItems);
      setCollections(updatedCollections);
    }
  }, [selectedItems, collections.length]);

  // Handle selection change
  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedItems(selectedIds);
  };

  // Toggle collection view
  const handleToggleCollectionView = () => {
    setCollectionView(!collectionView);
  };

  // Batch action handlers
  const handleBatchLend = () => {
    setBatchLendOpen(true);
  };

  const handleBatchSell = () => {
    setBatchSellOpen(true);
  };

  const handleBatchTag = () => {
    setBatchTagOpen(true);
  };

  const handleBatchCreateCollection = () => {
    setBatchCreateCollectionOpen(true);
  };

  const handleBatchDelete = () => {
    setBatchDeleteOpen(true);
  };

  // Batch action submission handlers
  const handleSubmitBatchLend = async (email: string, duration: number, price: number) => {
    try {
      setIsProcessing(true);
      setProcessingMessage('Sending lending offers...');
      
      // Filter out non-tokenized content
      const tokenizedItems = content
        .filter(item => item.tokenData && selectedItems.includes(item.contentId));
      
      // Simulate batch operation with progress
      for (let i = 0; i < tokenizedItems.length; i++) {
        // Update progress
        setProcessingProgress(Math.round(((i + 1) / tokenizedItems.length) * 100));
        setProcessingMessage(`Processing item ${i + 1} of ${tokenizedItems.length}...`);
        
        // Simulate API call (would be a real API call in production)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Successfully sent lending offers for ${tokenizedItems.length} items`,
        severity: 'success',
      });
      
      // Close dialog and reset selection
      setBatchLendOpen(false);
      setSelectedItems([]);
    } catch (error) {
      console.error('Error in batch lend:', error);
      setSnackbar({
        open: true,
        message: 'Failed to process lending offers',
        severity: 'error',
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleSubmitBatchSell = async (price: number, buyerEmail?: string) => {
    try {
      setIsProcessing(true);
      setProcessingMessage('Listing items for sale...');
      
      // Filter out non-tokenized content
      const tokenizedItems = content
        .filter(item => item.tokenData && selectedItems.includes(item.contentId));
      
      // Simulate batch operation with progress
      for (let i = 0; i < tokenizedItems.length; i++) {
        // Update progress
        setProcessingProgress(Math.round(((i + 1) / tokenizedItems.length) * 100));
        setProcessingMessage(`Processing item ${i + 1} of ${tokenizedItems.length}...`);
        
        // Simulate API call (would be a real API call in production)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Successfully listed ${tokenizedItems.length} items for sale`,
        severity: 'success',
      });
      
      // Close dialog and reset selection
      setBatchSellOpen(false);
      setSelectedItems([]);
    } catch (error) {
      console.error('Error in batch sell:', error);
      setSnackbar({
        open: true,
        message: 'Failed to list items for sale',
        severity: 'error',
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleSubmitBatchTag = async (tags: string[]) => {
    try {
      setIsProcessing(true);
      setProcessingMessage('Applying tags...');
      
      // Simulate batch operation with progress
      for (let i = 0; i < selectedItems.length; i++) {
        // Update progress
        setProcessingProgress(Math.round(((i + 1) / selectedItems.length) * 100));
        setProcessingMessage(`Tagging item ${i + 1} of ${selectedItems.length}...`);
        
        // Simulate API call (would be a real API call in production)
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Successfully applied tags to ${selectedItems.length} items`,
        severity: 'success',
      });
      
      // Close dialog and reset selection
      setBatchTagOpen(false);
      setSelectedItems([]);
    } catch (error) {
      console.error('Error in batch tag:', error);
      setSnackbar({
        open: true,
        message: 'Failed to apply tags',
        severity: 'error',
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleSubmitBatchCreateCollection = async (name: string, description: string) => {
    try {
      setIsProcessing(true);
      setProcessingMessage('Creating collection...');
      
      // Simulate collection creation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Successfully created collection "${name}" with ${selectedItems.length} items`,
        severity: 'success',
      });
      
      // Close dialog and reset selection
      setBatchCreateCollectionOpen(false);
      setSelectedItems([]);
    } catch (error) {
      console.error('Error in batch create collection:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create collection',
        severity: 'error',
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleSubmitBatchDelete = async () => {
    try {
      setIsProcessing(true);
      setProcessingMessage('Removing items from library...');
      
      // Simulate batch operation with progress
      for (let i = 0; i < selectedItems.length; i++) {
        // Update progress
        setProcessingProgress(Math.round(((i + 1) / selectedItems.length) * 100));
        setProcessingMessage(`Removing item ${i + 1} of ${selectedItems.length}...`);
        
        // Simulate API call (would be a real API call in production)
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Successfully removed ${selectedItems.length} items from library`,
        severity: 'success',
      });
      
      // In a real app, we would update the content state here
      // For now, let's just simulate it
      setContent(content.filter(item => !selectedItems.includes(item.contentId)));
      
      // Close dialog and reset selection
      setBatchDeleteOpen(false);
      setSelectedItems([]);
    } catch (error) {
      console.error('Error in batch delete:', error);
      setSnackbar({
        open: true,
        message: 'Failed to remove items',
        severity: 'error',
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Handle collection selection
  const handleSelectCollection = (collectionId: string, selected: boolean) => {
    const collection = collections.find(c => c.contentId === collectionId);
    if (!collection) return;
    
    const collectionItemIds = collection.items.map(item => item.contentId);
    
    if (selected) {
      // Add all collection items to selection
      setSelectedItems(prev => [...prev, ...collectionItemIds.filter(id => !prev.includes(id))]);
    } else {
      // Remove all collection items from selection
      setSelectedItems(prev => prev.filter(id => !collectionItemIds.includes(id)));
    }
  };

  // Memoized render helper for collection view
  const renderCollectionView = useCallback(() => (
    <Grid container spacing={3} sx={{ mt: 1 }}>
      {collections.map(collection => (
        <Grid item xs={12} sm={6} md={4} key={collection.contentId}>
          <LazyLoadWrapper height={300}>
            <Suspense fallback={<SkeletonLoader variant="content-card" />}>
              <CollectionCard
                collection={collection}
                onLend={(id) => handleLendContent(id)}
                onSell={(id) => handleSellContent(id)}
                onInfo={(id) => handleInfoContent(id)}
                onPlay={collection.items[0] && !collection.items[0].isLent ? (id) => handlePlayContent(id) : undefined}
                onSelect={handleSelectCollection}
                selected={collection.selectedTokens > 0}
                userIsPro={true}
                context="consumer"
              />
            </Suspense>
          </LazyLoadWrapper>
        </Grid>
      ))}
    </Grid>
  ), [collections, handleLendContent, handleSellContent, handleInfoContent, handlePlayContent, handleSelectCollection]);

  // Memoized render helper for regular item view
  const renderItemView = useCallback(() => (
    <Grid container spacing={3} sx={{ mt: 1 }}>
      {content.map(item => (
        <Grid item xs={12} sm={6} md={4} key={item.contentId}>
          <LazyLoadWrapper height={400}>
            <Suspense fallback={<SkeletonLoader variant="content-card" />}>
              <EnhancedContentCard
                content={{
                  id: item.contentId,
                  title: item.title,
                  description: item.description || '',
                  contentType: item.contentType || 'movie',
                  creator: item.creator || item.director || '',
                  creatorAddress: '',
                  mainFileCid: '',
                  image: item.thumbnailUrl,
                  tokenized: !!item.tokenData,
                  tokenId: item.tokenData?.tokenId,
                  price: item.currentValue || 0,
                  available: 1,
                  totalSupply: 1,
                  metadata: {
                    genres: item.genre ? [item.genre] : [],
                    releaseYear: item.year,
                    duration: '120 min'
                  },
                  createdAt: item.purchaseDate,
                  status: 'active',
                  visibility: 'public',
                  views: Math.floor(Math.random() * 100),
                  sales: 0
                }}
                context="consumer"
                onPlay={!item.isLent ? (id) => handlePlayContent(id) : undefined}
                onFavorite={(id) => console.log('Toggle favorite:', id)}
                hideStatus={false}
                showPrice={false}
                variant="standard"
                elevation={2}
                isSelected={selectedItems.includes(item.contentId)}
                onSelect={(id, selected) => {
                  if (selected) {
                    setSelectedItems(prev => [...prev, id]);
                  } else {
                    setSelectedItems(prev => prev.filter(i => i !== id));
                  }
                }}
              />
              
              {/* Custom action buttons for library context */}
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
                {item.tokenData && (
                  <Tooltip title={item.tokenData.ownershipVerified ? "Ownership verified" : "Verify ownership"}>
                    <IconButton
                      color={item.tokenData.ownershipVerified ? "success" : "warning"}
                      size="small"
                    >
                      {item.tokenData.ownershipVerified ? <VerifiedIcon /> : <ErrorOutlineIcon />}
                    </IconButton>
                  </Tooltip>
                )}
                
                <Tooltip title="Lend">
                  <IconButton
                    color="primary" 
                    size="small"
                    onClick={() => handleLendContent(item.contentId)}
                    disabled={item.isLent}
                  >
                    <SendIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Sell">
                  <IconButton 
                    color="primary" 
                    size="small"
                    onClick={() => handleSellContent(item.contentId)}
                    disabled={item.isLent}
                  >
                    <AttachMoneyIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Details">
                  <IconButton 
                    color="primary" 
                    size="small"
                    onClick={() => handleInfoContent(item.contentId)}
                  >
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Suspense>
          </LazyLoadWrapper>
        </Grid>
      ))}
    </Grid>
  ), [content, selectedItems, handleLendContent, handleSellContent, handleInfoContent, handlePlayContent]);

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
        {/* Selection toolbar */}
        <Suspense fallback={<SkeletonLoader variant="content-card" />}>
          <ContentSelectionToolbar
            items={content}
            collections={collections}
            selectedItems={selectedItems}
            onSelectionChange={handleSelectionChange}
            onBatchLend={handleBatchLend}
            onBatchSell={handleBatchSell}
            onBatchTag={handleBatchTag}
            onBatchCreateCollection={handleBatchCreateCollection}
            onBatchDelete={handleBatchDelete}
            userIsPro={true}
            collectionView={collectionView}
            onToggleCollectionView={handleToggleCollectionView}
          />
        </Suspense>
        
        {/* View toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Tooltip title={collectionView ? "Show individual items" : "Show collections"}>
            <IconButton onClick={handleToggleCollectionView}>
              {collectionView ? <ViewListIcon /> : <ViewModuleIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        
        {content.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              No content in this library yet
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Add content to your library to see it here
            </Typography>
            <Button 
              variant="contained"
              onClick={() => navigate('/store')}
              sx={{ mt: 2 }}
            >
              Browse Store
            </Button>
          </Box>
        ) : (
          collectionView ? renderCollectionView() : renderItemView()
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <LazyLoadWrapper height={500}>
          <Suspense fallback={<SkeletonLoader variant="analytics-chart" height={500} />}>
            <LibraryAnalytics libraryId={libraryId!} />
          </Suspense>
        </LazyLoadWrapper>
      </TabPanel>
      
      {/* Individual action dialogs */}
      <Dialog open={lendDialogOpen} onClose={() => setLendDialogOpen(false)}>
        <DialogTitle>Lend Content</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            {selectedItem?.title}
          </Typography>
          
          <TextField
            label="Recipient Email"
            type="email"
            fullWidth
            margin="normal"
            value={lendToEmail}
            onChange={(e) => setLendToEmail(e.target.value)}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Lending Duration</InputLabel>
            <Select
              value={lendDuration}
              onChange={(e) => setLendDuration(Number(e.target.value))}
            >
              <MenuItem value={3}>3 days</MenuItem>
              <MenuItem value={7}>1 week</MenuItem>
              <MenuItem value={14}>2 weeks</MenuItem>
              <MenuItem value={30}>1 month</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Lending Fee (ETH)"
            type="number"
            fullWidth
            margin="normal"
            value={lendPrice}
            onChange={(e) => setLendPrice(Number(e.target.value))}
            inputProps={{ step: 0.001, min: 0 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLendDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitLend} 
            variant="contained" 
            color="primary"
            disabled={!lendToEmail}
          >
            Send Lending Offer
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={sellDialogOpen} onClose={() => setSellDialogOpen(false)}>
        <DialogTitle>Sell Content</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            {selectedItem?.title}
          </Typography>
          
          <TextField
            label="Buyer Email (Optional)"
            type="email"
            fullWidth
            margin="normal"
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
          />
          
          <TextField
            label="Selling Price (USD)"
            type="number"
            fullWidth
            margin="normal"
            value={sellPrice}
            onChange={(e) => setSellPrice(Number(e.target.value))}
            inputProps={{ step: 1, min: 0 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSellDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitSell} 
            variant="contained" 
            color="primary"
            disabled={sellPrice <= 0}
          >
            List For Sale
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog 
        open={infoDialogOpen} 
        onClose={() => setInfoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Content Details</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                <Box sx={{ width: { xs: '100%', sm: '200px' }, flexShrink: 0 }}>
                  <img 
                    src={selectedItem.thumbnailUrl} 
                    alt={selectedItem.title} 
                    style={{ width: '100%', borderRadius: '4px' }}
                  />
                </Box>
                
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{selectedItem.title}</Typography>
                  
                  {selectedItem.director && (
                    <Typography variant="body1">
                      <strong>Director:</strong> {selectedItem.director}
                    </Typography>
                  )}
                  
                  {selectedItem.year && (
                    <Typography variant="body1">
                      <strong>Year:</strong> {selectedItem.year}
                    </Typography>
                  )}
                  
                  {selectedItem.genre && (
                    <Typography variant="body1">
                      <strong>Genre:</strong> {selectedItem.genre}
                    </Typography>
                  )}
                  
                  <Typography variant="body1">
                    <strong>License:</strong> {selectedItem.licenseType}
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="body1">
                    <strong>Purchased:</strong> {formatDate(selectedItem.purchaseDate)}
                  </Typography>
                  
                  <Typography variant="body1">
                    <strong>Purchase Price:</strong> {formatCurrency(selectedItem.purchasePrice)}
                  </Typography>
                  
                  <Typography variant="body1">
                    <strong>Current Value:</strong> {formatCurrency(selectedItem.currentValue)}
                  </Typography>
                  
                  {selectedItem.isLent && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body1" color="warning.main">
                        <strong>Currently Lent To:</strong> {selectedItem.lentTo}
                      </Typography>
                    </>
                  )}
                  
                  {selectedItem.tokenData && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body1">
                        <strong>Token ID:</strong> {selectedItem.tokenData.tokenId}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Blockchain:</strong> {selectedItem.tokenData.chain}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Standard:</strong> {selectedItem.tokenData.standard}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Typography variant="body1" sx={{ mr: 1 }}>
                          <strong>Ownership:</strong>
                        </Typography>
                        {selectedItem.tokenData.ownershipVerified ? (
                          <Chip 
                            icon={<VerifiedIcon />} 
                            label="Verified" 
                            color="success" 
                            size="small" 
                          />
                        ) : (
                          <Chip 
                            icon={<ErrorOutlineIcon />} 
                            label="Not Verified" 
                            color="warning" 
                            size="small" 
                          />
                        )}
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
              
              {selectedItem.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>Description</Typography>
                  <Typography variant="body1">{selectedItem.description}</Typography>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Batch action modals */}
      <Suspense fallback={null}>
        <BatchActionModals
          selectedItems={selectedItems}
          items={content}
          collections={collections}
          
          batchLendOpen={batchLendOpen}
          onCloseBatchLend={() => setBatchLendOpen(false)}
          onSubmitBatchLend={handleSubmitBatchLend}
          
          batchSellOpen={batchSellOpen}
          onCloseBatchSell={() => setBatchSellOpen(false)}
          onSubmitBatchSell={handleSubmitBatchSell}
          
          batchTagOpen={batchTagOpen}
          onCloseBatchTag={() => setBatchTagOpen(false)}
          onSubmitBatchTag={handleSubmitBatchTag}
          
          batchCreateCollectionOpen={batchCreateCollectionOpen}
          onCloseBatchCreateCollection={() => setBatchCreateCollectionOpen(false)}
          onSubmitBatchCreateCollection={handleSubmitBatchCreateCollection}
          
          batchDeleteOpen={batchDeleteOpen}
          onCloseBatchDelete={() => setBatchDeleteOpen(false)}
          onSubmitBatchDelete={handleSubmitBatchDelete}
          
          isProcessing={isProcessing}
          processingProgress={processingProgress}
          processingMessage={processingMessage}
          availableTags={['Action', 'Drama', 'Sci-Fi', 'Comedy', 'Documentary', 'Horror', 'Indie', 'Foreign']}
        />
      </Suspense>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EnhancedLibraryPage; 