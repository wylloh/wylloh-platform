import React from 'react';
import { Box, IconButton, Slider } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';
import { usePlayerStore } from '../../state/playerStore';

interface PlaybackControlsProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Playback controls component for play/pause and seek functionality
 */
const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  className,
  style,
}) => {
  const {
    playing,
    currentTime,
    duration,
    togglePlay,
    setCurrentTime,
  } = usePlayerStore();

  // Handle seek change
  const handleSeek = (_event: Event, value: number | number[]) => {
    const seekTime = typeof value === 'number' ? value : value[0];
    setCurrentTime(seekTime);
  };

  return (
    <Box 
      className={className}
      sx={{ 
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        ...style
      }}
    >
      {/* Play/Pause Button */}
      <IconButton 
        color="inherit" 
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        size="small"
        sx={{ color: 'white', mr: 1 }}
      >
        {playing ? <Pause /> : <PlayArrow />}
      </IconButton>
      
      {/* Progress Slider */}
      <Slider
        value={currentTime}
        min={0}
        max={duration || 100}
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
  );
};

export default PlaybackControls; 