import React from 'react';
import { Box, Typography } from '@mui/material';
import { usePlayerStore } from '../../state/playerStore';
import { formatTime } from '../../utils/formatting';

interface TimeDisplayProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Time display component to show current time and duration
 */
const TimeDisplay: React.FC<TimeDisplayProps> = ({
  className,
  style,
}) => {
  const { currentTime, duration } = usePlayerStore();

  return (
    <Box 
      className={className}
      sx={{ 
        display: 'flex',
        alignItems: 'center',
        ml: 2,
        ...style
      }}
    >
      <Typography variant="body2" sx={{ color: 'white' }}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </Typography>
    </Box>
  );
};

export default TimeDisplay; 