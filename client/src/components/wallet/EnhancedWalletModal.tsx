import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Divider,
  TextField,
  Paper,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  Link,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Visibility as VisibilityIcon,
  Login as LoginIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  VideoLibrary as VideoLibraryIcon,
  Security as SecurityIcon,
  SwapHoriz as SwapIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth, RegistrationData } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface EnhancedWalletModalProps {
  open: boolean;
  onClose: () => void;
}

const EnhancedWalletModal: React.FC<EnhancedWalletModalProps> = ({ open, onClose }) => {
  const { connect, account, active, provider } = useWallet();
  const { login, register, isAuthenticated, authenticateWithWallet } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mode selection states
  const [mode, setMode] = useState<'browse' | 'connect' | 'login' | 'register' | null>(null);
  
  // Registration form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration flow steps
  const [activeStep, setActiveStep] = useState(0);
  const registrationSteps = ['Connect Wallet', 'Create Account'];
  
  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && !!(window as any).ethereum?.isMetaMask;
  
  // Handle browsing as guest
  const handleBrowseAsGuest = () => {
    setMode('browse');
    // Close the modal and let the user browse without connecting
    setTimeout(onClose, 500);
  };
  
  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!isMetaMaskInstalled) {
        window.open('https://metamask.io/download/', '_blank');
        return;
      }
      
      await connect();
      
      // If connecting for registration, move to next step
      if (mode === 'register') {
        setActiveStep(1);
      } else {
        setMode('connect');
        setTimeout(onClose, 500);
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      
      // Handle user rejection specifically
      if (err.code === 4001 || err.message?.includes('rejected') || err.message?.includes('denied') || err.message?.includes('User rejected')) {
        // User cancelled - close modal instead of showing error
        onClose();
        return;
      }
      
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle login with connected wallet
  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (active && account) {
        // In a real implementation, this would create a signature with the wallet
        // and send it to the backend for authentication
        
        // Use Web3 wallet-based authentication instead of email/password
        const success = await authenticateWithWallet(account);
        
        if (success) {
          setMode('login');
          setTimeout(() => {
            onClose();
            navigate('/');
          }, 500);
        } else {
          throw new Error('Login failed. Please check your credentials.');
        }
      } else {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle wallet-based registration
  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!termsAccepted) {
        setError('You must accept the terms and conditions to continue.');
        return;
      }
      
      if (!username) {
        setError('Username is required.');
        return;
      }
      
      if (active && account) {
        // Create registration data with optional email
        const registrationData: RegistrationData = {
          username,
          walletAddress: account
        };
        
        // Only include email if provided
        if (email && email.trim() !== '') {
          registrationData.email = email;
        }
        
        // Register using Web3 wallet-based registration
        const success = await register(registrationData);
        
        if (success) {
          setMode('register');
          setTimeout(() => {
            onClose();
            navigate('/');
          }, 500);
        } else {
          throw new Error('Registration failed. Please try again.');
        }
      } else {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Render different content based on mode
  const renderContent = () => {
    // Initial selection screen
    if (!mode) {
      return (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 600 }}>
              Start Your Collection
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" paragraph>
              Your wallet is your movie vault. Connect to buy, trade, and manage your digital film collection.
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' },
                border: '2px solid rgba(25, 118, 210, 0.5)',
              }}
              onClick={() => {
                setMode('connect');
                handleConnectWallet();
              }}
            >
              <WalletIcon fontSize="large" color="primary" />
              <Typography variant="h6" align="center" gutterBottom mt={2}>
                Connect Wallet
              </Typography>
              <Typography variant="body2" align="center" paragraph>
                Recommended for Web3 users
              </Typography>
              <Divider sx={{ width: '100%', my: 2 }} />
              <Typography variant="body2" align="center" color="primary">
                • Buy & trade movie tokens
                <br />
                • True digital ownership
                <br />
                • Resell your collection
                <br />
                • No passwords needed
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' },
              }}
              onClick={handleBrowseAsGuest}
            >
              <VisibilityIcon fontSize="large" color="primary" />
              <Typography variant="h6" align="center" gutterBottom mt={2}>
                Browse as Guest
              </Typography>
              <Typography variant="body2" align="center" paragraph>
                New to Web3? Start here
              </Typography>
              <Divider sx={{ width: '100%', my: 2 }} />
              <Typography variant="body2" align="center" color="text.secondary">
                • Browse movie catalog
                <br />
                • Learn about ownership
                <br />
                • See how it works
                <br />
                • Connect later to buy
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} mt={2}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>New to crypto wallets?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" paragraph>
                  A crypto wallet is like a digital ID that lets you securely interact with blockchain applications. 
                  It doesn't store your money - it stores the keys that prove you own your digital assets.
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Secure & Private" 
                      secondary="Only you control your wallet - we never have access to your funds or private keys."
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><VideoLibraryIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="True Ownership" 
                      secondary="Your purchased content belongs to you forever - it can't be revoked or removed."
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SwapIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Transferable Assets" 
                      secondary="Sell, trade, or gift your content to others - you have full control."
                    />
                  </ListItem>
                </List>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Don't have a wallet yet?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    We recommend MetaMask - it's free, secure, and easy to use. 
                    <Button 
                      variant="text" 
                      size="small" 
                      onClick={() => window.open('https://metamask.io/download/', '_blank')}
                      sx={{ ml: 1 }}
                    >
                      Get MetaMask
                    </Button>
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      );
    }
    
    // Login mode - Web3-only authentication
    if (mode === 'login') {
      return (
        <Box>
          <Typography variant="h6" align="center" gutterBottom>
            Connect Your Wallet
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Wylloh uses Web3 wallet authentication. No passwords needed!
          </Typography>
          
          {!active ? (
            <Box textAlign="center" my={3}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<WalletIcon />}
                onClick={handleConnectWallet}
                disabled={loading}
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : 'Connect Wallet'}
              </Button>
            </Box>
          ) : (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                ✅ Wallet Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
              </Alert>
              
              <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
                Your wallet is connected! The system will automatically authenticate you.
              </Typography>
              
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => onClose()}
                sx={{ mt: 2 }}
              >
                Continue to Platform
              </Button>
            </Box>
          )}
        </Box>
      );
    }
    
    // Registration mode
    if (mode === 'register') {
      return (
        <Box>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {registrationSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {activeStep === 0 ? (
            // Step 1: Connect wallet
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                Connect your wallet to continue
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Your wallet address serves as your unique identifier, helping us save your preferences and manage your content access.
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<WalletIcon />}
                onClick={handleConnectWallet}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Connect Wallet'}
              </Button>
            </Box>
          ) : (
            // Step 2: Create account
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Wallet connected: {account?.slice(0, 6)}...{account?.slice(-4)}
              </Alert>
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
              
              <TextField
                margin="normal"
                fullWidth
                id="email"
                label="Email Address (Optional)"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                helperText="Only for important communications - you can skip this"
                InputProps={{
                  startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  What happens when you connect with just your wallet:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                  <li>Your preferences and library layout will be saved</li>
                  <li>You can access your content tokens from any device</li>
                  <li>Email is optional - only for Pro verification updates</li>
                  <li>Full platform access without traditional passwords</li>
                </Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to the{' '}
                    <Link href="#" target="_blank">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="#" target="_blank">
                      Privacy Policy
                    </Link>
                  </Typography>
                }
                sx={{ mt: 2 }}
              />
              
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleRegister}
                disabled={loading || !termsAccepted || !username}
                sx={{ mt: 3 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Create Account'}
              </Button>
            </Box>
          )}
        </Box>
      );
    }
    
    return null;
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="center" sx={{ pb: 1 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            Welcome to Wylloh
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" justifyContent="center">
          <Typography variant="body2" color="text.secondary" align="center">
            Own movies like never before. Buy, trade, and truly possess your collection.
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {renderContent()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnhancedWalletModal; 