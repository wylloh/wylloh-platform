import React, { useRef, useEffect } from 'react';
import { Box, CircularProgress, Chip } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import VideoPlayer from './VideoPlayer';
import { usePlayerStore } from '../../state/playerStore';

// We'll implement these control components in the next steps
import PlaybackControls from '../controls/PlaybackControls';
import VolumeControls from '../controls/VolumeControls';
import DisplayControls from '../controls/DisplayControls';
import TimeDisplay from '../controls/TimeDisplay';

export interface PlayerContainerProps {
  contentId?: string;
  src?: string;
  posterUrl?: string;
  isPreview?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Container component for the video player and all its controls
 */
const PlayerContainer: React.FC<PlayerContainerProps> = ({
  contentId,
  src,
  posterUrl,
  isPreview = false,
  className,
  style,
}) => {
  // References
  const playerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Player state
  const {
    playing,
    buffering,
    showControls,
    fullscreen,
    setShowControls,
    setContentId,
    setIsPreview,
    togglePlay,
  } = usePlayerStore();
  
  // Set content information when component mounts or contentId changes
  useEffect(() => {
    if (contentId) {
      setContentId(contentId);
    }
    setIsPreview(isPreview);
    
    // Clean up when component unmounts
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.error('Error exiting fullscreen:', err);
        });
      }
    };
  }, [contentId, isPreview, setContentId, setIsPreview]);
  
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
  }, [playing, setShowControls]);
  
  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      // This will be handled by the DisplayControls component
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  return (
    <Box 
      ref={playerRef}
      className={className}
      sx={{ 
        position: 'relative', 
        width: '100%',
        bgcolor: 'black',
        aspectRatio: '16/9',
        cursor: showControls ? 'auto' : 'none',
        overflow: 'hidden',
        ...style,
      }}
      onClick={togglePlay}
    >
      {/* Video Player */}
      <VideoPlayer
        src={src}
        poster={posterUrl}
      />
      
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
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '50%',
            p: 2,
            zIndex: 4,
            cursor: 'pointer',
          }}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
        >
          <PlayArrow sx={{ fontSize: 60 }} />
        </Box>
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
          <PlaybackControls />
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            px: 2 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <VolumeControls />
              <TimeDisplay />
            </Box>
            
            <DisplayControls />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PlayerContainer; 