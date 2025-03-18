import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Container } from '@mui/material';
import { contentService } from '../../services/content.service';
import { downloadService } from '../../services/download.service';
import { keyManagementService } from '../../services/keyManagement.service';

/**
 * ContentStreamPage - A component that provides direct streaming access to content
 * This page requires contentId and walletAddress as URL parameters
 * It serves as a direct streaming endpoint and shouldn't be navigated to directly by users
 */
const ContentStreamPage: React.FC = () => {
  const { contentId, walletAddress } = useParams<{ contentId: string; walletAddress: string }>();
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    async function setupStream() {
      if (!contentId || !walletAddress) {
        setError('Missing content ID or wallet address');
        setLoading(false);
        return;
      }

      try {
        // 1. Verify content exists
        const contentData = await contentService.getContentById(contentId);
        if (!contentData || !contentData.mainFileCid) {
          setError('Content not found');
          setLoading(false);
          return;
        }
        setContent(contentData);

        // 2. Verify ownership
        const hasAccess = await keyManagementService.verifyContentOwnership(contentId, walletAddress);
        if (!hasAccess) {
          setError('Unauthorized - You do not own this content');
          setLoading(false);
          return;
        }

        // 3. Get decrypted content stream URL
        const url = await downloadService.getContentStreamUrl(contentData.mainFileCid, walletAddress);
        if (!url) {
          setError('Failed to generate stream URL');
          setLoading(false);
          return;
        }

        // Set the stream URL
        setStreamUrl(url);
        setLoading(false);
      } catch (err) {
        console.error('Error setting up stream:', err);
        setError('An error occurred while setting up the stream');
        setLoading(false);
      }
    }

    setupStream();

    // Cleanup function to revoke object URL when component unmounts
    return () => {
      if (streamUrl && streamUrl.startsWith('blob:')) {
        URL.revokeObjectURL(streamUrl);
      }
    };
  }, [contentId, walletAddress]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Preparing secure stream...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box textAlign="center">
          <Typography variant="h5" color="error" gutterBottom>
            Stream Error
          </Typography>
          <Typography variant="body1">
            {error}
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!streamUrl) {
    return (
      <Container maxWidth="xl" sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box textAlign="center">
          <Typography variant="h5" color="error" gutterBottom>
            No Stream Available
          </Typography>
          <Typography variant="body1">
            Could not generate stream URL
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100vh', 
        position: 'fixed', 
        top: 0, 
        left: 0,
        bgcolor: '#000'
      }}
    >
      <video
        src={streamUrl}
        controls
        autoPlay
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      >
        Your browser does not support the video tag.
      </video>
    </Box>
  );
};

export default ContentStreamPage; 