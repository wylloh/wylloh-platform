import React from 'react';
import { Box, Typography, Slider } from '@mui/material';

interface TimeDisplayProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  touchOptimized?: boolean;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({
  currentTime,
  duration,
  onSeek,
  touchOptimized = false
}) => {
  // Format time in MM:SS format
  const formatTime = (timeInSeconds: number): string => {
    if (isNaN(timeInSeconds)) return '0:00';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handleChange = (_: Event, newValue: number | number[]) => {
    onSeek(newValue as number);
  };
  
  return (
    <Box sx={{ width: '100%', px: 2, mb: touchOptimized ? 1.5 : 0.5 }}>
      <Slider
        value={currentTime}
        min={0}
        max={duration || 100}
        onChange={handleChange}
        aria-label="Time"
        size={touchOptimized ? "medium" : "small"}
        sx={{
          color: 'primary.main',
          height: touchOptimized ? 4 : 3,
          '& .MuiSlider-thumb': {
            width: touchOptimized ? 16 : 12,
            height: touchOptimized ? 16 : 12,
            transition: '0.1s cubic-bezier(.47,1.64,.41,.8)',
            '&:before': {
              boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
            },
            '&:hover, &.Mui-focusVisible': {
              boxShadow: `0px 0px 0px 8px rgba(255, 255, 255, 0.16)`,
            },
          },
          '& .MuiSlider-rail': {
            opacity: 0.4,
          },
        }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: 'white' }}>
          {formatTime(currentTime)}
        </Typography>
        <Typography variant="caption" sx={{ color: 'white' }}>
          {formatTime(duration)}
        </Typography>
      </Box>
    </Box>
  );
};

export default TimeDisplay; 