import React, { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button, Alert, ButtonGroup } from '@mui/material';
import { Download, PlayArrow } from '@mui/icons-material';
import VideoPlayer from '../../components/player/VideoPlayer';
import { contentService } from '../../services/content.service';
import ProtectedContent from '../../components/content/ProtectedContent';
import { useWallet } from '../../hooks/useWallet';
import { downloadService } from '../../services/download.service';

const PlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { account, active } = useWallet();

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

  // Redirect if no account or wallet not connected
  if (!loading && (!active || !account)) {
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

  // Check if we have the CID property
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
    contentCid: content.mainFileCid,
    wallet: account
  });

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
        <ProtectedContent 
          contentId={id || ''} 
          contentCid={content.mainFileCid || ''}
        >
          <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
            <VideoPlayer 
              contentId={id || ''}
              contentCid={content.mainFileCid || ''}
              autoPlay={true}
              controls={true}
              width="100%"
              height="100%"
            />
          </Box>
        </ProtectedContent>
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

        <ProtectedContent 
          contentId={id || ''} 
          contentCid={content.mainFileCid || ''}
          fallback={null}
        >
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
        </ProtectedContent>
      </Box>
    </Container>
  );
};

export default PlayerPage;