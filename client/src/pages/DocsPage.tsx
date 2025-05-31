import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  Description as DocumentationIcon,
  GitHub as GitHubIcon,
  Construction as ConstructionIcon,
  PlayArrow as FlowIcon,
  Code as CodeIcon,
  School as TutorialIcon
} from '@mui/icons-material';

const DocsPage: React.FC = () => {
  const plannedSections = [
    {
      icon: <FlowIcon />,
      title: "User Flow Documentation",
      description: "Step-by-step guides for creators and collectors",
      status: "In Development"
    },
    {
      icon: <CodeIcon />,
      title: "API Documentation",
      description: "Complete API reference for developers",
      status: "Planned"
    },
    {
      icon: <TutorialIcon />,
      title: "Getting Started Guides",
      description: "Tutorials for new users and creators",
      status: "Planned"
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
          Documentation
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Comprehensive guides and technical documentation
        </Typography>
        <Chip label="In Development" variant="outlined" color="primary" />
      </Box>

      {/* Current Status */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 6,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ConstructionIcon sx={{ color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Documentation in Development
          </Typography>
        </Box>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          We're actively developing comprehensive documentation to help users, creators, and developers 
          get the most out of the Wylloh platform. Our documentation will include user flows, 
          technical guides, and API references.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<GitHubIcon />}
            href="https://github.com/wylloh/wylloh-platform"
            target="_blank"
            sx={{ mr: 2 }}
          >
            View Source Code
          </Button>
          <Button
            variant="outlined"
            href="mailto:contact@wylloh.com"
          >
            Request Documentation
          </Button>
        </Box>
      </Paper>

      {/* Planned Documentation Sections */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Planned Documentation
        </Typography>
        
        <Grid container spacing={4}>
          {plannedSections.map((section, index) => (
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
                    <Box sx={{ color: 'primary.main', mr: 2 }}>
                      {section.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {section.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {section.description}
                  </Typography>
                  <Chip 
                    label={section.status} 
                    size="small" 
                    variant="outlined"
                    color={section.status === "In Development" ? "primary" : "default"}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Temporary Resources */}
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
          Current Resources
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          While we develop comprehensive documentation, you can explore:
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Source Code
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Explore the open-source codebase to understand the platform architecture 
                and implementation details.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<GitHubIcon />}
                href="https://github.com/wylloh/wylloh-platform"
                target="_blank"
              >
                GitHub Repository
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Direct Support
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Have questions? Contact us directly for assistance with using the platform 
                or contributing to development.
              </Typography>
              <Button
                variant="outlined"
                href="mailto:contact@wylloh.com"
              >
                Contact Support
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default DocsPage; 