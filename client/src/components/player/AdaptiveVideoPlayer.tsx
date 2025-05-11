import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useWallet } from '../../hooks/useWallet';
import { downloadService } from '../../services/download.service';
import { keyManagementService } from '../../services/keyManagement.service';
import { blockchainService } from '../../services/blockchain.service';
import { cdnService } from '../../services/cdn.service';
import Hls from 'hls.js';
import * as dashjs from 'dashjs';

// Import Shaka if available
let shaka: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  shaka = require('shaka-player');
} catch (error) {
  console.warn('Shaka Player not available, some streaming features may be limited');
  shaka = null;
}

// Quality levels
export enum VideoQuality {
  AUTO = 'auto',
  LOW = 'low',     // 480p or lower
  MEDIUM = 'medium', // 720p
  HIGH = 'high',    // 1080p
  ULTRA = 'ultra'   // 4K
}

interface AdaptiveVideoPlayerProps {
  contentId: string;
  contentCid: string;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  width?: string;
  height?: string;
  preloadLevel?: 'none' | 'metadata' | 'auto';
  isPublicContent?: boolean;
  onQualityChange?: (quality: VideoQuality) => void;
}

const AdaptiveVideoPlayer: React.FC<AdaptiveVideoPlayerProps> = ({
  contentId,
  contentCid,
  autoPlay = false,
  loop = false,
  controls = true,
  width = '100%',
  height = '100%',
  preloadLevel = 'metadata',
  isPublicContent = false,
  onQualityChange
}) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const { account } = useWallet();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [retries, setRetries] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<VideoQuality>(VideoQuality.AUTO);
  
  // Reference to streaming players
  const hlsPlayerRef = useRef<Hls | null>(null);
  const dashPlayerRef = useRef<dashjs.MediaPlayerClass | null>(null);
  const shakaPlayerRef = useRef<any>(null);
  
  // Streaming format state
  const [streamFormat, setStreamFormat] = useState<'hls' | 'dash' | 'mp4' | null>(null);
  
  // Handle component unmount
  useEffect(() => {
    return () => {
      destroyPlayers();
    };
  }, []);
  
  // Destroy all players and clean up
  const destroyPlayers = () => {
    if (hlsPlayerRef.current) {
      hlsPlayerRef.current.destroy();
      hlsPlayerRef.current = null;
    }
    
    if (dashPlayerRef.current) {
      dashPlayerRef.current.destroy();
      dashPlayerRef.current = null;
    }
    
    if (shakaPlayerRef.current) {
      shakaPlayerRef.current.destroy();
      shakaPlayerRef.current = null;
    }
  };
  
  // Toggle verification of token ownership
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
        chainBalance > 0 || kmsVerified 
          ? 'Verified: You own this content'
          : 'Not verified: You do not own this content'
      );
    } catch (error) {
      console.error('Error during verification:', error);
      setVerificationStatus('Error during verification');
    }
  };

  // Setup HLS player
  const setupHlsPlayer = (streamUrl: string) => {
    if (!videoRef.current) return;
    
    // Destroy any existing players
    destroyPlayers();
    
    if (Hls.isSupported()) {
      console.log(`Setting up HLS player for ${streamUrl}`);
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        capLevelToPlayerSize: true
      });
      
      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
      
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log('HLS manifest parsed, levels:', data.levels.length);
        
        // Set available qualities
        const qualities = [VideoQuality.AUTO];
        
        if (data.levels.length > 0) {
          // Sort levels by height (resolution)
          const sortedLevels = [...data.levels].sort((a, b) => a.height - b.height);
          
          // Map to quality levels based on resolution
          if (sortedLevels.length >= 1) qualities.push(VideoQuality.LOW);
          if (sortedLevels.length >= 2) qualities.push(VideoQuality.MEDIUM);
          if (sortedLevels.length >= 3) qualities.push(VideoQuality.HIGH);
          if (sortedLevels.length >= 4) qualities.push(VideoQuality.ULTRA);
          
          setAvailableQualities(qualities);
        }
        
        if (autoPlay) {
          videoRef.current?.play().catch(e => 
            console.error('Error auto-playing video:', e)
          );
        }
      });
      
      // Error handling
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('Fatal HLS error:', data);
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad(); // Try to recover
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError(); // Try to recover
              break;
            default:
              // Cannot recover, destroy and try another format
              destroyPlayers();
              
              // Try MP4 fallback
              setVideoUrl(cdnService.getStreamingUrl(contentCid));
              setStreamFormat('mp4');
              break;
          }
        }
      });
      
      hlsPlayerRef.current = hls;
    } else {
      // HLS not supported, try direct playback
      console.log('HLS not supported, trying direct playback');
      setVideoUrl(streamUrl);
      setStreamFormat('mp4');
    }
  };
  
  // Setup DASH player
  const setupDashPlayer = (streamUrl: string) => {
    if (!videoRef.current) return;
    
    // Destroy any existing players
    destroyPlayers();
    
    try {
      console.log(`Setting up DASH player for ${streamUrl}`);
      const player = dashjs.MediaPlayer().create();
      
      player.initialize(videoRef.current, streamUrl, autoPlay);
      player.updateSettings({
        streaming: {
          lowLatencyEnabled: false,
          abr: {
            useDefaultABRRules: true,
            autoSwitchBitrate: {
              video: true
            }
          }
        }
      });
      
      // Event listeners for quality changes
      player.on('qualityChangeRendered', (e: any) => {
        if (e.mediaType === 'video') {
          console.log('DASH quality changed:', e);
          
          // Set available qualities based on bitrate list
          const bitrateList = player.getBitrateInfoListFor('video');
          if (bitrateList && bitrateList.length > 0) {
            const qualities = [VideoQuality.AUTO];
            
            // Sort levels by bitrate
            const sortedLevels = [...bitrateList].sort((a, b) => a.bitrate - b.bitrate);
            
            // Map to quality levels based on bitrate
            if (sortedLevels.length >= 1) qualities.push(VideoQuality.LOW);
            if (sortedLevels.length >= 2) qualities.push(VideoQuality.MEDIUM);
            if (sortedLevels.length >= 3) qualities.push(VideoQuality.HIGH);
            if (sortedLevels.length >= 4) qualities.push(VideoQuality.ULTRA);
            
            setAvailableQualities(qualities);
          }
        }
      });
      
      dashPlayerRef.current = player;
    } catch (error) {
      console.error('Error setting up DASH player:', error);
      
      // Try MP4 fallback
      setVideoUrl(cdnService.getStreamingUrl(contentCid));
      setStreamFormat('mp4');
    }
  };
  
  // Handle quality change
  const handleQualityChange = (quality: VideoQuality) => {
    setCurrentQuality(quality);
    
    if (onQualityChange) {
      onQualityChange(quality);
    }
    
    if (!videoRef.current) return;
    
    // Apply quality change based on player type
    if (hlsPlayerRef.current) {
      if (quality === VideoQuality.AUTO) {
        hlsPlayerRef.current.currentLevel = -1; // Auto
      } else {
        // Map quality to level
        const levels = hlsPlayerRef.current.levels;
        if (!levels || levels.length === 0) return;
        
        // Sort by height (resolution)
        const sortedLevels = [...levels].sort((a, b) => a.height - b.height);
        
        let levelIndex: number;
        switch (quality) {
          case VideoQuality.LOW:
            levelIndex = 0; // Lowest level
            break;
          case VideoQuality.MEDIUM:
            levelIndex = Math.floor(sortedLevels.length * 0.33);
            break;
          case VideoQuality.HIGH:
            levelIndex = Math.floor(sortedLevels.length * 0.66);
            break;
          case VideoQuality.ULTRA:
            levelIndex = sortedLevels.length - 1; // Highest level
            break;
          default:
            levelIndex = -1; // Auto
        }
        
        // Find actual index in the unsorted levels array
        if (levelIndex >= 0) {
          const targetHeight = sortedLevels[levelIndex].height;
          const actualIndex = levels.findIndex(l => l.height === targetHeight);
          hlsPlayerRef.current.currentLevel = actualIndex >= 0 ? actualIndex : levelIndex;
        } else {
          hlsPlayerRef.current.currentLevel = -1;
        }
      }
    } else if (dashPlayerRef.current) {
      try {
        const bitrateList = dashPlayerRef.current.getBitrateInfoListFor('video');
        if (!bitrateList || bitrateList.length === 0) return;
        
        if (quality === VideoQuality.AUTO) {
          dashPlayerRef.current.updateSettings({
            streaming: {
              abr: {
                autoSwitchBitrate: {
                  video: true
                }
              }
            }
          });
        } else {
          // Sort by bitrate
          const sortedBitrates = [...bitrateList].sort((a, b) => a.bitrate - b.bitrate);
          
          let bitrateIndex: number;
          switch (quality) {
            case VideoQuality.LOW:
              bitrateIndex = 0; // Lowest bitrate
              break;
            case VideoQuality.MEDIUM:
              bitrateIndex = Math.floor(sortedBitrates.length * 0.33);
              break;
            case VideoQuality.HIGH:
              bitrateIndex = Math.floor(sortedBitrates.length * 0.66);
              break;
            case VideoQuality.ULTRA:
              bitrateIndex = sortedBitrates.length - 1; // Highest bitrate
              break;
            default:
              bitrateIndex = -1; // Auto
          }
          
          if (bitrateIndex >= 0) {
            const targetBitrate = sortedBitrates[bitrateIndex].bitrate;
            const qualityIndex = bitrateList.findIndex(b => b.bitrate === targetBitrate);
            
            dashPlayerRef.current.updateSettings({
              streaming: {
                abr: {
                  autoSwitchBitrate: {
                    video: false
                  }
                }
              }
            });
            
            dashPlayerRef.current.setQualityFor('video', qualityIndex >= 0 ? qualityIndex : bitrateIndex);
          }
        }
      } catch (error) {
        console.error('Error changing DASH quality:', error);
      }
    }
  };
  
  // Load and setup the video
  const loadVideo = async () => {
    setLoading(true);
    setLoadingProgress(10); // Start progress at 10%
    setError(null);
    
    try {
      // Basic validation
      if (!contentId || !contentCid) {
        console.error('AdaptiveVideoPlayer - Missing content ID or CID');
        setError('Missing content information');
        setLoading(false);
        return;
      }
      
      setLoadingProgress(20);
      
      // For public content, we can use the CDN directly without ownership checks
      if (isPublicContent) {
        console.log('AdaptiveVideoPlayer - Using public content streaming');
        
        // Try HLS first
        const hlsUrl = `${cdnService.getEdgeServerUrl()}/hls/${contentCid}/master.m3u8`;
        
        try {
          // Make a HEAD request to check if HLS is available
          const response = await fetch(hlsUrl, { method: 'HEAD' });
          
          if (response.ok) {
            console.log('AdaptiveVideoPlayer - HLS available, using HLS streaming');
            setStreamFormat('hls');
            setupHlsPlayer(hlsUrl);
          } else {
            throw new Error('HLS not available');
          }
        } catch (e) {
          // Try DASH as fallback
          const dashUrl = `${cdnService.getEdgeServerUrl()}/dash/${contentCid}/manifest.mpd`;
          
          try {
            const response = await fetch(dashUrl, { method: 'HEAD' });
            
            if (response.ok) {
              console.log('AdaptiveVideoPlayer - DASH available, using DASH streaming');
              setStreamFormat('dash');
              setupDashPlayer(dashUrl);
            } else {
              throw new Error('DASH not available');
            }
          } catch (e) {
            // Fall back to direct MP4
            console.log('AdaptiveVideoPlayer - Falling back to direct streaming');
            setVideoUrl(cdnService.getStreamingUrl(contentCid));
            setStreamFormat('mp4');
          }
        }
        
        setLoading(false);
        return;
      }
      
      // Check wallet connection for protected content
      if (!account) {
        console.error('AdaptiveVideoPlayer - No wallet connected');
        setError('Please connect your wallet to play this content');
        setLoading(false);
        return;
      }

      setLoadingProgress(30);
      
      // Try with retries for token verification and content loading
      let retryCount = 3;
      
      while (retryCount > 0) {
        try {
          console.log(`AdaptiveVideoPlayer - Loading attempt ${4-retryCount} for content ID: ${contentId}, CID: ${contentCid}`);
          
          setLoadingProgress(40);
          
          // Double check ownership in keyManagementService for extra security
          console.log('AdaptiveVideoPlayer - Verifying ownership through keyManagementService');
          const ownershipVerified = await keyManagementService.verifyContentOwnership(contentId, account);
          console.log('AdaptiveVideoPlayer - Ownership verification result:', ownershipVerified);
          
          if (!ownershipVerified) {
            console.error('AdaptiveVideoPlayer - Ownership verification failed');
            // Only set error on last retry
            if (retryCount === 1) {
              setError('You do not own this content. If you just purchased it, please wait a moment and try again.');
              setLoading(false);
              return;
            }
            
            console.log(`AdaptiveVideoPlayer - Retrying ownership check in 2 seconds (${retryCount-1} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            retryCount--;
            continue;
          }

          setLoadingProgress(60);
          
          // Check if we can access the content
          console.log('AdaptiveVideoPlayer - Checking content access through downloadService');
          const canAccess = await downloadService.canAccessContent(contentCid, account);
          console.log('AdaptiveVideoPlayer - Content access check result:', canAccess);
          
          if (!canAccess) {
            console.error('AdaptiveVideoPlayer - Access denied to content');
            // Only set error on last retry
            if (retryCount === 1) {
              setError('You do not have permission to view this content. If you just purchased it, please wait a moment and try again.');
              setLoading(false);
              return;
            }
            
            console.log(`AdaptiveVideoPlayer - Retrying access check in 2 seconds (${retryCount-1} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            retryCount--;
            continue;
          }

          setLoadingProgress(80);
          
          // Try HLS for protected content
          try {
            // Get decryption key or token for the stream
            const decryptionKey = await keyManagementService.getContentKey(contentId, account);
            
            if (decryptionKey) {
              // Try HLS with authentication
              const hlsUrl = `${cdnService.getEdgeServerUrl()}/hls/${contentCid}/master.m3u8?token=${encodeURIComponent(decryptionKey)}`;
              
              try {
                // Check if HLS is available
                const response = await fetch(hlsUrl, { 
                  method: 'HEAD',
                  headers: { 'Authorization': `Bearer ${decryptionKey}` }
                });
                
                if (response.ok) {
                  console.log('AdaptiveVideoPlayer - HLS available for protected content');
                  setStreamFormat('hls');
                  setupHlsPlayer(hlsUrl);
                  setLoading(false);
                  return;
                }
              } catch (e) {
                console.log('AdaptiveVideoPlayer - HLS not available for protected content');
              }
            }
          } catch (e) {
            console.warn('AdaptiveVideoPlayer - Error setting up HLS for protected content:', e);
          }
          
          // Get the stream URL with decryption
          console.log('AdaptiveVideoPlayer - Falling back to download service for stream URL');
          const url = await downloadService.getContentStreamUrl(contentCid, account);
          
          if (!url) {
            console.error('AdaptiveVideoPlayer - Failed to get content stream URL');
            // Only set error on last retry
            if (retryCount === 1) {
              setError('Failed to load video. Please try again later.');
              setLoading(false);
              return;
            }
            
            console.log(`AdaptiveVideoPlayer - Retrying stream URL fetch in 2 seconds (${retryCount-1} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            retryCount--;
            continue;
          }

          setLoadingProgress(100);
          console.log('AdaptiveVideoPlayer - Stream URL obtained successfully');
          setVideoUrl(url);
          setStreamFormat('mp4');
          setLoading(false);
          
          // Prefetch rest of content in background
          downloadService.prefetchContent(contentCid, account);
          
          // Success, break out of retry loop
          break;
          
        } catch (err) {
          console.error('AdaptiveVideoPlayer - Error loading content:', err);
          
          // Only set error on last retry
          if (retryCount === 1) {
            setError('Failed to load video. Please try again later.');
            setLoading(false);
            return;
          }
          
          retryCount--;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (err) {
      console.error('AdaptiveVideoPlayer - Unexpected error:', err);
      setError('An unexpected error occurred. Please try again later.');
      setLoading(false);
    }
  };
  
  // Load video on mount or when dependencies change
  useEffect(() => {
    loadVideo();
    return () => destroyPlayers();
  }, [contentId, contentCid, account, isPublicContent]);
  
  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" width={width} height={height}>
        <CircularProgress variant="determinate" value={loadingProgress} size={60} thickness={4} />
        <Typography variant="body2" color="textSecondary" mt={2}>
          Loading video...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" width={width} height={height}>
        <Typography variant="body1" color="error" gutterBottom>
          {error}
        </Typography>
        {error.includes('do not own') && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={verifyTokenOwnership}
            sx={{ mt: 2 }}
          >
            Check Ownership
          </Button>
        )}
        <Button 
          variant="outlined" 
          onClick={loadVideo}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box width={width} height={height} position="relative">
      {verificationStatus && (
        <Box
          position="absolute"
          top={0}
          right={0}
          bgcolor="rgba(0,0,0,0.7)"
          p={1}
          borderRadius={1}
          zIndex={2}
        >
          <Typography variant="caption" color="white">
            {verificationStatus}
          </Typography>
        </Box>
      )}
      
      {availableQualities.length > 0 && (
        <Box
          position="absolute"
          top={8}
          right={8}
          zIndex={2}
          bgcolor="rgba(0,0,0,0.5)"
          borderRadius={1}
          p={1}
        >
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="quality-select-label" sx={{ color: 'white' }}>Quality</InputLabel>
            <Select
              labelId="quality-select-label"
              value={currentQuality}
              onChange={(e) => handleQualityChange(e.target.value as VideoQuality)}
              label="Quality"
              sx={{ color: 'white', '& .MuiSelect-icon': { color: 'white' } }}
            >
              {availableQualities.map((quality) => (
                <MenuItem key={quality} value={quality}>
                  {quality === VideoQuality.AUTO 
                    ? 'Auto' 
                    : quality === VideoQuality.LOW 
                      ? '480p' 
                      : quality === VideoQuality.MEDIUM 
                        ? '720p' 
                        : quality === VideoQuality.HIGH 
                          ? '1080p' 
                          : '4K'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
      
      <video
        ref={videoRef}
        src={streamFormat === 'mp4' ? videoUrl || undefined : undefined}
        autoPlay={autoPlay}
        loop={loop}
        controls={controls}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        preload={preloadLevel}
      />
    </Box>
  );
};

export default AdaptiveVideoPlayer; 