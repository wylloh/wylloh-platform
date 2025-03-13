import React, { useState } from 'react';
import { 
  Box, 
  IconButton, 
  Tooltip, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Typography
} from '@mui/material';
import { 
  Fullscreen, 
  FullscreenExit, 
  Settings, 
  Subtitles, 
  SubtitlesOff,
  Speed
} from '@mui/icons-material';

interface DisplayControlsProps {
  fullscreen: boolean;
  subtitlesEnabled: boolean;
  playbackRate: number;
  onToggleFullscreen: () => void;
  onToggleSubtitles: () => void;
  onPlaybackRateChange: (rate: number) => void;
  touchOptimized?: boolean;
}

const DisplayControls: React.FC<DisplayControlsProps> = ({
  fullscreen,
  subtitlesEnabled,
  playbackRate,
  onToggleFullscreen,
  onToggleSubtitles,
  onPlaybackRateChange,
  touchOptimized = false
}) => {
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [speedAnchorEl, setSpeedAnchorEl] = useState<null | HTMLElement>(null);
  
  const settingsOpen = Boolean(settingsAnchorEl);
  const speedOpen = Boolean(speedAnchorEl);
  
  const buttonSize = touchOptimized ? 'medium' : 'small';
  
  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };
  
  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };
  
  const handleSpeedClick = () => {
    setSpeedAnchorEl(settingsAnchorEl);
    setSettingsAnchorEl(null);
  };
  
  const handleSpeedClose = () => {
    setSpeedAnchorEl(null);
  };
  
  const handlePlaybackRateSelect = (rate: number) => {
    onPlaybackRateChange(rate);
    handleSpeedClose();
  };
  
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {/* Subtitles button */}
      {touchOptimized ? (
        <IconButton
          onClick={onToggleSubtitles}
          color="inherit"
          size={buttonSize}
          sx={{ color: 'white' }}
        >
          {subtitlesEnabled ? <Subtitles /> : <SubtitlesOff />}
        </IconButton>
      ) : (
        <Tooltip title={subtitlesEnabled ? "Disable Subtitles" : "Enable Subtitles"}>
          <IconButton
            onClick={onToggleSubtitles}
            color="inherit"
            size={buttonSize}
            sx={{ color: 'white' }}
          >
            {subtitlesEnabled ? <Subtitles /> : <SubtitlesOff />}
          </IconButton>
        </Tooltip>
      )}
      
      {/* Settings button */}
      {touchOptimized ? (
        <IconButton
          onClick={handleSettingsClick}
          color="inherit"
          size={buttonSize}
          sx={{ color: 'white', mx: 1 }}
        >
          <Settings />
        </IconButton>
      ) : (
        <Tooltip title="Settings">
          <IconButton
            onClick={handleSettingsClick}
            color="inherit"
            size={buttonSize}
            sx={{ color: 'white', mx: 1 }}
          >
            <Settings />
          </IconButton>
        </Tooltip>
      )}
      
      {/* Fullscreen button */}
      {touchOptimized ? (
        <IconButton
          onClick={onToggleFullscreen}
          color="inherit"
          size={buttonSize}
          sx={{ color: 'white' }}
        >
          {fullscreen ? <FullscreenExit /> : <Fullscreen />}
        </IconButton>
      ) : (
        <Tooltip title={fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
          <IconButton
            onClick={onToggleFullscreen}
            color="inherit"
            size={buttonSize}
            sx={{ color: 'white' }}
          >
            {fullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Tooltip>
      )}
      
      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchorEl}
        open={settingsOpen}
        onClose={handleSettingsClose}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(30, 30, 30, 0.9)',
            color: 'white',
            borderRadius: 2,
          }
        }}
      >
        <MenuItem onClick={onToggleSubtitles}>
          <ListItemIcon sx={{ color: 'white' }}>
            {subtitlesEnabled ? <Subtitles /> : <SubtitlesOff />}
          </ListItemIcon>
          <ListItemText>
            {subtitlesEnabled ? "Disable Subtitles" : "Enable Subtitles"}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleSpeedClick}>
          <ListItemIcon sx={{ color: 'white' }}>
            <Speed />
          </ListItemIcon>
          <ListItemText>
            Playback Speed ({playbackRate}x)
          </ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Speed Menu */}
      <Menu
        anchorEl={speedAnchorEl}
        open={speedOpen}
        onClose={handleSpeedClose}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(30, 30, 30, 0.9)',
            color: 'white',
            borderRadius: 2,
          }
        }}
      >
        {speeds.map(speed => (
          <MenuItem 
            key={speed} 
            onClick={() => handlePlaybackRateSelect(speed)}
            selected={speed === playbackRate}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }
            }}
          >
            <Typography variant="body2">
              {speed}x
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default DisplayControls; 