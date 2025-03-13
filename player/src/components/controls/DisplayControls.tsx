import React, { useRef } from 'react';
import { Box, IconButton } from '@mui/material';
import { 
  Fullscreen, 
  FullscreenExit, 
  Subtitles, 
  SubtitlesOff,
  Speed
} from '@mui/icons-material';
import { usePlayerStore } from '../../state/playerStore';

interface DisplayControlsProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Display controls component for fullscreen, subtitles, and playback speed
 */
const DisplayControls: React.FC<DisplayControlsProps> = ({
  className,
  style,
}) => {
  const {
    fullscreen,
    subtitlesEnabled,
    playbackRate,
    setFullscreen,
    toggleSubtitles,
    setPlaybackRate,
  } = usePlayerStore();
  
  // Get parent ref for fullscreen
  const playerRef = useRef<HTMLDivElement | null>(null);
  
  // Handle fullscreen toggle
  const handleToggleFullscreen = () => {
    // Get root player element from parent or document
    const playerElement = playerRef.current?.parentElement || document.querySelector('.player-container');
    
    if (!playerElement) {
      console.error('Could not find player element for fullscreen toggle');
      return;
    }
    
    if (!document.fullscreenElement) {
      // Enter fullscreen
      playerElement.requestFullscreen().then(() => {
        setFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      // Exit fullscreen
      document.exitFullscreen().then(() => {
        setFullscreen(false);
      }).catch(err => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };
  
  // Handle playback speed change
  const handlePlaybackRateChange = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  };

  return (
    <Box 
      ref={playerRef}
      className={className}
      sx={{ 
        display: 'flex',
        alignItems: 'center',
        ...style
      }}
    >
      {/* Playback Speed */}
      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
        <IconButton 
          color="inherit" 
          size="small"
          onClick={handlePlaybackRateChange}
          sx={{ color: 'white' }}
        >
          <Speed fontSize="small" />
        </IconButton>
        <Box component="span" sx={{ ml: 0.5, color: 'white', fontSize: '0.75rem' }}>
          {playbackRate}x
        </Box>
      </Box>
      
      {/* Subtitles Toggle */}
      <IconButton 
        color="inherit" 
        onClick={toggleSubtitles} 
        size="small"
        sx={{ color: 'white', mr: 1 }}
      >
        {subtitlesEnabled ? <Subtitles /> : <SubtitlesOff />}
      </IconButton>
      
      {/* Fullscreen Toggle */}
      <IconButton 
        color="inherit" 
        onClick={handleToggleFullscreen}
        size="small"
        sx={{ color: 'white' }}
      >
        {fullscreen ? <FullscreenExit /> : <Fullscreen />}
      </IconButton>
    </Box>
  );
};

export default DisplayControls; 