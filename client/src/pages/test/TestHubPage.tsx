import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  ListItemIcon,
  Paper,
  Divider
} from '@mui/material';
import { 
  DevicesOther, 
  VideoLibrary, 
  Fullscreen, 
  Speed,
  TouchApp,
  BugReport
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const TestHubPage: React.FC = () => {
  const testRoutes = [
    {
      name: 'Platform Detection Test',
      description: 'Test isSeedOne, isTouchDevice, and isKioskMode detection',
      path: '/platform-test',
      icon: <DevicesOther />
    },
    {
      name: 'Basic Player Test',
      description: 'Test core video player functionality and controls',
      path: '/player-test',
      icon: <VideoLibrary />
    },
    {
      name: 'Kiosk Mode Simulator',
      description: 'Simulate Seed One kiosk mode experience',
      path: '/kiosk-simulator',
      icon: <Fullscreen />
    },
    {
      name: 'Full Player Demo',
      description: 'Test the complete player with content ID 1',
      path: '/player/1',
      icon: <Speed />
    },
    {
      name: 'Touch-Optimized UI Test', 
      description: 'Test touch-optimized controls by adding ?platform=seedone&touch=true to any URL',
      path: '/player/1?platform=seedone&touch=true',
      icon: <TouchApp />
    }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Wylloh Player Test Hub
      </Typography>
      
      <Typography variant="body1" paragraph>
        This hub provides access to various test pages to validate the functionality
        of the Wylloh player components and platform detection.
      </Typography>
      
      <Paper sx={{ mt: 3 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <BugReport />
            </ListItemIcon>
            <ListItemText 
              primary="Test Pages" 
              secondary="Click on any test to begin"
            />
          </ListItem>
          
          <Divider />
          
          {testRoutes.map((route, index) => (
            <React.Fragment key={route.path}>
              <ListItem disablePadding>
                <ListItemButton 
                  component={Link} 
                  to={route.path}
                >
                  <ListItemIcon>
                    {route.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={route.name} 
                    secondary={route.description}
                  />
                </ListItemButton>
              </ListItem>
              {index < testRoutes.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Testing Instructions
        </Typography>
        
        <Typography variant="body1" paragraph>
          <strong>Platform Detection Test:</strong> Shows detected platform values.
          Add URL parameters or use device emulation to test different scenarios.
        </Typography>
        
        <Typography variant="body1" paragraph>
          <strong>Basic Player Test:</strong> Tests the core video player and controls in isolation.
          Good for testing basic playback functionality.
        </Typography>
        
        <Typography variant="body1" paragraph>
          <strong>Kiosk Mode Simulator:</strong> Provides a fullscreen experience that simulates
          the Seed One device. Great for testing the UI in kiosk mode.
        </Typography>
        
        <Typography variant="body1" paragraph>
          <strong>Full Player Demo:</strong> Tests the complete player implementation with all features.
          Uses mock content with ID 1.
        </Typography>
        
        <Typography variant="body1" paragraph>
          <strong>Touch-Optimized UI Test:</strong> Tests how the player behaves with touch controls.
          Forces touch mode regardless of your actual device.
        </Typography>
      </Box>
    </Container>
  );
};

export default TestHubPage; 