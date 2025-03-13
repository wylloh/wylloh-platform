import React, { useState } from 'react';
import { Box, IconButton, Slider, Tooltip, Popover } from '@mui/material';
import { VolumeUp, VolumeDown, VolumeMute, VolumeOff } from '@mui/icons-material';

interface VolumeControlsProps {
  volume: number;
  muted: boolean;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
  touchOptimized?: boolean;
}

const VolumeControls: React.FC<VolumeControlsProps> = ({
  volume,
  muted,
  onVolumeChange,
  onToggleMute,
  touchOptimized = false
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (touchOptimized) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // Determine which volume icon to show
  const getVolumeIcon = () => {
    if (muted || volume === 0) return <VolumeOff />;
    if (volume < 0.3) return <VolumeMute />;
    if (volume < 0.7) return <VolumeDown />;
    return <VolumeUp />;
  };

  const volumeSlider = (
    <Slider
      value={muted ? 0 : volume}
      min={0}
      max={1}
      step={0.01}
      onChange={(_, newValue) => onVolumeChange(newValue as number)}
      aria-label="Volume"
      sx={{
        color: 'white',
        width: 100,
        '& .MuiSlider-track': {
          transition: 'none',
        },
        '& .MuiSlider-thumb': {
          width: 12,
          height: 12,
          '&:hover, &.Mui-focusVisible': {
            boxShadow: '0px 0px 0px 8px rgba(255, 255, 255, 0.16)',
          },
        },
      }}
    />
  );

  const VolumeButton = (
    <IconButton
      onClick={(e) => {
        handleClick(e);
        if (!touchOptimized) {
          onToggleMute();
        }
      }}
      color="inherit"
      size={touchOptimized ? "medium" : "small"}
      aria-label="Volume"
      sx={{ color: 'white' }}
    >
      {getVolumeIcon()}
    </IconButton>
  );

  // For touch devices, show a popover with the volume slider
  if (touchOptimized) {
    return (
      <>
        {VolumeButton}
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          PaperProps={{
            sx: {
              backgroundColor: 'rgba(30, 30, 30, 0.9)',
              borderRadius: 2,
              p: 2,
            }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40 }}>
            <IconButton
              onClick={onToggleMute}
              color="inherit"
              size="small"
              sx={{ color: 'white', mb: 1 }}
            >
              {getVolumeIcon()}
            </IconButton>
            <Box sx={{ height: 100 }}>
              <Slider
                value={muted ? 0 : volume}
                min={0}
                max={1}
                step={0.01}
                onChange={(_, newValue) => onVolumeChange(newValue as number)}
                orientation="vertical"
                aria-label="Volume"
                sx={{
                  color: 'white',
                  '& .MuiSlider-track': {
                    transition: 'none',
                  },
                  '& .MuiSlider-thumb': {
                    width: 12,
                    height: 12,
                  },
                }}
              />
            </Box>
          </Box>
        </Popover>
      </>
    );
  }

  // For desktop, show the slider inline
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
      <Tooltip title={muted ? "Unmute" : "Mute"}>
        {VolumeButton}
      </Tooltip>
      <Box sx={{ ml: 1 }}>
        {volumeSlider}
      </Box>
    </Box>
  );
};

export default VolumeControls; 