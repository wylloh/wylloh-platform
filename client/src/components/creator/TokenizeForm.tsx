import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Slider,
  InputAdornment,
  Button,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
  FormControlLabel,
  Switch,
  Grid,
  Chip,
} from '@mui/material';
import {
  TokenOutlined as TokenIcon,
  Info as InfoIcon,
  Sell as SellIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

interface TokenizeFormProps {
  contentId: string;
  contentTitle: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface RightsThreshold {
  quantity: number;
  type: string;
  description: string;
}

const TokenizeForm: React.FC<TokenizeFormProps> = ({ 
  contentId, 
  contentTitle,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Token parameters
  const [initialSupply, setInitialSupply] = useState<number>(1000);
  const [royaltyPercentage, setRoyaltyPercentage] = useState<number>(10);
  const [initialPrice, setInitialPrice] = useState<string>('0.01');
  const [advancedMode, setAdvancedMode] = useState(false);
  
  // Rights thresholds - default values
  const [rightsThresholds, setRightsThresholds] = useState<RightsThreshold[]>([
    { quantity: 1, type: 'personal', description: 'Personal Viewing' },
    { quantity: 100, type: 'small_venue', description: 'Small Venue (50 seats)' },
    { quantity: 5000, type: 'streaming', description: 'Streaming Platform' },
    { quantity: 10000, type: 'theatrical', description: 'Theatrical Exhibition' }
  ]);
  
  // Handle token creation
  const handleCreateToken = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would call an API to tokenize the content
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Success!
      setSuccess(true);
      
      // Call success callback after a delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to tokenize content');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle threshold update
  const handleUpdateThreshold = (index: number, field: keyof RightsThreshold, value: string | number): void => {
    const newThresholds = [...rightsThresholds];
    if (field === 'quantity') {
      newThresholds[index].quantity = value as number;
    } else if (field === 'type') {
      newThresholds[index].type = value as string;
    } else if (field === 'description') {
      newThresholds[index].description = value as string;
    }
    setRightsThresholds(newThresholds);
  };
  
  if (success) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
          <CheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          
          <Typography variant="h5" gutterBottom>
            Content Tokenized Successfully!
          </Typography>
          
          <Typography variant="body1" paragraph>
            Your content has been tokenized and is now ready for the marketplace.
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={onSuccess}
          >
            Return to Dashboard
          </Button>
        </Box>
      </Paper>
    );
  }
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom display="flex" alignItems="center">
        <TokenIcon sx={{ mr: 1 }} /> 
        Tokenize Content
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>About Tokenization</AlertTitle>
        <Typography variant="body2">
          Tokenizing your content creates a blockchain-based license that can be traded on the marketplace.
          This process is irreversible and will make your content available for purchase.
        </Typography>
      </Alert>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Content Details
        </Typography>
        <Typography variant="body1">
          {contentTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ID: {contentId}
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Initial Supply
          </Typography>
          
          <TextField
            fullWidth
            type="number"
            value={initialSupply}
            onChange={(e) => setInitialSupply(Number(e.target.value))}
            InputProps={{
              endAdornment: <InputAdornment position="end">tokens</InputAdornment>,
            }}
            helperText="Total number of license tokens to create"
          />
          
          <Box sx={{ px: 1, mt: 2 }}>
            <Slider
              value={initialSupply}
              onChange={(_, newValue) => setInitialSupply(newValue as number)}
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
            value={royaltyPercentage}
            onChange={(e) => setRoyaltyPercentage(Number(e.target.value))}
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
              value={royaltyPercentage}
              onChange={(_, newValue) => setRoyaltyPercentage(newValue as number)}
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
            value={initialPrice}
            onChange={(e) => setInitialPrice(e.target.value)}
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
      
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch 
              checked={advancedMode} 
              onChange={(e) => setAdvancedMode(e.target.checked)} 
            />
          }
          label="Advanced Settings"
        />
      </Box>
      
      {advancedMode && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Rights Thresholds
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Rights thresholds determine what rights are granted based on the number of tokens owned.
            </Typography>
          </Alert>
          
          {rightsThresholds.map((threshold, index) => (
            <Box 
              key={index} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                gap: 2,
                flexWrap: 'wrap'
              }}
            >
              <TextField
                label="Quantity"
                type="number"
                size="small"
                value={threshold.quantity}
                onChange={(e) => handleUpdateThreshold(index, 'quantity', Number(e.target.value))}
                sx={{ width: 100 }}
              />
              
              <TextField
                label="Description"
                size="small"
                value={threshold.description}
                onChange={(e) => handleUpdateThreshold(index, 'description', e.target.value)}
                sx={{ flexGrow: 1 }}
              />
              
              <Chip 
                label={threshold.type} 
                color={index === 0 ? "primary" : "default"} 
                variant={index === 0 ? "filled" : "outlined"}
              />
            </Box>
          ))}
        </Box>
      )}
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          variant="outlined" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Button 
          variant="contained"
          color="primary"
          onClick={handleCreateToken}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SellIcon />}
        >
          {loading ? 'Processing...' : 'Create Token'}
        </Button>
      </Box>
    </Paper>
  );
};

export default TokenizeForm;