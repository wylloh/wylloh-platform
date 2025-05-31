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
  const { active } = useWallet();
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
      icon: <Verified sx={{ fontSize: 40, color: 'text.primary' }} />,
      title: "Professional-Grade Security",
      description: "Enterprise blockchain infrastructure with hardware-bound encryption for your valuable IP",
      audience: "pros",
      details: [
        "Hardware Security Module (HSM) integration for key management",
        "Multi-signature wallet support for enterprise accounts",
        "End-to-end encryption for all content uploads",
        "Immutable audit trails on Polygon blockchain",
        "SOC 2 Type II compliance standards"
      ],
      benefits: "Protect your intellectual property with bank-grade security that scales from independent filmmakers to major studios."
    },
    {
      icon: <Collections sx={{ fontSize: 40, color: 'text.primary' }} />,
      title: "Permanent Digital Ownership",
      description: "Build a lasting collection with true ownership rights that can't be revoked",
      audience: "collectors",
      details: [
        "NFT-based ownership certificates stored on blockchain",
        "Transferable licenses with resale capabilities",
        "No expiration dates or subscription renewals",
        "Cross-platform compatibility with other Wylloh-protocol platforms",
        "Inheritance and estate planning support"
      ],
      benefits: "Own your digital movie collection forever. Unlike streaming services, your purchases can't be removed or revoked."
    },
    {
      icon: <Analytics sx={{ fontSize: 40, color: 'text.primary' }} />,
      title: "Transparent Analytics",
      description: "Real-time insights into distribution, royalties, and audience engagement",
      audience: "pros",
      details: [
        "Real-time revenue tracking and royalty distribution",
        "Geographic distribution analytics",
        "Audience engagement metrics without privacy invasion",
        "Secondary market performance tracking",
        "Automated financial reporting for tax purposes"
      ],
      benefits: "Make data-driven decisions with comprehensive analytics that respect user privacy while providing actionable insights."
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
              alt="Wylloh Platform - Hollywood's Digital Content Hub"
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
                      Hollywood distribution, reimagined.
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
                      Open-source, decentralized license management and CDN with realtime utility.
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
                        to="/marketplace"
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
                        Explore Collection
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
            Built for professionals, designed for everyone
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
            Industry-standard security meets consumer-friendly experience. 
            Every feature serves both creators and collectors.
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
            Ready to get started?
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
            Join the platform where professional filmmakers maintain control and collectors build lasting value.
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
              to="/register"
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
                onClick={() => setShowConnectPrompt(false)}
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