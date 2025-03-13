import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Link,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Twitter as TwitterIcon,
  Telegram as TelegramIcon,
  LinkedIn as LinkedInIcon,
  YouTube as YouTubeIcon,
  GitHub as GitHubIcon
} from '@mui/icons-material';

const Footer: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const footerLinks = [
    {
      title: 'Company',
      links: [
        { name: 'About', path: '/about' },
        { name: 'Careers', path: '/careers' },
        { name: 'Press', path: '/press' },
        { name: 'Contact', path: '/contact' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Terms', path: '/terms' },
        { name: 'Privacy', path: '/privacy' },
        { name: 'Licenses', path: '/licenses' },
        { name: 'Copyright', path: '/copyright' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Documentation', path: '/docs' },
        { name: 'Help Center', path: '/help' },
        { name: 'Community', path: '/community' },
        { name: 'Blog', path: '/blog' }
      ]
    }
  ];
  
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          {/* Logo and slogan */}
          <Grid item xs={12} md={3}>
            <Typography
              variant="h6"
              noWrap
              component={RouterLink}
              to="/"
              sx={{
                fontFamily: 'Playfair Display, serif',
                fontWeight: 700,
                letterSpacing: '.2rem',
                color: 'primary.main',
                textDecoration: 'none',
                mb: 2,
                display: 'inline-block'
              }}
            >
              WYLLOH
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Your premium platform for blockchain-verified digital content.
              Own, trade, and enjoy premium content with verifiable ownership.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <IconButton color="primary" aria-label="Twitter" component="a" href="https://twitter.com" target="_blank">
                <TwitterIcon />
              </IconButton>
              <IconButton color="primary" aria-label="Telegram" component="a" href="https://telegram.org" target="_blank">
                <TelegramIcon />
              </IconButton>
              <IconButton color="primary" aria-label="LinkedIn" component="a" href="https://linkedin.com" target="_blank">
                <LinkedInIcon />
              </IconButton>
              <IconButton color="primary" aria-label="YouTube" component="a" href="https://youtube.com" target="_blank">
                <YouTubeIcon />
              </IconButton>
              <IconButton color="primary" aria-label="GitHub" component="a" href="https://github.com" target="_blank">
                <GitHubIcon />
              </IconButton>
            </Box>
          </Grid>
          
          {/* Links - desktop */}
          {!isMobile && footerLinks.map((section) => (
            <Grid item key={section.title} xs={12} sm={4} md={2}>
              <Typography variant="subtitle1" color="text.primary" gutterBottom>
                {section.title}
              </Typography>
              <Box>
                {section.links.map((link) => (
                  <Link
                    key={link.name}
                    component={RouterLink}
                    to={link.path}
                    color="text.secondary"
                    underline="hover"
                    sx={{ display: 'block', mb: 1 }}
                  >
                    {link.name}
                  </Link>
                ))}
              </Box>
            </Grid>
          ))}
          
          {/* Links - mobile (accordion style) */}
          {isMobile && (
            <Grid item xs={12}>
              {footerLinks.map((section, index) => (
                <Box key={section.title} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" color="text.primary" gutterBottom>
                    {section.title}
                  </Typography>
                  <Box>
                    {section.links.map((link) => (
                      <Link
                        key={link.name}
                        component={RouterLink}
                        to={link.path}
                        color="text.secondary"
                        underline="hover"
                        sx={{ display: 'block', mb: 1 }}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </Box>
                  {index < footerLinks.length - 1 && <Divider sx={{ my: 2 }} />}
                </Box>
              ))}
            </Grid>
          )}
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Wylloh. All rights reserved.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Made with ❤️ for creators and consumers
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 