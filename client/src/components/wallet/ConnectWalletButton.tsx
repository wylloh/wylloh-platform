import React, { useState, useEffect, useRef } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Typography, 
  Box, 
  CircularProgress,
  Link,
  Chip,
  Paper,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  AccountBalanceWallet as WalletIcon,
  OpenInNew as OpenInNewIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import { ethers } from 'ethers';

const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const ConnectWalletButton: React.FC = () => {
  const { connect, disconnect, account, active, chainId, isCorrectNetwork, switchNetwork, connecting, provider } = useWallet();
  const { isAuthenticated, login } = useAuth();
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState<boolean | null>(null);
  const [walletDebugInfo, setWalletDebugInfo] = useState<string>('');
  const [connectionIndicator, setConnectionIndicator] = useState({
    show: false,
    message: '',
    type: 'info' as 'info' | 'warning' | 'error' | 'success'
  });
  
  // Flag to prevent multiple auto-connect attempts
  const autoConnectAttemptedRef = useRef<boolean>(false);

  // Debug logs
  console.log('ConnectWalletButton rendered with:', { 
    account, 
    active, 
    chainId, 
    isCorrectNetwork,
    connecting, 
    provider: provider ? 'Provider exists' : 'No provider',
    window: typeof window !== 'undefined' ? 'Window exists' : 'No window'
  });

  // Check if MetaMask is installed
  useEffect(() => {
    const checkMetaMaskInstalled = () => {
      const { ethereum } = window as any;
      const isInstalled = !!ethereum && !!ethereum.isMetaMask;
      console.log('MetaMask installed:', isInstalled, ethereum);
      setIsMetaMaskInstalled(isInstalled);
    };

    checkMetaMaskInstalled();
  }, []);

  // Get balance when connected
  useEffect(() => {
    const getBalance = async () => {
      if (active && account && provider) {
        console.log('Fetching balance for account:', account);
        try {
          const rawBalance = await provider.getBalance(account);
          const formattedBalance = ethers.utils.formatEther(rawBalance);
          // Format to 4 decimal places
          const balanceToShow = parseFloat(formattedBalance).toFixed(4);
          console.log('Balance fetched:', balanceToShow);
          setBalance(balanceToShow);
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBalance(null);
        }
      } else {
        console.log('Cannot fetch balance, conditions not met:', { active, account, hasProvider: !!provider });
        setBalance(null);
      }
    };

    getBalance();
  }, [active, account, provider]);

  // Update debug display - only in development mode
  useEffect(() => {
    const info = {
      component: 'ConnectWalletButton',
      walletActive: active,
      walletAccount: account,
      walletType: getWalletDisplayName(account),
      timestamp: new Date().toISOString()
    };
    
    if (process.env.NODE_ENV === 'development') {
      setWalletDebugInfo(JSON.stringify(info, null, 2));
      console.log('Wallet Button Debug:', info);
    }
    
    // Auto-connect if MetaMask is detected and not already connected,
    // but only do this once to prevent infinite popups
    const { ethereum } = window as any;
    if (ethereum && ethereum.isMetaMask && !active && !autoConnectAttemptedRef.current && !connecting) {
      console.log('ConnectWalletButton - MetaMask detected but not connected, auto-connecting...');
      autoConnectAttemptedRef.current = true;
      connect().catch(err => {
        console.error('Auto connect error:', err);
        // Reset the flag after a timeout to allow a retry later
        setTimeout(() => {
          autoConnectAttemptedRef.current = false;
        }, 5000);
      });
    }
  }, [active, connect, connecting]);

  // Direct login attempt for recognized wallets - this is actually a good pattern for production
  useEffect(() => {
    // Only attempt if we have an account, are not authenticated, and active
    if (active && account && !isAuthenticated) {
      console.log('ConnectWalletButton - Attempting wallet auto-login for:', account);
      
      // Demo wallet mapping (lowercase for case-insensitivity)
      const demoWallets: Record<string, string> = {
        '0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1': 'pro@example.com',
        '0x8db97c7cece249c2b98bdc0226cc4c2a57bf52fc': 'user@example.com',
      };
      
      const accountLower = account.toLowerCase();
      if (demoWallets[accountLower]) {
        // We found a matching wallet address
        const email = demoWallets[accountLower];
        console.log(`ConnectWalletButton - Auto-login with wallet: ${getWalletDisplayName(account)}`);
        
        // Attempt login - this matches production Web3 behavior where connecting a wallet
        // automatically logs in the associated account
        login(email, 'password')
          .then(success => {
            console.log(`Auto-login ${success ? 'successful' : 'failed'} for ${email}`);
          })
          .catch(error => {
            console.error(`Auto-login error for ${email}:`, error);
          });
      } else {
        // In production, we would show a registration form for new wallets
        console.log('Unrecognized wallet - would prompt for registration in production');
      }
    }
  }, [active, account, isAuthenticated, login]);

  const handleClickOpen = () => {
    console.log('Opening wallet dialog');
    setOpen(true);
  };

  const handleClose = () => {
    console.log('Closing wallet dialog');
    setOpen(false);
  };

  const handleConnect = async () => {
    console.log('Connect wallet clicked, MetaMask installed:', isMetaMaskInstalled);
    if (!isMetaMaskInstalled) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    
    // Prevent rapid re-clicks
    if (connecting) {
      console.log('Already connecting, ignoring click');
      return;
    }
    
    // Reset the auto-connect attempt flag
    autoConnectAttemptedRef.current = false;
    
    console.log('Calling connect function');
    try {
      await connect();
      console.log('Connect function completed');
    } catch (error) {
      console.error('Error in handleConnect:', error);
    }
  };

  const handleDisconnect = () => {
    console.log('Disconnect wallet clicked');
    disconnect();
    handleClose();
  };

  const handleSwitchNetwork = async () => {
    console.log('Switch network clicked');
    await switchNetwork();
  };

  // Force re-render on window ethereum changes
  useEffect(() => {
    const handleEthereumChanged = () => {
      console.log('Ethereum changed, forcing re-render');
      // Force a re-render
      setBalance(null);
    };

    // Listen for account changes
    const { ethereum } = window as any;
    if (ethereum) {
      ethereum.on('accountsChanged', handleEthereumChanged);
      ethereum.on('chainChanged', handleEthereumChanged);
    }

    return () => {
      if (ethereum) {
        ethereum.removeListener('accountsChanged', handleEthereumChanged);
        ethereum.removeListener('chainChanged', handleEthereumChanged);
      }
    };
  }, []);

  // Get wallet display name (keep this functionality for the demo)
  const getWalletDisplayName = (address: string | null | undefined): string => {
    if (!address) return 'Not Connected';
    
    const lowerAddress = address.toLowerCase();
    if (lowerAddress === '0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1') {
      return 'Creator Wallet (Pro)';
    } else if (lowerAddress === '0x8db97c7cece249c2b98bdc0226cc4c2a57bf52fc') {
      return 'Consumer Wallet (User)';
    }
    
    return 'Unknown Wallet';
  };

  // Listen for wallet connection changes
  useEffect(() => {
    const handleWalletChanged = (event: Event) => {
      // Display indicator when wallet changes
      setConnectionIndicator({
        show: true,
        message: 'Wallet changed. Updating connection...',
        type: 'info'
      });
      
      // Hide after 5 seconds
      setTimeout(() => {
        setConnectionIndicator({
          show: false,
          message: '',
          type: 'info'
        });
      }, 5000);
    };
    
    window.addEventListener('wallet-account-changed', handleWalletChanged);
    
    return () => {
      window.removeEventListener('wallet-account-changed', handleWalletChanged);
    };
  }, []);
  
  // Show connection status changes
  useEffect(() => {
    if (active && account) {
      setConnectionIndicator({
        show: true,
        message: 'Wallet connected successfully',
        type: 'success'
      });
    } else if (!active && previousActive.current) {
      setConnectionIndicator({
        show: true,
        message: 'Wallet disconnected',
        type: 'warning'
      });
    }
    
    // Hide after 5 seconds
    const timer = setTimeout(() => {
      setConnectionIndicator({
        show: false,
        message: '',
        type: 'info'
      });
    }, 5000);
    
    // Track previous active state
    previousActive.current = active;
    
    return () => clearTimeout(timer);
  }, [active, account]);
  
  // Reference to track previous active state
  const previousActive = useRef(active);

  // Render Dialog content
  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<WalletIcon />}
        onClick={handleClickOpen}
        sx={{ position: 'relative' }}
      >
        {active && account ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isCorrectNetwork ? (
                <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />
              ) : (
                <WarningIcon sx={{ fontSize: 16, mr: 0.5, color: 'error.main' }} />
              )}
              {shortenAddress(account)}
            </Box>
          </Box>
        ) : (
          'Connect Wallet'
        )}
        
        {/* Connection indicator */}
        {connectionIndicator.show && (
          <Chip
            label={connectionIndicator.message}
            color={
              connectionIndicator.type === 'success' ? 'success' :
              connectionIndicator.type === 'warning' ? 'warning' :
              connectionIndicator.type === 'error' ? 'error' : 'info'
            }
            size="small"
            sx={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2,
              whiteSpace: 'nowrap'
            }}
          />
        )}
      </Button>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Wallet Connection
          {account && (
            <Chip 
              label={getWalletDisplayName(account)} 
              color={getWalletDisplayName(account).includes('Pro') ? "success" : "primary"}
              size="small" 
              sx={{ ml: 1 }} 
            />
          )}
        </DialogTitle>
        <DialogContent>
          {!isMetaMaskInstalled && (
            <DialogContentText>
              You need to install MetaMask to connect your wallet.
              <Button
                variant="outlined"
                color="primary"
                startIcon={<OpenInNewIcon />}
                onClick={() => window.open('https://metamask.io/download/', '_blank')}
                sx={{ ml: 2 }}
              >
                Install MetaMask
              </Button>
            </DialogContentText>
          )}

          {isMetaMaskInstalled && !active && (
            <DialogContentText>
              Connect your wallet to access the platform features.
            </DialogContentText>
          )}

          {active && account && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Connected Wallet</Typography>
                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                  {account}
                </Typography>
                {balance && (
                  <Typography variant="body2" color="textSecondary">
                    Balance: {balance} ETH
                  </Typography>
                )}
              </Box>

              {!isCorrectNetwork && (
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'warning.light', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WarningIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      You're on the wrong network. Please switch to connect to this application.
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={handleSwitchNetwork}
                    sx={{ mt: 1 }}
                  >
                    Switch Network
                  </Button>
                </Paper>
              )}

              {/* Debug info - only shown in development if explicitly enabled */}
              {process.env.NODE_ENV === 'development' && process.env.REACT_APP_SHOW_DEBUG === 'true' && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" component="pre" sx={{ 
                    fontSize: '0.7rem', 
                    bgcolor: 'grey.100', 
                    p: 1, 
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: '150px'
                  }}>
                    {walletDebugInfo}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {active && account ? (
            <Button onClick={handleDisconnect} color="error">
              Disconnect
            </Button>
          ) : (
            <Button 
              onClick={handleConnect} 
              color="primary" 
              disabled={!isMetaMaskInstalled || connecting}
              sx={{ 
                minWidth: '100px',
                position: 'relative'
              }}
            >
              {connecting ? (
                <>
                  <CircularProgress 
                    size={16} 
                    sx={{ 
                      position: 'absolute',
                      left: 10,
                      color: 'inherit'
                    }} 
                  />
                  <span style={{ marginLeft: '8px' }}>Connecting...</span>
                </>
              ) : 'Connect'}
            </Button>
          )}
          <Button onClick={handleClose} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ConnectWalletButton;