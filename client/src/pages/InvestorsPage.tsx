import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
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
  CloudQueue,
  Movie,
  Stars,
  Lightbulb
} from '@mui/icons-material';

const InvestorsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          The Convergence Moment
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
          Where Blockchain Meets Hollywood
        </Typography>
        <Alert severity="info" sx={{ maxWidth: 800, mx: 'auto', bgcolor: 'rgba(0, 0, 0, 0.05)', border: '1px solid rgba(0, 0, 0, 0.1)' }}>
          <Typography variant="body1">
            <strong>Platform built and tested:</strong> Wylloh infrastructure is operational and ready for first users. 
            We're scaling proven technology to transform how films flow between filmmakers and audiences worldwide.
          </Typography>
        </Alert>
      </Box>

      {/* Market Opportunity - Merged Section */}
      <Paper elevation={2} sx={{ p: 4, mb: 6, bgcolor: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Stars color="primary" />
          The Market Opportunity
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph sx={{ fontStyle: 'italic' }}>
          "Crypto needs mainstream adoption. Hollywood needs sustainable distribution economics. 
          The convergence is inevitable—we're building the infrastructure to make it work."
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>The Crypto Challenge</Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><TrendingUp fontSize="small" color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Billions in value locked, millions of users" 
                  secondary="Yet most filmmakers still can't monetize with crypto"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><People fontSize="small" color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Complex onboarding blocks mainstream adoption" 
                  secondary="Artists and audiences want ownership without technical barriers"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Lightbulb fontSize="small" color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Infrastructure exists, experience doesn't" 
                  secondary="Web3 needs elegant interfaces for real-world cinema"
                />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>The Hollywood Challenge</Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><Movie fontSize="small" color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Distribution wars drain filmmaker revenue" 
                  secondary="Artists lose control over theatrical and digital rights"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Business fontSize="small" color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Exhibitors struggle with complex licensing" 
                  secondary="Manual rights management slows theatrical distribution"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Security fontSize="small" color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Audiences pay subscriptions but own nothing" 
                  secondary="Digital ownership remains theoretical for cinema"
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Our Solution */}
      <Typography variant="h3" gutterBottom sx={{ mt: 6, mb: 4 }}>
        Reimagining Distribution from the Ground Up
      </Typography>

      <Grid container spacing={4}>
        {/* Phase 1: Infrastructure Excellence */}
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ height: '100%', bgcolor: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CloudQueue sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5">Infrastructure Excellence</Typography>
              </Box>
              <Typography variant="h6" gutterBottom>
                Built for Hollywood Scale
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Engineering Philosophy:</strong> Bootstrap validation, then scale with precision
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><DataUsage fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Professional distribution infrastructure" 
                    secondary="4K downloads, DCP packages, IMF for theatrical exhibition"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><Security fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Enterprise-grade security" 
                    secondary="Protecting valuable film libraries"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><People fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Filmmaker-first support" 
                    secondary="Tools and team that understand cinema"
                  />
                </ListItem>
              </List>
              <Typography variant="caption" display="block" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                Foundation: Proven in production
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Phase 2: Seed One Network */}
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ height: '100%', bgcolor: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Hardware sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5">Seed One Network</Typography>
              </Box>
              <Typography variant="h6" gutterBottom>
                Ownership-First Home Media
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Premium home media server</strong> focused on digital ownership—better quality than streaming, 
                more efficient than traditional physical media, designed for collectors who want both convenience and true ownership.
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><Hardware fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Beautiful hardware audiences want to own" 
                    secondary="Elegant design that enhances the home theater experience"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><TrendingUp fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Distributed storage network" 
                    secondary="Users become the infrastructure they depend on"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><Store fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Contribution rewards" 
                    secondary="Share storage, earn tokens, support filmmakers"
                  />
                </ListItem>
              </List>
              <Typography variant="caption" display="block" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                Innovation: User-owned infrastructure
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Phase 3: Industry Transformation */}
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ height: '100%', bgcolor: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Business sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5">Industry Renaissance</Typography>
              </Box>
              <Typography variant="h6" gutterBottom>
                Sustainable Economics
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Partnership Vision:</strong> When technology serves cinematic artistry, everyone benefits
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><Business fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Theatrical partnerships" 
                    secondary="Exhibitors become stakeholders in film success"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><Rocket fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Filmmaker liberation" 
                    secondary="Artists control distribution and retain ownership"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><People fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Audience empowerment" 
                    secondary="Film lovers own and support what they cherish"
                  />
                </ListItem>
              </List>
              <Typography variant="caption" display="block" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                Outcome: Sustainable cinematic economy
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Why Now */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Why Now
        </Typography>
        <Alert severity="info" sx={{ mb: 4, bgcolor: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.1)' }}>
          <Typography variant="body1" paragraph>
            <strong>Market Timing:</strong> Blockchain infrastructure has matured while distribution economics have become unsustainable. 
            Filmmakers demand ownership, audiences want permanence, and exhibitors need simpler licensing.
          </Typography>
          <Typography variant="body1">
            <strong>Our approach:</strong> We've solved the technical complexity that kept these worlds apart. 
            Open-source trust-building meets elegant user experience—creating a platform where 
            all participants can thrive.
          </Typography>
        </Alert>
      </Box>

      {/* Competitive Positioning */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Our Approach in Action
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, bgcolor: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rocket color="primary" />
                Technology Excellence
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="First platform bridging Web3 and Hollywood elegantly" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="Open-source foundation building industry trust" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="Proven credit card → crypto → film pipeline" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="⚡ Infrastructure ready for global scale" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, bgcolor: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="primary" />
                Market Position
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><TrendingUp fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="$2.3 trillion cinema market ready for ownership evolution" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingUp fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="Subscription fatigue driving digital ownership demand" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingUp fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="Filmmaker economy seeking sustainable monetization" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingUp fontSize="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="Positioning as ownership-first rather than competing on pure quality metrics" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Built and Ready */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Built and Ready
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
          "While competitors pitch decks, we ship code. Our platform is built, tested, and ready to onboard the first cohort of filmmakers."
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">⚡</Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>Infrastructure Ready</Typography>
                <Typography variant="caption" color="text.secondary">
                  Production platform operational
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">15min</Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>Deploy Speed</Typography>
                <Typography variant="caption" color="text.secondary">
                  Ship fast, iterate faster
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">$0</Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>External Debt</Typography>
                <Typography variant="caption" color="text.secondary">
                  Bootstrap foundation
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">∞</Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>Growth Potential</Typography>
                <Typography variant="caption" color="text.secondary">
                  Network effects ready
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Execution Track Record */}
      <Box sx={{ mt: 6, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Execution Track Record
        </Typography>
        <Alert severity="success" sx={{ mb: 3, bgcolor: 'rgba(0, 0, 0, 0.02)', border: '1px solid rgba(0, 0, 0, 0.1)' }}>
          <Typography variant="body1">
            <strong>Infrastructure Complete:</strong> Platform built, tested, and ready for first users. 
            Transaction pipeline operational, smart contracts deployed, and filmmaker interest confirmed through industry outreach.
          </Typography>
        </Alert>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="primary" />
              Technical Readiness
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="⚡ Blockchain → credit card pipeline operational" />
              </ListItem>
              <ListItem>
                <ListItemText primary="⚡ IPFS storage infrastructure built and tested" />
              </ListItem>
              <ListItem>
                <ListItemText primary="⚡ Smart contracts deployed and verified" />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp color="primary" />
              Market Validation
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="⚡ Open-source developers contributing to platform" />
              </ListItem>
              <ListItem>
                <ListItemText primary="⚡ Filmmaker interest confirmed through industry outreach" />
              </ListItem>
              <ListItem>
                <ListItemText primary="⚡ Market validation through filmmaker conversations" />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rocket color="primary" />
              Platform Readiness
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="⚡ Full-stack platform shipped to production" />
              </ListItem>
              <ListItem>
                <ListItemText primary="⚡ Bootstrap operation proven sustainable" />
              </ListItem>
              <ListItem>
                <ListItemText primary="⚡ Ready to onboard first filmmaker cohort" />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Box>

      {/* The Invitation */}
      <Divider sx={{ my: 4 }} />
      <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.05)' }}>
        <Typography variant="h4" gutterBottom>
          Ready to Scale
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph sx={{ fontStyle: 'italic', maxWidth: 600, mx: 'auto' }}>
          "We're not asking you to bet on a concept. We're inviting you to scale a platform that's already built 
          and ready to transform how filmmakers and audiences connect through ownership."
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 3 }}>
          <Button 
            variant="contained" 
            size="large" 
            href="/contact"
            sx={{ mt: 2 }}
          >
            Partner with Wylloh
          </Button>
          <Button 
            variant="outlined" 
            size="large" 
            href="/about"
            sx={{ mt: 2 }}
          >
            Explore the Platform
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, opacity: 0.8 }}>
          Built by filmmakers, for filmmakers • Backed by blockchain, loved by audiences
        </Typography>
      </Box>
    </Container>
  );
};

export default InvestorsPage; 