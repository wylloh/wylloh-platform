import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  Movie as MovieIcon,
  Upload as UploadIcon,
  Security as SecurityIcon,
  AccountBalanceWallet as WalletIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

const ProVerificationPage: React.FC = () => {
  const { connect, active } = useWallet();
  const [connecting, setConnecting] = useState(false);

  const handleConnectWallet = async () => {
    try {
      setConnecting(true);
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  const verificationSteps = [
    {
      step: 1,
      title: "Connect Your Wallet",
      description: "Your wallet address serves as your unique identity on the blockchain",
      icon: <WalletIcon />
    },
    {
      step: 2,
      title: "Submit Pro Application",
      description: "Complete verification with your filmmaking credentials (email optional)",
      icon: <UploadIcon />
    },
    {
      step: 3,
      title: "Verification Review",
      description: "Our team reviews your application and credentials",
      icon: <SecurityIcon />
    },
    {
      step: 4,
      title: "Pro Access Granted",
      description: "Upload feature films and series for direct distribution",
      icon: <VerifiedIcon />
    }
  ];

  const proFeatures = [
    "Upload feature films and series content",
    "Direct distribution to audiences and exhibitors",
    "Advanced analytics and revenue tracking",
    "Customizable licensing terms",
    "Priority platform support",
    "Early access to new features"
  ];

  const requirements = [
    "Professional filmmaking experience or credentials",
    "Ownership or rights to content you plan to upload",
    "Valid identification for verification",
    "Connected wallet address",
    "Email address (optional, for important communications only)"
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          Pro Verification
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Unlock professional filmmaking tools and direct distribution
        </Typography>
      </Box>

      {/* Overview */}
      <Paper elevation={0} sx={{ p: 4, mb: 6, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Professional Access for Filmmakers
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          Pro verification enables professional filmmakers to upload feature films and series content 
          for direct distribution to audiences and exhibitors. This verification process ensures content 
          quality and protects the platform's reputation while giving creators powerful tools for 
          monetization and distribution.
        </Typography>
        
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Getting Started:</strong> Connect your wallet to get started. Email registration 
            is completely optional and only used for important communications about your Pro status.
          </Typography>
        </Alert>
      </Paper>

      {/* Verification Process */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Verification Process
        </Typography>
        
        <Grid container spacing={3}>
          {verificationSteps.map((step, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                elevation={0} 
                sx={{ 
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  textAlign: 'center',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {step.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Step {step.step}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Pro Features & Requirements */}
      <Grid container spacing={6} sx={{ mb: 6 }}>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Pro Features
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              What you get with Pro verification:
            </Typography>
            <List dense>
              {proFeatures.map((feature, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckIcon sx={{ fontSize: 20, color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={feature}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Requirements
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              What you need for Pro verification:
            </Typography>
            <List dense>
              {requirements.map((requirement, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <InfoIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={requirement}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Call to Action */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 6, 
          textAlign: 'center',
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05), rgba(66, 165, 245, 0.05))'
        }}
      >
        <MovieIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Ready to Get Started?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: '600px', mx: 'auto', lineHeight: 1.7 }}>
          Join the platform where professional filmmakers maintain control and reach audiences directly. 
          Connect your wallet to get started - no email required unless you want updates about your Pro status.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleConnectWallet}
            disabled={connecting}
            sx={{ mr: 2, mb: { xs: 2, sm: 0 } }}
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={Link}
            to="/about"
          >
            Learn More
          </Button>
        </Box>
        
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="body2" color="text.secondary">
          Questions about Pro verification? Contact us at{' '}
          <Typography 
            component="a" 
            href="mailto:contact@wylloh.com" 
            sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}
          >
            contact@wylloh.com
          </Typography>
        </Typography>
      </Paper>
    </Container>
  );
};

export default ProVerificationPage; 