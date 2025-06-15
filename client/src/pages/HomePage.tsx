import React, { useEffect, useState, Suspense } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Button, 
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
  Fade,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Skeleton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton
} from '@mui/material';
import { 
  PlayArrow, 
  Movie, 
  Security, 
  MonetizationOn,
  ArrowForward,
  Verified,
  Collections,
  Analytics,
  TrendingUp,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useSnackbar } from 'notistack';
import ResponsiveBanner from '../components/common/ResponsiveBanner';
import PageTransition from '../components/common/PageTransition';
import LazyLoadWrapper from '../components/common/LazyLoadWrapper';
import SkeletonLoader from '../components/common/SkeletonLoader';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useResponsiveDesign } from '../hooks/useResponsiveDesign';
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization';

interface FeaturedContent {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  creator: string;
  price: string;
}

const HomePage: React.FC = () => {
  const { active, connect } = useWallet();
  const theme = useTheme();
  const { breakpoints, config, card } = useResponsiveDesign();
  const { debounce, createPerformanceMonitor } = usePerformanceOptimization();
  const [showConnectPrompt, setShowConnectPrompt] = useState<boolean>(false);
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedFeatures, setExpandedFeatures] = useState<{ [key: number]: boolean }>({});
  const { enqueueSnackbar } = useSnackbar();
  
  // Performance monitoring
  const performanceUtils = usePerformanceOptimization();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!active) {
        setShowConnectPrompt(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [active]);

  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/featured-content`);
        if (!response.ok) {
          throw new Error('Failed to fetch featured content');
        }
        const data = await response.json();
        setFeaturedContent(data);
      } catch (error) {
        console.error('Error fetching featured content:', error);
        enqueueSnackbar('Failed to load featured content', { variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedContent();
  }, [enqueueSnackbar]);

  const features = [
    {
      icon: <Collections sx={{ fontSize: 40, color: 'text.primary' }} />,
      title: "Truly Own Your Movies",
      description: "Buy once, own forever. No subscriptions, no takedowns, no funny business.",
      audience: "collectors",
      details: [
        "Blockchain-verified ownership certificates",
        "Resell your movies anytime at market value",
        "No expiration dates or subscription renewals",
        "Access your collection from any device",
        "Pass movies to family through inheritance"
      ],
      benefits: "Unlike streaming services that can remove content anytime, your Wylloh movies are yours permanently. Digital ownership with physical media permanence."
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40, color: 'text.primary' }} />,
      title: "Trade & Retain Value",
      description: "Your movies keep their worth. Resell when you're done watching.",
      audience: "collectors",
      details: [
        "Built-in marketplace for buying and selling",
        "Real-time pricing based on actual demand",
        "Rare releases may appreciate over time",
        "No middleman fees on peer-to-peer trades",
        "Track your collection's current value"
      ],
      benefits: "Break free from the walled garden. Movies that hold their value, in a marketplace that's yours to explore."
    },
    {
      icon: <Verified sx={{ fontSize: 40, color: 'text.primary' }} />,
      title: "Studio-Grade Authenticity",
      description: "The same security that protects Hollywood's biggest releases, now protecting your collection.",
      audience: "collectors",
      details: [
        "All transactions recorded on blockchain",
        "Verified authentic content from real creators",
        "Professional-grade digital rights management",
        "Direct support to filmmakers with every purchase",
        "Industry-standard security protocols"
      ],
      benefits: "Every movie in your collection is verified authentic. No counterfeits, no compromises, just pure cinema from the source."
    }
  ];

  const handleExpandFeature = (index: number) => {
    setExpandedFeatures(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <ErrorBoundary>
      <PageTransition variant="fade" timeout={400}>
        <Box sx={{ overflow: 'hidden' }}>
          {/* Hero Banner Section */}
          <Box sx={{ position: 'relative', mb: 8 }}>
            <ResponsiveBanner 
              height="60vh"
              priority={true}
              alt="Wylloh Platform - Hollywood's Digital Marketplace"
            />
        
        {/* Overlay Content */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={8}>
                <Fade in timeout={1000}>
                  <Box>
                    <Typography 
                      component="h1" 
                      variant={breakpoints.isMobile ? "h3" : "h1"} 
                      color="white" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        letterSpacing: '-0.02em',
                        mb: 3,
                        lineHeight: 1.1,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      }}
                    >
                      Own your movies again.
                    </Typography>
                    <Typography 
                      variant="h5" 
                      color="rgba(255,255,255,0.9)" 
                      paragraph
                      sx={{ 
                        mb: 4,
                        fontWeight: 400,
                        lineHeight: 1.5,
                        maxWidth: '600px',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      }}
                    >
                      Physical media reimagined with blockbusters on the blockchain.
                    </Typography>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      spacing={3}
                      sx={{ mt: 5 }}
                    >
                      <Button 
                        variant="contained" 
                        size="large"
                        component={Link} 
                        to="/store"
                        endIcon={<ArrowForward />}
                        sx={{ 
                          py: 1.5,
                          px: 4,
                          fontSize: '1rem',
                          fontWeight: 500,
                          backgroundColor: 'primary.main',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          }
                        }}
                      >
                        Browse Movie Store
                      </Button>
                      <Button 
                        variant="outlined" 
                        size="large"
                        component={Link} 
                        to="/pro-verification"
                        sx={{ 
                          py: 1.5,
                          px: 4,
                          fontSize: '1rem',
                          fontWeight: 500,
                        }}
                      >
                        Pro Access
                      </Button>
                    </Stack>
                  </Box>
                </Fade>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 12 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography 
            variant="h2" 
            gutterBottom 
            sx={{ 
              fontWeight: 600, 
              mb: 2,
              color: 'text.primary'
            }}
          >
            Modular rights for everyone.
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ 
              maxWidth: '600px', 
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.6,
            }}
          >
            Introducing a new licensing standard for personal and commercial applications. 
            Unlock a download for home viewing, or unlock a cinema package for your theatrical exhibition.
          </Typography>
        </Box>
        
        <Grid container spacing={6}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
                  p: 4,
                  textAlign: 'center',
                  transition: 'all 0.2s ease-in-out',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                <Box sx={{ mb: 3 }}>
                  {feature.icon}
                </Box>
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600,
                    mb: 2,
                    color: 'text.primary'
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ 
                    lineHeight: 1.6,
                    fontWeight: 400,
                    mb: 2
                  }}
                >
                  {feature.description}
                </Typography>
                
                <IconButton
                  onClick={() => handleExpandFeature(index)}
                  sx={{
                    transform: expandedFeatures[index] ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease-in-out',
                    color: 'primary.main'
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
                
                <Collapse in={expandedFeatures[index]} timeout="auto" unmountOnExit>
                  <Box sx={{ mt: 2, textAlign: 'left' }}>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {feature.benefits}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Key Features:
                    </Typography>
                    <List dense>
                      {feature.details.map((detail, idx) => (
                        <ListItem key={idx} sx={{ px: 0, py: 0.25 }}>
                          <ListItemIcon sx={{ minWidth: 24 }}>
                            <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={detail}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Collapse>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 8, 
            textAlign: 'center',
            backgroundColor: 'background.paper',
          }}
        >
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              fontWeight: 600,
              mb: 3,
              color: 'text.primary'
            }}
          >
            Your collection awaits.
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            paragraph
            sx={{ 
              mb: 4,
              maxWidth: '500px',
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.6,
            }}
          >
            Where cinema meets permanence, and every movie finds its home.
          </Typography>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={3}
            justifyContent="center"
          >
            <Button 
              variant="contained" 
              size="large"
              component={Link} 
              to="/store"
              sx={{ 
                py: 1.5,
                px: 4,
                fontSize: '1rem',
                fontWeight: 500,
              }}
            >
              Start Collecting
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              component={Link} 
              to="/pro-verification"
              sx={{ 
                py: 1.5,
                px: 4,
                fontSize: '1rem',
                fontWeight: 500,
              }}
            >
              Pro Access
            </Button>
          </Stack>
        </Paper>
      </Container>

      {/* Featured Content Section - Only shown when content is available */}
      {featuredContent.length > 0 && (
        <LazyLoadWrapper height={400}>
          <Container maxWidth="lg" sx={{ mb: 8 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
              Featured Films
            </Typography>
            <Grid container spacing={4}>
              {featuredContent.map((content) => (
                <Grid item xs={12} sm={6} md={4} key={content.id}>
                  <Card 
                    elevation={card.elevation}
                    variant={card.variant}
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      overflow: 'hidden',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    <CardActionArea 
                      component={Link} 
                      to={`/store/${content.id}`}
                      sx={{ height: '100%' }}
                    >
                      <CardMedia
                        component="img"
                        height={card.imageHeight}
                        image={content.imageUrl}
                        alt={content.title}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent>
                        <Typography variant="h6" gutterBottom noWrap>
                          {content.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          by {content.creator}
                        </Typography>
                        <Typography variant="h6" color="primary.main">
                          {content.price}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </LazyLoadWrapper>
      )}

      {/* Wallet Connection Prompt */}
      {showConnectPrompt && !active && (
        <Fade in>
          <Paper 
            sx={{ 
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              p: 3,
              bgcolor: 'background.paper',
              borderRadius: 2,
              maxWidth: 600,
              width: '90%',
              zIndex: 1000
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom color="text.primary">
                  Connect your wallet to get started
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Access your film library and discover new titles on the store.
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                onClick={() => {
                  connect();
                  setShowConnectPrompt(false);
                }}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Connect Wallet
              </Button>
            </Stack>
          </Paper>
        </Fade>
      )}
        </Box>
      </PageTransition>
    </ErrorBoundary>
  );
};

export default HomePage;