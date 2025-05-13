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
  ArrowForward
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useSnackbar } from 'notistack';

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
      icon: <Movie sx={{ fontSize: 40 }} />,
      title: "True Ownership",
      description: "Own your content rights through blockchain technology"
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: "Secure Distribution",
      description: "Advanced DRM with hardware-bound encryption"
    },
    {
      icon: <MonetizationOn sx={{ fontSize: 40 }} />,
      title: "Fair Compensation",
      description: "Direct revenue sharing with no intermediaries"
    }
  ];

  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Hero Section */}
      <Paper
        sx={{
          position: 'relative',
          backgroundColor: 'grey.900',
          color: '#fff',
          mb: 8,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url(/images/hero-background.jpg)`,
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Fade in timeout={1000}>
                <Box>
                  <Typography 
                    component="h1" 
                    variant={isMobile ? "h3" : "h2"} 
                    color="inherit" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 800,
                      letterSpacing: '-0.5px',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                  >
                    Revolutionizing Film Distribution
                  </Typography>
                  <Typography 
                    variant="h5" 
                    color="inherit" 
                    paragraph
                    sx={{ 
                      mb: 4,
                      opacity: 0.95,
                      fontWeight: 300,
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                  >
                    A decentralized platform where filmmakers and audiences connect directly, powered by blockchain technology.
                  </Typography>
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={2}
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
                        borderRadius: 2
                      }}
                    >
                      Explore Films
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="large"
                      component={Link} 
                      to="/about"
                      sx={{ 
                        py: 1.5,
                        px: 4,
                        borderRadius: 2,
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2
                        }
                      }}
                    >
                      Learn More
                    </Button>
                  </Stack>
                </Box>
              </Fade>
            </Grid>
          </Grid>
        </Container>
      </Paper>

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

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Fade in timeout={1000} style={{ transitionDelay: `${index * 100}ms` }}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 4,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    bgcolor: 'background.default',
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Paper
        sx={{
          position: 'relative',
          backgroundColor: 'primary.main',
          color: '#fff',
          py: 8,
          mb: 8
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                Ready to Transform Film Distribution?
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
                Join the future of content ownership and distribution.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Button
                variant="contained"
                size="large"
                component={Link}
                to="/store"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  },
                  py: 1.5,
                  px: 4,
                  borderRadius: 2
                }}
              >
                Get Started
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Paper>

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
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 2,
              maxWidth: 600,
              width: '90%',
              zIndex: 1000
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Connect your wallet to get started
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Access your film library and discover new titles on the store.
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                color="secondary"
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