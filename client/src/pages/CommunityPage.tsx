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
  Card,
  CardContent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  VideoLibrary as VideotapeIcon,
  Favorite as HeartIcon,
  Group as CommunityIcon,
  Security as SecurityIcon,
  Handshake as HandshakeIcon,
  Star as StarIcon,
  Movie as FilmIcon,
  Support as SupportIcon
} from '@mui/icons-material';

const CommunityPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const principles = [
    {
      icon: <VideotapeIcon />,
      title: "Be Kind, Rewind",
      description: "Just like returning a VHS tape in good condition, treat our community with respect and care. Leave every interaction better than you found it."
    },
    {
      icon: <HeartIcon />,
      title: "Respect the Art",
      description: "Honor the filmmakers, creators, and collectors who make this platform possible. Every piece of content represents someone's passion and hard work."
    },
    {
      icon: <CommunityIcon />,
      title: "Build Together",
      description: "We're creating the future of film collecting together. Share knowledge, help newcomers, and contribute to a thriving community."
    },
    {
      icon: <SecurityIcon />,
      title: "Protect & Preserve",
      description: "Help us maintain the integrity of the platform. Report issues, respect intellectual property, and keep our digital vault secure."
    }
  ];

  const guidelines = [
    {
      category: "Content & Collections",
      items: [
        "Share authentic enthusiasm for film and collecting",
        "Respect copyright and intellectual property rights",
        "Provide accurate information about content and metadata",
        "Help preserve film history through thoughtful curation"
      ]
    },
    {
      category: "Community Interactions",
      items: [
        "Engage with kindness and professional courtesy",
        "Welcome newcomers and share knowledge generously",
        "Provide constructive feedback and helpful suggestions",
        "Celebrate others' collections and achievements"
      ]
    },
    {
      category: "Platform Integrity",
      items: [
        "Use the platform as intended for legitimate collecting",
        "Report bugs, security issues, or inappropriate content",
        "Respect the blockchain and smart contract systems",
        "Maintain the professional standards expected by filmmakers"
      ]
    },
    {
      category: "Professional Standards",
      items: [
        "Maintain confidentiality of unreleased or sensitive content",
        "Honor licensing terms and distribution agreements",
        "Support fair compensation for creators and rights holders",
        "Uphold the platform's reputation in the film industry"
      ]
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 6 }}>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              mb: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' }
            }}
          >
            Community Guidelines
          </Typography>
          <Typography 
            variant="h5" 
            color="text.secondary" 
            paragraph
            sx={{ 
              maxWidth: '600px',
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.6,
            }}
          >
            Be Kind, Rewind: Building a respectful community for film lovers and collectors
          </Typography>
        </Box>

        {/* Be Kind Rewind Hero Section */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            mb: 6, 
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VideotapeIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
                  Be Kind, Rewind
                </Typography>
              </Box>
              <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                Remember the golden rule of video stores? "Be Kind, Rewind." We've adapted this timeless 
                principle for our digital age. Just as you'd return a VHS tape in perfect condition for 
                the next person, we ask that you treat our community with the same consideration.
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                This isn't about strict rules or heavy-handed moderation. It's about fostering a culture 
                where film enthusiasts, collectors, and industry professionals can thrive together.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center' }}>
                <FilmIcon sx={{ fontSize: 120, color: 'text.secondary', opacity: 0.7 }} />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Core Principles */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
            Our Core Principles
          </Typography>
          <Grid container spacing={3}>
            {principles.map((principle, index) => (
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
                        {principle.icon}
                      </Box>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                        {principle.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {principle.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Detailed Guidelines */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
            Community Guidelines
          </Typography>
          <Grid container spacing={4}>
            {guidelines.map((section, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    {section.category}
                  </Typography>
                  <List dense>
                    {section.items.map((item, itemIndex) => (
                      <ListItem key={itemIndex} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <StarIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={item}
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

        {/* Community Spirit Section */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            mb: 6,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <HandshakeIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              The Spirit of Our Community
            </Typography>
          </Box>
          <Typography variant="body1" paragraph sx={{ textAlign: 'center', maxWidth: '800px', mx: 'auto', lineHeight: 1.7 }}>
            We believe in the power of self-regulation and community responsibility. Rather than imposing 
            rigid rules, we trust our members to embody the spirit of "Be Kind, Rewind." When everyone 
            contributes to a positive environment, we all benefit from a thriving, supportive community.
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', maxWidth: '800px', mx: 'auto', lineHeight: 1.7 }}>
            Remember: we're all here because we love film. Whether you're a Hollywood professional, 
            an independent creator, or a passionate collector, you're part of something special. 
            Let's build it together.
          </Typography>
        </Paper>

        {/* Contact and Support */}
        <Box sx={{ textAlign: 'center' }}>
          <SupportIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            Questions or Concerns?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            If you have questions about these guidelines or need to report an issue, 
            please don't hesitate to reach out to our community team.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Contact us at: <strong>community@wylloh.com</strong>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default CommunityPage; 