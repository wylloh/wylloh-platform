import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PlayArrow from '@mui/icons-material/PlayArrow';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Divider,
  Chip,
  Card,
  CardContent,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
  LinearProgress,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  InputAdornment,
} from '@mui/material';
import {
  Download,
  Info,
  People,
  DateRange,
  Movie,
  Category,
  ArrowBack,
  Share,
  FavoriteBorder,
  Favorite,
  LocalOffer,
  VerifiedUser,
  Timeline,
  Theaters,
  ListAlt,
  PlaylistAdd,
  ShoppingCart,
  Check,
  Close,
} from '@mui/icons-material';
import { useWallet } from '../../hooks/useWallet';
import { useAuth } from '../../contexts/AuthContext';
import { contentService } from '../../services/content.service';
import { getProjectIpfsUrl } from '../../utils/ipfs';
import { generatePlaceholderImage } from '../../utils/placeholders';
import { Content } from '../../services/content.service';
import { blockchainService } from '../../services/blockchain.service';
import { keyManagementService } from '../../services/keyManagement.service';

// Add interfaces for content types
interface SecondaryMarketListing {
  seller: string;
  quantity: number;
  price: number;
}

// First, let's fix the interface definition with rights thresholds explicitly typed
interface RightsThreshold {
  quantity: number;
  type: string;
}

// Add rights thresholds to the DetailedContent interface
interface DetailedContent extends Content {
  longDescription?: string;
  releaseDate?: string;
  duration?: string;
  ratings?: {
    imdb: number;
    metacritic: number;
  };
  cast?: string[];
  director?: string;
  producer?: string;
  rightsThresholds?: RightsThreshold[];
  transactionHistory?: any[];
  secondaryMarket?: SecondaryMarketListing[];
  genre?: string[];
  trailerUrl?: string;
  creatorAvatar?: string;
  createdAt: string;
  status: 'draft' | 'pending' | 'active';
  visibility: 'public' | 'private' | 'unlisted';
  views: number;
  sales: number;
  encryptionKey?: string;
}

