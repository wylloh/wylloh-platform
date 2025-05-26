import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PlayerContainer from '../../../components/player/PlayerContainer';

const SAMPLE_VIDEO = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';

const KioskSimulatorPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Set up kiosk mode parameters
  useEffect(() => {
    // Add seed one parameter to URL if not already there
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('platform')) {
      // Update URL without reloading the page
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('platform', 'seedone');
      window.history.pushState({}, '', newUrl);
      
      // Force reload local storage setting
      localStorage.setItem('wylloh-platform', 'seedone');
    }
    
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => {
      clearTimeout(timer);
      // Clean up when leaving the simulator
      localStorage.removeItem('wylloh-platform');
    };
  }, []);
  
  // Request fullscreen on button click
  const enterFullscreen = () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
    } catch (err) {
      setError('Fullscreen request failed. Try using a different browser.');
      console.error('Fullscreen request failed:', err);
    }
  };
  
  if (loading) {
    return (
      <Container 
        maxWidth={false} 
        disableGutters 
        sx={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          backgroundColor: '#000'
        }}
      >
        <CircularProgress size={60} sx={{ color: '#fff' }} />
        <Typography variant="h6" sx={{ mt: 2, color: '#fff' }}>
          Initializing Seed One Kiosk Mode...
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container 
      maxWidth={false} 
      disableGutters 
      sx={{ 
        height: '100vh', 
        backgroundColor: '#000',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {!document.fullscreenElement && (
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 10, 
          bgcolor: 'rgba(0,0,0,0.7)', 
          p: 2, 
          textAlign: 'center'
        }}>
          <Typography variant="body1" sx={{ color: '#fff', mb: 2 }}>
            For the full Seed One experience, please enter fullscreen mode:
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={enterFullscreen}
          >
            Enter Fullscreen
          </Button>
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>
      )}
      
      <PlayerContainer
        src={SAMPLE_VIDEO}
        contentMetadata={{
          title: "Big Buck Bunny",
          creator: "Blender Foundation",
          description: "A short animated film produced by the Blender Foundation.",
          duration: "10 minutes"
        }}
        isPlatformSeedOne={true}
        previewMode={false}
        autoPlay={true}
      />
      
      <Box sx={{ 
        position: 'absolute', 
        bottom: 20, 
        right: 20, 
        zIndex: 5,
      }}>
        <Button 
          variant="text" 
          color="primary" 
          onClick={() => navigate('/')}
          sx={{ color: 'rgba(255,255,255,0.7)' }}
        >
          Exit Simulator
        </Button>
      </Box>
    </Container>
  );
};

export default KioskSimulatorPage; 