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
import { generatePlaceholderImage } from '../../utils/placeholders';
import { getProjectIpfsUrl } from '../../utils/ipfs';

const MyCollectionPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [purchasedContent, setPurchasedContent] = useState<PurchasedContent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);
        const collection = await contentService.getPurchasedContent();
        console.log('Fetched collection:', collection);
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

  // Helper function to get image URL for content
  const getContentImageUrl = (content: PurchasedContent) => {
    if (content.thumbnailCid) {
      console.log('Using thumbnailCid for image:', content.thumbnailCid);
      return getProjectIpfsUrl(content.thumbnailCid);
    }
    
    if (content.image) {
      console.log('Using image URL:', content.image);
      return content.image;
    }
    
    console.log('Using placeholder for image with title:', content.title);
    return generatePlaceholderImage(content.title);
  };

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
                    image={getContentImageUrl(content)}
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
                      {content.purchaseQuantity && (
                        <Chip 
                          label={`${content.purchaseQuantity} Token${content.purchaseQuantity > 1 ? 's' : ''}`} 
                          size="small"
                          color="primary"
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Purchased: {new Date(content.purchaseDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    
                    {/* Rights tier information */}
                    {content.purchaseQuantity && (
                      <Box sx={{ mt: 2, bgcolor: 'rgba(25, 118, 210, 0.05)', p: 1, borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          License Rights
                        </Typography>
                        {content.metadata?.rightsThresholds ? (
                          <>
                            {/* Display purchase quantity for debugging */}
                            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                              You own {content.purchaseQuantity} token{content.purchaseQuantity !== 1 ? 's' : ''}
                            </Typography>
                            {console.log('Rights thresholds:', content.metadata.rightsThresholds)}
                            {console.log('Purchase quantity:', content.purchaseQuantity)}
                            {content.metadata.rightsThresholds
                              .filter((tier: {quantity: number, type: string}) => {
                                const passes = tier.quantity <= content.purchaseQuantity;
                                console.log(`Tier ${tier.type} (${tier.quantity}) passes: ${passes}`);
                                return passes;
                              })
                              .map((tier: {quantity: number, type: string}, i: number) => (
                                <Chip
                                  key={i}
                                  size="small"
                                  label={tier.type}
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                  color="success"
                                />
                              ))}
                          </>
                        ) : (
                          <Chip
                            size="small"
                            label="Personal Viewing"
                            sx={{ mr: 0.5, mb: 0.5 }}
                            color="success"
                          />
                        )}
                      </Box>
                    )}
                  </CardContent>
                  
                  <Divider />
                  
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<Info />}
                      component={Link}
                      to={`/marketplace/content/${content.id}`}
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