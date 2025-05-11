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
import DeviceManagementPanel from '../../components/content/DeviceManagementPanel';
import SimilarContent from '../../components/recommendations/SimilarContent';

// Add interfaces for content types
interface SecondaryMarketListing {
  seller: string;
  quantity: number;
  price: number;
}

// Interface for license tiers
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

// Mock content data for testing
const mockContent: DetailedContent[] = [
  {
    id: '1',
    title: 'Blockchain Odyssey',
    description: 'A journey through the evolution of blockchain technology.',
    longDescription: 'Blockchain Odyssey takes viewers on an immersive journey through the groundbreaking evolution of blockchain technology. From the mysterious origins of Bitcoin to the latest developments in decentralized finance, this documentary explores how distributed ledger technology is revolutionizing industries worldwide.\n\nFeaturing interviews with leading technologists, economists, and futurists, the film offers a comprehensive look at both the promise and challenges of this transformative technology.\n\nViewers will gain insights into smart contracts, tokenization, and how blockchain may reshape our digital future in ways we're only beginning to understand.',
    image: 'https://source.unsplash.com/random/800x450?blockchain',
    contentType: 'movie',
    price: 0.01,
    creator: 'Crypto Films',
    creatorId: '12345',
    creatorAddress: '0x1234567890abcdef',
    creatorAvatar: 'https://source.unsplash.com/random/100x100?person',
    releaseDate: 'October 15, 2023',
    duration: '1h 24m',
    availableFormats: ['HD', '4K'],
    totalSupply: 100,
    available: 82,
    tokenId: '1',
    tokenAddress: '0xabcdef1234567890',
    tokenStandard: 'ERC-1155',
    blockchain: 'Ethereum',
    ratings: {
      imdb: 8.2,
      metacritic: 85
    },
    rightsTiers: [
      { name: 'Personal', description: 'For personal viewing only', quantity: 1 },
      { name: 'Small Venue', description: 'License for venues up to 50 people', quantity: 10 },
      { name: 'Commercial', description: 'Commercial broadcasting rights', quantity: 50 }
    ],
    genre: ['Documentary', 'Technology', 'Finance'],
    cast: ['Dr. Satoshi Nakamoto', 'Vitalik Buterin', 'Charles Hoskinson'],
    director: 'Alex Blockchain',
    producer: 'DeFi Productions',
    trailerUrl: 'https://example.com/trailer',
    transactionHistory: [
      { date: '2023-10-15', type: 'Mint', quantity: 100, price: 0 },
      { date: '2023-10-16', type: 'Sale', quantity: 5, price: 0.01 },
      { date: '2023-10-17', type: 'Sale', quantity: 3, price: 0.01 },
      { date: '2023-10-18', type: 'Sale', quantity: 10, price: 0.01 }
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
      setLoading(true);
      try {
        // In a real app, we would fetch from the API
        // const content = await contentService.getContentById(id);
        
        // But for this demo, we'll use mock data
        const foundContent = mockContent.find(item => item.id === id);
        
        if (foundContent) {
          setContent(foundContent);
        } else {
          throw new Error("Content not found");
        }
      } catch (err: any) {
        console.error("Error fetching content:", err);
        setError(err.message || "Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchContent();
    }
  }, [id]);

  // Placeholder function for additional content fetching
  const fetchContent = async () => {
    // Additional content fetching logic would go here
    console.log("Fetching content...");
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Toggle favorite status
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  // Handle dialog open/close
  const handleOpenPurchaseDialog = () => {
    setPurchaseDialogOpen(true);
  };

  const handleClosePurchaseDialog = () => {
    setPurchaseDialogOpen(false);
  };

  // Handle quantity change
  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(event.target.value);
  };

  // Snackbar handlers
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Placeholder function for content purchase
  const handlePurchaseContent = async () => {
    // Purchase logic would go here
    console.log("Purchasing content...");
  };

  // Function to render the purchase card
  const renderPurchaseCard = () => {
    if (!content) return null;

    return (
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {userOwnsContent ? 'You Own This Content' : 'Purchase Options'}
          </Typography>
          
          {userOwnsContent ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                You own {ownedTokens} token{ownedTokens !== 1 ? 's' : ''} of this content.
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<PlayArrow />}
                component={Link}
                to={`/player/${content.id}`}
                sx={{ mt: 2 }}
              >
                Watch Now
              </Button>
              
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Download />}
                sx={{ mt: 1 }}
              >
                Download
              </Button>
            </Box>
          ) : (
            <>
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
              
              {/* Rights tiers */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  License Tiers
                </Typography>
                <List>
                  {content.rightsTiers?.map((tier, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <LocalOffer />
                      </ListItemIcon>
                      <ListItemText
                        primary={tier.name}
                        secondary={tier.description}
                      />
                      <Chip label={`${tier.quantity}+`} color="primary" variant="outlined" />
                    </ListItem>
                  ))}
                </List>
              </Box>
              
              {/* Purchase button */}
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<ShoppingCart />}
                onClick={handleOpenPurchaseDialog}
                disabled={!active || isPurchasing}
                sx={{ mt: 2 }}
              >
                {isPurchasing ? <CircularProgress size={24} /> : 'Purchase'}
              </Button>
              
              {!active && (
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  startIcon={<AccountBalanceWalletIcon />}
                  sx={{ mt: 1 }}
                >
                  Connect Wallet
                </Button>
              )}
            </>
          )}
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
            
            {/* Similar Content Recommendations */}
            <SimilarContent 
              contentId={content.id}
              contentType={content.contentType}
              title="You Might Also Like"
              maxItems={4}
            />
          </Grid>

          {/* Right column - Purchase card */}
          <Grid item xs={12} md={4}>
            {renderPurchaseCard()}
          </Grid>
        </Grid>
      </Box>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onClose={handleClosePurchaseDialog}>
        <DialogTitle>Purchase Content</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to purchase "{content.title}" for {content.price} ETH.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            variant="outlined"
            value={quantity}
            onChange={handleQuantityChange}
            InputProps={{
              inputProps: { min: 1, max: content.available || 1 },
              endAdornment: <InputAdornment position="end">Tokens</InputAdornment>,
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Total: {(Number(quantity) * (content.price || 0)).toFixed(4)} ETH
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePurchaseDialog}>Cancel</Button>
          <Button 
            onClick={handlePurchaseContent} 
            variant="contained" 
            disabled={!active || !isCorrectNetwork}
          >
            {purchaseInProgress ? <CircularProgress size={24} /> : 'Confirm Purchase'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ContentDetailsPage; 