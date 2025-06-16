import React from 'react';
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
  Chip,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Handshake as HandshakeIcon,
  TheaterComedy as TheaterIcon,
  Tv as StreamingIcon,
  Business as DistributionIcon,
  Festival as FestivalIcon,
  Api as ApiIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  AutoMode as AutoModeIcon,
  Verified as VerifiedIcon,
  ArrowForward as ArrowForwardIcon,
  Link as IntegrationIcon
} from '@mui/icons-material';

const PartnershipsPage: React.FC = () => {
  const partnershipTypes = [
    {
      icon: <TheaterIcon />,
      title: "Theatrical Exhibitors",
      subtitle: "Independent Cinemas & Theater Chains",
      benefits: [
        "Simplified licensing for independent films",
        "Automated screening rights verification",
        "Real-time audience demand data",
        "Reduced legal overhead for content acquisition"
      ],
      cta: "Streamline Your Content Pipeline"
    },
    {
      icon: <StreamingIcon />,
      title: "Streaming Platforms",
      subtitle: "Netflix, Hulu, Prime Video & Emerging Platforms",
      benefits: [
        "API-driven content acquisition based on token demand",
        "Automated royalty distribution to rights holders",
        "Market intelligence from blockchain analytics",
        "Seamless integration with existing tech stacks"
      ],
      cta: "Enhance Your Content Strategy"
    },
    {
      icon: <DistributionIcon />,
      title: "Distribution Companies",
      subtitle: "Traditional & Digital Distribution Partners",
      benefits: [
        "Automated rights management across territories",
        "Transparent royalty tracking and distribution",
        "Reduced administrative overhead",
        "Enhanced market visibility for catalog content"
      ],
      cta: "Modernize Your Distribution"
    },
    {
      icon: <FestivalIcon />,
      title: "Film Festivals",
      subtitle: "Festival Circuits & Industry Events",
      benefits: [
        "Streamlined screening rights for festival programming",
        "Enhanced audience engagement through collectibles",
        "Post-festival distribution pathway for filmmakers",
        "Industry networking through verified filmmaker profiles"
      ],
      cta: "Elevate Your Festival Experience"
    }
  ];

  const technicalFeatures = [
    {
      icon: <ApiIcon />,
      title: "API-First Integration",
      description: "RESTful APIs designed for seamless integration with existing content management systems"
    },
    {
      icon: <AutoModeIcon />,
      title: "Automated Rights Management",
      description: "Smart contracts handle licensing terms, territorial restrictions, and expiration dates automatically"
    },
    {
      icon: <AnalyticsIcon />,
      title: "Market Intelligence",
      description: "Blockchain-based analytics provide real demand signals without compromising user privacy"
    },
    {
      icon: <SecurityIcon />,
      title: "Enterprise Security",
      description: "Bank-grade encryption and blockchain verification ensure content protection and authenticity"
    }
  ];

  const valuePropositions = [
    {
      icon: <SpeedIcon />,
      title: "Faster Deal Flow",
      description: "Reduce licensing negotiations from weeks to minutes with automated smart contracts"
    },
    {
      icon: <TrendingUpIcon />,
      title: "Data-Driven Decisions",
      description: "Make content acquisition decisions based on real market demand and token holder behavior"
    },
    {
      icon: <VerifiedIcon />,
      title: "Verified Authenticity",
      description: "Blockchain verification eliminates concerns about content authenticity and rights ownership"
    },
    {
      icon: <IntegrationIcon />,
      title: "Seamless Integration",
      description: "Enhance your existing workflows without replacing your current technology infrastructure"
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
          <Box component="span" sx={{ textDecoration: 'line-through', color: 'grey.500' }}>Disruption</Box> Coherence
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Enhancing Hollywood's distribution pipelines with blockchain technology
        </Typography>
        <Chip 
          label="Automation × Acquisition" 
          variant="outlined" 
          sx={{ mt: 2, fontSize: '1rem', py: 1 }}
        />
      </Box>

      {/* Mission Statement */}
      <Paper elevation={0} sx={{ p: 4, mb: 6, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <HandshakeIcon sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Our Partnership Philosophy
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.7, mb: 3 }}>
          Wylloh is designed to <strong>strengthen and streamline</strong> existing distribution pipelines, 
          not replace them. We believe the future of entertainment lies in making Hollywood's proven 
          systems work better for everyone—from major studios to independent theaters.
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
          Our blockchain infrastructure provides the missing layer of automation, transparency, and 
          efficiency that the industry needs to thrive in the digital age, while preserving the 
          relationships and workflows that have made Hollywood successful.
        </Typography>
      </Paper>

      {/* Partnership Types */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4, textAlign: 'center' }}>
          Partnership Opportunities
        </Typography>
        <Grid container spacing={4}>
          {partnershipTypes.map((partnership, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card 
                elevation={0} 
                sx={{ 
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-4px)',
                    transition: 'all 0.3s ease-in-out',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ color: 'primary.main', mr: 2 }}>
                      {partnership.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {partnership.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {partnership.subtitle}
                      </Typography>
                    </Box>
                  </Box>
                  <List dense sx={{ mb: 3 }}>
                    {partnership.benefits.map((benefit, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <ArrowForwardIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        </ListItemIcon>
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
                  <Button 
                    variant="outlined" 
                    fullWidth
                    sx={{ 
                      borderColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'white'
                      }
                    }}
                  >
                    {partnership.cta}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Technical Features */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4, textAlign: 'center' }}>
          Technical Integration
        </Typography>
        <Grid container spacing={3}>
          {technicalFeatures.map((feature, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Box sx={{ display: 'flex', mb: 3 }}>
                <Box sx={{ color: 'primary.main', mr: 2, mt: 0.5 }}>
                  {feature.icon}
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 6 }} />

      {/* Value Propositions */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4, textAlign: 'center' }}>
          Why Partner with Wylloh
        </Typography>
        <Grid container spacing={4}>
          {valuePropositions.map((value, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {value.icon}
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {value.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {value.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Collector vs Professional Distinction */}
      <Paper elevation={0} sx={{ p: 4, mb: 6, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Dual-Market Approach
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              Professional Distribution
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2, color: 'text.primary' }}>
              Our primary focus is enhancing professional distribution workflows for theatrical 
              exhibitors, streaming platforms, and distribution companies. We provide enterprise-grade 
              tools for licensing, rights management, and market intelligence.
            </Typography>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="API-first integration with existing systems"
                  primaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Automated licensing and royalty distribution"
                  primaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Enterprise security and compliance"
                  primaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
                />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
              Collector Experience
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2, color: 'text.primary' }}>
              While we support direct viewing through our proprietary player, this experience 
              is designed for passionate collectors and film enthusiasts rather than casual viewers. 
              This preserves the traditional streaming market for our platform partners.
            </Typography>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Premium collecting experience for film enthusiasts"
                  primaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Complementary to mainstream streaming services"
                  primaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Focus on ownership and permanence"
                  primaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Call to Action */}
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Ready to Enhance Your Distribution Pipeline?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
          Join leading industry partners who are already leveraging Wylloh's blockchain infrastructure 
          to streamline their content operations and unlock new revenue opportunities.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            size="large"
            sx={{ 
              px: 4, 
              py: 1.5,
              fontSize: '1.1rem'
            }}
          >
            Schedule Partnership Discussion
          </Button>
          <Button 
            variant="outlined" 
            size="large"
            sx={{ 
              px: 4, 
              py: 1.5,
              fontSize: '1.1rem'
            }}
          >
            Download Integration Guide
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default PartnershipsPage; 