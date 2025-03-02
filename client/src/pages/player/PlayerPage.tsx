import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Slider,
  Container,
  Grid,
  Paper,
  Button,
  Divider,
  Tooltip,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  ArrowBack,
  Info,
  Subtitles,
  SubtitlesOff,
  Settings,
  Speed,
  ShoppingCart,
  Warning
} from '@mui/icons-material';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';

// Mock content data
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

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return [
    hours > 0 ? hours : null,
    minutes > 0 || hours > 0 ? minutes.toString().padStart(2, '0') : '00',
    secs.toString().padStart(2, '0')
  ]
    .filter(Boolean)
    .join(':');
};

const PlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [previewEndDialogOpen, setPreviewEndDialogOpen] = useState(false);
  const [isPreview, setIsPreview] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const navigate = useNavigate();
  const { active, isCorrectNetwork } = useWallet();
  const { isAuthenticated } = useAuth();
  
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
    
    // Cleanup function
    return () => {
      // Stop video playback when component unmounts
      if (videoRef.current) {
        videoRef.current.pause();
      }
      
      // Clear any pending timeouts
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, [id]);
  
  // Handle video events
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
      
      // Check if preview has ended
      if (isPreview && videoElement.currentTime >= 120) { // 2 minutes in seconds
        videoElement.pause();
        setPlaying(false);
        setPreviewEndDialogOpen(true);
      }
    };
    
    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };
    
    const handlePlay = () => {
      setPlaying(true);
    };
    
    const handlePause = () => {
      setPlaying(false);
    };
    
    const handleWaiting = () => {
      setBuffering(true);
    };
    
    const handlePlaying = () => {
      setBuffering(false);
    };
    
    const handleVolumeChange = () => {
      setVolume(videoElement.volume);
      setMuted(videoElement.muted);
    };
    
    const handleEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
      
      if (isPreview) {
        setPreviewEndDialogOpen(true);
      }
    };
    
    // Add event listeners
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('volumechange', handleVolumeChange);
    videoElement.addEventListener('ended', handleEnded);
    
    // Remove event listeners on cleanup
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('playing', handlePlaying);
      videoElement.removeEventListener('volumechange', handleVolumeChange);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [isPreview]);
  
  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Handle show/hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        if (playing) {
          setShowControls(false);
        }
      }, 3000);
    };
    
    const playerElement = playerRef.current;
    if (playerElement) {
      playerElement.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (playerElement) {
        playerElement.removeEventListener('mousemove', handleMouseMove);
      }
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [playing]);
  
  // Player control functions
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };
  
  const handleSeek = (event: Event, newValue: number | number[]) => {
    if (!videoRef.current) return;
    
    const seekTime = typeof newValue === 'number' ? newValue : newValue[0];
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };
  
  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    if (!videoRef.current) return;
    
    const newVolume = typeof newValue === 'number' ? newValue : newValue[0];
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      videoRef.current.muted = true;
      setMuted(true);
    } else if (muted) {
      videoRef.current.muted = false;
      setMuted(false);
    }
  };
  
  const toggleMute = () => {
    if (!videoRef.current) return;
    
    const newMuted = !muted;
    videoRef.current.muted = newMuted;
    setMuted(newMuted);
  };
  
  const toggleFullscreen = () => {
    if (!playerRef.current) return;
    
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };
  
  const toggleSubtitles = () => {
    setSubtitlesEnabled(!subtitlesEnabled);
  };
  
  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };
  
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
  
  const handlePreviewEndDialogClose = () => {
    setPreviewEndDialogOpen(false);
  };
  
  // Render loading state
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ pt: 2, pb: 2 }}>
          <Button 
            component={Link} 
            to={`/marketplace/${id}`} 
            startIcon={<ArrowBack />}
            sx={{ mb: 2 }}
          >
            Back to Details
          </Button>
          <Skeleton variant="rectangular" height={500} width="100%" />
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="text" height={40} width="60%" />
            <Skeleton variant="text" height={20} width="40%" />
          </Box>
        </Box>
      </Container>
    );
  }
  
  // Render error state if content not found
  if (!content) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Content Not Found
          </Typography>
          <Typography variant="body1" paragraph>
            The content you are trying to access does not exist or has been removed.
          </Typography>
          <Button 
            variant="contained" 
            component={Link} 
            to="/marketplace"
            startIcon={<ArrowBack />}
          >
            Back to Marketplace
          </Button>
        </Box>
      </Container>
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
        <Box 
          ref={playerRef}
          sx={{ 
            position: 'relative', 
            width: '100%',
            bgcolor: 'black',
            aspectRatio: '16/9',
            cursor: showControls ? 'auto' : 'none',
          }}
          onClick={togglePlay}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            src={isPreview ? content.previewUrl : content.fullContentUrl}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
            }}
            poster={content.thumbnailUrl}
            playsInline
            onClick={(e) => e.stopPropagation()}
          >
            {subtitlesEnabled && (
              <track 
                kind="subtitles" 
                src="/path/to/subtitles.vtt" 
                srcLang="en" 
                label="English" 
                default 
              />
            )}
            Your browser does not support the video tag.
          </video>
          
          {/* Preview Badge */}
          {isPreview && (
            <Chip
              label="PREVIEW"
              color="primary"
              size="small"
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 10,
                bgcolor: 'rgba(25, 118, 210, 0.8)',
              }}
            />
          )}
          
          {/* Buffering Indicator */}
          {buffering && (
            <Box 
              sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                zIndex: 5,
              }}
            >
              <CircularProgress color="primary" size={60} />
            </Box>
          )}
          
          {/* Play/Pause Big Button (when paused) */}
          {!playing && showControls && (
            <IconButton
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                },
                zIndex: 4,
                p: 2,
              }}
              onClick={togglePlay}
            >
              <PlayArrow sx={{ fontSize: 60 }} />
            </IconButton>
          )}
          
          {/* Controls Overlay */}
          {showControls && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                p: 1,
                transition: 'all 0.3s ease',
                zIndex: 3,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress Bar */}
              <Box sx={{ px: 2, mb: 1 }}>
                <Slider
                  value={currentTime}
                  min={0}
                  max={duration}
                  onChange={handleSeek}
                  aria-label="Video Progress"
                  sx={{
                    color: 'primary.main',
                    height: 4,
                    '& .MuiSlider-thumb': {
                      width: 12,
                      height: 12,
                      display: 'none',
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0px 0px 0px 8px rgba(25, 118, 210, 0.16)',
                      },
                    },
                    '&:hover .MuiSlider-thumb': {
                      display: 'block',
                    },
                  }}
                />
              </Box>
              
              {/* Controls Row */}
              <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                {/* Play/Pause */}
                <IconButton color="inherit" onClick={togglePlay} size="small">
                  {playing ? <Pause /> : <PlayArrow />}
                </IconButton>
                
                {/* Volume */}
                <Box sx={{ display: 'flex', alignItems: 'center', width: 120, ml: 1, mr: 2 }}>
                  <IconButton color="inherit" onClick={toggleMute} size="small">
                    {muted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
                  </IconButton>
                  <Slider
                    value={muted ? 0 : volume}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={handleVolumeChange}
                    aria-label="Volume"
                    size="small"
                    sx={{
                      ml: 1,
                      color: 'white',
                    }}
                  />
                </Box>
                
                {/* Time Display */}
                <Typography variant="body2" sx={{ mr: 2 }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>
                
                {/* Spacer */}
                <Box sx={{ flexGrow: 1 }} />
                
                {/* Playback Speed */}
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    {playbackRate}x
                  </Typography>
                  <IconButton 
                    color="inherit" 
                    size="small"
                    onClick={() => {
                      const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
                      const currentIndex = rates.indexOf(playbackRate);
                      const nextIndex = (currentIndex + 1) % rates.length;
                      changePlaybackRate(rates[nextIndex]);
                    }}
                  >
                    <Speed fontSize="small" />
                  </IconButton>
                </Box>
                
                {/* Subtitles Toggle */}
                <IconButton 
                  color="inherit" 
                  onClick={toggleSubtitles} 
                  size="small"
                  sx={{ mr: 1 }}
                >
                  {subtitlesEnabled ? <Subtitles /> : <SubtitlesOff />}
                </IconButton>
                
                {/* Fullscreen Toggle */}
                <IconButton 
                  color="inherit" 
                  onClick={toggleFullscreen}
                  size="small"
                >
                  {fullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
              </Box>
            </Box>
          )}
          
          {/* Preview Overlay for non-owned content */}
          {isPreview && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: 2,
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="body2">
                  Preview Mode: {content.previewDuration} preview
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                startIcon={<ShoppingCart />}
                onClick={handlePurchaseDialogOpen}
              >
                Purchase Full Content
              </Button>
            </Box>
          )}
        </Box>
        
        {/* Content Information */}
        {!fullscreen && (
          <Paper 
            sx={{ 
              mt: 2, 
              p: 2,
              bgcolor: 'background.paper',
              color: 'text.primary',
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="h5" gutterBottom>
                  {content.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {content.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip 
                    label={content.contentType.toUpperCase()}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {content.duration} • {content.creator}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: {xs: 'flex-start', md: 'flex-end'} }}>
                {isPreview ? (
                  <Box>
                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Price: {content.price} MATIC
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<ShoppingCart />}
                      onClick={handlePurchaseDialogOpen}
                      fullWidth
                    >
                      Purchase Full Content
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                      Includes perpetual license with resale rights
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Chip 
                      label="OWNED"
                      color="success"
                      variant="outlined"
                      icon={<VerifiedUser />}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Full access enabled
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>
        )}
      </Container>
      
      {/* Purchase Dialog */}
      <Dialog
        open={purchaseDialogOpen}
        onClose={handlePurchaseDialogClose}
      >
        <DialogTitle>Purchase Content</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Would you like to purchase the full content license for "{content.title}"?
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              License Details:
            </Typography>
            <Typography variant="body2">
              • Perpetual access to the full content
            </Typography>
            <Typography variant="body2">
              • Ability to resell your license
            </Typography>
            <Typography variant="body2">
              • Ownership verified on the blockchain
            </Typography>
            <Typography variant="h6" sx={{ mt: 2 }}>
              Price: {content.price} MATIC
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePurchaseDialogClose}>Cancel</Button>
          <Button 
            onClick={handlePurchase}
            variant="contained" 
            color="primary"
            startIcon={<ShoppingCart />}
          >
            Go to Purchase Page
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
            You've reached the end of the preview for "{content.title}". Would you like to purchase the full content?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePreviewEndDialogClose}>Close</Button>
          <Button 
            onClick={handlePurchase}
            variant="contained" 
            color="primary"
            startIcon={<ShoppingCart />}
          >
            Purchase Full Content
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Import this at the top of the file
import { VerifiedUser } from '@mui/icons-material';

export default PlayerPage;