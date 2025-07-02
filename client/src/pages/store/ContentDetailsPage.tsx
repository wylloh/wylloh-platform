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
import { enhancedBlockchainService } from '../../services/enhancedBlockchain.service';
import { keyManagementService } from '../../services/keyManagement.service';
import DeviceManagementPanel from '../../components/content/DeviceManagementPanel';
import { StripeOnrampModal } from '../../components/payment';
import { formatCurrency } from '../../utils/formatting';

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
  currency?: string;
}

// Production content data - would be fetched from API in production
const productionContent: DetailedContent[] = [
  // Content would be populated from your backend API
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
  
  // Stripe onramp state
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeRequired, setStripeRequired] = useState(false);
  const [stripeAvailable, setStripeAvailable] = useState(false);

  const fetchContent = async () => {
    if (!id) return;
    
    try {
      // But for this demo, we'll use mock data
      const foundContent = productionContent.find(item => item.id === id);
      
      if (foundContent) {
        setContent(foundContent);
      } else {
        throw new Error("Content not found");
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to load content details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    checkStripeAvailability();
  }, [id]);

  const checkStripeAvailability = async () => {
    try {
      const available = await enhancedBlockchainService.isStripeOnrampAvailable();
      setStripeAvailable(available);
      console.log('💳 Stripe availability:', available);
    } catch (error) {
      console.error('❌ Error checking Stripe availability:', error);
    }
  };

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
      setStripeRequired(false);
      
      // Get the token price in USDC
      const tokenPrice = content.price || 19.99; // Default to $19.99 for parity with traditional digital platforms
      const totalPrice = Number(quantity) * tokenPrice;
      console.log(`🎬 Starting enhanced purchase flow for ${quantity} tokens at $${tokenPrice} USDC each (Total: $${totalPrice})`);
      
      // Validate purchase requirements
      const validation = await enhancedBlockchainService.validatePurchaseRequirements(
        content.id,
        totalPrice.toString(),
        account
      );

      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid purchase requirements');
      }

      // Attempt purchase with smart Stripe fallback
      const result = await enhancedBlockchainService.purchaseWithSmartFallback({
        contentId: content.id,
        contentTitle: content.title,
        price: totalPrice.toString(),
        walletAddress: account,
        onStripeRequired: () => {
          console.log('💳 Stripe onramp required');
          setStripeRequired(true);
          if (stripeAvailable) {
            setShowStripeModal(true);
          } else {
            throw new Error('Insufficient USDC balance. Please add USDC to your wallet manually.');
          }
        }
      });

      if (result.success && !result.usedStripe) {
        // Direct blockchain purchase succeeded - continue with existing success logic
        console.log('✅ Direct purchase successful:', result.transactionHash);
      
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
      } else if (result.usedStripe) {
        // Stripe onramp initiated - purchase will complete after funding
        console.log('💳 Stripe onramp initiated - waiting for user to complete funding');
        return; // Don't set isPurchasing to false yet
      } else if (result.error) {
        // Enhanced error handling
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('❌ Enhanced purchase error:', error);
      
      // Use enhanced error formatting
      let errorMessage = error.message 
        ? enhancedBlockchainService.formatErrorForUser(error.message)
        : 'Failed to purchase content. Please try again.';
      
      // Special handling for fallback purchase record creation
      if (error.message && error.message.includes('Payment was sent but token transfer failed')) {
          errorMessage = 'Payment was processed but token transfer failed. The system will attempt to credit your tokens. Please check your collection in a few minutes.';
          
          // Create a fallback local record of the purchase since payment went through
          // This helps ensure the user gets access even if the blockchain part failed
          try {
            console.log('Creating fallback local purchase record since payment was processed');
            const purchased = await contentService.getPurchasedContent();
            const existingPurchase = purchased.find(item => item.id === content.id);
            const tokenPriceForFallback = content.price || 19.99; // Get token price again to avoid scope issues
            
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
        } else {
          // For other errors, just use the enhanced error message
          console.log('Using enhanced error formatting for:', error.message);
        }
      
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      if (!showStripeModal) {
        setIsPurchasing(false);
      }
    }
  };

  const completePurchaseAfterFunding = async () => {
    if (!content || !account) return;

    try {
      console.log('🎉 Completing purchase after Stripe funding...');
      const tokenPrice = content.price || 19.99;
      const totalPrice = Number(quantity) * tokenPrice;
      
      const result = await enhancedBlockchainService.completePurchaseAfterFunding(
        content.id,
        totalPrice.toString(),
        account
      );

      if (result.success) {
        // Continue with existing success logic
        if (content.encryptionKey) {
          await keyManagementService.storeContentKey(
            content.id,
            content.encryptionKey,
            account
          );
        }

        // Update purchased content status
        const purchased = await contentService.getPurchasedContent();
        const existingPurchase = purchased.find(item => item.id === content.id);
        
        if (existingPurchase) {
          existingPurchase.purchaseQuantity += Number(quantity);
          localStorage.setItem('purchased_content', JSON.stringify(purchased));
        } else {
          const newPurchase = {
            ...content,
            purchaseDate: new Date().toISOString(),
            purchasePrice: tokenPrice,
            purchaseQuantity: Number(quantity)
          };
          purchased.push(newPurchase);
          localStorage.setItem('purchased_content', JSON.stringify(purchased));
        }

        setIsPurchased(true);
        setUserOwnsContent(true);
        setOwnedTokens(prev => prev + Number(quantity));
        
        setSnackbarMessage('🎉 Payment completed! Content purchased successfully via credit card.');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        console.log('✅ Post-funding purchase successful:', result.transactionHash);
        
        setTimeout(() => {
          setRedirectToCollection(true);
        }, 1500);
      } else {
        throw new Error(result.error || 'Failed to complete purchase after funding');
      }
    } catch (error) {
      console.error('❌ Post-funding purchase error:', error);
      setSnackbarMessage('Payment completed, but there was an issue finalizing your purchase. Please contact support.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  };

  const handleStripeModalClose = () => {
    setShowStripeModal(false);
    setIsPurchasing(false);
    setStripeRequired(false);
  };

  const handleStripeSuccess = () => {
    console.log('🎉 Stripe onramp completed successfully');
    setShowStripeModal(false);
    completePurchaseAfterFunding();
  };

  const handleStripeError = (error: string) => {
    console.error('❌ Stripe onramp error:', error);
    setShowStripeModal(false);
    setIsPurchasing(false);
    setStripeRequired(false);
    setSnackbarMessage(`Credit card payment failed: ${error}`);
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
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
              {formatCurrency(content.price || 19.99, 'USDC')}
            </Typography>
            
            {/* Payment Method Info */}
            {!userOwnsContent && stripeAvailable && (
              <Alert severity="info" sx={{ mt: 2, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    💳 Credit Card or 🪙 Wallet USDC • Powered by Stripe
                  </Typography>
                </Box>
              </Alert>
            )}
            
            {stripeRequired && stripeAvailable && (
              <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    ⚠️ Insufficient USDC balance detected. Add funds with your credit card.
                  </Typography>
                </Box>
              </Alert>
            )}
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
                      {listing.price} USDC
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
              helperText={`Total: ${formatCurrency(totalPrice, 'USDC')}`}
            />
          </Box>

          {isAuthenticated ? (
            active ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  startIcon={isPurchasing ? null : <ShoppingCart />}
                  onClick={handlePurchaseDialogOpen}
                  disabled={isPurchasing || !isCorrectNetwork || Number(quantity) < 1 || (content.available ? Number(quantity) > content.available : true)}
                >
                  {isPurchasing ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    isCorrectNetwork ? `Purchase ${formatCurrency(totalPrice, 'USDC')}` : 'Switch Network to Purchase'
                  )}
                </Button>
                
                {/* Payment Methods Info */}
                {!userOwnsContent && (
                  <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
                    {stripeAvailable 
                      ? '💳 Credit Card • 🪙 Wallet USDC • 🔒 Secure Payment'
                      : '🪙 USDC Wallet Payment Only'
                    }
                  </Typography>
                )}
              </>
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
              Purchase includes perpetual license with resale rights • Powered by blockchain technology
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
            onClick={() => navigate('/store')}
          >
            Back to Store
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
            to="/store"
            startIcon={<ArrowBack />}
            sx={{ mr: 2 }}
          >
            Back to Store
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
            <Box sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  aria-label="content tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="Overview" />
                  <Tab label="Details" />
                  <Tab label="Devices" />
                  <Tab label="History" />
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
                <Box>
                  {userOwnsContent && (
                    <DeviceManagementPanel
                      contentId={id || ''}
                      onDeviceChange={fetchContent}
                    />
                  )}
                  {!userOwnsContent && (
                    <Alert severity="info" sx={{ m: 2 }}>
                      You need to own this content to manage devices.
                    </Alert>
                  )}
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
                      <TableCell align="right">Price (USDC)</TableCell>
                      <TableCell align="right">Total (USDC)</TableCell>
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
            You are about to purchase {quantity} token(s) of "{content?.title}" for a total of {content?.price ? (content.price * Number(quantity)).toFixed(4) : '0.01'} USDC.
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

      {/* Stripe Onramp Modal */}
      <StripeOnrampModal
        open={showStripeModal}
        onClose={handleStripeModalClose}
        walletAddress={account || ''}
        requiredAmount={(content ? Number(quantity) * (content.price || 19.99) : 0).toString()}
        contentTitle={content?.title || 'Content'}
        onSuccess={handleStripeSuccess}
        onError={handleStripeError}
      />

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