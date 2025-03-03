import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  Alert,
  AlertTitle
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UploadForm from '../../components/creator/UploadForm';

const UploadPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  
  // Check if user has creator role
  const isCreator = user?.roles.includes('creator');
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ pt: 4, pb: 8 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" underline="hover" color="inherit">
            Home
          </MuiLink>
          <MuiLink component={Link} to="/creator/dashboard" underline="hover" color="inherit">
            Creator Dashboard
          </MuiLink>
          <Typography color="text.primary">Upload Content</Typography>
        </Breadcrumbs>
        
        {/* Back button */}
        <Button
          component={Link}
          to="/creator/dashboard"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
        </Button>
        
        {/* Page title */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CloudUploadIcon sx={{ mr: 2, color: 'primary.main', fontSize: 36 }} />
          <Typography variant="h4" component="h1">
            Upload New Content
          </Typography>
        </Box>
        
        {/* Content based on authentication status */}
        {!isAuthenticated ? (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Alert severity="warning">
              <AlertTitle>Authentication Required</AlertTitle>
              You need to be logged in to upload content.
            </Alert>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                component={Link}
                to="/login"
              >
                Go to Login
              </Button>
            </Box>
          </Paper>
        ) : !isCreator ? (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Alert severity="info">
              <AlertTitle>Creator Role Required</AlertTitle>
              Your account needs to be upgraded to a creator account to upload content.
            </Alert>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                component={Link}
                to="/profile"
              >
                Go to Profile Settings
              </Button>
            </Box>
          </Paper>
        ) : (
          <UploadForm />
        )}
      </Box>
    </Container>
  );
};

export default UploadPage;