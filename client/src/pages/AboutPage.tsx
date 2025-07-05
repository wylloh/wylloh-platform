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
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  Movie as MovieIcon,
  Security as SecurityIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  VerifiedUser as VerifiedUserIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Token as TokenIcon,
  Storage as StorageIcon,
  Api as ApiIcon,
  Autorenew as AutorenewIcon,
  Shield as ShieldIcon,
  Visibility as VisibilityIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

const AboutPage: React.FC = () => {
  const revolutionaryFeatures = [
    {
      icon: <TokenIcon />,
      title: "Stackable Token Rights",
      description: "Revolutionary ERC-1155 token architecture where quantity determines usage rights. 1 token = personal viewing, 25,000 tokens = national distribution rights."
    },
    {
      icon: <AutorenewIcon />,
      title: "Perpetual Royalty Engine",
      description: "Smart contracts automatically distribute royalties on every transaction. Creators earn from initial sales AND all future resales forever."
    },
    {
      icon: <ShieldIcon />,
      title: "Blockchain-Native Content Protection",
      description: "IPFS storage with wallet-based decryption keys. Content remains encrypted and inaccessible without valid token ownership."
    },
    {
      icon: <VisibilityIcon />,
      title: "Privacy-First Analytics",
      description: "\"Movies That Don't Watch You Back\" - Analytics derived from public blockchain data, not invasive user tracking."
    }
  ];

  const technicalArchitecture = [
    {
      icon: <SecurityIcon />,
      title: "Blockchain Layer",
      description: "Polygon-based smart contracts managing media licensing, rights verification, and automated royalty distribution with sub-penny transaction costs."
    },
    {
      icon: <StorageIcon />,
      title: "Decentralized Storage",
      description: "IPFS/Filecoin integration ensures content is secure, encrypted, and permanently accessible. No single point of failure."
    },
    {
      icon: <ApiIcon />,
      title: "Access Control Layer",
      description: "Multi-level encryption with wallet-based authentication. Token holders automatically receive decryption keys for their rights tier."
    }
  ];

  const valueProps = [
    {
      icon: <MovieIcon />,
      title: "For Filmmakers",
      benefits: [
        "Perpetual royalties on all sales (primary and secondary)",
        "Granular rights management (personal, commercial, distribution)",
        "Direct audience relationships without platform intermediaries",
        "Pre-financing opportunities through token pre-sales"
      ]
    },
    {
      icon: <AccountBalanceWalletIcon />,
      title: "For Collectors",
      benefits: [
        "True ownership - tokens persist across platforms",
        "Resale rights - create secondary markets",
        "Stackable rights - accumulate tokens for commercial use",
        "Permanent access - no expiration dates"
      ]
    },
    {
      icon: <GroupIcon />,
      title: "For Exhibitors",
      benefits: [
        "Instant rights verification via blockchain",
        "API-driven content acquisition",
        "Automated licensing and payments",
        "Market intelligence from token demand"
      ]
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
          Revolutionizing Film Distribution
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          The first blockchain-native platform for tokenized film licensing and distribution.
        </Typography>
        <Chip 
          label="Blockchain • IPFS • Smart Contracts" 
          variant="outlined" 
          sx={{ mt: 2 }}
        />
      </Box>

      {/* What is Wylloh */}
      <Paper elevation={0} sx={{ p: 4, mb: 6, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          What is Wylloh?
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.7, mb: 3 }}>
          Wylloh is the world's first blockchain-native film distribution platform that tokenizes movie licenses 
          using smart contracts. Instead of traditional licensing paperwork, films become ERC-1155 tokens where 
          ownership quantity determines usage rights.
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
          We've solved the fundamental problems of digital media ownership: expiration dates, platform lock-in, 
          and creator compensation. Our technology creates permanent, transferable rights that benefit everyone 
          in the film ecosystem.
        </Typography>
      </Paper>

      {/* Revolutionary Features */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Revolutionary Technology
        </Typography>
        <Grid container spacing={4}>
          {revolutionaryFeatures.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card 
                elevation={0} 
                sx={{ 
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
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ color: 'primary.main', mr: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Technical Architecture */}
      <Paper elevation={0} sx={{ p: 4, mb: 6, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          How It Works
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7, mb: 4 }}>
          Wylloh operates on a three-layer architecture that combines blockchain technology, 
          decentralized storage, and sophisticated access controls:
        </Typography>
        
        <Grid container spacing={4}>
          {technicalArchitecture.map((layer, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {layer.icon}
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {layer.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {layer.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* The Revolutionary Model */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          What Makes This Revolutionary
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                Traditional Model Problems
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Content expires or disappears" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="No resale rights for digital purchases" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Complex licensing negotiations" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Creators get paid once" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Platform lock-in and gatekeepers" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'success.main' }}>
                Wylloh Solution
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Permanent ownership via blockchain" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Secondary markets for all content" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Instant verification and licensing" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Perpetual royalties on all sales" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Platform-agnostic content access" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Value Propositions */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Value for the Film Ecosystem
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

      {/* Platform Economics */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Platform Economics & Sustainability
        </Typography>
        
        <Paper elevation={0} sx={{ p: 4, mb: 4, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box sx={{ color: 'success.main', mr: 2 }}>
              <MoneyIcon />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
              Platform Transaction Fee: 5%
            </Typography>
          </Box>
          
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.7, mb: 3 }}>
            Sustainable, transparent fee structure designed to ensure platform longevity while maximizing creator earnings. 
            Significantly lower than traditional platforms (20-30%).
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Revenue Distribution
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><VerifiedUserIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Creator Revenue: 95%" 
                    secondary="Goes directly to filmmakers and collaborators" 
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Platform Fee: 5%" 
                    secondary="Supports infrastructure, security, and community programs" 
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Platform Fee Allocation
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Infrastructure & Security: ~50%" 
                    secondary="Blockchain operations, IPFS storage, platform security" 
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Development & Innovation: ~30%" 
                    secondary="Platform improvements and new features" 
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Community & Support: ~20%" 
                    secondary="Creator support programs and community initiatives" 
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark' }}>
              💡 Why 5% is Fair: Traditional film distribution takes 20-30% in fees. 
              Wylloh's 5% enables sustainable operations while ensuring creators keep 95% of revenue.
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Platform Independence */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 4,
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05), rgba(139, 195, 74, 0.05))'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
          <PublicIcon sx={{ color: 'success.main', mr: 2, fontSize: 40 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'success.main' }}>
            Platform Independence
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3, fontSize: '1.1rem' }}>
          Your purchased content belongs to you, permanently. We believe digital ownership should work 
          like physical ownership — when you buy something, you should be able to keep it regardless 
          of where you bought it.
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
          Through blockchain technology and decentralized storage, your films remain accessible 
          using only your wallet and the IPFS network. If Wylloh were to disappear tomorrow, 
          you would still own and can access every film you've purchased.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This isn't just a promise — it's architecturally guaranteed. True digital ownership 
          means your content transcends any single platform, creating lasting value that 
          extends far beyond our service.
        </Typography>
      </Paper>

      {/* Open Source Philosophy */}
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
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Open Source Protocol
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
          Wylloh is developed as an open-source protocol under the Apache License. 
          Our goal is for other platforms to adopt this technology, making movie tokens 
          cross-compatible and expanding market exposure for filmmakers.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          When the protocol becomes an industry standard, filmmakers benefit from 
          wider distribution as their content becomes accessible across multiple 
          compatible platforms and marketplaces.
        </Typography>
      </Paper>
    </Container>
  );
};

export default AboutPage; 