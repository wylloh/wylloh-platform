import React from 'react';
import { Container, Typography, Paper, Box, Divider, Grid } from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import NodeContribution from '../components/network/NodeContribution';

const NetworkPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <CloudIcon sx={{ mr: 1, fontSize: 32 }} />
          Wylloh Network
        </Typography>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Welcome to the Wylloh Distributed Network
          </Typography>
          <Typography variant="body1" paragraph>
            Wylloh uses a distributed content delivery network powered by its users to ensure
            fast, reliable, and censorship-resistant access to content. By contributing your
            device's resources to the network, you help strengthen the ecosystem and earn rewards.
          </Typography>
          <Typography variant="body1" paragraph>
            The more users contribute to the network, the stronger and more efficient it becomes,
            reducing central infrastructure costs and creating a truly decentralized platform.
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Peer-to-Peer Delivery
                </Typography>
                <Typography variant="body2">
                  Content is delivered directly between users, reducing bandwidth costs
                  and improving delivery speeds.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Earn Rewards
                </Typography>
                <Typography variant="body2">
                  Users who contribute resources to the network earn Wylloh token rewards
                  proportional to their contribution.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Content Security
                </Typography>
                <Typography variant="body2">
                  All content is encrypted, ensuring that only authorized users can
                  access it, even when cached on other devices.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Divider sx={{ my: 4 }} />
        
        {/* Node Contribution Component */}
        <NodeContribution />
      </Box>
    </Container>
  );
};

export default NetworkPage; 