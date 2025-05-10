import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useWallet } from '../../hooks/useWallet';
import { downloadService } from '../../services/download.service';
import { keyManagementService } from '../../services/keyManagement.service';
import { blockchainService } from '../../services/blockchain.service';
import { cdnService } from '../../services/cdn.service';

interface VideoPlayerProps {
  contentId: string;
  contentCid: string;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  width?: string;
  height?: string;
  preloadLevel?: 'none' | 'metadata' | 'auto';
  isPublicContent?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  contentId,
  contentCid,
  autoPlay = false,
  loop = false,
  controls = true,
  width = '100%',
  height = '100%',
  preloadLevel = 'metadata',
  isPublicContent = false
}) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const { account } = useWallet();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [retries, setRetries] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Add direct verification function
  const verifyTokenOwnership = async () => {
    try {
      setVerificationStatus('Checking token ownership...');
      
      if (!account) {
        setVerificationStatus('Error: No wallet connected');
        return;
      }
      
      console.log(`Manual verification - Content ID: ${contentId}, Wallet: ${account}`);
      
      // Direct blockchain check
      let chainBalance = 0;
      if (blockchainService.isInitialized()) {
        try {
          chainBalance = await blockchainService.getTokenBalance(account, contentId);
          console.log(`Blockchain token balance: ${chainBalance}`);
        } catch (err) {
          console.error('Error checking blockchain balance:', err);
        }
      }
      
      // KMS check
      const kmsVerified = await keyManagementService.verifyContentOwnership(contentId, account);
      console.log(`KMS verification result: ${kmsVerified}`);
      
      setVerificationStatus(
        `Token Verification Results:
        Blockchain Balance: ${chainBalance} tokens
        KMS Verification: ${kmsVerified ? 'Passed' : 'Failed'}
        
        ${kmsVerified ? '✅ You should be able to play the content now.' : '❌ Token ownership could not be verified.'}
        
        ${!kmsVerified && chainBalance > 0 ? 'Your tokens were found on the blockchain but verification failed. Please try again.' : ''}
        ${!kmsVerified && chainBalance === 0 ? 'No tokens found on the blockchain. If you just purchased tokens, they may not be registered yet.' : ''}`
      );
      
      // If verification passed and we had an error before, retry loading
      if (kmsVerified && error) {
        setTimeout(() => {
          handleRetry();
        }, 2000);
      }
    } catch (err) {
      console.error('Error during manual verification:', err);
      setVerificationStatus(`Verification error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const loadVideo = async () => {
    setLoading(true);
    setLoadingProgress(10); // Start progress at 10%
    setError(null);
    
    try {
      // Basic validation
      if (!contentId || !contentCid) {
        console.error('VideoPlayer - Missing content ID or CID');
        setError('Missing content information');
        setLoading(false);
        return;
      }
      
      setLoadingProgress(20);
      
      // For public content, we can use the CDN directly without ownership checks
      if (isPublicContent) {
        console.log('VideoPlayer - Using public content streaming');
        const url = downloadService.getPublicStreamUrl(contentCid);
        setVideoUrl(url);
        setLoading(false);
        return;
      }
      
      // Check wallet connection for protected content
      if (!account) {
        console.error('VideoPlayer - No wallet connected');
        setError('Please connect your wallet to play this content');
        setLoading(false);
        return;
      }

      setLoadingProgress(30);
      
      // Try with retries for token verification and content loading
      let retryCount = 3;
      
      while (retryCount > 0) {
        try {
          console.log(`VideoPlayer - Loading attempt ${4-retryCount} for content ID: ${contentId}, CID: ${contentCid}`);
          
          setLoadingProgress(40);
          
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

          setLoadingProgress(60);
          
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

          setLoadingProgress(80);
          
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

          setLoadingProgress(100);
          console.log('VideoPlayer - Stream URL obtained successfully');
          setVideoUrl(url);
          setLoading(false);
          
          // Prefetch rest of content in background
          downloadService.prefetchContent(contentCid, account);
          
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
    } catch (error) {
      console.error('VideoPlayer - Unexpected error during video loading:', error);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize CDN service if needed
    if (cdnService && !videoUrl) {
      cdnService.initialize().catch(err => {
        console.warn('Error initializing CDN service:', err);
      });
    }
    
    // Load video when component mounts or when contentCid/account changes
    setLoading(true);
    loadVideo();

    // Cleanup when component unmounts
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [contentCid, contentId, account, isPublicContent]);

  const handleRetry = () => {
    setRetries(retries + 1);
    setLoading(true);
    setLoadingProgress(0);
    setError(null);
    setVerificationStatus(null);
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
        <CircularProgress size={40} variant={loadingProgress > 0 ? "determinate" : "indeterminate"} value={loadingProgress} />
        <Typography variant="body2" sx={{ mt: 2 }}>
          {loadingProgress < 50 ? 'Verifying access...' : 'Decrypting content...'}
        </Typography>
        {loadingProgress > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            {loadingProgress}% complete
          </Typography>
        )}
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
        <Typography color="error" gutterBottom align="center">{error}</Typography>
        
        {verificationStatus && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, maxWidth: '80%', whiteSpace: 'pre-line' }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
              {verificationStatus}
            </Typography>
          </Box>
        )}
        
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleRetry}
          >
            Retry Playback
          </Button>
          
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={verifyTokenOwnership}
          >
            Verify Token Ownership
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box position="relative" width={width} height={height}>
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay={autoPlay}
          loop={loop}
          controls={controls}
          width="100%"
          height="100%"
          style={{ objectFit: 'contain' }}
          preload={preloadLevel}
          onError={(e) => {
            console.error('Video playback error:', e);
            setError('Error playing video. Please try again.');
          }}
        />
      )}
    </Box>
  );
};

export default VideoPlayer; 