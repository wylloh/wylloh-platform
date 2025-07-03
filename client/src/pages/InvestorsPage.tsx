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
        <Alert severity="info" sx={{ maxWidth: 800, mx: 'auto' }}>
          <Typography variant="body1">
            <strong>Live in Production:</strong> Wylloh is operational with film tokenization capabilities. 
            We're scaling proven technology to transform how films flow between filmmakers and audiences worldwide.
          </Typography>
        </Alert>
      </Box>

      {/* Vision Statement */}
      <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Stars color="primary" />
          The Obvious Opportunity
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph sx={{ fontStyle: 'italic' }}>
          "Crypto needs mainstream adoption. Hollywood needs sustainable distribution economics. 
          The convergence is inevitable—we're building the infrastructure to make it elegant."
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>The Crypto Reality</Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><TrendingUp fontSize="small" color="warning" /></ListItemIcon>
                <ListItemText 
                  primary="Billions in value locked, millions of users" 
                  secondary="Yet most filmmakers still can't monetize with crypto"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><People fontSize="small" color="warning" /></ListItemIcon>
                <ListItemText 
                  primary="Complex onboarding blocks mainstream adoption" 
                  secondary="Artists and audiences want ownership without technical barriers"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Lightbulb fontSize="small" color="warning" /></ListItemIcon>
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
                <ListItemIcon><Movie fontSize="small" color="error" /></ListItemIcon>
                <ListItemText 
                  primary="Distribution wars drain filmmaker revenue" 
                  secondary="Artists lose control over theatrical and digital rights"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Business fontSize="small" color="error" /></ListItemIcon>
                <ListItemText 
                  primary="Exhibitors struggle with complex licensing" 
                  secondary="Manual rights management slows theatrical distribution"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Security fontSize="small" color="error" /></ListItemIcon>
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
          <Card elevation={3} sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CloudQueue sx={{ mr: 1 }} />
                <Typography variant="h5">Elegant Infrastructure</Typography>
              </Box>
              <Typography variant="h6" gutterBottom>
                Built for Hollywood Scale
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }} paragraph>
                <strong>Engineering Philosophy:</strong> Bootstrap validation, then scale with precision
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><DataUsage fontSize="small" sx={{ color: 'white' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Professional distribution infrastructure" 
                    secondary="4K downloads, DCP packages, IMF for theatrical exhibition"
                    sx={{ '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><Security fontSize="small" sx={{ color: 'white' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Enterprise-grade security" 
                    secondary="Protecting billion-dollar film libraries"
                    sx={{ '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><People fontSize="small" sx={{ color: 'white' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Filmmaker-first support" 
                    secondary="Tools and team that understand cinema"
                    sx={{ '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </ListItem>
              </List>
              <Typography variant="caption" display="block" sx={{ mt: 2, fontStyle: 'italic', opacity: 0.8 }}>
                Foundation: Proven in production
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Phase 2: Network Effects */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Hardware sx={{ mr: 1 }} />
                <Typography variant="h5">Network Intelligence</Typography>
              </Box>
              <Typography variant="h6" gutterBottom>
                Self-Sustaining Ecosystem
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }} paragraph>
                <strong>Network Vision:</strong> User ownership creates unbreakable distribution
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><Hardware fontSize="small" sx={{ color: 'white' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Seed One home players" 
                    secondary="Beautiful hardware that audiences want to own"
                    sx={{ '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><TrendingUp fontSize="small" sx={{ color: 'white' }} /></ListItemIcon>
                  <ListItemText 
                    primary="∞ Distributed storage network" 
                    secondary="Fans become the infrastructure they depend on"
                    sx={{ '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><Store fontSize="small" sx={{ color: 'white' }} /></ListItemIcon>
                  <ListItemText 
                    primary="Contribution rewards" 
                    secondary="Share storage, earn tokens, support filmmakers"
                    sx={{ '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.7)' } }}
                  />
                </ListItem>
              </List>
              <Typography variant="caption" display="block" sx={{ mt: 2, fontStyle: 'italic', opacity: 0.8 }}>
                Innovation: User-owned infrastructure
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Phase 3: Industry Transformation */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%', background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', color: '#333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Business sx={{ mr: 1 }} />
                <Typography variant="h5">Industry Renaissance</Typography>
              </Box>
              <Typography variant="h6" gutterBottom>
                Positive-Sum Economics
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }} paragraph>
                <strong>Transformation Vision:</strong> When technology serves cinematic artistry, everyone wins
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><Business fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Theatrical partnerships" 
                    secondary="Exhibitors become stakeholders in film success"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><Rocket fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Filmmaker liberation" 
                    secondary="Artists control distribution and retain ownership"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon><People fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Audience empowerment" 
                    secondary="Film lovers own and support what they cherish"
                  />
                </ListItem>
              </List>
                              <Typography variant="caption" display="block" sx={{ mt: 2, fontStyle: 'italic', opacity: 0.8 }}>
                Outcome: Sustainable cinematic economy
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Why Now */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Why This Convergence Moment Changes Everything
        </Typography>
        <Alert severity="success" sx={{ mb: 4, bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
          <Typography variant="body1" paragraph>
            <strong>The Perfect Storm:</strong> Blockchain infrastructure has matured while distribution economics have become unsustainable. 
            Filmmakers demand ownership, audiences want permanence, and exhibitors need simpler licensing.
          </Typography>
          <Typography variant="body1">
            <strong>Our breakthrough:</strong> We've solved the technical complexity that kept these worlds apart. 
            Open-source trust-building meets elegant user experience—creating the first platform where 
            all participants thrive together.
          </Typography>
        </Alert>
      </Box>

      {/* Competitive Advantages */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Our Crystalline Vision in Action
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', border: '1px solid rgba(102, 126, 234, 0.3)' }}>
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
                  <ListItemText primary="⚡ Live infrastructure scaling from bootstrap to global" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 239, 125, 0.1) 100%)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="success" />
                Market Transformation
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><TrendingUp fontSize="small" color="success" /></ListItemIcon>
                  <ListItemText primary="$2.3 trillion cinema market ready for ownership evolution" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingUp fontSize="small" color="success" /></ListItemIcon>
                  <ListItemText primary="Subscription fatigue driving digital ownership demand" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingUp fontSize="small" color="success" /></ListItemIcon>
                  <ListItemText primary="Filmmaker economy seeking sustainable monetization" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingUp fontSize="small" color="success" /></ListItemIcon>
                  <ListItemText primary="∞ Network effects create unassailable position" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Bootstrap Foundation */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Built Right: Bootstrap Foundation
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
          "Great companies start lean and scale with purpose—we're proving the model before seeking scale."
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4">⚡</Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>Live Platform</Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Production infrastructure operational
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4">15min</Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>Deploy Speed</Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Ship fast, iterate faster
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', color: '#333' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4">$0</Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>External Debt</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Profitable from day one
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4">∞</Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>Growth Ceiling</Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Network effects compound
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Proven Foundation */}
      <Box sx={{ mt: 6, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Not a Concept—A Running Engine
        </Typography>
        <Alert severity="success" sx={{ mb: 3, bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
          <Typography variant="body1">
            <strong>Live Infrastructure:</strong> While others pitch slides, we ship code. Our platform processes real transactions, 
            serves actual films, and grows organic usage daily. The foundation is built—now we scale the vision.
          </Typography>
        </Alert>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              Technical Excellence
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="⚡ Blockchain → credit card pipeline operational" />
              </ListItem>
              <ListItem>
                <ListItemText primary="⚡ IPFS storage serving real films globally" />
              </ListItem>
              <ListItem>
                <ListItemText primary="⚡ Smart contracts deployed and tested" />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp color="success" />
              Market Validation
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="⚡ Open-source developers contributing actively" />
              </ListItem>
              <ListItem>
                <ListItemText primary="⚡ Filmmakers requesting platform access" />
              </ListItem>
              <ListItem>
                <ListItemText primary="⚡ Early users embracing digital ownership" />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rocket color="success" />
              Execution Track Record
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="⚡ Full-stack platform shipped to production" />
              </ListItem>
              <ListItem>
                <ListItemText primary="⚡ Bootstrap profitable operation proven" />
              </ListItem>
              <ListItem>
                <ListItemText primary="⚡ Scaling roadmap validated by real usage" />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Box>

      {/* The Invitation */}
      <Divider sx={{ my: 4 }} />
      <Box sx={{ textAlign: 'center', py: 4, background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          The Convergence Is Here
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph sx={{ fontStyle: 'italic', maxWidth: 600, mx: 'auto' }}>
          "We're not asking you to bet on a dream. We're inviting you to scale a reality that's already transforming 
          how filmmakers and audiences connect through true ownership."
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 3 }}>
          <Button 
            variant="contained" 
            size="large" 
            href="/contact"
            sx={{ 
              mt: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6c5ce7 100%)',
              }
            }}
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