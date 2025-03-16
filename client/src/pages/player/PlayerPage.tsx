import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Divider,
  Alert
} from '@mui/material';
import { VerifiedUser, ShoppingCart, Warning } from '@mui/icons-material';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePlatform } from '../../contexts/PlatformContext';
import PlayerContainer from '../../components/player/PlayerContainer';
import { contentService, Content, PurchasedContent } from '../../services/content.service';
import { getProjectIpfsUrl } from '../../utils/ipfs';
import { generatePlaceholderImage } from '../../utils/placeholders';

const PlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [previewEndDialogOpen, setPreviewEndDialogOpen] = useState(false);
  const [isPreview, setIsPreview] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { active, isCorrectNetwork } = useWallet();
  const { isAuthenticated } = useAuth();
  const { isSeedOne, isTouchDevice } = usePlatform();
  
  // Check if a user owns this content
  const checkOwnership = async (contentId: string) => {
    try {
      const purchasedContent = await contentService.getPurchasedContent();
      console.log('Checking if user owns content:', contentId, 'in', purchasedContent);
      const isOwned = purchasedContent.some(item => item.id === contentId);
      setIsPreview(!isOwned);
      setIsPurchased(isOwned);
      return isOwned;
    } catch (err) {
      console.error('Error checking ownership:', err);
      return false;
    }
  };
  
  // Load content data
  useEffect(() => {
    const fetchContent = async () => {
      if (!id) {
        setError('No content ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const contentData = await contentService.getContentById(id);
        console.log('Fetched content:', contentData);
        
        if (contentData) {
          setContent(contentData);
          await checkOwnership(id);
        } else {
          setError('Content not found');
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Failed to load content');
      } finally {
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
  
  const handleConfirmPurchase = async () => {
    if (!content) return;
    
    try {
      // Purchase the token
      await contentService.purchaseToken(content.id, 1);
      
      // Close dialog and update state
      setPurchaseDialogOpen(false);
      setIsPreview(false);
      setIsPurchased(true);
    } catch (error) {
      console.error('Error purchasing content:', error);
      // Show error to user
    }
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  // Get appropriate video URL
  const getVideoUrl = () => {
    if (!content) return '';
    
    if (!isPreview && content.mainFileCid) {
      // Full content
      return getProjectIpfsUrl(content.mainFileCid);
    } else if (content.previewCid) {
      // Preview content
      return getProjectIpfsUrl(content.previewCid);
    } else {
      // Fallback to mock URL
      return 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4';
    }
  };
  
  // Get thumbnail URL
  const getThumbnailUrl = () => {
    if (!content) return '';
    
    if (content.thumbnailCid) {
      return getProjectIpfsUrl(content.thumbnailCid);
    } else if (content.image) {
      return content.image;
    } else {
      return generatePlaceholderImage(content?.title || 'Video');
    }
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
  
  if (error || !content) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Content not found'}
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mt: 2 }}>
            The content you're looking for could not be found.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 3, mr: 2 }}
            component={Link}
            to="/marketplace"
          >
            Browse Marketplace
          </Button>
          <Button 
            variant="outlined"
            sx={{ mt: 3 }}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }
  
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
          src={getVideoUrl()}
          poster={getThumbnailUrl()}
          contentMetadata={{
            title: content.title,
            creator: content.creator,
            description: content.description,
            duration: content.metadata?.duration || '10 minutes'
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
                        {content.creator} • {content.metadata?.duration || '10 minutes'}
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
                        Purchase ({content.price || 0.01} ETH)
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
                    <strong>Duration:</strong> {content.metadata?.duration || 'Not specified'}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Creator:</strong> {content.creator}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Token ID:</strong> #{content.tokenId || content.id}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>
      
      {/* Preview ended dialog */}
      <Dialog open={previewEndDialogOpen} onClose={() => setPreviewEndDialogOpen(false)}>
        <DialogTitle>Preview Ended</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have reached the end of the preview for "{content.title}". 
            Would you like to purchase the full content?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewEndDialogOpen(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              setPreviewEndDialogOpen(false);
              handlePurchase();
            }}
            disabled={!active || !isCorrectNetwork || !isAuthenticated}
          >
            Purchase Now
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Purchase dialog */}
      <Dialog open={purchaseDialogOpen} onClose={() => setPurchaseDialogOpen(false)}>
        <DialogTitle>Confirm Purchase</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to purchase "{content.title}" for {content.price || 0.01} ETH. 
            This will give you full access to the content.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleConfirmPurchase}
          >
            Confirm Purchase
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlayerPage;