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
  Warning as WarningIcon,
  Person as PersonIcon
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
  const { isAuthenticated, user, login } = useAuth();
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
  
  // Reference to track previous active state
  const previousActive = useRef(active);

  // Enhanced debug logs for connection state
  console.log('🔍 ConnectWalletButton DEBUG:', { 
    account, 
    active, 
    chainId, 
    isCorrectNetwork,
    connecting, 
    isAuthenticated,
    username: user?.username,
    provider: provider ? 'Provider exists' : 'No provider',
    contextIsMetaMaskInstalled,
    shouldShowAutoConnectPrompt,
    timestamp: new Date().toISOString()
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
      isAuthenticated,
      username: user?.username,
      timestamp: new Date().toISOString()
    };
    
    if (process.env.NODE_ENV === 'development') {
      setWalletDebugInfo(JSON.stringify(info, null, 2));
      console.log('🔍 Wallet Button Debug:', info);
    }
  }, [active, account, isAuthenticated, user?.username]);

  // Web3 authentication is handled by Web3AuthManager - no auto-login logic needed here

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
    
    try {
      await connect();
      console.log('✅ Wallet connection successful');
    } catch (error) {
      console.error('❌ Error in handleConnect:', error);
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

  // Get wallet display name - production version
  const getWalletDisplayName = (address: string | null | undefined): string => {
    if (!address) return 'Not Connected';
    
    // In production, just show the wallet address
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Listen for wallet connection changes - only show for actual changes
  useEffect(() => {
    let lastAccount = account;
    
    const handleWalletChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newAccount = customEvent.detail?.account;
      
      // Only show indicator if this is actually a different account
      if (newAccount && newAccount !== lastAccount) {
        lastAccount = newAccount;
        
        setConnectionIndicator({
          show: true,
          message: 'Wallet changed. Updating connection...',
          type: 'info'
        });
        
        // Hide after 3 seconds
        setTimeout(() => {
          setConnectionIndicator({
            show: false,
            message: '',
            type: 'info'
          });
        }, 3000);
      }
    };
    
    window.addEventListener('wallet-account-changed', handleWalletChanged);
    
    return () => {
      window.removeEventListener('wallet-account-changed', handleWalletChanged);
    };
  }, [account]);
  
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

  // Enhanced button rendering with proper state handling
  const renderButton = () => {
    console.log('🎨 Rendering button with state:', { active, account, isAuthenticated, username: user?.username });
    
    // Loading state
    if (connecting) {
      return (
        <Button
          variant="outlined"
          disabled
          startIcon={<CircularProgress size={16} />}
          sx={{ borderRadius: '16px' }}
        >
          Connecting...
        </Button>
      );
    }
    
    // Connected and authenticated - show username
    if (active && account && isAuthenticated && user?.username) {
      return (
        <Chip
          icon={<PersonIcon />}
          label={user.username}
          variant="outlined"
          onClick={handleDisconnect}
          color="primary"
          sx={{ 
            borderRadius: '16px',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
            },
          }}
        />
      );
    }
    
    // Connected but not authenticated - show wallet address
    if (active && account) {
      return (
        <Chip
          icon={<WalletIcon />}
          label={shortenAddress(account)}
          variant="outlined"
          onClick={handleDisconnect}
          color={isCorrectNetwork ? 'secondary' : 'error'}
          sx={{ 
            borderRadius: '16px',
            '&:hover': {
              backgroundColor: 'rgba(156, 39, 176, 0.08)',
            },
          }}
        />
      );
    }
    
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
  };

  return (
    <>
      {renderButton()}
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ position: 'fixed', top: 10, right: 10, zIndex: 9999, maxWidth: 300 }}>
          <Paper sx={{ p: 1, fontSize: '0.7rem', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white' }}>
            <Typography variant="caption">ConnectWalletButton Debug:</Typography>
            <pre style={{ fontSize: '0.6rem', margin: 0, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify({
                active,
                account: account ? shortenAddress(account) : null,
                isAuthenticated,
                username: user?.username,
                connecting
              }, null, 2)}
            </pre>
          </Paper>
        </Box>
      )}
      
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