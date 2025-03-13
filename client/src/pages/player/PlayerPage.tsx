import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material';
import { VerifiedUser, ShoppingCart, Warning } from '@mui/icons-material';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePlatform } from '../../contexts/PlatformContext';
import PlayerContainer from '../../components/player/PlayerContainer';

// Mock content data (would be fetched from API in a real app)
const mockContent = [
  {
    id: '1',
    title: 'The Digital Frontier',
    description: 'A journey into the world of blockchain and digital ownership.',
    previewUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', // Sample video URL
    fullContentUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_10mb.mp4', // Sample video URL
    thumbnailUrl: 'https://source.unsplash.com/random/800x500/?technology',
    contentType: 'movie',
    creator: 'Digital Studios',
    duration: '84 minutes',
    previewDuration: '2 minutes',
    owned: false,
    price: 0.01
  },
  // Additional mock content would be here
];

const PlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [previewEndDialogOpen, setPreviewEndDialogOpen] = useState(false);
  const [isPreview, setIsPreview] = useState(true);
  
  const navigate = useNavigate();
  const { active, isCorrectNetwork } = useWallet();
  const { isAuthenticated } = useAuth();
  const { isSeedOne, isTouchDevice } = usePlatform();
  
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
  }, [id]);
  
  const handlePreviewEnded = () => {
    setPreviewEndDialogOpen(true);
  };
  
  const handlePurchase = () => {
    setPurchaseDialogOpen(true);
  };
  
  const handleConfirmPurchase = () => {
    // Here you would integrate with web3 to execute purchase
    setPurchaseDialogOpen(false);
    
    // For the demo, simulate purchase success
    setIsPreview(false);
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading content...
        </Typography>
      </Container>
    );
  }
  
  if (!content) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" color="error">
          Content Not Found
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          The content you're looking for could not be found.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 3 }}
          onClick={() => navigate('/marketplace')}
        >
          Browse Marketplace
        </Button>
      </Container>
    );
  }
  
  // Determine content URL based on preview status
  const videoUrl = isPreview ? content.previewUrl : content.fullContentUrl;
  
  return (
    <Box sx={{ 
      pb: 4,
      pt: isSeedOne ? 0 : 2,
      px: isSeedOne ? 0 : 2,
      minHeight: '100vh',
      backgroundColor: '#121212' 
    }}>
      <Container maxWidth="xl" disableGutters={isSeedOne}>
        {/* Player Section */}
        <PlayerContainer
          src={videoUrl}
          poster={content.thumbnailUrl}
          contentMetadata={{
            title: content.title,
            creator: content.creator,
            description: content.description,
            duration: content.duration
          }}
          previewMode={isPreview}
          isPlatformSeedOne={isSeedOne}
          onPreviewEnded={handlePreviewEnded}
          onBack={!isSeedOne ? handleBack : undefined}
        />
        
        {/* Content Info Section - Hide in kiosk mode */}
        {!isSeedOne && (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, bgcolor: '#1e1e1e' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h4" gutterBottom>
                        {content.title}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary">
                        {content.creator} • {content.duration}
                      </Typography>
                    </Box>
                    
                    {isPreview ? (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ShoppingCart />}
                        onClick={handlePurchase}
                        disabled={!active || !isCorrectNetwork || !isAuthenticated}
                      >
                        Purchase ({content.price} ETH)
                      </Button>
                    ) : (
                      <Chip
                        icon={<VerifiedUser />}
                        label="Owned"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body1" paragraph>
                    {content.description}
                  </Typography>
                  
                  {isPreview && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        mt: 2,
                        bgcolor: 'rgba(255, 196, 0, 0.1)',
                        border: '1px solid rgba(255, 196, 0, 0.3)',
                        borderRadius: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Warning color="warning" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="warning.main">
                          You are viewing a preview. Purchase to unlock the full content.
                        </Typography>
                      </Box>
                    </Paper>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, bgcolor: '#1e1e1e' }}>
                  <Typography variant="h6" gutterBottom>
                    Content Details
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Type:</strong> {content.contentType}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Duration:</strong> {content.duration}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Creator:</strong> {content.creator}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Token ID:</strong> #{id}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    License Info
                  </Typography>
                  <Typography variant="body2">
                    This content is licensed under the Wylloh Content License, which grants the token holder the right to view and use the content for personal, non-commercial purposes.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>
      
      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onClose={() => setPurchaseDialogOpen(false)}>
        <DialogTitle>Purchase Content</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to purchase "{content.title}" for {content.price} ETH. This will grant you a license to view the full content.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmPurchase} color="primary" variant="contained">
            Confirm Purchase
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Preview End Dialog */}
      <Dialog open={previewEndDialogOpen} onClose={() => setPreviewEndDialogOpen(false)}>
        <DialogTitle>Preview Ended</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You've reached the end of the preview for "{content.title}". Purchase a license to view the full content.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewEndDialogOpen(false)}>Close</Button>
          <Button
            onClick={() => {
              setPreviewEndDialogOpen(false);
              handlePurchase();
            }}
            color="primary"
            variant="contained"
            disabled={!active || !isCorrectNetwork || !isAuthenticated}
          >
            Purchase Now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlayerPage;