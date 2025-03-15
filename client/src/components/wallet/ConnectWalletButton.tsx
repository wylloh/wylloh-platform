import React, { useState, useEffect } from 'react';
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
  Divider
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

  // Add debug effect
  useEffect(() => {
    const info = {
      component: 'ConnectWalletButton',
      walletActive: active,
      walletAccount: account,
      accountType: account ? typeof account : 'null',
      accountLength: account ? account.length : 0,
      timestamp: new Date().toISOString()
    };
    
    setWalletDebugInfo(JSON.stringify(info, null, 2));
    console.log('Wallet Button Debug:', info);
    
    // Directly call connect if we have MetaMask but no connection yet
    if ((window as any).ethereum && !active) {
      console.log('ConnectWalletButton - MetaMask detected but not connected, auto-connecting...');
      connect().catch(err => console.error('Auto connect error:', err));
    }
  }, [active, account, connect]);

  // Direct login attempt for recognized wallets
  useEffect(() => {
    // Only attempt if we have an account, are not authenticated, and active
    if (active && account && !isAuthenticated) {
      console.log('ConnectWalletButton - Attempting direct wallet matching for:', account);
      
      // Demo wallet mapping (lowercase for case-insensitivity)
      const demoWallets: Record<string, string> = {
        '0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1': 'pro@example.com',
        '0x8db97c7cece249c2b98bdc0226cc4c2a57bf52fc': 'user@example.com',
      };
      
      const accountLower = account.toLowerCase();
      if (demoWallets[accountLower]) {
        // We found a matching wallet address
        const email = demoWallets[accountLower];
        console.log(`ConnectWalletButton - Found matching wallet! Logging in as: ${email}`);
        
        // Attempt login
        login(email, 'password')
          .then(success => {
            console.log(`ConnectWalletButton - Login attempt result for ${email}:`, success);
          })
          .catch(error => {
            console.error(`ConnectWalletButton - Login error for ${email}:`, error);
          });
      } else {
        console.log('ConnectWalletButton - No matching wallet found in:', Object.keys(demoWallets));
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

  // Render connecting state
  if (connecting) {
    console.log('Rendering connecting state');
    return (
      <Button
        variant="contained"
        color="primary"
        startIcon={<CircularProgress size={20} color="inherit" />}
        disabled
      >
        Connecting...
      </Button>
    );
  }

  // Render connected state
  if (active && account) {
    console.log('Rendering connected state for account:', account);
    return (
      <>
        <Button
          variant="contained"
          color={isCorrectNetwork ? "primary" : "error"}
          startIcon={<WalletIcon />}
          onClick={handleClickOpen}
          sx={{ textTransform: 'none' }}
        >
          {isCorrectNetwork ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />
              {shortenAddress(account)}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WarningIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Wrong Network
            </Box>
          )}
        </Button>
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Wallet Connected
              <Chip 
                icon={<CheckCircleIcon />} 
                label="Connected" 
                color="success" 
                size="small" 
                variant="outlined" 
              />
            </Box>
          </DialogTitle>
          <DialogContent>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Wallet Address
              </Typography>
              <Typography variant="body2" component="div" sx={{ wordBreak: "break-all", fontFamily: "monospace" }}>
                {account}
              </Typography>
            </Paper>
            
            {balance !== null && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Balance
                </Typography>
                <Typography variant="h6">
                  {balance} ETH
                </Typography>
              </Paper>
            )}
            
            {!isCorrectNetwork && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography color="error" variant="subtitle1" gutterBottom>
                  <WarningIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  You are connected to the wrong network
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSwitchNetwork}
                  sx={{ mt: 1 }}
                >
                  Switch to Correct Network
                </Button>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
            <Button onClick={handleDisconnect} color="error">Disconnect</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // Render not connected state
  console.log('Rendering not connected state');
  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<WalletIcon />}
        onClick={handleConnect}
      >
        Connect Wallet
      </Button>
      
      {/* MetaMask not installed dialog */}
      {isMetaMaskInstalled === false && open && (
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>MetaMask Not Detected</DialogTitle>
          <DialogContent>
            <DialogContentText>
              To connect your wallet, you need to install the MetaMask browser extension.
            </DialogContentText>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="contained" 
                color="primary"
                startIcon={<OpenInNewIcon />}
                onClick={() => window.open('https://metamask.io/download/', '_blank')}
              >
                Install MetaMask
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          backgroundColor: 'rgba(0,0,0,0.8)', 
          color: 'white',
          padding: '8px',
          zIndex: 9999,
          fontSize: '10px',
          maxWidth: '300px',
          maxHeight: '200px',
          overflow: 'auto',
          fontFamily: 'monospace'
        }}>
          <pre>{walletDebugInfo}</pre>
        </div>
      )}
    </>
  );
};

export default ConnectWalletButton;