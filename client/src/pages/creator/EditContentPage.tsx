import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import EditContentForm from '../../components/creator/EditContentForm';

const EditContentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Handle success callback
  const handleSuccess = () => {
    navigate('/creator/dashboard');
  };
  
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
          <Typography color="text.primary">Edit Content</Typography>
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
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Content
        </Typography>
        
        {/* Content editing form */}
        {id ? (
          <EditContentForm contentId={id} onSuccess={handleSuccess} />
        ) : (
          <Typography color="error">
            No content ID provided.
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default EditContentPage;