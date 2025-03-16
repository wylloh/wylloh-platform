import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions, 
  Divider,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { Link } from 'react-router-dom';
import { PlayArrow, Info } from '@mui/icons-material';
import { contentService, PurchasedContent } from '../../services/content.service';

const MyCollectionPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [purchasedContent, setPurchasedContent] = useState<PurchasedContent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);
        const collection = await contentService.getPurchasedContent();
        setPurchasedContent(collection);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch collection:', err);
        setError('Failed to load your collection. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Collection
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && purchasedContent.length === 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="body1" paragraph>
              You don't have any content in your collection yet.
            </Typography>
            <Button component={Link} to="/marketplace" variant="contained">
              Browse Marketplace
            </Button>
          </Paper>
        )}

        {!loading && !error && purchasedContent.length > 0 && (
          <Grid container spacing={3}>
            {purchasedContent.map((content) => (
              <Grid item key={content.id} xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={content.image}
                    alt={content.title}
                  />
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div" noWrap>
                      {content.title}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mb: 2
                      }}
                    >
                      {content.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Chip label={content.contentType.toUpperCase()} size="small" />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Purchased: {new Date(content.purchaseDate).toLocaleDateString()}
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
                      Play
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default MyCollectionPage;