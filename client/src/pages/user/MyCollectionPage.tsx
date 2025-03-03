import React from 'react';
import { Container, Typography, Box, Paper, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const MyCollectionPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Collection
        </Typography>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="body1" paragraph>
            This page is under development. It will display the user's owned content and licenses.
          </Typography>
          <Button component={Link} to="/marketplace" variant="contained">
            Browse Marketplace
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default MyCollectionPage;