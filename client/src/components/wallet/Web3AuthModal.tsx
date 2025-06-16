import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Link as MuiLink,
  Divider
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Web3AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const Web3AuthModal: React.FC<Web3AuthModalProps> = ({ open, onClose }) => {
  const { connect, account, active } = useWallet();
  const { authenticateWithWallet, createWalletProfile, loading, error } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'connect' | 'choice' | 'create-profile' | 'success'>('connect');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('connect');
      setUsername('');
      setEmail('');
      setTermsAccepted(false);
      setLocalError(null);
      setConnecting(false);
    }
  }, [open]);

  // Handle wallet connection success
  useEffect(() => {
    if (active && account && step === 'connect') {
      handleWalletConnected();
    }
  }, [active, account, step]);

  const handleWalletConnected = async () => {
    if (!account) return;

    console.log('Web3AuthModal - Wallet connected, checking for existing account:', account);
    
    // Try to authenticate with existing wallet account
    const existingAuth = await authenticateWithWallet(account);
    
    if (existingAuth) {
      // User already exists, authentication successful
      setStep('success');
      setTimeout(() => {
        onClose();
        navigate('/profile'); // Take them to their profile
      }, 1500);
    } else {
      // New wallet, show choice
      setStep('choice');
    }
  };

  const handleConnectWallet = async () => {
    try {
      setConnecting(true);
      setLocalError(null);
      
      if (!window.ethereum) {
        window.open('https://metamask.io/download/', '_blank');
        return;
      }
      
      await connect();
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      
      // Handle user rejection gracefully
      if (err.code === 4001 || err.message?.includes('rejected')) {
        onClose();
        return;
      }
      
      setLocalError('Failed to connect wallet. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleBrowseAsGuest = () => {
    onClose();
    // User can browse without creating an account
  };

  const handleCreateProfile = async () => {
    if (!account) return;
    
    setLocalError(null);
    
    if (!username.trim()) {
      setLocalError('Username is required');
      return;
    }
    
    if (!termsAccepted) {
      setLocalError('You must accept the terms and conditions');
      return;
    }
    
    const success = await createWalletProfile(account, username, email || undefined);
    
    if (success) {
      setStep('success');
      setTimeout(() => {
        onClose();
        navigate('/profile');
      }, 1500);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'connect':
        return (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <WalletIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Connect Your Wallet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Connect your wallet to access Wylloh. Your wallet address serves as your unique identity.
            </Typography>
            
            {!window.ethereum ? (
              <Alert severity="warning" sx={{ mb: 3 }}>
                MetaMask is required to connect your wallet.
              </Alert>
            ) : null}
            
            <Button
              variant="contained"
              size="large"
              startIcon={<WalletIcon />}
              onClick={handleConnectWallet}
              disabled={connecting}
              sx={{ mt: 2 }}
            >
              {connecting ? <CircularProgress size={24} /> : 'Connect MetaMask'}
            </Button>
          </Box>
        );

      case 'choice':
        return (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Wallet Connected!
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </Typography>
            
            <Typography variant="body1" paragraph sx={{ mt: 3 }}>
              This is a new wallet. Would you like to create a profile or browse as a guest?
            </Typography>
            
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<PersonIcon />}
                onClick={() => setStep('create-profile')}
              >
                Create Profile
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleBrowseAsGuest}
              >
                Browse as Guest
              </Button>
            </Box>
          </Box>
        );

      case 'create-profile':
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ textAlign: 'center' }}>
              Create Your Profile
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ textAlign: 'center' }}>
              Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
            </Typography>
            
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              helperText="Choose a unique username for your profile"
            />
            
            <TextField
              fullWidth
              label="Email (Optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              helperText="Only used for important platform communications"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2">
                  I accept the{' '}
                  <MuiLink href="/terms" target="_blank">
                    Terms of Service
                  </MuiLink>
                  {' '}and{' '}
                  <MuiLink href="/privacy" target="_blank">
                    Privacy Policy
                  </MuiLink>
                </Typography>
              }
              sx={{ mt: 2 }}
            />
            
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleCreateProfile}
              disabled={loading || !username.trim() || !termsAccepted}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Profile'}
            </Button>
          </Box>
        );

      case 'success':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Welcome to Wylloh!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your wallet profile has been created successfully.
            </Typography>
            <CircularProgress sx={{ mt: 3 }} />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={step === 'success' ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1
        }
      }}
    >
      <DialogContent>
        {(error || localError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {localError || error}
          </Alert>
        )}
        
        {renderContent()}
      </DialogContent>
      
      {step !== 'success' && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default Web3AuthModal; 