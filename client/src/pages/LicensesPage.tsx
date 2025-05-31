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
  Button,
  Card,
  CardContent
} from '@mui/material';
import {
  Code as CodeIcon,
  Movie as MovieIcon,
  Public as PublicIcon,
  Security as SecurityIcon,
  Sync as SyncIcon,
  OpenInNew as ExternalLinkIcon,
  Gavel as LegalIcon,
  AccountBalance as LicenseIcon
} from '@mui/icons-material';

const LicensesPage: React.FC = () => {
  const platformLicenses = [
    {
      title: "Wylloh Platform Code",
      license: "Apache License 2.0",
      description: "The entire Wylloh platform codebase is open source under Apache 2.0",
      permissions: ["Commercial use", "Modification", "Distribution", "Patent use"],
      limitations: ["Trademark use", "Liability", "Warranty"]
    },
    {
      title: "Smart Contracts",
      license: "Apache License 2.0", 
      description: "All smart contracts for media licensing and token management",
      permissions: ["Commercial use", "Modification", "Distribution", "Patent use"],
      limitations: ["Trademark use", "Liability", "Warranty"]
    },
    {
      title: "Protocol Specification",
      license: "Creative Commons CC0",
      description: "The Wylloh protocol specification is public domain for maximum adoption",
      permissions: ["Any use", "No attribution required", "Commercial use", "Modification"],
      limitations: ["None"]
    }
  ];

  const movieLicenseTypes = [
    {
      icon: <MovieIcon />,
      title: "Personal Viewing License",
      description: "Standard license for personal consumption of content",
      rights: ["Stream content", "Download for offline viewing", "Personal device access", "Resale rights"]
    },
    {
      icon: <PublicIcon />,
      title: "Public Exhibition License",
      description: "License for public screenings and exhibitions",
      rights: ["Public screening rights", "Educational use", "Festival submissions", "Commercial exhibition"]
    },
    {
      icon: <SecurityIcon />,
      title: "Commercial Distribution License",
      description: "License for commercial distribution and sublicensing",
      rights: ["Sublicensing rights", "Commercial distribution", "Platform integration", "Revenue sharing"]
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
          Licenses
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Open source platform, interoperable content licensing
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 3 }}>
          <Chip label="Apache 2.0" variant="outlined" />
          <Chip label="Open Source" variant="outlined" />
          <Chip label="Interoperable" variant="outlined" />
        </Box>
      </Box>

      {/* Platform Licensing */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Platform Licensing
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7, mb: 4 }}>
          Wylloh is developed as an open-source project to maximize adoption and ensure the 
          protocol becomes a standard for blockchain-based media licensing. Our goal is for 
          other platforms to adopt this protocol, making movie assets cross-compatible and 
          expanding market exposure for creators.
        </Typography>
        
        <Grid container spacing={4}>
          {platformLicenses.map((license, index) => (
            <Grid item xs={12} md={4} key={index}>
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
                    <CodeIcon sx={{ color: 'primary.main', mr: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {license.title}
                    </Typography>
                  </Box>
                  <Chip 
                    label={license.license} 
                    size="small" 
                    color="primary" 
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {license.description}
                  </Typography>
                  
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Permissions:
                  </Typography>
                  <List dense>
                    {license.permissions.map((permission, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: 0.25 }}>
                        <ListItemText 
                          primary={`• ${permission}`}
                          primaryTypographyProps={{ variant: 'body2', color: 'success.main' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>
                    Limitations:
                  </Typography>
                  <List dense>
                    {license.limitations.map((limitation, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: 0.25 }}>
                        <ListItemText 
                          primary={`• ${limitation}`}
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Interoperability Mission */}
      <Paper elevation={0} sx={{ p: 4, mb: 6, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Interoperability Mission
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          Movies are more valuable when they are interoperable and resellable across platforms. 
          By open-sourcing the Wylloh protocol, we enable:
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <SyncIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Cross-Platform Compatibility
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Movie tokens work across any platform that adopts the Wylloh protocol, 
                increasing utility and value for collectors.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <PublicIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Expanded Market Exposure
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Creators benefit from wider distribution as their content becomes 
                accessible across multiple compatible platforms.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Standardized Rights Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                A common protocol ensures consistent rights management and 
                royalty distribution across the ecosystem.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Movie Token Licenses */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Movie Token Licenses
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7, mb: 4 }}>
          Each movie token represents specific usage rights defined by smart contracts. 
          These licenses are stackable and transferable, providing flexibility for both 
          creators and consumers.
        </Typography>
        
        <Grid container spacing={4}>
          {movieLicenseTypes.map((type, index) => (
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
                    {type.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {type.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {type.description}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Rights Included:
                </Typography>
                <List dense>
                  {type.rights.map((right, idx) => (
                    <ListItem key={idx} sx={{ px: 0, py: 0.25 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <LicenseIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={right}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Legal Framework */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05), rgba(66, 165, 245, 0.05))'
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Legal Framework
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          All licenses are enforced through smart contracts on the Polygon blockchain, 
          providing transparent and automated rights management. The legal framework ensures:
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', mb: 3 }}>
              <LegalIcon sx={{ color: 'primary.main', mr: 2, mt: 0.5 }} />
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Automated Enforcement
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Smart contracts automatically enforce license terms without requiring 
                  manual intervention or legal proceedings.
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', mb: 3 }}>
              <SecurityIcon sx={{ color: 'primary.main', mr: 2, mt: 0.5 }} />
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Transparent Terms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All license terms are publicly visible on the blockchain, 
                  ensuring transparency and preventing disputes.
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 4 }} />
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            View the Source Code
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Explore our open-source codebase and contribute to the future of media licensing.
          </Typography>
          <Button
            variant="contained"
            startIcon={<CodeIcon />}
            endIcon={<ExternalLinkIcon />}
            href="https://github.com/wylloh/wylloh-platform"
            target="_blank"
            size="large"
          >
            View on GitHub
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default LicensesPage; 