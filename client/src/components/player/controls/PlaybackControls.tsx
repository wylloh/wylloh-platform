import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';

interface PlaybackControlsProps {
  playing: boolean;
  onTogglePlay: () => void;
  touchOptimized?: boolean;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  playing,
  onTogglePlay,
  touchOptimized = false
}) => {
  const buttonSize = touchOptimized ? 'medium' : 'small';
  const iconSize = touchOptimized ? { fontSize: 28 } : { fontSize: 24 };

  const PlayButton = (
    <IconButton
      onClick={onTogglePlay}
      color="inherit"
      size={buttonSize}
      aria-label={playing ? 'Pause' : 'Play'}
      sx={{ color: 'white' }}
    >
      {playing ? <Pause sx={iconSize} /> : <PlayArrow sx={iconSize} />}
    </IconButton>
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {touchOptimized ? (
        PlayButton
      ) : (
        <Tooltip title={playing ? 'Pause' : 'Play'}>
          {PlayButton}
        </Tooltip>
      )}
    </Box>
  );
};

export default PlaybackControls; 