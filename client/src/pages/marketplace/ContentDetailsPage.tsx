import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
} from '@mui/icons-material';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import { contentService } from '../../services/content.service';
import { getProjectIpfsUrl } from '../../utils/ipfs';
import { generatePlaceholderImage } from '../../utils/placeholders';
import { Content } from '../../services/content.service';

// Add interfaces for content types
interface SecondaryMarketListing {
  seller: string;
  quantity: number;
  price: number;
}

// Interface for detailed content display
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
  rightsThresholds?: any[];
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [purchaseErrorDialogOpen, setPurchaseErrorDialogOpen] = useState(false);
  const [purchaseSuccessDialogOpen, setPurchaseSuccessDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Ownership check state
  const [ownership, setOwnership] = useState<{ owned: boolean, quantity: number }>({
    owned: false,
    quantity: 0
  });

  // Extract ownership values for readability
  const userOwnsContent = ownership.owned;
  const ownedTokens = ownership.quantity;

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
            setOwnership(ownershipStatus);
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

  const handlePurchase = async () => {
    if (!content) return;
    
    try {
      // Set a loading state
      setPurchaseInProgress(true);
      
      // Purchase token using content service
      await contentService.purchaseToken(content.id, Number(quantity));
      
      // Close the dialog
      handlePurchaseDialogClose();
      
      // Show success message
      setSuccessMessage(`Successfully purchased ${quantity} token${Number(quantity) > 1 ? 's' : ''} for "${content.title}".`);
      
      // Show success dialog
      setPurchaseSuccessDialogOpen(true);
      setPurchaseErrorDialogOpen(false);
    } catch (error: any) {
      console.error('Error purchasing token:', error);
      setErrorMessage(error.message || 'Failed to complete purchase');
      setPurchaseErrorDialogOpen(true);
    } finally {
      setPurchaseInProgress(false);
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
                  {content.rightsThresholds && 
                   Array.isArray(content.rightsThresholds) && 
                   content.rightsThresholds
                    .filter((tier: {quantity: number, type: string}) => tier.quantity <= ownedTokens)
                    .map((tier: {quantity: number, type: string}, i: number) => (
                      <Chip
                        key={i}
                        size="small"
                        label={tier.type}
                        sx={{ mr: 0.5, mb: 0.5, bgcolor: 'white', color: 'success.dark' }}
                      />
                    ))}
                </Box>
              </Box>
                
              <Button
                variant="contained"
                color="primary"
                component={Link}
                to={`/player/${content.id}`}
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
                  to={`/player/${content.id}`}
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
                <List>
                  {content.rightsThresholds?.map((threshold: any) => (
                    <ListItem key={threshold.type} divider>
                      <ListItemIcon>
                        {threshold.quantity === 1 ? <VerifiedUser color="primary" /> : <Theaters />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={threshold.type} 
                        secondary={`Required Tokens: ${threshold.quantity}`} 
                      />
                      {threshold.quantity === 1 ? (
                        <Chip color="primary" size="small" label="Basic" />
                      ) : (
                        <Chip 
                          color="secondary" 
                          size="small" 
                          label={`Tier ${
                            content.rightsThresholds && 
                            Array.isArray(content.rightsThresholds) && 
                            threshold ? 
                              content.rightsThresholds.indexOf(threshold) + 1 : 
                              1
                          }`} 
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tokens can be accumulated and stacked to unlock these rights. For example, if you want to stream this content on your platform, you would need to acquire 5,000 tokens.
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
      >
        <DialogTitle>Confirm Purchase</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to purchase {quantity} license token{Number(quantity) !== 1 ? 's' : ''} for "{content.title}" at {content.price} ETH each.
          </DialogContentText>
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle1">
              Transaction Summary:
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1">Unit Price:</Typography>
              <Typography variant="body1">{content.price} ETH</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1">Quantity:</Typography>
              <Typography variant="body1">{quantity}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1">Network Fee (est.):</Typography>
              <Typography variant="body1">~0.001 ETH</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6">{totalPrice.toFixed(4)} ETH</Typography>
            </Box>
          </Box>
          
          {/* License rights information */}
          {content.rightsThresholds && Array.isArray(content.rightsThresholds) && (
            <Box sx={{ mt: 2, mb: 2, bgcolor: 'rgba(25, 118, 210, 0.05)', p: 1.5, borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                License Rights You Will Receive:
              </Typography>
              
              {/* Current rights if user already owns some tokens */}
              {userOwnsContent && ownedTokens > 0 && (
                <>
                  <Typography variant="body2" sx={{ mt: 1, mb: 0.5 }}>
                    Current rights with {ownedTokens} token{ownedTokens !== 1 ? 's' : ''}:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                    {content.rightsThresholds
                      .filter(tier => tier.quantity <= ownedTokens)
                      .map((tier, i) => (
                        <Chip
                          key={i}
                          size="small"
                          label={tier.type}
                          sx={{ mr: 0.5, mb: 0.5 }}
                          color="success"
                        />
                      ))}
                  </Box>
                </>
              )}
              
              {/* New rights after purchase */}
              <Typography variant="body2" sx={{ mt: 1, mb: 0.5 }}>
                After purchase ({Number(ownedTokens) + Number(quantity)} token{Number(ownedTokens) + Number(quantity) !== 1 ? 's' : ''} total):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {content.rightsThresholds
                  .filter(tier => tier.quantity <= (Number(ownedTokens) + Number(quantity)))
                  .map((tier, i) => {
                    // Check if this is a newly unlocked tier
                    const isNewTier = tier.quantity > ownedTokens;
                    
                    return (
                      <Chip
                        key={i}
                        size="small"
                        label={tier.type}
                        sx={{ mr: 0.5, mb: 0.5 }}
                        color={isNewTier ? "primary" : "success"}
                        icon={isNewTier ? <Info /> : undefined}
                      />
                    );
                  })}
              </Box>
              
              {/* Display newly unlocked tiers */}
              {content.rightsThresholds.some(tier => 
                tier.quantity > ownedTokens && tier.quantity <= (Number(ownedTokens) + Number(quantity))
              ) && (
                <Alert severity="info" sx={{ mt: 1.5 }}>
                  <Typography variant="body2">
                    <strong>New rights unlocked!</strong> This purchase will grant you additional usage rights.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
          
          <Alert severity="info" sx={{ mt: 2 }}>
            After purchase, the license token(s) will be transferred to your wallet and will appear in your collection.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePurchaseDialogClose}>Cancel</Button>
          <Button onClick={handlePurchase} variant="contained" color="primary">
            Confirm Purchase
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog
        open={purchaseSuccessDialogOpen}
        onClose={() => {
          setPurchaseSuccessDialogOpen(false);
          setSuccessMessage(null);
        }}
      >
        <DialogTitle>Purchase Successful</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {successMessage}
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">
              You can now view your purchased content in your collection.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setPurchaseSuccessDialogOpen(false);
              setSuccessMessage(null);
            }}
          >
            Close
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            component={Link}
            to="/collection"
          >
            View My Collection
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={purchaseErrorDialogOpen}
        onClose={() => {
          setPurchaseErrorDialogOpen(false);
          setErrorMessage(null);
        }}
      >
        <DialogTitle>Purchase Failed</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage || 'There was an error processing your purchase.'}
          </Alert>
          <Typography variant="body2">
            Please try again or contact support if the issue persists.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setPurchaseErrorDialogOpen(false);
              setErrorMessage(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ContentDetailsPage;