import React, { useRef, useState } from 'react';
import { Box, Typography, Paper, Container, Grid, Button, Stack, Slider } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, VolumeOff, Fullscreen } from '@mui/icons-material';

const SAMPLE_VIDEO_URL = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';

const PlayerTestPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Player state
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  
  // Event handlers
  const handlePlay = () => {
    setPlaying(true);
  };
  
  const handlePause = () => {
    setPlaying(false);
  };
  
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };
  
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
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
  
  const handleSeek = (event: Event, newValue: number | number[]) => {
    const time = newValue as number;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };
  
  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const vol = newValue as number;
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
      
      if (vol > 0 && muted) {
        videoRef.current.muted = false;
        setMuted(false);
      }
    }
  };
  
  const handleToggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !muted;
      videoRef.current.muted = newMutedState;
      setMuted(newMutedState);
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
  
  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Video Player Test</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper 
            ref={containerRef}
            sx={{ 
              p: 0, 
              bgcolor: '#000',
              height: '50vh',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ maxWidth: '100%', mb: 3 }}>
              <Typography variant="h6" gutterBottom>Video Player Test</Typography>
              <video
                ref={videoRef}
                src={SAMPLE_VIDEO_URL}
                autoPlay={false}
                loop={false}
                muted={muted}
                controls
                style={{ width: '100%', maxHeight: '400px' }}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
              />
            </Box>
            
            {/* Simple playback controls */}
            <Box 
              sx={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                p: 1
              }}
            >
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button onClick={handleTogglePlay} size="small">
                    {playing ? <Pause /> : <PlayArrow />}
                  </Button>
                  
                  <Typography variant="body2" sx={{ color: 'white', minWidth: 60 }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </Typography>
                  
                  <Slider
                    size="small"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    sx={{ mx: 2, color: 'white' }}
                  />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
                    <Button onClick={handleToggleMute} size="small">
                      {muted ? <VolumeOff /> : <VolumeUp />}
                    </Button>
                    
                    <Slider
                      size="small"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={handleVolumeChange}
                      sx={{ mx: 1, color: 'white' }}
                    />
                  </Box>
                  
                  <Button onClick={handleToggleFullscreen} size="small">
                    <Fullscreen />
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Player State:</Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                <strong>Playing:</strong> {playing ? 'Yes' : 'No'}
              </Typography>
              
              <Typography variant="body1">
                <strong>Current Time:</strong> {formatTime(currentTime)}
              </Typography>
              
              <Typography variant="body1">
                <strong>Duration:</strong> {formatTime(duration)}
              </Typography>
              
              <Typography variant="body1">
                <strong>Volume:</strong> {(volume * 100).toFixed(0)}%
              </Typography>
              
              <Typography variant="body1">
                <strong>Muted:</strong> {muted ? 'Yes' : 'No'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PlayerTestPage; 