// Mock content data - in a real app, this would come from an API
const mockContent: DetailedContent[] = [
  {
    id: '1',
    title: 'The Digital Frontier',
    description: 'A journey into the world of blockchain and digital ownership.',
    longDescription: 'In "The Digital Frontier," we explore the revolutionary impact of blockchain technology on creative industries. This documentary takes viewers on a journey through the evolving landscape of digital ownership, interviewing pioneers who are redefining how content is created, distributed, and monetized.',
    image: 'https://source.unsplash.com/random/1200x600/?technology',
    contentType: 'documentary',
    creator: 'Digital Studios',
    creatorAddress: '0x1234...5678',
    creatorAvatar: 'https://source.unsplash.com/random/100x100/?portrait',
    price: 0.01,
    available: 250,
    totalSupply: 1000,
    releaseDate: '2023-10-15',
    duration: '84 minutes',
    genre: ['Documentary', 'Technology', 'Finance'],
    cast: ['John Smith', 'Jane Doe', 'David Johnson'],
    director: 'Alexandra Rivera',
    producer: 'Blockchain Media Productions',
    ratings: { imdb: 8.2, metacritic: 85 },
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    tokenized: true,
    tokenId: '0x1234...5678',
    rightsThresholds: [
      { quantity: 1, type: 'Personal Viewing' },
      { quantity: 100, type: 'Small Venue (50 seats)' },
      { quantity: 5000, type: 'Streaming Platform' },
      { quantity: 10000, type: 'Theatrical Exhibition' }
    ],
    transactionHistory: [
      { date: '2023-10-15', type: 'Mint', quantity: 1000, price: 0.01 },
      { date: '2023-10-16', type: 'Purchase', quantity: 5, price: 0.01 },
      { date: '2023-10-17', type: 'Purchase', quantity: 10, price: 0.01 },
      { date: '2023-10-18', type: 'Secondary Sale', quantity: 2, price: 0.015 }
    ],
    secondaryMarket: [
      { seller: '0xabcd...efgh', quantity: 2, price: 0.015 },
      { seller: '0xijkl...mnop', quantity: 1, price: 0.016 }
    ],
    mainFileCid: 'Qm...',
    thumbnailCid: 'Qm...',
    previewCid: 'Qm...',
    metadata: {
      cast: ['John Smith', 'Jane Doe', 'David Johnson'],
      director: 'Alexandra Rivera',
      producer: 'Blockchain Media Productions'
    },
    createdAt: '2023-10-15T00:00:00.000Z',
    status: 'active',
    visibility: 'public',
    views: 245,
    sales: 18
  },
  // Additional mock content would be here
];

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
      id={`content-tabpanel-${index}`}
      aria-labelledby={`content-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ContentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<DetailedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [quantity, setQuantity] = useState('1');
  const [isFavorite, setIsFavorite] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const { active, account, isCorrectNetwork } = useWallet();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [isPurchased, setIsPurchased] = useState(false);
  const [redirectToCollection, setRedirectToCollection] = useState(false);
  
  // Ownership check state
  const [userOwnsContent, setUserOwnsContent] = useState(false);
  const [ownedTokens, setOwnedTokens] = useState(0);

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return;
      
      try {
        const contentData = await contentService.getContentById(id);
        if (contentData) {
          setContent(contentData);
          
          // Check ownership
          try {
            const ownershipStatus = await contentService.checkContentOwnership(id);
            setUserOwnsContent(ownershipStatus.owned);
            setOwnedTokens(ownershipStatus.quantity);
            console.log('Ownership status:', ownershipStatus);
          } catch (error) {
            console.error('Error checking content ownership:', error);
          }
        } else {
          setError('Content not found');
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Failed to load content details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
  }, [id]);

  // Check if user owns content
  useEffect(() => {
    const checkOwnership = async () => {
      if (content && active && account) {
        try {
          // Check if this content is in the user's purchased content
          const purchased = await contentService.getPurchasedContent();
          const ownedContent = purchased.find(item => item.id === content.id);
          
          // If found in purchased content or isPurchased is already true
          const isOwned = !!ownedContent || isPurchased;
          setUserOwnsContent(isOwned);
          
          if (ownedContent) {
            setOwnedTokens(ownedContent.purchaseQuantity || 0);
            
            // Get rights thresholds and determine unlocked tiers
            try {
              const thresholds = await contentService.getRightsThresholds(content.id);
              console.log('Rights thresholds:', thresholds);
              console.log('Owned tokens:', ownedContent.purchaseQuantity);
              
              // Update content with rights thresholds if not already set
              if (!content.rightsThresholds && thresholds.length > 0) {
                setContent({
                  ...content,
                  rightsThresholds: thresholds
                });
              }
            } catch (e) {
              console.error('Error fetching rights thresholds:', e);
            }
          }
        } catch (error) {
          console.error('Error checking ownership:', error);
          setUserOwnsContent(false);
        }
      }
    };
    
    checkOwnership();
  }, [content, active, account, isPurchased]);

  // Update the function to generate default license tiers to return properly typed objects
  const generateDefaultLicenseTiers = (): RightsThreshold[] => {
    return [
      { quantity: 1, type: "Personal Use" },
      { quantity: 10, type: "Small Venue" },
      { quantity: 50, type: "Commercial Use" },
      { quantity: 100, type: "Broadcast Rights" }
    ];
  };

  // When the content is loaded, ensure it has rights thresholds only if none exist
  useEffect(() => {
    if (content && 
        !content.rightsThresholds && 
        (!content.metadata?.rightsThresholds || 
         content.metadata.rightsThresholds.length === 0)) {
      console.log('No rights thresholds found, adding defaults');
      // Create a deep copy to avoid direct state mutation
      const updatedContent = { 
        ...content,
        metadata: {
          ...content.metadata,
          rightsThresholds: generateDefaultLicenseTiers()
        }
      };
      setContent(updatedContent);
    }
  }, [content]);

  // Fix the getUserLicenseTiers function with proper typing
  const getUserLicenseTiers = (): string[] => {
    if (!content || !userOwnsContent) {
      return [];
    }
    
    // First try to use rights thresholds from content itself (set during tokenization)
    const thresholds: RightsThreshold[] = 
      content.rightsThresholds || 
      (content.metadata?.rightsThresholds as RightsThreshold[] || []);
    
    return thresholds
      .filter((tier: RightsThreshold) => tier.quantity <= ownedTokens)
      .map((tier: RightsThreshold) => tier.type);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {  // Only allow digits
      setQuantity(value);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handlePurchaseDialogOpen = () => {
    setPurchaseDialogOpen(true);
  };

  const handlePurchaseDialogClose = () => {
    setPurchaseDialogOpen(false);
  };

  const handlePurchaseContent = async () => {
    if (!content || !active || !account) return;
    
    try {
      setIsPurchasing(true);
      
      // Get the token price 
      const tokenPrice = content.price || 0.01;
      console.log(`Purchasing ${quantity} tokens at ${tokenPrice} ETH each`);
      
      // Purchase the content token using blockchain service - pass per-token price, not total
      await blockchainService.purchaseTokens(
        content.id,
        Number(quantity),
        tokenPrice  // Now passing the per-token price, not the total price
      );
      
      // After successful purchase, store the content key
      if (content.encryptionKey) {
        await keyManagementService.storeContentKey(
          content.id,
          content.encryptionKey,
          account
        );
      }
      
      // Refresh purchased content status with direct creation of purchase record
      // This ensures the content appears in the collection immediately
      const purchased = await contentService.getPurchasedContent();
      let updatedContent;
      
      // Find if this content is already purchased
      const existingPurchase = purchased.find(item => item.id === content.id);
      
      if (existingPurchase) {
        // Update existing purchase
        existingPurchase.purchaseQuantity += Number(quantity);
        updatedContent = existingPurchase;
        
        // Update local storage
        localStorage.setItem('purchased_content', JSON.stringify(purchased));
      } else {
        // Create new purchase record
        const newPurchase = {
          ...content,
          purchaseDate: new Date().toISOString(),
          purchasePrice: tokenPrice,
          purchaseQuantity: Number(quantity)
        };
        
        purchased.push(newPurchase);
        updatedContent = newPurchase;
        
        // Update local storage
        localStorage.setItem('purchased_content', JSON.stringify(purchased));
      }
      
      if (updatedContent) {
        setContent({...content, ...updatedContent});
        setIsPurchased(true);
        setUserOwnsContent(true);
        setOwnedTokens(Number(quantity));
      }
      
      // Show success message
      setSnackbarMessage('Content purchased successfully! You now have access.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Close dialog
      handlePurchaseDialogClose();
      
      // Redirect to collection after a short delay to show the success message
      setTimeout(() => {
        setRedirectToCollection(true);
      }, 1500);
    } catch (error: any) {
      console.error('Error purchasing content:', error);
      
      // Format a more user-friendly error message based on the error
      let errorMessage = 'Failed to purchase content. Please try again.';
      
      if (error.message) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds in your wallet to complete this purchase.';
        } else if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected. Please try again when ready.';
        } else if (error.message.includes('Contract address')) {
          errorMessage = 'Contract configuration issue. Please contact support.';
        } else if (error.message.includes('Payment was sent but token transfer failed')) {
          errorMessage = 'Payment was processed but token transfer failed. The system will attempt to credit your tokens. Please check your collection in a few minutes.';
          
          // Create a fallback local record of the purchase since payment went through
          // This helps ensure the user gets access even if the blockchain part failed
          try {
            console.log('Creating fallback local purchase record since payment was processed');
            const purchased = await contentService.getPurchasedContent();
            const existingPurchase = purchased.find(item => item.id === content.id);
            const tokenPriceForFallback = content.price || 0.01; // Get token price again to avoid scope issues
            
            if (existingPurchase) {
              existingPurchase.purchaseQuantity += Number(quantity);
              localStorage.setItem('purchased_content', JSON.stringify(purchased));
            } else {
              const newPurchase = {
                ...content,
                purchaseDate: new Date().toISOString(),
                purchasePrice: tokenPriceForFallback,
                purchaseQuantity: Number(quantity)
              };
              
              purchased.push(newPurchase);
              localStorage.setItem('purchased_content', JSON.stringify(purchased));
            }
            
            // Show a special warning message
            setSnackbarMessage('Payment processed, but there was an issue with the token transfer. You have been granted access to the content, and the system will attempt to synchronize your tokens.');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            
            // Set purchase as successful (from access standpoint) despite the error
            setIsPurchased(true);
            setUserOwnsContent(true);
            setOwnedTokens(prev => prev + Number(quantity));
            
            // Redirect to collection after a delay
            setTimeout(() => {
              setRedirectToCollection(true);
            }, 3000);
            
            return; // Exit early since we've handled this special case
          } catch (fallbackError) {
            console.error('Failed to create fallback purchase record:', fallbackError);
          }
        } else if (error.message.includes('enough tokens')) {
          errorMessage = 'The creator does not have enough tokens available to complete this sale.';
        } else {
          // Include part of the original error for debugging
          const shortErrorMsg = error.message.substring(0, 100) + (error.message.length > 100 ? '...' : '');
          errorMessage = `Transaction failed: ${shortErrorMsg}`;
        }
      }
      
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsPurchasing(false);
    }
  };

  // Calculate total price
  const totalPrice = content ? Number(quantity) * (content.price || 0) : 0;

  // Update the purchase card to show ownership status and play button
  const renderPurchaseCard = () => {
    if (!content) return null;
    
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {userOwnsContent ? 'You Own This Content' : 'Purchase License'}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {/* Ownership information */}
          {userOwnsContent && (
            <Box sx={{ mb: 3, bgcolor: 'success.light', p: 2, borderRadius: 1 }}>
              <Typography variant="body1" color="white" gutterBottom>
                You own {ownedTokens} token{ownedTokens !== 1 ? 's' : ''} of this content
              </Typography>
              
              {/* License tier display */}
              <Box sx={{ mt: 1, mb: 2, bgcolor: 'rgba(255,255,255,0.15)', p: 1, borderRadius: 1 }}>
                <Typography variant="subtitle2" color="white" gutterBottom>
                  Your License Rights:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {getUserLicenseTiers().map((tier: string, i: number) => (
                    <Chip
                      key={i}
                      size="small"
                      label={tier}
                      sx={{ mr: 0.5, mb: 0.5, bgcolor: 'white', color: 'success.dark' }}
                    />
                  ))}
                </Box>
              </Box>
                
              <Button
                variant="contained"
                color="primary"
                component={Link}
                to={`/player/${content.id}?preview=true`}
                startIcon={<PlayArrow />}
                sx={{ mt: 1 }}
                fullWidth
              >
                Play Content
              </Button>
            </Box>
          )}
          
          {/* Primary Market */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Primary Market
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h5" sx={{ mr: 1 }}>
                {content.available}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                / {content.totalSupply}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={content.available && content.totalSupply ? (content.available / content.totalSupply) * 100 : 0} 
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {content.available && content.totalSupply ? 
                Math.round((content.available / content.totalSupply) * 100) : 0}% still available
            </Typography>
            <Typography variant="h5" color="primary" sx={{ mt: 2 }}>
              {content.price || 0} ETH
            </Typography>
          </Box>

          {/* Secondary Market */}
          {content.secondaryMarket && content.secondaryMarket.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Secondary Market
              </Typography>
              <List>
                {content.secondaryMarket.map((listing: SecondaryMarketListing, index: number) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={`${listing.quantity} License${listing.quantity > 1 ? 's' : ''}`}
                      secondary={`Seller: ${listing.seller}`}
                    />
                    <Typography variant="h6" color="primary">
                      {listing.price} ETH
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <TextField
              label="Quantity"
              type="text"
              value={quantity}
              onChange={handleQuantityChange}
              fullWidth
              variant="outlined"
              inputProps={{ min: 1, max: content.available }}
              helperText={`Total: ${totalPrice.toFixed(4)} ETH`}
            />
          </Box>

          {isAuthenticated ? (
            active ? (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                startIcon={purchaseInProgress ? null : <ShoppingCart />}
                onClick={handlePurchaseDialogOpen}
                disabled={purchaseInProgress || !isCorrectNetwork || Number(quantity) < 1 || (content.available ? Number(quantity) > content.available : true)}
              >
                {purchaseInProgress ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  isCorrectNetwork ? 'Purchase Now' : 'Switch Network to Purchase'
                )}
              </Button>
            ) : (
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<AccountBalanceWalletIcon />}
                onClick={() => {/* Connect wallet logic */}}
              >
                Connect Wallet to Purchase
              </Button>
            )
          ) : (
            <Button
              variant="contained"
              fullWidth
              size="large"
              component={Link}
              to="/login"
            >
              Login to Purchase
            </Button>
          )}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Purchase includes perpetual license with resale rights
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Function to get content image URL
  const getContentImageUrl = () => {
    if (!content) return '';
    
    if (content.thumbnailCid) {
      return getProjectIpfsUrl(content.thumbnailCid);
    }
    
    if (content.image) {
      return content.image;
    }
    
    return generatePlaceholderImage(content.title);
  };

  // Redirect to collection after successful purchase
  if (redirectToCollection) {
    return <Navigate to="/collection" />;
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Skeleton variant="rectangular" height={400} sx={{ mb: 2 }} />
          <Skeleton variant="text" height={60} sx={{ mb: 1 }} />
          <Skeleton variant="text" height={30} sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" height={250} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={250} />
            </Grid>
          </Grid>
        </Box>
      </Container>
    );
  }

  if (error || !content) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error || "Content not found"}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/marketplace')}
          >
            Back to Marketplace
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Navigation */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Button
            component={Link}
            to="/marketplace"
            startIcon={<ArrowBack />}
            sx={{ mr: 2 }}
          >
            Back to Marketplace
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
            <IconButton onClick={toggleFavorite} sx={{ mr: 1 }}>
              {isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Share">
            <IconButton>
              <Share />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Main content */}
        <Grid container spacing={4}>
          {/* Left column - Content image and metadata */}
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: 0,
                paddingBottom: '56.25%', // 16:9 aspect ratio
                mb: 3,
                borderRadius: 1,
                overflow: 'hidden',
                bgcolor: 'grey.200',
              }}
            >
              <img
                src={getContentImageUrl()}
                alt={content.title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  size="large"
                  component={Link}
                  to={`/player/${content.id}?preview=true`}
                  sx={{
                    borderRadius: 50,
                    px: 3,
                    py: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    },
                  }}
                >
                  Preview
                </Button>
              </Box>
            </Box>

            {/* Title and Basic Info */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h4" component="h1">
                  {content.title}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {content.genre && Array.isArray(content.genre) && content.genre.map((genre: string) => (
                  <Chip key={genre} label={genre} size="small" />
                ))}
                <Chip
                  icon={<Category fontSize="small" />}
                  label={content.contentType}
                  size="small"
                  color="primary"
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 1 }}>
                <DateRange fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2" sx={{ mr: 2 }}>
                  {content.releaseDate}
                </Typography>
                <Movie fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2" sx={{ mr: 2 }}>
                  {content.duration}
                </Typography>
                <People fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  Director: {content.director}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  Ratings:
                </Typography>
                <Chip
                  label={`IMDb: ${content.ratings?.imdb}/10`}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={`Metacritic: ${content.ratings?.metacritic}/100`}
                  size="small"
                />
              </Box>
            </Box>

            {/* Tabs Panel */}
            <Box sx={{ width: '100%', mb: 4 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  aria-label="content tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="Description" icon={<Info />} iconPosition="start" />
                  <Tab label="Cast & Crew" icon={<People />} iconPosition="start" />
                  <Tab label="License Tiers" icon={<ListAlt />} iconPosition="start" />
                  <Tab label="Transaction History" icon={<Timeline />} iconPosition="start" />
                </Tabs>
              </Box>
              <TabPanel value={tabValue} index={0}>
                <Typography variant="body1" paragraph>
                  {content.longDescription ? content.longDescription.split('\n\n').map((paragraph: string, idx: number) => (
                    <React.Fragment key={idx}>
                      {paragraph}
                      <br /><br />
                    </React.Fragment>
                  )) : content.description}
                </Typography>
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom>Cast</Typography>
                <List>
                  {(content.cast && Array.isArray(content.cast) && content.cast.length > 0) ? (
                    content.cast.map((person: string) => (
                      <ListItem key={person}>
                        <ListItemIcon>
                          <Avatar>{person.charAt(0)}</Avatar>
                        </ListItemIcon>
                        <ListItemText primary={person} />
                      </ListItem>
                    ))
                  ) : content.metadata && content.metadata.cast ? (
                    Array.isArray(content.metadata.cast) ? (
                      content.metadata.cast.map((person: string) => (
                        <ListItem key={person}>
                          <ListItemIcon>
                            <Avatar>{person.charAt(0)}</Avatar>
                          </ListItemIcon>
                          <ListItemText primary={person} />
                        </ListItem>
                      ))
                    ) : typeof content.metadata.cast === 'string' ? (
                      content.metadata.cast.split(',').map((person: string) => (
                        <ListItem key={person}>
                          <ListItemIcon>
                            <Avatar>{person.charAt(0)}</Avatar>
                          </ListItemIcon>
                          <ListItemText primary={person} />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="Cast information not available" />
                      </ListItem>
                    )
                  ) : (
                    <ListItem>
                      <ListItemText primary="Cast information not available" />
                    </ListItem>
                  )}
                </List>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>Crew</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar>D</Avatar>
                    </ListItemIcon>
                    <ListItemText 
                      primary={content.director || (content.metadata?.director) || 'Director information not available'} 
                      secondary="Director" 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar>P</Avatar>
                    </ListItemIcon>
                    <ListItemText 
                      primary={content.producer || (content.metadata?.producer) || 'Producer information not available'} 
                      secondary="Producer" 
                    />
                  </ListItem>
                </List>
              </TabPanel>
              <TabPanel value={tabValue} index={2}>
                <Typography variant="body1" paragraph>
                  Wylloh licenses use a unique modular rights system. By accumulating more tokens, you can unlock additional rights for this content:
                </Typography>
                <List dense>
                  {content?.rightsThresholds ? 
                    content.rightsThresholds.map((right, index: number) => (
                      <ListItem key={index} sx={{ pl: 0 }}>
                        <ListItemIcon sx={{ minWidth: '36px' }}>
                          {Number(quantity) >= right.quantity ? (
                            <Check color="success" />
                          ) : (
                            <Close color="disabled" />
                          )}
                        </ListItemIcon>
                        <ListItemText 
                          primary={right.type} 
                          secondary={`Required tokens: ${right.quantity}`}
                        />
                      </ListItem>
                    ))
                  : content?.metadata?.rightsThresholds ?
                    content.metadata.rightsThresholds.map((right: RightsThreshold, index: number) => (
                      <ListItem key={index} sx={{ pl: 0 }}>
                        <ListItemIcon sx={{ minWidth: '36px' }}>
                          {Number(quantity) >= right.quantity ? (
                            <Check color="success" />
                          ) : (
                            <Close color="disabled" />
                          )}
                        </ListItemIcon>
                        <ListItemText 
                          primary={right.type} 
                          secondary={`Required tokens: ${right.quantity}`}
                        />
                      </ListItem>
                    ))
                  : 
                    <ListItem sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: '36px' }}>
                        <Check color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Personal Viewing" 
                        secondary="Basic access to content"
                      />
                    </ListItem>
                  }
                </List>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tokens can be accumulated and stacked to unlock these rights. For example, if you want to stream this content on your platform, you would need to acquire the necessary number of tokens that give you that right.
                  </Typography>
                </Box>
              </TabPanel>
              <TabPanel value={tabValue} index={3}>
                <Typography variant="subtitle1" gutterBottom>
                  Recent Transactions
                </Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Price (ETH)</TableCell>
                      <TableCell align="right">Total (ETH)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {content.transactionHistory?.map((tx: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{tx.date}</TableCell>
                        <TableCell>{tx.type}</TableCell>
                        <TableCell align="right">{tx.quantity}</TableCell>
                        <TableCell align="right">{tx.price}</TableCell>
                        <TableCell align="right">{(tx.quantity * tx.price).toFixed(3)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabPanel>
            </Box>
          </Grid>

          {/* Right column - Purchase card */}
          <Grid item xs={12} md={4}>
            {renderPurchaseCard()}

            {/* Creator Info Card */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    src={content.creatorAvatar} 
                    sx={{ width: 64, height: 64, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="h6">
                      {content.creator}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Content Creator
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" paragraph>
                  {content.creator} specializes in creating high-quality documentaries that explore the intersection of technology and society.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    component={Link}
                    to={`/creator/${content.creatorAddress}`}
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PlaylistAdd />}
                  >
                    Follow Creator
                  </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                  Address: {content.creatorAddress}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Purchase Dialog */}
      <Dialog
        open={purchaseDialogOpen}
        onClose={handlePurchaseDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Purchase Content</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to purchase {quantity} token(s) of "{content?.title}" for a total of {content?.price ? (content.price * Number(quantity)).toFixed(4) : '0.01'} ETH.
          </DialogContentText>
          
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Quantity:
            </Typography>
            <TextField
              value={quantity}
              onChange={handleQuantityChange}
              type="text"
              fullWidth
              size="small"
              InputProps={{
                endAdornment: <InputAdornment position="end">Tokens</InputAdornment>,
                inputProps: { min: 1, max: content?.available || 1000 }
              }}
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            By purchasing this token, you will receive the following rights:
          </Typography>
          
          <List dense>
            {content?.rightsThresholds ? 
              content.rightsThresholds.map((right, index: number) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: '36px' }}>
                    {Number(quantity) >= right.quantity ? (
                      <Check color="success" />
                    ) : (
                      <Close color="disabled" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={right.type} 
                    secondary={`Required tokens: ${right.quantity}`}
                  />
                </ListItem>
              ))
            : content?.metadata?.rightsThresholds ?
              content.metadata.rightsThresholds.map((right: RightsThreshold, index: number) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemIcon sx={{ minWidth: '36px' }}>
                    {Number(quantity) >= right.quantity ? (
                      <Check color="success" />
                    ) : (
                      <Close color="disabled" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={right.type} 
                    secondary={`Required tokens: ${right.quantity}`}
                  />
                </ListItem>
              ))
            : 
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon sx={{ minWidth: '36px' }}>
                  <Check color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Personal Viewing" 
                  secondary="Basic access to content"
                />
              </ListItem>
            }
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePurchaseDialogClose}>Cancel</Button>
          <Button 
            onClick={handlePurchaseContent} 
            variant="contained" 
            color="primary"
            disabled={isPurchasing}
          >
            {isPurchasing ? 'Processing...' : 'Confirm Purchase'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ContentDetailsPage;