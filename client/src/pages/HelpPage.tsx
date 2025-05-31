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
  Help as HelpIcon,
  Email as EmailIcon,
  Construction as ConstructionIcon
} from '@mui/icons-material';

const HelpPage: React.FC = () => {
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
          Help Center
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Support and assistance for Wylloh users
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
          Help Center Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: '600px', mx: 'auto', lineHeight: 1.7 }}>
          We're building a comprehensive help center with FAQs, tutorials, troubleshooting guides, 
          and step-by-step instructions to help you get the most out of the Wylloh platform.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Need Help Now?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            For immediate assistance, please contact our support team:
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
            <strong>Response Time:</strong> We typically respond to support inquiries within 2-3 business days.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default HelpPage; 