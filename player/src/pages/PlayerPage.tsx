import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Button,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { ArrowBack, ShoppingCart } from '@mui/icons-material';
import PlayerContainer from '../components/player/PlayerContainer';
import { usePlayerStore } from '../state/playerStore';

// Mock content data for testing - in real implementation, this would come from an API
const mockContent = [
  {
    id: '1',
    title: 'The Digital Frontier',
    description: 'A journey into the world of blockchain and digital ownership.',
    previewUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    fullContentUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_10mb.mp4',
    thumbnailUrl: 'https://sample-videos.com/img/Sample-jpg-image-500kb.jpg',
    creator: 'Blockchain Studios',
    releaseDate: '2023-01-15',
    duration: '1h 20m',
    category: 'Documentary',
    tags: ['blockchain', 'nft', 'digital ownership'],
    price: '0.05 ETH'
  },
  {
    id: '2',
    title: 'Web3 Revolution',
    description: 'How Web3 is changing the internet forever.',
    previewUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    fullContentUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_10mb.mp4',
    thumbnailUrl: 'https://sample-videos.com/img/Sample-png-image-500kb.png',
    creator: 'Future Media',
    releaseDate: '2023-02-20',
    duration: '45m',
    category: 'Technology',
    tags: ['web3', 'blockchain', 'decentralization'],
    price: '0.03 ETH'
  }
];

/**
 * Player page component for video playback
 */
const PlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [previewEndDialogOpen, setPreviewEndDialogOpen] = useState(false);
  
  const navigate = useNavigate();
  
  // Get player state
  const { isPreview, fullscreen, setIsPreview } = usePlayerStore();
  
  // Load content data
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        // Simulating API delay
        setTimeout(() => {
          const foundContent = mockContent.find(item => item.id === id);
          if (foundContent) {
            setContent(foundContent);
            // Check if user owns this content (would be based on blockchain in real app)
            // For demo, let's assume content with ID '1' is not owned, others are
            setIsPreview(id === '1');
          }
          setLoading(false);
        }, 1500);
      } catch (error) {
        console.error('Error fetching content:', error);
        setLoading(false);
      }
    };
    
    fetchContent();
  }, [id, setIsPreview]);
  
  // Handle purchase dialog
  const handlePurchaseDialogOpen = () => {
    setPurchaseDialogOpen(true);
  };
  
  const handlePurchaseDialogClose = () => {
    setPurchaseDialogOpen(false);
  };
  
  const handlePurchase = () => {
    handlePurchaseDialogClose();
    navigate(`/marketplace/${id}`);
  };
  
  // Handle preview end dialog
  const handlePreviewEndDialogClose = () => {
    setPreviewEndDialogOpen(false);
  };
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!content) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Typography variant="h5" color="error" gutterBottom>
          Content Not Found
        </Typography>
        <Button 
          component={Link} 
          to="/" 
          variant="contained" 
          startIcon={<ArrowBack />}
        >
          Back to Home
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      bgcolor: 'black', 
      color: 'white',
      minHeight: '100vh',
      pt: fullscreen ? 0 : 2,
      pb: fullscreen ? 0 : 2,
    }}>
      <Container maxWidth={fullscreen ? false : "lg"} disableGutters={fullscreen}>
        {!fullscreen && (
          <Button 
            component={Link} 
            to={`/marketplace/${id}`} 
            startIcon={<ArrowBack />}
            sx={{ color: 'white', mb: 2, ml: 2 }}
          >
            Back to Details
          </Button>
        )}
        
        {/* Player Container */}
        <PlayerContainer
          contentId={content.id}
          src={isPreview ? content.previewUrl : content.fullContentUrl}
          posterUrl={content.thumbnailUrl}
          isPreview={isPreview}
        />
        
        {/* Content Info (only visible when not in fullscreen) */}
        {!fullscreen && (
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="h4" gutterBottom>
                  {content.title}
                </Typography>
                <Typography variant="body1" paragraph>
                  {content.description}
                </Typography>
                
                {isPreview && (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<ShoppingCart />}
                    onClick={handlePurchaseDialogOpen}
                    sx={{ mt: 2 }}
                  >
                    Purchase Full Content ({content.price})
                  </Button>
                )}
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    Content Details
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Creator:</Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>{content.creator}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Release Date:</Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>{content.releaseDate}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Duration:</Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>{content.duration}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Category:</Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>{content.category}</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Purchase Dialog */}
        <Dialog
          open={purchaseDialogOpen}
          onClose={handlePurchaseDialogClose}
        >
          <DialogTitle>Purchase Full Content</DialogTitle>
          <DialogContent>
            <DialogContentText>
              To watch the full version of "{content.title}", you need to purchase this content for {content.price}.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePurchaseDialogClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handlePurchase} color="primary" variant="contained" autoFocus>
              Go to Marketplace
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Preview End Dialog */}
        <Dialog
          open={previewEndDialogOpen}
          onClose={handlePreviewEndDialogClose}
        >
          <DialogTitle>Preview Ended</DialogTitle>
          <DialogContent>
            <DialogContentText>
              You've reached the end of the preview. Purchase the full content to continue watching.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePreviewEndDialogClose} color="primary">
              Close
            </Button>
            <Button onClick={handlePurchase} color="primary" variant="contained" autoFocus>
              Purchase Now
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default PlayerPage; 