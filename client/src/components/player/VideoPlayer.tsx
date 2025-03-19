import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useWallet } from '../../hooks/useWallet';
import { downloadService } from '../../services/download.service';
import { keyManagementService } from '../../services/keyManagement.service';

interface VideoPlayerProps {
  contentId: string;
  contentCid: string;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  width?: string;
  height?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  contentId,
  contentCid,
  autoPlay = false,
  loop = false,
  controls = true,
  width = '100%',
  height = '100%'
}) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { account } = useWallet();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [retries, setRetries] = useState(0);

  const loadVideo = async () => {
    setLoading(true);
    setError(null);
    
    // Basic validation
    if (!contentId || !contentCid) {
      console.error('VideoPlayer - Missing content ID or CID');
      setError('Missing content information');
      setLoading(false);
      return;
    }
    
    // Check wallet connection
    if (!account) {
      console.error('VideoPlayer - No wallet connected');
      setError('Please connect your wallet to play this content');
      setLoading(false);
      return;
    }

    // Try with retries for token verification and content loading
    let retryCount = 3;
    
    while (retryCount > 0) {
      try {
        console.log(`VideoPlayer - Loading attempt ${4-retryCount} for content ID: ${contentId}, CID: ${contentCid}`);
        
        // Double check ownership in keyManagementService for extra security
        console.log('VideoPlayer - Verifying ownership through keyManagementService');
        const ownershipVerified = await keyManagementService.verifyContentOwnership(contentId, account);
        console.log('VideoPlayer - Ownership verification result:', ownershipVerified);
        
        if (!ownershipVerified) {
          console.error('VideoPlayer - Ownership verification failed');
          // Only set error on last retry
          if (retryCount === 1) {
            setError('You do not own this content. If you just purchased it, please wait a moment and try again.');
            setLoading(false);
            return;
          }
          
          console.log(`VideoPlayer - Retrying ownership check in 2 seconds (${retryCount-1} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retryCount--;
          continue;
        }

        // Check if we can access the content
        console.log('VideoPlayer - Checking content access through downloadService');
        const canAccess = await downloadService.canAccessContent(contentCid, account);
        console.log('VideoPlayer - Content access check result:', canAccess);
        
        if (!canAccess) {
          console.error('VideoPlayer - Access denied to content');
          // Only set error on last retry
          if (retryCount === 1) {
            setError('You do not have permission to view this content. If you just purchased it, please wait a moment and try again.');
            setLoading(false);
            return;
          }
          
          console.log(`VideoPlayer - Retrying access check in 2 seconds (${retryCount-1} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retryCount--;
          continue;
        }

        // Get the stream URL with decryption
        console.log('VideoPlayer - Getting content stream URL');
        const url = await downloadService.getContentStreamUrl(contentCid, account);
        
        if (!url) {
          console.error('VideoPlayer - Failed to get content stream URL');
          // Only set error on last retry
          if (retryCount === 1) {
            setError('Failed to load video. Please try again later.');
            setLoading(false);
            return;
          }
          
          console.log(`VideoPlayer - Retrying stream URL fetch in 2 seconds (${retryCount-1} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retryCount--;
          continue;
        }

        console.log('VideoPlayer - Stream URL obtained successfully');
        setVideoUrl(url);
        setLoading(false);
        // Success, break out of retry loop
        break;
        
      } catch (err) {
        console.error('Error in VideoPlayer.loadVideo attempt:', err);
        retryCount--;
        
        // On last retry, show error to user
        if (retryCount === 0) {
          console.error('VideoPlayer - All retry attempts failed');
          setError('Error loading video: ' + (err instanceof Error ? err.message : String(err)));
          setLoading(false);
        } else {
          console.log(`VideoPlayer - Retrying after error (${retryCount} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
  };

  useEffect(() => {
    // Load video when component mounts or when contentCid/account changes
    setLoading(true);
    loadVideo();

    // Cleanup when component unmounts
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [contentCid, contentId, account]);

  const handleRetry = () => {
    setRetries(retries + 1);
    setLoading(true);
    setError(null);
    loadVideo();
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        width={width} 
        height={height}
        bgcolor="rgba(0, 0, 0, 0.1)"
      >
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Decrypting content...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        width={width} 
        height={height}
        bgcolor="rgba(0, 0, 0, 0.05)"
        p={2}
      >
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleRetry}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <video
      ref={videoRef}
      src={videoUrl || undefined}
      autoPlay={autoPlay}
      loop={loop}
      controls={controls}
      width={width}
      height={height}
      style={{ maxWidth: '100%', maxHeight: '100%' }}
    >
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoPlayer; 