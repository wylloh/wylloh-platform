import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useWallet } from '../../hooks/useWallet';
import { downloadService } from '../../services/download.service';

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

  useEffect(() => {
    // Load video when component mounts or when contentCid/account changes
    async function loadVideo() {
      if (!contentCid || !contentId) {
        setError('No content provided');
        setLoading(false);
        return;
      }

      if (!account) {
        setError('Wallet not connected');
        setLoading(false);
        return;
      }

      try {
        // Check if user can access this content
        const canAccess = await downloadService.canAccessContent(contentCid, account);
        if (!canAccess) {
          setError('You do not have permission to view this content');
          setLoading(false);
          return;
        }

        // Get the stream URL with decryption
        const url = await downloadService.getContentStreamUrl(contentCid, account);
        if (!url) {
          setError('Failed to load video');
          setLoading(false);
          return;
        }

        setVideoUrl(url);
        setLoading(false);
      } catch (err) {
        console.error('Error loading video:', err);
        setError('Error loading video');
        setLoading(false);
      }
    }

    setLoading(true);
    loadVideo();

    // Cleanup when component unmounts
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [contentCid, contentId, account]);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        width={width} 
        height={height}
        bgcolor="rgba(0, 0, 0, 0.1)"
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        width={width} 
        height={height}
        bgcolor="rgba(0, 0, 0, 0.05)"
        p={2}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <video
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