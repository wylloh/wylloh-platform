import React from 'react';
import { Container, Typography, Box, Paper, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Profile
        </Typography>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="body1" paragraph>
            This page is under development. It will contain user profile settings and account management.
          </Typography>
          <Button component={Link} to="/" variant="contained">
            Return to Home
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default ProfilePage;