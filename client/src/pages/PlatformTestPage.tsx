import React from 'react';
import { Box, Typography, Paper, Container, Grid } from '@mui/material';
import { usePlatform } from '../contexts/PlatformContext';

const PlatformTestPage: React.FC = () => {
  const { isSeedOne, isTouchDevice, isKioskMode } = usePlatform();

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Platform Detection Test</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Platform Detection Results:</Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                <strong>isSeedOne:</strong> {isSeedOne ? 'Yes' : 'No'}
              </Typography>
              
              <Typography variant="body1">
                <strong>isTouchDevice:</strong> {isTouchDevice ? 'Yes' : 'No'}
              </Typography>
              
              <Typography variant="body1">
                <strong>isKioskMode:</strong> {isKioskMode ? 'Yes' : 'No'}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              To test different platforms:
            </Typography>
            
            <ul>
              <li>
                <Typography variant="body2">
                  Add <code>?platform=seedone</code> to the URL to simulate Seed One
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Enable mobile device emulation in developer tools to test touch detection
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Use full screen mode to test kiosk mode detection
                </Typography>
              </li>
            </ul>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PlatformTestPage; 