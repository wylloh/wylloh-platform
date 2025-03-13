import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography, Chip } from '@mui/material';
import { ArrowBack, Warning } from '@mui/icons-material';
import VideoPlayer from './VideoPlayer';
import PlaybackControls from './controls/PlaybackControls';
import VolumeControls from './controls/VolumeControls';
import DisplayControls from './controls/DisplayControls';
import TimeDisplay from './controls/TimeDisplay';
import { usePlatform } from '../../contexts/PlatformContext';

interface ContentMetadata {
  title: string;
  creator: string;
  description: string;
  duration: string;
}

interface PlayerContainerProps {
  src: string;
  poster?: string;
  contentMetadata: ContentMetadata;
  previewMode?: boolean;
  isPlatformSeedOne?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  onPreviewEnded?: () => void;
  onBack?: () => void;
}

const PlayerContainer: React.FC<PlayerContainerProps> = ({
  src,
  poster,
  contentMetadata,
  previewMode = false,
  isPlatformSeedOne = false,
  autoPlay = false,
  loop = false,
  muted = false,
  onPreviewEnded,
  onBack
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { isTouchDevice } = usePlatform();
  
  // Handle preview timeout (typically 2 minutes)
  useEffect(() => {
    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
        
        // If in preview mode and reached 2 minutes, trigger preview ended
        if (previewMode && videoRef.current.currentTime >= 120 && onPreviewEnded) {
          videoRef.current.pause();
          setPlaying(false);
          onPreviewEnded();
        }
      }
    };
    
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
    }
    
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, [previewMode, onPreviewEnded]);
  
  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Handle show/hide controls
  useEffect(() => {
    const hideControlsTimer = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      if (!isPlatformSeedOne || !isTouchDevice) {
        controlsTimeoutRef.current = setTimeout(() => {
          if (playing && !isBuffering) {
            setShowControls(false);
          }
        }, 3000);
      }
    };
    
    const handleMouseMove = () => {
      setShowControls(true);
      hideControlsTimer();
    };
    
    const playerElement = containerRef.current;
    if (playerElement) {
      playerElement.addEventListener('mousemove', handleMouseMove);
      playerElement.addEventListener('touchstart', handleMouseMove);
    }
    
    // Always show controls when paused or buffering
    if (!playing || isBuffering) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      hideControlsTimer();
    }
    
    return () => {
      if (playerElement) {
        playerElement.removeEventListener('mousemove', handleMouseMove);
        playerElement.removeEventListener('touchstart', handleMouseMove);
      }
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [playing, isBuffering, isPlatformSeedOne, isTouchDevice]);
  
  // Video event handlers
  const handlePlay = () => {
    setPlaying(true);
  };
  
  const handlePause = () => {
    setPlaying(false);
  };
  
  const handleEnded = () => {
    setPlaying(false);
    
    if (previewMode && onPreviewEnded) {
      onPreviewEnded();
    }
  };
  
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };
  
  const handleVolumeChange = () => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  };
  
  const handleBufferStart = () => {
    setIsBuffering(true);
  };
  
  const handleBufferEnd = () => {
    setIsBuffering(false);
  };
  
  // Control handlers
  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };
  
  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };
  
  const handleVolumeAdjust = (value: number) => {
    if (videoRef.current) {
      videoRef.current.volume = value;
      setVolume(value);
      
      if (value > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      } else if (value === 0 && !isMuted) {
        videoRef.current.muted = true;
        setIsMuted(true);
      }
    }
  };
  
  const handleToggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };
  
  const handleToggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };
  
  const handleToggleSubtitles = () => {
    setSubtitlesEnabled(!subtitlesEnabled);
  };
  
  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };
  
  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        bgcolor: 'black',
        aspectRatio: isPlatformSeedOne ? undefined : '16/9',
        height: isPlatformSeedOne ? '100vh' : undefined,
        cursor: showControls ? 'auto' : 'none',
        overflow: 'hidden'
      }}
      onClick={handleTogglePlay}
    >
      {/* Back button for web (non-fullscreen) */}
      {!isPlatformSeedOne && !isFullscreen && onBack && (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 20,
            color: 'white',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
        >
          <ArrowBack />
        </IconButton>
      )}
      
      {/* Preview badge */}
      {previewMode && (
        <Chip
          label="PREVIEW"
          color="primary"
          size="small"
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 20,
            bgcolor: 'rgba(25, 118, 210, 0.8)',
          }}
        />
      )}
      
      {/* Video Player */}
      <VideoPlayer
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        onVolumeChange={handleVolumeChange}
        onWaiting={handleBufferStart}
        onPlaying={handleBufferEnd}
        subtitlesEnabled={subtitlesEnabled}
      />
      
      {/* Preview message overlay */}
      {previewMode && showControls && (
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
            zIndex: 15,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Warning sx={{ color: 'warning.main', mr: 1 }} />
            <Typography variant="body2">
              Preview Mode: 2-minute preview
            </Typography>
          </Box>
        </Box>
      )}
      
      {/* Controls overlay */}
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
            zIndex: 15,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Time slider */}
          <TimeDisplay
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            touchOptimized={isTouchDevice || isPlatformSeedOne}
          />
          
          {/* Control buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PlaybackControls
                playing={playing}
                onTogglePlay={handleTogglePlay}
                touchOptimized={isTouchDevice || isPlatformSeedOne}
              />
              
              <VolumeControls
                volume={volume}
                muted={isMuted}
                onVolumeChange={handleVolumeAdjust}
                onToggleMute={handleToggleMute}
                touchOptimized={isTouchDevice || isPlatformSeedOne}
              />
            </Box>
            
            <Box>
              <DisplayControls
                fullscreen={isFullscreen}
                subtitlesEnabled={subtitlesEnabled}
                playbackRate={playbackRate}
                onToggleFullscreen={handleToggleFullscreen}
                onToggleSubtitles={handleToggleSubtitles}
                onPlaybackRateChange={handlePlaybackRateChange}
                touchOptimized={isTouchDevice || isPlatformSeedOne}
              />
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Content title - for Seed One kiosk mode */}
      {isPlatformSeedOne && showControls && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0, 
            right: 0,
            p: 2,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10,
          }}
        >
          <Typography variant="h5" sx={{ color: 'white' }}>
            {contentMetadata.title}
          </Typography>
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {contentMetadata.creator}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PlayerContainer; 