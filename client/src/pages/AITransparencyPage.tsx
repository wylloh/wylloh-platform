import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  Visibility as TransparencyIcon,
  Palette as PaletteIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';

const AITransparencyPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" gutterBottom sx={{ fontWeight: 600 }}>
          AI Transparency & Artist Collaboration
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '800px', mx: 'auto' }}>
          Our commitment to transparency about AI usage and our dedication to supporting human artists
        </Typography>
      </Box>

      {/* Current AI Usage Alert */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body1">
          <strong>Transparency First:</strong> We believe in being completely open about our use of AI tools during development. 
          This page outlines exactly how AI is currently used on our platform and our concrete plans for transitioning to human artist collaborations.
        </Typography>
      </Alert>

      {/* Current AI Usage Section */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TransparencyIcon sx={{ mr: 2, color: 'primary.main' }} />
          Current AI Usage
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Hero Banner Imagery</Typography>
                <Typography variant="body2" color="text.secondary">
                  The main hero banner featuring the "Wylloh" sign in hills is AI-generated placeholder imagery 
                  used during development phase.
                </Typography>
                <Chip label="Temporary" color="warning" size="small" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Placeholder Content</Typography>
                <Typography variant="body2" color="text.secondary">
                  Dynamic placeholder images for content thumbnails during development and testing phases.
                </Typography>
                <Chip label="Development Only" color="info" size="small" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Development Assistance</Typography>
                <Typography variant="body2" color="text.secondary">
                  AI tools used for code development, documentation, and testing to accelerate platform creation.
                </Typography>
                <Chip label="Behind the Scenes" color="default" size="small" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Our Philosophy */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <VerifiedIcon sx={{ mr: 2, color: 'primary.main' }} />
          Our Philosophy: AI as a Tool, Not a Replacement
        </Typography>
        
        <Typography variant="body1" paragraph>
          We recognize the inherent irony in using AI tools to build a platform designed to support and empower human artists in Hollywood. 
          This apparent contradiction is not lost on us, and we address it head-on.
        </Typography>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">Why We Used AI During Development:</Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><ScheduleIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Speed to Market" secondary="Rapid prototyping to validate platform concept" />
              </ListItem>
              <ListItem>
                <ListItemIcon><ScheduleIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Resource Efficiency" secondary="Bootstrap development with limited initial resources" />
              </ListItem>
              <ListItem>
                <ListItemIcon><VerifiedIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Proof of Concept" secondary="Demonstrate functionality before seeking artist partnerships" />
              </ListItem>
            </List>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="secondary">Why This Supports Our Mission:</Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><PaletteIcon color="secondary" /></ListItemIcon>
                <ListItemText primary="Tool vs. Replacement" secondary="AI as development tool, not creative replacement" />
              </ListItem>
              <ListItem>
                <ListItemIcon><GroupIcon color="secondary" /></ListItemIcon>
                <ListItemText primary="Economic Opportunity" secondary="Platform creates new revenue streams for artists" />
              </ListItem>
              <ListItem>
                <ListItemIcon><TransparencyIcon color="secondary" /></ListItemIcon>
                <ListItemText primary="Transparency" secondary="Open about AI usage rather than hiding it" />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>



      {/* Artist Collaboration Roadmap */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PaletteIcon sx={{ mr: 2, color: 'primary.main' }} />
          Artist Collaboration Roadmap
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Phase 1: Hero Banner Replacement</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Replace AI-generated hero banner with human artist collaboration.
                </Typography>
                <Chip label="Q3 2025" color="primary" size="small" />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Open call for concept artists and digital illustrators focusing on cinematic and landscape work.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Phase 2: Platform Visual Identity</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Develop comprehensive visual identity with human artists.
                </Typography>
                <Chip label="Q1 2026" color="primary" size="small" />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Custom iconography, UI elements, and marketing materials created by professional designers.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Phase 3: Featured Content Showcase</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Replace placeholder content with artist-created promotional materials.
                </Typography>
                <Chip label="Q2-Q3 2026" color="primary" size="small" />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Collaborate with filmmakers and commission poster artists for authentic promotional content.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Phase 4: Community Art Integration</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Build ongoing artist community and collaboration programs.
                </Typography>
                <Chip label="Q3-Q4 2026" color="primary" size="small" />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Artist residency programs, fan art ecosystems, and educational partnerships.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Transparency Commitments */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TransparencyIcon sx={{ mr: 2, color: 'primary.main' }} />
          Our Transparency Commitments
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Ongoing Disclosure</Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="AI Usage Labeling" secondary="All AI-generated content clearly marked" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Artist Attribution" secondary="Prominent crediting of all human artists" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Process Documentation" secondary="Public documentation of our AI-to-human transition" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Regular Updates" secondary="Quarterly reports on artist collaboration progress" />
              </ListItem>
            </List>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Community Involvement</Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Open Feedback" secondary="Regular community input on AI usage policies" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Artist Advisory Board" secondary="Formal artist representation in platform decisions" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Public Roadmap" secondary="Transparent timeline for AI-to-human content transitions" />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Conclusion */}
      <Paper sx={{ p: 4, backgroundColor: 'background.default' }}>
        <Typography variant="h5" gutterBottom>Our Commitment to the Creative Community</Typography>
        <Typography variant="body1" paragraph>
          Our use of AI during Wylloh's development phase was a strategic decision to rapidly build and validate our platform concept. 
          However, our ultimate vision is a platform where human creativity is celebrated, compensated, and empowered through blockchain technology.
        </Typography>
        <Typography variant="body1" paragraph>
          The transition from AI-generated placeholder content to human artist collaborations represents more than just a visual upgrade—it 
          embodies our core values of supporting the human art economy in Hollywood and beyond.
        </Typography>
        <Typography variant="body1">
          We invite artists, creators, and community members to join us in this transition. Together, we can build a platform that truly 
          serves the creative community while leveraging technology to expand opportunities rather than replace human talent.
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="body2" color="text.secondary">
          <strong>Contact for Artist Collaborations:</strong> contact@wylloh.com
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Last Updated:</strong> December 2024 | <strong>Next Review:</strong> March 2025
        </Typography>
      </Paper>
    </Container>
  );
};

export default AITransparencyPage; 