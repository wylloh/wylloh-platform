import React from 'react';
import { Button, Typography, Box, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import ContentDetailsPage from './ContentDetailsPage';

const TestContentDetails: React.FC = () => {
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Content Details Page Test
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Button component={Link} to="/marketplace/1" variant="contained" color="primary">
            View Content Details Page via Router
          </Button>
        </Box>
        
        <Typography variant="h5" sx={{ my: 2 }}>
          Direct Component Render Test:
        </Typography>
        
        <Box sx={{ border: '1px solid #ccc', p: 2, borderRadius: 1 }}>
          <ContentDetailsPage />
        </Box>
      </Box>
    </Container>
  );
};

export default TestContentDetails; 