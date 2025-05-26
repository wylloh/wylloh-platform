import React, { useEffect, useState } from 'react';
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
  Skeleton
} from '@mui/material';
import { 
  PlayArrow, 
  Movie, 
  Security, 
  MonetizationOn,
  ArrowForward,
  Verified,
  Collections,
  Analytics
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useSnackbar } from 'notistack';
import ResponsiveBanner from '../components/common/ResponsiveBanner';

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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showConnectPrompt, setShowConnectPrompt] = useState<boolean>(false);
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { enqueueSnackbar } = useSnackbar();

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
      audience: "pros"
    },
    {
      icon: <Collections sx={{ fontSize: 40, color: 'text.primary' }} />,
      title: "Permanent Digital Ownership",
      description: "Build a lasting collection with true ownership rights that can't be revoked",
      audience: "collectors"
    },
    {
      icon: <Analytics sx={{ fontSize: 40, color: 'text.primary' }} />,
      title: "Transparent Analytics",
      description: "Real-time insights into distribution, royalties, and audience engagement",
      audience: "pros"
    }
  ];

  return (
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
            background: 'linear-gradient(45deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)',
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
                      variant={isMobile ? "h3" : "h1"} 
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
                        to="/creator/upload"
                        sx={{ 
                          py: 1.5,
                          px: 4,
                          fontSize: '1rem',
                          fontWeight: 500,
                          borderColor: 'white',
                          color: 'white',
                          '&:hover': {
                            borderColor: 'white',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                          }
                        }}
                      >
                        For Pros
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
                  '&:hover': {
                    borderColor: 'text.secondary',
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
                  }}
                >
                  {feature.description}
                </Typography>
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
              to="/creator/register"
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
        <Container maxWidth="lg" sx={{ mb: 8 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
            Featured Films
          </Typography>
          <Grid container spacing={4}>
            {featuredContent.map((content) => (
              <Grid item xs={12} sm={6} md={4} key={content.id}>
                <Card 
                  elevation={0}
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
                      height="300"
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
  );
};

export default HomePage;