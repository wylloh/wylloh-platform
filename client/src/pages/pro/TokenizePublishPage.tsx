import React, { useState, useEffect } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  Grid,
  TextField,
  InputAdornment,
  Slider,
  Divider,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  TokenOutlined as TokenIcon,
  Public as PublicIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { contentService } from '../../services/content.service';

interface RightsThreshold {
  quantity: number;
  type: string;
  description: string;
}

// Define interface for form data
interface TokenizationFormData {
  initialSupply: number;
  royaltyPercentage: number;
  initialPrice: string;
  rightsThresholds: RightsThreshold[];
}

// Define steps
const TOKENIZE_STEPS = [
  'Set License Terms', 
  'Configure Token Sale', 
  'Review & Publish'
];

const TokenizePublishPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get content info from location state
  const contentInfo = location.state?.contentInfo || {
    id: 'temp-id-' + Date.now(),
    title: 'Untitled Content',
    description: 'No description provided'
  };
  
  // State for active step
  const [activeStep, setActiveStep] = useState(0);
  
  // Check if content is already tokenized
  const [isAlreadyTokenized, setIsAlreadyTokenized] = useState(false);

  // State for submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // State for skip confirmation dialog
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  
  // Check if user has verified Pro status
  const isProVerified = user?.proStatus === 'verified';
  
  // Load content details on mount
  useEffect(() => {
    async function loadContentDetails() {
      if (contentInfo.id) {
        try {
          const content = await contentService.getContentById(contentInfo.id);
          
          // Check if content is already tokenized
          if (content?.tokenized) {
            console.log('Content already tokenized during upload:', content);
            setIsAlreadyTokenized(true);
            
            // Log additional details for debugging
            console.log('Tokenization status details:', {
              tokenId: content.tokenId,
              price: content.price,
              totalSupply: content.totalSupply,
              available: content.available
            });
            
            // Check blockchain token balance if possible
            try {
              if (window.ethereum && content.tokenId) {
                // Import dynamically to avoid circular dependencies
                const { blockchainService } = await import('../../services/blockchain.service');
                if (blockchainService.isInitialized()) {
                  // Get the creator's address
                  const creatorAddress = content.creatorAddress;
                  if (creatorAddress) {
                    const balance = await blockchainService.getTokenBalance(creatorAddress, content.tokenId);
                    console.log(`Creator's token balance for ${content.tokenId}: ${balance}`);
                    if (balance === 0) {
                      console.warn('Creator has 0 tokens despite content being marked as tokenized');
                    }
                  }
                }
              }
            } catch (balanceError) {
              console.error('Error checking token balance:', balanceError);
            }
          }
          
          // Update form data with content's rights thresholds if available
          if (content && 'rightsThresholds' in content && 
              Array.isArray(content.rightsThresholds) && 
              content.rightsThresholds.length > 0) {
                
            setFormData(prevData => ({
              ...prevData,
              initialSupply: content.totalSupply || prevData.initialSupply,
              initialPrice: String(content.price || prevData.initialPrice),
              rightsThresholds: content.rightsThresholds?.map(threshold => ({
                quantity: threshold.quantity,
                type: threshold.type,
                description: threshold.type
              })) || prevData.rightsThresholds
            }));
          }
        } catch (error) {
          console.error('Error loading content details:', error);
        }
      }
    }
    
    loadContentDetails();
  }, [contentInfo.id]);
  
  // State for form data
  const [formData, setFormData] = useState<TokenizationFormData>({
    initialSupply: contentInfo.tokenization?.initialSupply || 1000,
    royaltyPercentage: contentInfo.tokenization?.royalty || 10,
    initialPrice: String(contentInfo.tokenization?.price || '0.01'),
    rightsThresholds: contentInfo.tokenization?.rightsThresholds?.map((threshold: { quantity: number; type: string }) => ({
      quantity: threshold.quantity,
      type: threshold.type,
      description: threshold.type // Use type as description since it's more descriptive in the upload form
    })) || [
      { quantity: 1, type: 'Personal Viewing', description: 'Personal Viewing' },
      { quantity: 5, type: 'Family Viewing', description: 'Family Viewing' },
      { quantity: 10, type: 'Public Display Rights', description: 'Public Display Rights' }
    ]
  });
  
  // Handle going to next step
  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };
  
  // Handle going back to previous step
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Handle form field changes
  const handleChange = (field: keyof TokenizationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle threshold update
  const handleUpdateThreshold = (index: number, field: string, value: any) => {
    const newThresholds = [...formData.rightsThresholds];
    newThresholds[index] = {
      ...newThresholds[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      rightsThresholds: newThresholds
    }));
  };
  
  // Handle submit
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      // Double-check if content is already tokenized to avoid duplicate tokenization
      const content = await contentService.getContentById(contentInfo.id);
      
      // If content is already tokenized, redirect to dashboard
      if (content?.tokenized || isAlreadyTokenized) {
        console.log('Content is already tokenized, skipping tokenization');
        navigate('/pro/dashboard', {
          state: {
            success: true,
            message: `${contentInfo.title} is already tokenized. No changes were needed.`
          }
        });
        return;
      }

      // First check if MetaMask is installed and connected
      if (!window.ethereum) {
        throw new Error('MetaMask is required for tokenization. Please install MetaMask and refresh the page.');
      }
      
      // Try to get the current account
      let accounts;
      try {
        accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) {
          console.log('No accounts connected, requesting account access...');
          accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        }
      } catch (err) {
        console.error('Error connecting to MetaMask:', err);
        throw new Error('Failed to connect to MetaMask. Please ensure MetaMask is unlocked and try again.');
      }
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No MetaMask accounts available. Please unlock and connect your MetaMask wallet.');
      }
      
      console.log('Using MetaMask account:', accounts[0]);
      
      // Check if on the correct network (Polygon mainnet)
      try {
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const chainId = parseInt(chainIdHex, 16);
        console.log(`Current chain ID: ${chainId}`);
        
        // For production, we need to be on chainId 137 (Polygon mainnet)
        if (chainId !== 137) {
          console.warn('Not on the expected network (Polygon mainnet). This may cause issues with tokenization.');
        }
      } catch (err) {
        console.error('Error checking network:', err);
      }

      // Convert price from string to float
      const priceAsFloat = parseFloat(formData.initialPrice);
      
      if (isNaN(priceAsFloat)) {
        setError('Invalid price value');
        setSubmitting(false);
        return;
      }
      
      console.log('Tokenizing content with the following parameters:', {
        contentId: contentInfo.id,
        initialSupply: formData.initialSupply,
        royaltyPercentage: formData.royaltyPercentage,
        price: priceAsFloat,
        rightsThresholds: formData.rightsThresholds,
      });
      
      // Show message that MetaMask will prompt for transaction approval
      // This helps the user understand to look for the MetaMask popup
      setError('Please approve the transaction in your MetaMask wallet to continue. The MetaMask popup should appear shortly.');
      
      try {
        // Tokenize content
        const tokenizedContent = await contentService.tokenizeContent(
          contentInfo.id,
          {
            initialSupply: formData.initialSupply,
            royaltyPercentage: formData.royaltyPercentage,
            price: priceAsFloat,
            rightsThresholds: formData.rightsThresholds.map(rt => ({
              quantity: rt.quantity,
              type: rt.type
            })),
          }
        );
        
        // Clear the error that was showing the MetaMask prompt message
        setError(null);
        
        // Add a verification step to confirm token creation before redirecting
        setError('Verifying token creation...');
        
        // Import blockchain service dynamically
        const { blockchainService } = await import('../../services/blockchain.service');
        
        // Wait a moment to ensure blockchain state is updated
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verify token creation using blockchain service
        const verificationResult = await blockchainService.verifyTokenCreation(contentInfo.id, accounts[0]);
        console.log('Token verification result:', verificationResult);
        
        if (verificationResult.success && verificationResult.balance > 0) {
          // Navigate to creator dashboard with success message
          navigate('/pro/dashboard', {
            state: {
              success: true,
              message: `${contentInfo.title} has been tokenized and published to the marketplace.`
            }
          });
        } else {
          throw new Error('Token creation transaction submitted, but token verification failed. Your content was not fully tokenized.');
        }
      } catch (tokenizationError) {
        console.error('Error in tokenization or verification:', tokenizationError);
        
        // Check if we need to fetch the content again to prevent duplicates
        const updatedContent = await contentService.getContentById(contentInfo.id);
        
        if (updatedContent?.tokenized) {
          // If marked as tokenized but verification failed, update the content status
          console.log('Content marked as tokenized but verification failed, attempting cleanup');
          
          // Store failure in local storage to prevent duplicate marketplace entries
          try {
            localStorage.setItem(`tokenization_failed_${contentInfo.id}`, 'true');
          } catch (storageError) {
            console.error('Error updating localStorage:', storageError);
          }
        }
        
        throw tokenizationError;
      }
    } catch (err: any) {
      console.error('Error tokenizing content:', err);
      
      // Provide more detailed error message
      let errorMessage = err.message || 'Failed to tokenize content';
      
      // Check for specific error messages
      if (err.message && err.message.includes('already tokenized')) {
        errorMessage = `${contentInfo.title} is already tokenized. Please refresh the dashboard.`;
        // Redirect to dashboard after showing error
        setTimeout(() => {
          navigate('/pro/dashboard');
        }, 3000);
      } else if (err.message && err.message.includes('MetaMask')) {
        if (err.message.includes('rejected')) {
          errorMessage = 'Transaction rejected in MetaMask. Please approve the transaction to tokenize your content.';
        } else {
          errorMessage = err.message;
        }
      } else if (err.message && err.message.includes('balance')) {
        errorMessage = 'Token creation failed: The creator received 0 tokens. Please try again or contact support.';
      } else if (err.message && err.message.includes('network') || err.message.includes('chainId')) {
        errorMessage = 'Network error: Please make sure MetaMask is connected to the Polygon mainnet (Chain ID: 137).';
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle skip confirmation
  const handleSkipConfirm = () => {
    setSkipDialogOpen(false);
          navigate('/pro/dashboard');
  };
  
  // Handle opening skip dialog
  const handleOpenSkipDialog = () => {
    setSkipDialogOpen(true);
  };
  
  // Handle closing skip dialog
  const handleCloseSkipDialog = () => {
    setSkipDialogOpen(false);
  };
  
  // Render license terms step
  const renderLicenseTermsStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        License Terms
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Rights Management</AlertTitle>
        Define what rights users will obtain at different token ownership thresholds.
        The more tokens a user owns, the more rights they can unlock.
      </Alert>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Rights Thresholds
        </Typography>
        
        {formData.rightsThresholds.map((threshold, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Token Quantity"
                  type="number"
                  value={threshold.quantity}
                  onChange={(e) => handleUpdateThreshold(index, 'quantity', Number(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">tokens</InputAdornment>,
                  }}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Rights Type"
                  value={threshold.type}
                  onChange={(e) => handleUpdateThreshold(index, 'type', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Description"
                  value={threshold.description}
                  onChange={(e) => handleUpdateThreshold(index, 'description', e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Box>
    </Box>
  );
  
  // Render token sale configuration step
  const renderTokenSaleStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Token Sale Configuration
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>About Token Sales</AlertTitle>
        These settings determine how your content license tokens will be sold in the marketplace.
      </Alert>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Initial Supply
          </Typography>
          
          <TextField
            fullWidth
            type="number"
            value={formData.initialSupply}
            onChange={(e) => handleChange('initialSupply', Number(e.target.value))}
            InputProps={{
              endAdornment: <InputAdornment position="end">tokens</InputAdornment>,
            }}
            helperText="Total number of license tokens to create"
          />
          
          <Box sx={{ px: 1, mt: 2 }}>
            <Slider
              value={formData.initialSupply}
              onChange={(_, newValue) => handleChange('initialSupply', newValue as number)}
              min={100}
              max={10000}
              step={100}
              marks={[
                { value: 100, label: '100' },
                { value: 1000, label: '1K' },
                { value: 5000, label: '5K' },
                { value: 10000, label: '10K' },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Royalty Percentage
          </Typography>
          
          <TextField
            fullWidth
            type="number"
            value={formData.royaltyPercentage}
            onChange={(e) => handleChange('royaltyPercentage', Number(e.target.value))}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            inputProps={{
              min: 0,
              max: 50,
              step: 0.5
            }}
            helperText="Royalty on secondary sales"
          />
          
          <Box sx={{ px: 1, mt: 2 }}>
            <Slider
              value={formData.royaltyPercentage}
              onChange={(_, newValue) => handleChange('royaltyPercentage', newValue as number)}
              min={0}
              max={25}
              step={0.5}
              marks={[
                { value: 0, label: '0%' },
                { value: 10, label: '10%' },
                { value: 25, label: '25%' },
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}%`}
            />
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Initial Price
          </Typography>
          
          <TextField
            fullWidth
            type="number"
            value={formData.initialPrice}
            onChange={(e) => handleChange('initialPrice', e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">ETH</InputAdornment>,
            }}
            inputProps={{
              min: 0.001,
              step: 0.001
            }}
            helperText="Starting price for each license token"
          />
        </Grid>
      </Grid>
    </Box>
  );
  
  // Render review and publish step
  const renderReviewPublishStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review & Submit
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Content Information
            </Typography>
            <Typography>
              <strong>Title:</strong> {contentInfo.title}
            </Typography>
            <Typography>
              <strong>Creator:</strong> {contentInfo.creator}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Token Supply
            </Typography>
            <Typography>
              <strong>Initial Supply:</strong> {formData.initialSupply} tokens
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Royalty Percentage
            </Typography>
            <Typography>
              <strong>Royalty:</strong> {formData.royaltyPercentage}%
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Initial Price
            </Typography>
            <Typography>
              <strong>Price:</strong> ${formData.initialPrice} per token
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Rights Thresholds
            </Typography>
            {formData.rightsThresholds.length > 0 ? (
              <List>
                {formData.rightsThresholds.map((threshold, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`${threshold.type} (${threshold.quantity} tokens)`}
                      secondary={threshold.description}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No rights thresholds defined
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Important</AlertTitle>
        <Typography variant="body2">
          After submission, you'll need to confirm the transaction in MetaMask to create your token.
          This process can take up to a minute to complete.
        </Typography>
      </Alert>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={submitting}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || isAlreadyTokenized}
          startIcon={submitting ? <CircularProgress size={16} /> : null}
        >
          {submitting ? 'Processing...' : (isAlreadyTokenized ? 'Already Tokenized' : 'Tokenize & Publish')}
        </Button>
      </Box>
    </Box>
  );
  
  // Render step content based on active step
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderLicenseTermsStep();
      case 1:
        return renderTokenSaleStep();
      case 2:
        return renderReviewPublishStep();
      default:
        return 'Unknown step';
    }
  };
  
  // Render header with title and breadcrumbs
  const renderHeader = () => (
    <Box sx={{ mb: 4 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/pro/dashboard" color="inherit">
          Creator Dashboard
        </MuiLink>
        <Typography color="text.primary">Tokenize</Typography>
      </Breadcrumbs>
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" component="h1">
          <TokenIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Tokenize Content
        </Typography>
        <Button
          component={Link}
          to="/pro/dashboard"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Back to Dashboard
        </Button>
      </Box>
      
      {isAlreadyTokenized && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <AlertTitle>Content Already Tokenized</AlertTitle>
          This content was tokenized during the upload process. You can review the settings below.
        </Alert>
      )}
    </Box>
  );
  
  // If user is not authenticated or not a verified pro, show error message
  if (!isAuthenticated || !isProVerified) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ pt: 4, pb: 8 }}>
          <Alert severity="error">
            <AlertTitle>Access Denied</AlertTitle>
            You need to be a verified Pro creator to access this page.
          </Alert>
          <Button
            variant="contained"
            component={Link}
            to="/pro/dashboard"
            sx={{ mt: 3 }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }
  
  // If successful submission, show success message
  if (success) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ pt: 4, pb: 8, textAlign: 'center' }}>
          <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Content Published Successfully!
          </Typography>
          <Typography variant="body1" paragraph>
            Your content has been tokenized and is now available in the marketplace.
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/pro/dashboard"
            sx={{ mt: 2 }}
          >
            Return to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ pt: 4, pb: 8 }}>
        {/* Skip confirmation dialog */}
        <Dialog
          open={skipDialogOpen}
          onClose={handleCloseSkipDialog}
        >
          <DialogTitle>Skip Tokenization?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Your content has been uploaded but will not be tokenized or published to the marketplace yet. 
              You can tokenize it later from your Creator Dashboard.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSkipDialog} color="primary">
              Cancel
            </Button>
            <Button onClick={handleSkipConfirm} color="secondary" variant="contained">
              Skip Tokenization
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" underline="hover" color="inherit">
            Home
          </MuiLink>
          <MuiLink component={Link} to="/pro/dashboard" underline="hover" color="inherit">
            Creator Dashboard
          </MuiLink>
          <Typography color="text.primary">Tokenize & Publish</Typography>
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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <TokenIcon sx={{ mr: 2, color: 'primary.main', fontSize: 36 }} />
          <Typography variant="h4" component="h1">
            Tokenize & Publish: {contentInfo.title}
          </Typography>
        </Box>
        
        {/* Error message if any */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}
        
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {TOKENIZE_STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* Step content */}
        <Paper sx={{ p: 3, mb: 3 }}>
          {getStepContent(activeStep)}
        </Paper>
        
        {/* Navigation buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Back
          </Button>
          
          <Box>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleOpenSkipDialog}
              sx={{ mr: 2 }}
            >
              Skip for Now
            </Button>
            
            {activeStep === TOKENIZE_STEPS.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                startIcon={submitting ? <CircularProgress size={20} /> : <PublicIcon />}
                disabled={submitting}
              >
                {submitting ? 'Publishing...' : 'Publish to Marketplace'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default TokenizePublishPage; 