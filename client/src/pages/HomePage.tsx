import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Button, 
  CardActions,
  Divider,
  Paper,
  Stack,
  Chip
} from '@mui/material';
import { PlayArrow, Info, Theaters } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { generatePlaceholderImage } from '../utils/placeholders';

// Mock featured content data
const featuredContent = [
  {
    id: '1',
    title: 'The Digital Frontier',
    description: 'A journey into the world of blockchain and digital ownership.',
    image: generatePlaceholderImage('The Digital Frontier'),
    contentType: 'movie',
    creator: 'Digital Studios',
    price: 0.01
  },
  {
    id: '2',
    title: 'Nature Unveiled',
    description: 'A breathtaking documentary exploring the wonders of nature.',
    image: generatePlaceholderImage('Nature Unveiled'),
    contentType: 'documentary',
    creator: 'EcoVision Films',
    price: 0.008
  },
  {
    id: '3',
    title: 'Future Horizons',
    description: 'A science fiction tale about the future of humanity.',
    image: generatePlaceholderImage('Future Horizons'),
    contentType: 'movie',
    creator: 'Quantum Entertainment',
    price: 0.015
  }
];

// Mock latest releases data
const latestReleases = [
  {
    id: '4',
    title: 'Urban Landscapes',
    description: 'A visual journey through the world\'s most iconic cities.',
    image: generatePlaceholderImage('Urban Landscapes'),
    contentType: 'short film',
    creator: 'Metropolitan Arts',
    price: 0.005
  },
  {
    id: '5',
    title: 'Emotional Symphony',
    description: 'A musical exploration of human emotions.',
    image: generatePlaceholderImage('Emotional Symphony'),
    contentType: 'music film',
    creator: 'Harmony Productions',
    price: 0.007
  },
  {
    id: '6',
    title: 'Culinary Adventures',
    description: 'A journey through global cuisines and food cultures.',
    image: generatePlaceholderImage('Culinary Adventures'),
    contentType: 'series',
    creator: 'Gourmet Studios',
    price: 0.01
  },
  {
    id: '7',
    title: 'Sports Legends',
    description: 'Stories of triumph and perseverance in sports.',
    image: generatePlaceholderImage('Sports Legends'),
    contentType: 'documentary',
    creator: 'Champion Media',
    price: 0.009
  }
];

const HomePage: React.FC = () => {
  const { active } = useWallet();
  const [showConnectPrompt, setShowConnectPrompt] = useState<boolean>(false);

  useEffect(() => {
    // Show connect wallet prompt after a short delay if not connected
    const timer = setTimeout(() => {
      if (!active) {
        setShowConnectPrompt(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [active]);

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Paper
        sx={{
          position: 'relative',
          backgroundColor: 'grey.800',
          color: '#fff',
          mb: 4,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: `url(https://source.unsplash.com/random/1200x600/?cinema)`,
          p: 6,
          borderRadius: 2
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,.4)',
            borderRadius: 2
          }}
        />
        <Grid container>
          <Grid item md={6}>
            <Box
              sx={{
                position: 'relative',
                p: { xs: 3, md: 6 },
                pr: { md: 0 },
              }}
            >
              <Typography component="h1" variant="h3" color="inherit" gutterBottom>
                Welcome to Wylloh
              </Typography>
              <Typography variant="h5" color="inherit" paragraph>
                A blockchain-based media licensing platform with true ownership and frictionless distribution.
              </Typography>
              <Button 
                variant="contained" 
                size="large" 
                component={Link} 
                to="/marketplace"
              >
                Explore Films
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Wallet Connection Prompt */}
      {showConnectPrompt && !active && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.light', color: 'white' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">Connect your wallet to get started</Typography>
              <Typography variant="body2">
                Access your film library and discover new titles on the marketplace.
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              color="secondary"
              onClick={() => setShowConnectPrompt(false)}
            >
              Later
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Featured Content */}
      <Typography variant="h4" component="h2" gutterBottom>
        Featured Films
      </Typography>
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {featuredContent.map((content) => (
          <Grid item key={content.id} xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={content.image}
                alt={content.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {content.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {content.description}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label={content.contentType.toUpperCase()} size="small" />
                  <Typography variant="body2" color="text.secondary">
                    By {content.creator}
                  </Typography>
                </Box>
              </CardContent>
              <Divider />
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<Info />}
                  component={Link}
                  to={`/marketplace/${content.id}`}
                >
                  Details
                </Button>
                <Button 
                  size="small" 
                  startIcon={<PlayArrow />}
                  component={Link}
                  to={`/player/${content.id}`}
                >
                  Preview
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="button" color="primary">
                  {content.price} MATIC
                </Typography>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Latest Releases */}
      <Typography variant="h4" component="h2" gutterBottom>
        Latest Releases
      </Typography>
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {latestReleases.map((content) => (
          <Grid item key={content.id} xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="140"
                image={content.image}
                alt={content.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="h2">
                  {content.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {content.description.substring(0, 60)}...
                </Typography>
                <Chip label={content.contentType.toUpperCase()} size="small" />
              </CardContent>
              <Divider />
              <CardActions>
                <Button 
                  size="small"
                  component={Link}
                  to={`/marketplace/${content.id}`}
                >
                  Details
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="button" color="primary">
                  {content.price} MATIC
                </Typography>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* How It Works Section */}
      <Box sx={{ my: 6 }}>
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" component="h2" gutterBottom align="center">
            How Wylloh Works
          </Typography>
          <Divider sx={{ mb: 4 }} />
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{ fontSize: 60, color: 'primary.main', mb: 2 }}>1</Box>
                <Typography variant="h6" gutterBottom>Connect Your Wallet</Typography>
                <Typography variant="body2" color="text.secondary">
                  Link your blockchain wallet to buy, sell, and manage your digital content licenses.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{ fontSize: 60, color: 'primary.main', mb: 2 }}>2</Box>
                <Typography variant="h6" gutterBottom>Purchase Content Licenses</Typography>
                <Typography variant="body2" color="text.secondary">
                  Buy tokens that represent licenses to view and own digital content with true ownership.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{ fontSize: 60, color: 'primary.main', mb: 2 }}>3</Box>
                <Typography variant="h6" gutterBottom>Watch or Trade</Typography>
                <Typography variant="body2" color="text.secondary">
                  Enjoy your content on the Seed One player or trade licenses on the marketplace.
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button 
              variant="contained" 
              size="large" 
              color="primary"
              component={Link}
              to="/about"
            >
              Learn More
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default HomePage;