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
import EnhancedWalletModal from './EnhancedWalletModal';

const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const ConnectWalletButton: React.FC = () => {
  const { 
    connect, 
    disconnect, 
    account, 
    active, 
    chainId, 
    isCorrectNetwork, 
    switchNetwork, 
    connecting, 
    provider,
    isMetaMaskInstalled: contextIsMetaMaskInstalled,
    shouldShowAutoConnectPrompt,
    setShouldShowAutoConnectPrompt
  } = useWallet();
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
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  
  // Flag to prevent multiple auto-connect attempts
  const autoConnectAttemptedRef = useRef<boolean>(false);
  
  // Flag to track whether user has seen the modal
  const hasSeenModalRef = useRef<boolean>(false);

  // Debug logs
  console.log('ConnectWalletButton rendered with:', { 
    account, 
    active, 
    chainId, 
    isCorrectNetwork,
    connecting, 
    provider: provider ? 'Provider exists' : 'No provider',
    window: typeof window !== 'undefined' ? 'Window exists' : 'No window',
    contextIsMetaMaskInstalled,
    shouldShowAutoConnectPrompt
  });

  // Show auto-connect modal when shouldShowAutoConnectPrompt changes
  useEffect(() => {
    if (shouldShowAutoConnectPrompt && !active && !hasSeenModalRef.current) {
      console.log('ConnectWalletButton - Auto-showing wallet modal based on WalletContext flag');
      setWalletModalOpen(true);
      hasSeenModalRef.current = true;
      // Mark flag as seen in WalletContext
      setShouldShowAutoConnectPrompt(false);
      // Set flag in localStorage to avoid showing modal again
      localStorage.setItem('hasSeenWalletModal', 'true');
    }
  }, [shouldShowAutoConnectPrompt, active, setShouldShowAutoConnectPrompt]);

  // Check if MetaMask is installed - use value from context if available
  useEffect(() => {
    if (contextIsMetaMaskInstalled !== undefined) {
      setIsMetaMaskInstalled(contextIsMetaMaskInstalled);
    } else {
      const checkMetaMaskInstalled = () => {
        const { ethereum } = window as any;
        const isInstalled = !!ethereum && !!ethereum.isMetaMask;
        console.log('MetaMask installed check in button:', isInstalled);
        setIsMetaMaskInstalled(isInstalled);
      };
      checkMetaMaskInstalled();
    }
  }, [contextIsMetaMaskInstalled]);

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
  }, [active, account]);

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

  // Handler for opening the wallet modal
  const handleOpenWalletModal = () => {
    setWalletModalOpen(true);
    hasSeenModalRef.current = true;
    // Once user manually opens modal, we shouldn't show the auto-connect prompt
    setShouldShowAutoConnectPrompt(false);
    localStorage.setItem('hasSeenWalletModal', 'true');
  };

  // Handler for closing the wallet modal
  const handleCloseWalletModal = () => {
    setWalletModalOpen(false);
  };

  // Show different button states based on connection status
  const renderButton = () => {
    if (active && account) {
      // Connected state
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Chip
            icon={<WalletIcon />}
            label={shortenAddress(account)}
            variant="outlined"
            onClick={handleDisconnect}
            color={isCorrectNetwork ? 'primary' : 'error'}
            sx={{ 
              borderRadius: '16px',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
              },
            }}
          />
        </Box>
      );
    } else {
      // Not connected state
      return (
        <Button
          variant="outlined"
          startIcon={<WalletIcon />}
          onClick={handleOpenWalletModal}
          sx={{ borderRadius: '16px' }}
        >
          Connect
        </Button>
      );
    }
  };

  return (
    <>
      {renderButton()}
      
      {connectionIndicator.show && (
        <Box 
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 2000,
            backgroundColor: connectionIndicator.type === 'success' ? 'success.light' : 
                          connectionIndicator.type === 'warning' ? 'warning.light' : 
                          connectionIndicator.type === 'error' ? 'error.light' : 'info.light',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {connectionIndicator.type === 'success' && <CheckCircleIcon sx={{ mr: 1 }} />}
          {connectionIndicator.type === 'warning' && <WarningIcon sx={{ mr: 1 }} />}
          <Typography variant="body2">{connectionIndicator.message}</Typography>
        </Box>
      )}
      
      <EnhancedWalletModal
        open={walletModalOpen}
        onClose={handleCloseWalletModal}
      />
    </>
  );
};

export default ConnectWalletButton;