import React, { useEffect, useState } from 'react';
import { useParams, Navigate, Link, useLocation } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button, Alert, ButtonGroup, CircularProgress } from '@mui/material';
import { Download, PlayArrow, Refresh } from '@mui/icons-material';
import VideoPlayer from '../../components/player/VideoPlayer';
import { contentService } from '../../services/content.service';
import { useWallet } from '../../hooks/useWallet';
import { downloadService } from '../../services/download.service';

const PlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { account, active } = useWallet();
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const isPreview = queryParams.get('preview') === 'true';

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) {
        setError('Invalid content ID');
        setLoading(false);
        return;
      }

      try {
        const contentData = await contentService.getContentById(id);
        if (contentData) {
          console.log('Content data loaded:', contentData);
          setContent(contentData);
        } else {
          setError('Content not found');
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id]);

  useEffect(() => {
    const checkAccess = async () => {
      if (!content || !content.mainFileCid || !account || isPreview) {
        if (isPreview) {
          console.log('Preview mode: Skipping ownership check.');
          setHasAccess(true);
          setAccessChecked(true);
        }
        return;
      }

      try {
        setVerifying(true);
        console.log('Checking access for content:', content.id);
        const ownership = await contentService.checkContentOwnership(content.id);
        console.log('Ownership check result:', ownership);
        setHasAccess(ownership.owned);
      } catch (err) {
        console.error('Error checking access:', err);
        setHasAccess(false);
      } finally {
        setVerifying(false);
        setAccessChecked(true);
      }
    };

    checkAccess();
  }, [content, account, isPreview]);

  const handleForceVerification = async () => {
    if (!content || !account) return;
    
    try {
      setVerifying(true);
      console.log('Force verifying token ownership for content:', content.id);
      
      localStorage.removeItem(`ownership_${content.id}_${account}`);
      
      const ownership = await contentService.checkContentOwnership(content.id, true);
      console.log('Force verification result:', ownership);
      
      setHasAccess(ownership.owned);
      setAccessChecked(true);
    } catch (err) {
      console.error('Error during force verification:', err);
    } finally {
      setVerifying(false);
    }
  };

  if (!loading && (!active || !account) && !isPreview) {
    return <Navigate to={`/marketplace/details/${id}`} replace />;
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
          <Typography>Loading content...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !content) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" height="70vh" flexDirection="column">
          <Typography color="error" gutterBottom>{error || 'Content not available'}</Typography>
          <Button component={Link} to="/marketplace" variant="contained" sx={{ mt: 2 }}>
            Return to Marketplace
          </Button>
        </Box>
      </Container>
    );
  }

  if (!content.mainFileCid) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          This content is missing its CID and cannot be played. This may be because it's using mock data.
        </Alert>
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            {content.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            By {content.creator}
          </Typography>
        </Box>
        <Button component={Link} to={`/marketplace/details/${id}`} variant="contained">
          Back to Content Details
        </Button>
      </Container>
    );
  }

  console.log('Rendering player with content:', {
    id: id,
    contentCid: isPreview ? content.previewCid : content.mainFileCid,
    wallet: account,
    isPreview,
    hasAccess
  });

  if (accessChecked && !hasAccess && !isPreview) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            {content.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            By {content.creator}
          </Typography>
        </Box>
        
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 6,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 3,
            textAlign: 'center',
            my: 4
          }}
        >
          <Typography variant="h5" gutterBottom>
            Access Restricted
          </Typography>
          <Typography variant="body1" paragraph>
            You do not own the required token to access this content
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            to={`/marketplace/details/${id}`}
            sx={{ mt: 2, mb: 2 }}
          >
            PURCHASE ACCESS
          </Button>
          
          {verifying ? (
            <Box display="flex" alignItems="center" mt={2}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2">Verifying token ownership...</Typography>
            </Box>
          ) : (
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleForceVerification}
              sx={{ mt: 1 }}
            >
              Verify Token Ownership
            </Button>
          )}
        </Box>
        
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>
            About this content
          </Typography>
          <Typography variant="body1" paragraph>
            {content.description}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          {content.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          By {content.creator}
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden', borderRadius: 2 }}>
        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
          <VideoPlayer 
            contentId={id || ''}
            contentCid={isPreview ? content.previewCid || content.mainFileCid : content.mainFileCid || ''}
            autoPlay={true}
            controls={true}
            width="100%"
            height="100%"
          />
        </Box>
      </Paper>
      
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          About this content
        </Typography>
        <Typography variant="body1" paragraph>
          {content.description}
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          License Details
        </Typography>
        <Typography variant="body2" paragraph>
          You own {content.purchaseQuantity || 0} token(s) of this content, 
          which grants you {content.purchaseQuantity > 500 ? 'commercial' : 'personal'} usage rights.
        </Typography>

        <Box mt={3}>
          <ButtonGroup variant="outlined">
            <Button
              startIcon={<Download />}
              onClick={() => {
                if (account) {
                  downloadService.downloadContentToDevice(
                    content.mainFileCid,
                    account,
                    `${content.title}.mp4`
                  );
                }
              }}
            >
              Download to Device
            </Button>
            <Button
              component={Link}
              to={`/stream/${id}/${account}`}
              startIcon={<PlayArrow />}
              color="primary"
            >
              Open in Full Screen Player
            </Button>
          </ButtonGroup>
        </Box>
      </Box>
    </Container>
  );
};

export default PlayerPage;