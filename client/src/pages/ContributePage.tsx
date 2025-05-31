import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
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
  GitHub as GitHubIcon,
  Code as CodeIcon,
  BugReport as BugReportIcon,
  Description as DocumentationIcon,
  Lightbulb as IdeaIcon,
  Security as SecurityIcon,
  Gavel as GovernanceIcon,
  OpenInNew as ExternalLinkIcon
} from '@mui/icons-material';

const ContributePage: React.FC = () => {
  const contributionTypes = [
    {
      icon: <CodeIcon />,
      title: "Code Contributions",
      description: "Help build the platform by contributing to our React frontend, Node.js API, or Solidity smart contracts.",
      skills: ["TypeScript", "React", "Node.js", "Solidity", "Web3"]
    },
    {
      icon: <BugReportIcon />,
      title: "Bug Reports & Testing",
      description: "Help us identify and fix issues by reporting bugs, testing new features, and improving platform stability.",
      skills: ["QA Testing", "Bug Reporting", "User Experience"]
    },
    {
      icon: <DocumentationIcon />,
      title: "Documentation",
      description: "Improve our documentation, write tutorials, create guides, and help make Wylloh more accessible.",
      skills: ["Technical Writing", "Documentation", "User Guides"]
    },
    {
      icon: <IdeaIcon />,
      title: "Feature Ideas",
      description: "Share your ideas for new features, improvements, and enhancements to the platform.",
      skills: ["Product Design", "UX/UI", "Feature Planning"]
    }
  ];

  const governanceAreas = [
    {
      title: "Technical Decisions",
      description: "Architecture choices, technology stack decisions, and development standards"
    },
    {
      title: "Feature Prioritization",
      description: "Roadmap planning and determining which features to build next"
    },
    {
      title: "Community Guidelines",
      description: "Establishing standards for collaboration and community interaction"
    },
    {
      title: "Protocol Evolution",
      description: "Decisions about blockchain protocol changes and smart contract upgrades"
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
          Contribute to Wylloh
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Help build the future of blockchain-based media licensing
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 3 }}>
          <Chip label="Open Source" variant="outlined" />
          <Chip label="Apache License" variant="outlined" />
          <Chip label="Community Driven" variant="outlined" />
        </Box>
      </Box>

      {/* Quick Start */}
      <Paper elevation={0} sx={{ p: 4, mb: 6, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Get Started
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          Wylloh is an open-source project built by filmmakers, for filmmakers. We believe in 
          transparent development and community-driven innovation. Whether you're a developer, 
          designer, filmmaker, or blockchain enthusiast, there are many ways to contribute.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<GitHubIcon />}
            endIcon={<ExternalLinkIcon />}
            href="https://github.com/wylloh/wylloh-platform"
            target="_blank"
            size="large"
          >
            View on GitHub
          </Button>
          <Button
            variant="outlined"
            startIcon={<BugReportIcon />}
            href="https://github.com/wylloh/wylloh-platform/issues"
            target="_blank"
          >
            Report Issues
          </Button>
          <Button
            variant="outlined"
            startIcon={<IdeaIcon />}
            href="https://github.com/wylloh/wylloh-platform/discussions"
            target="_blank"
          >
            Join Discussions
          </Button>
        </Box>
      </Paper>

      {/* Contribution Types */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Ways to Contribute
        </Typography>
        <Grid container spacing={4}>
          {contributionTypes.map((type, index) => (
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
                      {type.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {type.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {type.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {type.skills.map((skill, idx) => (
                      <Chip 
                        key={idx} 
                        label={skill} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Development Status */}
      <Paper elevation={0} sx={{ p: 4, mb: 6, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Current Development Status
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          Wylloh is currently at approximately <strong>95-98% completion</strong> for the core platform. 
          We're in the final phases of development, focusing on:
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Active Development Areas
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CodeIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Component architecture refactoring" />
              </ListItem>
              <ListItem>
                <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Security audits and testing" />
              </ListItem>
              <ListItem>
                <ListItemIcon><BugReportIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Bug fixes and optimization" />
              </ListItem>
              <ListItem>
                <ListItemIcon><DocumentationIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Documentation and user guides" />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Technology Stack
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Frontend: React + TypeScript + Material-UI" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Backend: Node.js + Express + MongoDB" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Blockchain: Solidity + Polygon + Web3" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Storage: IPFS + Filecoin" />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Governance */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Governance & Decision Making
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          As an open-source project, Wylloh follows transparent governance principles. 
          Community input is valued in key decision-making areas:
        </Typography>
        
        <Grid container spacing={3}>
          {governanceAreas.map((area, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Box sx={{ display: 'flex', mb: 3 }}>
                <GovernanceIcon sx={{ color: 'primary.main', mr: 2, mt: 0.5 }} />
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {area.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {area.description}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Incentive Structure */}
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
          Incentive Structure
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          While Wylloh is currently in development phase, we're designing incentive structures 
          for contributors that align with our mission of empowering creators:
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recognition
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Contributors are recognized in project documentation, 
                release notes, and community acknowledgments.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Learning & Growth
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gain experience with cutting-edge blockchain technology, 
                Web3 development, and decentralized systems.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Future Opportunities
              </Typography>
              <Typography variant="body2" color="text.secondary">
                As the platform grows, active contributors may have 
                opportunities for deeper involvement and governance roles.
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 4 }} />
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Ready to Contribute?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Join our community and help build the future of filmmaking technology.
          </Typography>
          <Button
            variant="contained"
            startIcon={<GitHubIcon />}
            href="https://github.com/wylloh/wylloh-platform"
            target="_blank"
            size="large"
          >
            Get Started on GitHub
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ContributePage; 