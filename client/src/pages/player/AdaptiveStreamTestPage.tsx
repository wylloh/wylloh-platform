import React, { useState } from 'react';
import { Container, Typography, Paper, Box, Grid, Select, MenuItem, FormControl, InputLabel, Button, Chip } from '@mui/material';
import AdaptiveVideoPlayer, { VideoQuality } from '../../components/player/AdaptiveVideoPlayer';

// Sample content IDs for testing
const SAMPLE_CONTENTS = [
  {
    contentId: 'sample-bbb',
    contentCid: 'QmVLEz2SxoNiFnuyLpbXsH6SvjPTrHNMU88vCQZyhgBzgw',
    title: 'Big Buck Bunny',
    description: 'Open source animated film released in 2008'
  },
  {
    contentId: 'sample-jellyfish',
    contentCid: 'QmcQJ8LPWB6dP9UMcnM7TcqEJMgE1ZyqfcizYDNqM3z5m3',
    title: 'Jellyfish',
    description: 'Underwater scene with Jellyfish in HD'
  },
  {
    contentId: 'sample-nature',
    contentCid: 'QmTBWcaUNvDX7NS3jxWKi5LEAWf1zYzwPqRMX44ZEVnSKJ',
    title: 'Nature Documentary',
    description: 'Beautiful nature scenes with wildlife'
  }
];

const AdaptiveStreamTestPage: React.FC = () => {
  const [selectedContent, setSelectedContent] = useState(SAMPLE_CONTENTS[0]);
  const [preferredQuality, setPreferredQuality] = useState<VideoQuality>(VideoQuality.AUTO);
  const [currentQuality, setCurrentQuality] = useState<VideoQuality>(VideoQuality.AUTO);
  const [autoPlay, setAutoPlay] = useState(false);
  const [streamStatsVisible, setStreamStatsVisible] = useState(false);
  const [statsData, setStatsData] = useState({
    bufferingEvents: 0,
    startTime: 0,
    qualitySwitches: 0,
    resolution: '',
    bitrate: 0
  });
  
  // Handle content selection change
  const handleContentChange = (contentId: string) => {
    const content = SAMPLE_CONTENTS.find(c => c.contentId === contentId);
    if (content) {
      setSelectedContent(content);
    }
  };
  
  // Handle quality change from player
  const handleQualityChange = (quality: VideoQuality) => {
    setCurrentQuality(quality);
    // Update stats
    setStatsData(prev => ({
      ...prev,
      qualitySwitches: prev.qualitySwitches + 1
    }));
  };
  
  // Handle buffer start event
  const handleBuffering = () => {
    setStatsData(prev => ({
      ...prev,
      bufferingEvents: prev.bufferingEvents + 1
    }));
  };
  
  // Reset stats
  const resetStats = () => {
    setStatsData({
      bufferingEvents: 0,
      startTime: 0,
      qualitySwitches: 0,
      resolution: '',
      bitrate: 0
    });
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Adaptive Streaming Test
        </Typography>
        <Typography variant="body1" paragraph>
          This page demonstrates adaptive bitrate streaming capabilities using HLS and DASH formats.
          The player automatically adjusts video quality based on network conditions but also allows manual selection.
        </Typography>
      </Paper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 0, position: 'relative', height: '500px' }}>
            <AdaptiveVideoPlayer
              contentId={selectedContent.contentId}
              contentCid={selectedContent.contentCid}
              autoPlay={autoPlay}
              isPublicContent={true}
              onQualityChange={handleQualityChange}
              height="100%"
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Content Selection
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Sample Content</InputLabel>
              <Select
                value={selectedContent.contentId}
                onChange={(e) => handleContentChange(e.target.value as string)}
                label="Sample Content"
              >
                {SAMPLE_CONTENTS.map((content) => (
                  <MenuItem key={content.contentId} value={content.contentId}>
                    {content.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Typography variant="body2" paragraph>
              {selectedContent.description}
            </Typography>
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <FormControl sx={{ width: '48%' }}>
                <InputLabel>Preferred Quality</InputLabel>
                <Select
                  value={preferredQuality}
                  onChange={(e) => setPreferredQuality(e.target.value as VideoQuality)}
                  label="Preferred Quality"
                >
                  <MenuItem value={VideoQuality.AUTO}>Auto</MenuItem>
                  <MenuItem value={VideoQuality.LOW}>Low (480p)</MenuItem>
                  <MenuItem value={VideoQuality.MEDIUM}>Medium (720p)</MenuItem>
                  <MenuItem value={VideoQuality.HIGH}>High (1080p)</MenuItem>
                  <MenuItem value={VideoQuality.ULTRA}>Ultra (4K)</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                color="primary"
                onClick={() => setAutoPlay(!autoPlay)}
              >
                {autoPlay ? 'Disable AutoPlay' : 'Enable AutoPlay'}
              </Button>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Streaming Statistics
              </Typography>
              
              <Button 
                size="small" 
                variant="outlined"
                onClick={() => setStreamStatsVisible(!streamStatsVisible)}
              >
                {streamStatsVisible ? 'Hide Details' : 'Show Details'}
              </Button>
            </Box>
            
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Current Quality: 
                <Chip 
                  label={
                    currentQuality === VideoQuality.AUTO ? 'Auto' :
                    currentQuality === VideoQuality.LOW ? '480p' :
                    currentQuality === VideoQuality.MEDIUM ? '720p' :
                    currentQuality === VideoQuality.HIGH ? '1080p' : '4K'
                  }
                  size="small"
                  color={
                    currentQuality === VideoQuality.AUTO ? 'default' :
                    currentQuality === VideoQuality.LOW ? 'default' :
                    currentQuality === VideoQuality.MEDIUM ? 'primary' :
                    currentQuality === VideoQuality.HIGH ? 'secondary' : 'error'
                  }
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>
            
            {streamStatsVisible && (
              <Box>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      Buffering Events: {statsData.bufferingEvents}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      Quality Switches: {statsData.qualitySwitches}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      Start Time: {statsData.startTime}ms
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      Resolution: {statsData.resolution || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      Bitrate: {statsData.bitrate > 0 ? `${Math.round(statsData.bitrate / 1000)} kbps` : 'Unknown'}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box mt={2} display="flex" justifyContent="center">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={resetStats}
                  >
                    Reset Statistics
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          About Adaptive Streaming
        </Typography>
        <Typography variant="body1" paragraph>
          Adaptive Bitrate Streaming automatically adjusts the quality of the video stream based on network conditions
          and device capabilities. This ensures optimal playback experience without buffering, even on varying
          network conditions.
        </Typography>
        <Typography variant="body1" paragraph>
          The implementation uses:
        </Typography>
        <ul>
          <li>
            <Typography variant="body1">
              <strong>HLS (HTTP Live Streaming)</strong> - Developed by Apple, works well across most devices
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>DASH (Dynamic Adaptive Streaming over HTTP)</strong> - Open standard alternative to HLS
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Progressive Enhancement</strong> - Falls back to direct MP4 streaming if adaptive formats are unavailable
            </Typography>
          </li>
        </ul>
      </Paper>
    </Container>
  );
};

export default AdaptiveStreamTestPage; 