import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip
} from '@mui/material';
import {
  Article as BlogIcon,
  Email as EmailIcon,
  Construction as ConstructionIcon
} from '@mui/icons-material';

const BlogPage: React.FC = () => {
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
          Blog
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Insights, updates, and stories from the Wylloh team
        </Typography>
        <Chip label="Coming Soon" variant="outlined" color="primary" />
      </Box>

      {/* Coming Soon Notice */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 6, 
          textAlign: 'center',
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05), rgba(66, 165, 245, 0.05))'
        }}
      >
        <ConstructionIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Blog Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: '600px', mx: 'auto', lineHeight: 1.7 }}>
          We're preparing to share insights about blockchain technology, filmmaking, digital ownership, 
          and the future of content distribution. Stay tuned for updates on platform development, 
          industry trends, and creator stories.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Stay Updated
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Follow us on social media or contact us for updates:
          </Typography>
          <Button
            variant="contained"
            startIcon={<EmailIcon />}
            href="mailto:contact@wylloh.com"
            size="large"
            sx={{ mt: 2 }}
          >
            contact@wylloh.com
          </Button>
        </Box>
        
        <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Follow us:</strong> @wyllohland on X (Twitter) for the latest updates and announcements.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default BlogPage; 