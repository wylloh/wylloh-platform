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
  Article as ArticleIcon,
  Email as EmailIcon,
  Construction as ConstructionIcon
} from '@mui/icons-material';

const PressPage: React.FC = () => {
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
          Press
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Media resources and press information
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
          Press Resources Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: '600px', mx: 'auto', lineHeight: 1.7 }}>
          We're preparing comprehensive press resources including media kits, press releases, 
          high-resolution assets, and background information about Wylloh's mission to revolutionize 
          digital media licensing through blockchain technology.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Media Inquiries
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            For press inquiries, interviews, or media resources, please contact:
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
            <strong>About Wylloh:</strong> A blockchain-based media licensing platform that revolutionizes 
            how digital content is distributed, accessed, and monetized while empowering creators 
            and providing collectors with true ownership.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default PressPage; 