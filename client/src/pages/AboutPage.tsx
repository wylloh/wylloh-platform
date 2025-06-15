import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Movie as MovieIcon,
  Security as SecurityIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  VerifiedUser as VerifiedUserIcon,
  Public as PublicIcon,
  Lock as LockIcon
} from '@mui/icons-material';

const AboutPage: React.FC = () => {
  const valueProps = [
    {
      icon: <MovieIcon />,
      title: "For Filmmakers & Rights Holders",
      benefits: [
        "Perpetual royalties on all sales (primary and secondary)",
        "Granular control over licensing terms",
        "Automated rights management",
        "New financing opportunities"
      ]
    },
    {
      icon: <AccountBalanceWalletIcon />,
      title: "For Audiences",
      benefits: [
        "True ownership of purchased content",
        "Ability to resell licenses",
        "Flexibility in how content is consumed",
        "Access to wider range of independent media"
      ]
    },
    {
      icon: <GroupIcon />,
      title: "For Exhibitors & Platforms",
      benefits: [
        "Frictionless licensing",
        "Automated royalty distribution",
        "Reduced legal overhead when acquiring content",
        "API-driven content acquisition based on real-time demand"
      ]
    }
  ];

  const differentiators = [
    {
      icon: <VerifiedUserIcon />,
      title: "Modular Rights Management",
      description: "Licenses can be stacked to unlock different usage rights (personal viewing, commercial exhibition, etc.)"
    },
    {
      icon: <TrendingUpIcon />,
      title: "Perpetual Royalties",
      description: "Creators earn from both initial sales and all subsequent resales automatically"
    },
    {
      icon: <PublicIcon />,
      title: "Organic Distribution",
      description: "Content can move fluidly between platforms based on market demand rather than fixed distribution windows"
    },
    {
      icon: <SecurityIcon />,
      title: "Privacy-First Analytics",
      description: "\"Movies That Don't Watch You Back\" - analytics based solely on blockchain data, respecting user privacy"
    },
    {
      icon: <LockIcon />,
      title: "Verifiable Ownership",
      description: "On-chain verification of legitimate access rights with no expiration dates"
    }
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
          Cinema, reimagined
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Where every movie finds its perfect home
        </Typography>
        <Chip 
          label="Open Source • Apache License" 
          variant="outlined" 
          sx={{ mt: 2 }}
        />
      </Box>

      {/* Mission Statement */}
      <Paper elevation={0} sx={{ p: 4, mb: 6, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Movies that matter
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.7, mb: 3 }}>
          Every great film deserves to find its audience. Every passionate viewer deserves to truly own 
          the movies they love. We're building the bridge between these two truths.
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
          Professional-grade tools for filmmakers. Premium ownership experience for audiences. 
          All built on technology that respects both creativity and privacy.
        </Typography>
      </Paper>

      {/* Value Propositions */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Value for Everyone
        </Typography>
        <Grid container spacing={4}>
          {valueProps.map((prop, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: 'primary.main', mr: 2 }}>
                    {prop.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {prop.title}
                  </Typography>
                </Box>
                <List dense>
                  {prop.benefits.map((benefit, idx) => (
                    <ListItem key={idx} sx={{ px: 0 }}>
                      <ListItemText 
                        primary={benefit}
                        primaryTypographyProps={{
                          variant: 'body2',
                          sx: { lineHeight: 1.5 }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Key Differentiators */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          What Makes Us Different
        </Typography>
        <Grid container spacing={3}>
          {differentiators.map((diff, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Box sx={{ display: 'flex', mb: 3 }}>
                <Box sx={{ color: 'primary.main', mr: 2, mt: 0.5 }}>
                  {diff.icon}
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {diff.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {diff.description}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* System Overview */}
      <Paper elevation={0} sx={{ p: 4, mb: 6, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          How It Works
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          Wylloh is an integrated ecosystem consisting of three primary components:
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Blockchain Layer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Polygon-based smart contracts managing media licensing, rights verification, 
                and automated royalty distribution.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <PublicIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Storage Layer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Decentralized IPFS/Filecoin storage ensuring content is secure, 
                encrypted, and accessible only to authorized token holders.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <MovieIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Access Layer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Web platform and specialized hardware providing interfaces for content 
                management, token operations, and secure playback.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Current Status */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05), rgba(66, 165, 245, 0.05))'
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Open Source Development
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Wylloh is developed as an open-source project under the Apache License. 
          Our goal is for other platforms to adopt this protocol, making movie assets 
          cross-compatible and expanding market exposure for filmmakers.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Filmmakers benefit from wider distribution as their content becomes 
          accessible across multiple compatible platforms.
        </Typography>
        <Divider sx={{ my: 3 }} />
        <Typography variant="body2" color="text.secondary">
          Want to contribute? Visit our{' '}
          <Typography 
            component="a" 
            href="https://github.com/wylloh/wylloh-platform" 
            target="_blank"
            sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}
          >
            GitHub repository
          </Typography>
          {' '}to get started.
        </Typography>
      </Paper>
    </Container>
  );
};

export default AboutPage; 