import React, { useState, useRef } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  Alert,
  AlertTitle,
  TextField,
  Grid,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Movie,
  Info,
  Security,
  Publish
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UploadForm from '../../components/creator/UploadForm';

const UploadPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if user has verified Pro status
  const isProVerified = user?.proStatus === 'verified';

  // 🔄 PHASE 1: Context-Aware Refresh - Pro feature access
  React.useEffect(() => {
    if (user) {
      console.log('🔄 Pro Upload: Refreshing user data for Pro status verification');
      refreshUser();
    }
  }, []); // Only run on mount

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
        {!user ? (
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