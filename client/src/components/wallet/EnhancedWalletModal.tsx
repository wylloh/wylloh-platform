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
  const { login, register, isAuthenticated } = useAuth();
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
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
      console.error('Wallet connection error:', err);
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
        
        // For demo purposes, we'll just use the email/password login
        const success = await login(loginEmail, password);
        
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
        
        // For demo purposes, we'll register with username/email and associate with wallet
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
            <Typography variant="h6" align="center" gutterBottom>
              Choose how you want to use Wylloh
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Box mb={3}>
              <Alert severity="info">
                Connecting your wallet helps us provide a personalized experience and remember your preferences.
              </Alert>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
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
                Just Browsing
              </Typography>
              <Typography variant="body2" align="center">
                Browse without saving preferences
              </Typography>
              <Divider sx={{ width: '100%', my: 2 }} />
              <Typography variant="body2" align="center" color="text.secondary">
                • Limited features
                <br />
                • No personalization
                <br />
                • Preferences not saved
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' },
                border: '1px solid rgba(25, 118, 210, 0.5)',
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
              <Typography variant="body2" align="center">
                Save preferences without creating an account
              </Typography>
              <Divider sx={{ width: '100%', my: 2 }} />
              <Typography variant="body2" align="center" color="primary">
                • Remember library layout
                <br />
                • View purchased tokens
                <br />
                • Personalized experience
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' },
              }}
              onClick={() => setMode('login')}
            >
              <LoginIcon fontSize="large" color="primary" />
              <Typography variant="h6" align="center" gutterBottom mt={2}>
                Connect & Log In
              </Typography>
              <Typography variant="body2" align="center">
                Full access with your existing account
              </Typography>
              <Divider sx={{ width: '100%', my: 2 }} />
              <Typography variant="body2" align="center" color="text.secondary">
                • All platform features
                <br />
                • Standard/Pro permissions
                <br />
                • Multiple wallet support
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} mt={2}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Why connect a wallet?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  <ListItem>
                    <ListItemIcon><PaletteIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Save Your Preferences" 
                      secondary="Your library layout and settings are saved securely with your wallet identity."
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><VideoLibraryIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Manage Your Digital Tokens" 
                      secondary="Easily view and manage all your content tokens in one place."
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Access Control" 
                      secondary="Your wallet determines if you have Standard or Pro permissions for content creation."
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><SwapIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Seamless Transactions" 
                      secondary="Purchase, trade or sell your content tokens with just a few clicks."
                    />
                  </ListItem>
                </List>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Connecting your wallet does not grant us access to your funds or private keys. It's simply a secure way to identify you.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Grid>
          
          <Grid item xs={12} mt={2}>
            <Box display="flex" justifyContent="center">
              <Button 
                variant="text" 
                color="primary"
                onClick={() => setMode('register')}
              >
                Don't have an account? Sign up with wallet
              </Button>
            </Box>
          </Grid>
        </Grid>
      );
    }
    
    // Login mode
    if (mode === 'login') {
      return (
        <Box>
          <Typography variant="h6" align="center" gutterBottom>
            Log in with your wallet
          </Typography>
          
          {!active ? (
            <Box textAlign="center" my={3}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<WalletIcon />}
                onClick={handleConnectWallet}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Connect Wallet'}
              </Button>
            </Box>
          ) : (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Wallet connected: {account?.slice(0, 6)}...{account?.slice(-4)}
              </Alert>
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleLogin}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Log In'}
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
                helperText="You can add this later if you prefer"
                InputProps={{
                  startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  What happens when you register with just your wallet:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                  <li>Your preferences and library layout will be saved</li>
                  <li>You can access your content tokens from any device</li>
                  <li>You can add an email later for account recovery</li>
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
        <Box display="flex" alignItems="center" justifyContent="center">
          <Typography variant="h5" component="div">
            Welcome to Wylloh
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