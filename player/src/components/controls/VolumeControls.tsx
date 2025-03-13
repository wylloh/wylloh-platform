import React from 'react';
import { Box, IconButton, Slider } from '@mui/material';
import { VolumeUp, VolumeOff } from '@mui/icons-material';
import { usePlayerStore } from '../../state/playerStore';

interface VolumeControlsProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Volume controls component for volume adjustment and mute toggle
 */
const VolumeControls: React.FC<VolumeControlsProps> = ({
  className,
  style,
}) => {
  const {
    volume,
    muted,
    setVolume,
    toggleMute,
  } = usePlayerStore();

  // Handle volume change
  const handleVolumeChange = (_event: Event, value: number | number[]) => {
    const newVolume = typeof value === 'number' ? value : value[0];
    setVolume(newVolume);
  };

  return (
    <Box 
      className={className}
      sx={{ 
        display: 'flex',
        alignItems: 'center',
        width: 120,
        ml: 1,
        mr: 2,
        ...style
      }}
    >
      {/* Mute/Unmute Button */}
      <IconButton 
        color="inherit" 
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
        size="small"
        sx={{ color: 'white' }}
      >
        {muted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
      </IconButton>
      
      {/* Volume Slider */}
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
  );
};

export default VolumeControls; 