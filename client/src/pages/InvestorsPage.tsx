import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Button
} from '@mui/material';
import {
  CheckCircle,
  Rocket,
  Security,
  People,
  Store,
  Hardware,
  Business,
  TrendingUp,
  DataUsage,
  CloudQueue
} from '@mui/icons-material';

const InvestorsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Investors
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
          Scaling the Future of Media Ownership
        </Typography>
        <Alert severity="info" sx={{ maxWidth: 800, mx: 'auto' }}>
          <Typography variant="body1">
            <strong>Currently Live:</strong> Wylloh is operational in production with first film tokenization capabilities. 
            We're seeking strategic investment to scale from our current single-server infrastructure to global capacity.
          </Typography>
        </Alert>
      </Box>

      {/* Current State */}
      <Paper elevation={2} sx={{ p: 4, mb: 6, bgcolor: 'grey.50' }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="success" />
          Current State: Beta Platform Live
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Technical Infrastructure</Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                <ListItemText primary="Production platform deployed on Digital Ocean Droplet" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                <ListItemText primary="15-minute CI/CD pipeline with automated deployment" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                <ListItemText primary="Polygon blockchain integration with smart contracts" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                <ListItemText primary="IPFS/Filecoin decentralized storage system" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                <ListItemText primary="Stripe integration for mainstream credit card payments" />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Business Validation</Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                <ListItemText primary="First film ready for tokenization: The Cocoanuts (1929)" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                <ListItemText primary="USDC-first pricing strategy ($19.99 standard)" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                <ListItemText primary="Open source positioning for developer adoption" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                <ListItemText primary="Bootstrap profitable with zero external funding" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                <ListItemText primary="Complete Web3 + Web2 user experience" />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Investment Roadmap */}
      <Typography variant="h3" gutterBottom sx={{ mt: 6, mb: 4 }}>
        Investment Roadmap: Scaling to Hollywood
      </Typography>

      <Grid container spacing={4}>
        {/* Phase 1: Infrastructure Scaling */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CloudQueue color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5">Phase 1</Typography>
                <Chip label="Infrastructure" color="primary" size="small" sx={{ ml: 1 }} />
              </Box>
              <Typography variant="h6" gutterBottom>
                Server Infrastructure Scaling
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Strategic Priority:</strong> Scale infrastructure thoughtfully while maintaining bootstrap efficiency
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><DataUsage fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Multi-region VPS deployment" 
                    secondary="Scale from single droplet to global infrastructure"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><Security fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Enterprise security audits" 
                    secondary="Third-party penetration testing & code review"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><People fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Customer support team" 
                    secondary="24/7 user onboarding specialists"
                  />
                </ListItem>
              </List>
              <Typography variant="caption" display="block" sx={{ mt: 2, fontStyle: 'italic' }}>
                Timeline: 3-6 months
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Phase 2: Network Hardware */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Hardware color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h5">Phase 2</Typography>
                <Chip label="Hardware" color="secondary" size="small" sx={{ ml: 1 }} />
              </Box>
              <Typography variant="h6" gutterBottom>
                Hardware Player Development
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Strategic Priority:</strong> Build sustainable network effects through user-owned infrastructure
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><Hardware fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Seed One player device" 
                    secondary="Purpose-built hardware for secure content playback"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><TrendingUp fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="IPFS network strengthening" 
                    secondary="Distributed storage with user incentives"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><Store fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Reward system for storage sharing" 
                    secondary="Users earn for contributing more than they consume"
                  />
                </ListItem>
              </List>
              <Typography variant="caption" display="block" sx={{ mt: 2, fontStyle: 'italic' }}>
                Timeline: 6-12 months
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Phase 3: Content Partnerships */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Business color="success" sx={{ mr: 1 }} />
                <Typography variant="h5">Phase 3</Typography>
                <Chip label="Content" color="success" size="small" sx={{ ml: 1 }} />
              </Box>
              <Typography variant="h6" gutterBottom>
                Hollywood Partnerships
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Strategic Priority:</strong> Establish sustainable content partnerships avoiding Quibi-style overspending
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><Business fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Theatrical relationships" 
                    secondary="Direct partnerships with cinema chains"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><Rocket fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Content acquisition pipeline" 
                    secondary="Major studio and independent distributor deals"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><People fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Creator onboarding infrastructure" 
                    secondary="Tools and support for filmmakers at scale"
                  />
                </ListItem>
              </List>
              <Typography variant="caption" display="block" sx={{ mt: 2, fontStyle: 'italic' }}>
                Timeline: 12-24 months
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Strategic Differentiation */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Our Special Formula: Humility Meets Innovation
        </Typography>
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body1" paragraph>
            <strong>We know what we're up against.</strong> Media platforms are inherently expensive and unpredictable. 
            Quibi had studio support and $2 billion in investment, yet still failed. We approach this gargantuan problem with humility.
          </Typography>
          <Typography variant="body1">
            <strong>Our success will be due to our special formula:</strong> addressing the specific elements where others have failed 
            through sustainable network effects, user ownership incentives, and bootstrap efficiency—not through massive capital deployment.
          </Typography>
        </Alert>
      </Box>

      {/* Strategic Advantages */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Strategic Investment Advantages
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Technical Moat
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="First-mover advantage in film tokenization" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="Patent-pending modular rights management" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="Proven blockchain + mainstream UX integration" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="Open source developer community building" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Market Opportunity
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><TrendingUp fontSize="small" color="success" /></ListItemIcon>
                  <ListItemText primary="$2.3 trillion global media market addressable" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingUp fontSize="small" color="success" /></ListItemIcon>
                  <ListItemText primary="Netflix model disruption with ownership benefits" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingUp fontSize="small" color="success" /></ListItemIcon>
                  <ListItemText primary="Creator economy demands better monetization" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingUp fontSize="small" color="success" /></ListItemIcon>
                  <ListItemText primary="Web3 adoption reaching mainstream tipping point" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Current Metrics */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Current Bootstrap Metrics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">1</Typography>
                <Typography variant="body2">Production Server</Typography>
                <Typography variant="caption" color="text.secondary">
                  Single Digital Ocean Droplet
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">15m</Typography>
                <Typography variant="body2">CI/CD Deployment</Typography>
                <Typography variant="caption" color="text.secondary">
                  Automated pipeline
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">$0</Typography>
                <Typography variant="body2">External Funding</Typography>
                <Typography variant="caption" color="text.secondary">
                  Bootstrapped profitable
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">∞</Typography>
                <Typography variant="body2">Upside Potential</Typography>
                <Typography variant="caption" color="text.secondary">
                  Platform network effects
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Risk Management */}
      <Box sx={{ mt: 6, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Risk Management & Validation Strategy
        </Typography>
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body1">
            <strong>De-risked Investment:</strong> Platform is live and operational, not a theoretical concept. 
            Technical infrastructure proven, user experience validated, revenue model confirmed.
          </Typography>
        </Alert>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Technical Risk: Mitigated</Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="✅ Blockchain integration proven" />
              </ListItem>
              <ListItem>
                <ListItemText primary="✅ Storage infrastructure operational" />
              </ListItem>
              <ListItem>
                <ListItemText primary="✅ Payment processing integrated" />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Market Risk: Validated</Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="✅ Open source community interest" />
              </ListItem>
              <ListItem>
                <ListItemText primary="✅ Creator demand for ownership tools" />
              </ListItem>
              <ListItem>
                <ListItemText primary="✅ Consumer appetite for digital ownership" />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Execution Risk: Proven</Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="✅ MVP built and deployed" />
              </ListItem>
              <ListItem>
                <ListItemText primary="✅ Team capable of delivery" />
              </ListItem>
              <ListItem>
                <ListItemText primary="✅ Incremental scaling plan" />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Box>

      {/* Call to Action */}
      <Divider sx={{ my: 4 }} />
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Ready to Scale the Future of Media?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Join us in revolutionizing how content creators monetize their work and how audiences own their media.
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          href="/contact"
          sx={{ mt: 2 }}
        >
          Contact for Investment Opportunities
        </Button>
      </Box>
    </Container>
  );
};

export default InvestorsPage; 