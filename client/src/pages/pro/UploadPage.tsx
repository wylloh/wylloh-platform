import React, { useRef } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Movie,
  Info,
  Security,
  Publish
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import UploadForm from '../../components/creator/UploadForm';

const UploadPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pro status verification handled at route level for enterprise scalability

  return (
    <Container maxWidth="lg">
      <Box sx={{ pt: 4, pb: 8 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" underline="hover" color="inherit">
            Home
          </MuiLink>
          <MuiLink component={Link} to="/pro/dashboard" underline="hover" color="inherit">
            Creator Dashboard
          </MuiLink>
          <Typography color="text.primary">Upload Content</Typography>
        </Breadcrumbs>
        
        {/* Back button */}
        <Button
          component={Link}
          to="/pro/dashboard"
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
        
        {/* Upload form - route protection ensures Pro verification */}
        <UploadForm />
      </Box>
    </Container>
  );
};

export default UploadPage;