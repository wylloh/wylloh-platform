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
  
  // Check if user has verified Pro status
  const isProVerified = user?.proStatus === 'verified';
  
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
            Upload Film Package
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
        ) : !isProVerified ? (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Alert severity="info">
              <AlertTitle>Pro Status Verification Required</AlertTitle>
              Your account needs to have verified Pro status to upload content.
              {user?.proStatus === 'pending' && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Your Pro verification request is pending. Please wait for admin approval.
                </Typography>
              )}
            </Alert>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                component={Link}
                to="/profile"
              >
                Go to Profile
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