import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { useWeb3React, Web3ReactProvider } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { ethers } from 'ethers';
import { blockchainService } from '../services/blockchain.service';

// Import the generated JSON configuration
import deployedAddresses from '../config/deployedAddresses.json';
import polygonAddresses from '../config/polygonAddresses.json';

// Add Snackbar for notifications
import { 
  Snackbar, 
  Alert, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';

// Define chain IDs for supported networks
const POLYGON_MAINNET_ID = 137;
// For local development (if needed)
const GANACHE_ID = 1337;

// Define chain ID for the app
// For production deployment, use Polygon mainnet
const CHAIN_ID = POLYGON_MAINNET_ID;

console.log('WalletContext initialized with CHAIN_ID:', CHAIN_ID);

// Configure the connectors
const injected = new InjectedConnector({
      supportedChainIds: [POLYGON_MAINNET_ID, GANACHE_ID],
});

const walletconnect = new WalletConnectConnector({
  rpc: {
    [POLYGON_MAINNET_ID]: 'https://polygon-rpc.com',
    // Development network configuration
    [GANACHE_ID]: process.env.REACT_APP_WEB3_PROVIDER || 'https://polygon-rpc.com',
  },
  qrcode: true,
});

interface WalletContextType {
  connect: () => Promise<void>;
  disconnect: () => void;
  account: string | null | undefined;
  chainId: number | undefined;
  active: boolean;
  provider: ethers.providers.Web3Provider | null;
  isCorrectNetwork: boolean;
  switchNetwork: () => Promise<void>;
  connecting: boolean;
  walletModalOpen: boolean;
  setWalletModalOpen: (open: boolean) => void;
  setSkipAutoConnect: (skip: boolean) => void;
  skipAutoConnect: boolean;
  isMetaMaskInstalled: boolean;
  shouldShowAutoConnectPrompt: boolean;
  setShouldShowAutoConnectPrompt: (show: boolean) => void;
}

const WalletContext = createContext<WalletContextType>({
  // Provide default implementation
  connect: async () => {},
  disconnect: () => {},
  account: null,
  chainId: undefined,
  active: false,
  provider: null,
  isCorrectNetwork: false,
  switchNetwork: async () => {},
  connecting: false,
  walletModalOpen: false,
  setWalletModalOpen: () => {},
  setSkipAutoConnect: () => {},
  skipAutoConnect: false,
  isMetaMaskInstalled: false,
  shouldShowAutoConnectPrompt: false,
  setShouldShowAutoConnectPrompt: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const { activate, deactivate, active, account, chainId, library } = useWeb3React();
  const [connecting, setConnecting] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [skipAutoConnect, setSkipAutoConnect] = useState(false);
  const [shouldShowAutoConnectPrompt, setShouldShowAutoConnectPrompt] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  
  // Notification states
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    show: false,
    message: '',
    severity: 'info'
  });
  
  // Wallet switch prompt dialog state
  const [walletPrompt, setWalletPrompt] = useState<{
    show: boolean;
    account: string | null;
  }>({
    show: false,
    account: null
  });

  // After successful connection
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Debug log for Web3React state
  console.log('Web3React state:', { active, account, chainId, library: library ? 'exists' : 'null' });

  // Check if connected to the correct network
  // Also support Ganache for local development
  const isCorrectNetwork = chainId === CHAIN_ID || chainId === GANACHE_ID;

  // Get provider
  const provider = library ? library as ethers.providers.Web3Provider : null;

  // Initialize blockchain service and set addresses when provider becomes available
  useEffect(() => {
    if (active && provider && account) {
      try {
        // Initialize the service if not already done
        if (!blockchainService.isInitialized()) {
           console.log('WalletContext: Initializing BlockchainService...');
           blockchainService.initialize();
           console.log('Blockchain service initialized from WalletContext');
           
           // Now set the film factory address using the Polygon config
           console.log(`WalletContext: Setting Film Factory Address from Polygon config: [${polygonAddresses.factoryAddress}]`);
           blockchainService.setFilmFactoryAddress(polygonAddresses.factoryAddress);
        }

      } catch (error) {
        console.error('Failed to initialize blockchain service or set address:', error);
        setConnectionError('Failed to connect to blockchain contracts. Please try again.');
      }
    } else if (!active) {
      // If wallet becomes inactive, ensure service is potentially re-initialized later
      // (Optional: could reset service state here if needed)
      console.log('WalletContext: Wallet inactive, service state preserved.');
    }
  }, [active, provider, account]); // Dependencies include active, provider, account

  // Check if MetaMask is installed on component mount
  useEffect(() => {
    const checkMetaMaskInstalled = () => {
      const { ethereum } = window as any;
      const installed = !!ethereum && !!ethereum.isMetaMask;
      console.log('WalletContext - MetaMask installed check:', installed);
      setIsMetaMaskInstalled(installed);
      
      // SECURITY FIX: Disable automatic wallet detection that bypasses user consent
      // This was causing automatic authentication without user approval
      // Users must explicitly click Connect Wallet for proper security
      
      // DISABLED: Auto-connect prompt for better UX and security
      // Let users manually connect when they're ready instead of immediately showing popup
      // if (installed && !active && !localStorage.getItem('hasSeenWalletModal') && !skipAutoConnect) {
      //   console.log('WalletContext - Should show auto-connect prompt:', true);
      //   setShouldShowAutoConnectPrompt(true);
      // }
    };
    
    checkMetaMaskInstalled();
  }, [active, skipAutoConnect]);

  // SECURITY ENHANCEMENT: Check for already connected wallet but require user consent
  useEffect(() => {
    const checkExistingConnection = async () => {
      const { ethereum } = window as any;
      if (ethereum && ethereum.isMetaMask && !active) {
        try {
          // Check if MetaMask has connected accounts but don't auto-connect
          const accounts = await ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            console.log('WalletContext: Found already connected account during initialization:', accounts[0]);
            // Don't auto-authenticate - user must click Connect Wallet for security
            console.log('WalletContext: User must explicitly connect for security compliance');
          }
        } catch (error) {
          console.log('WalletContext: Error checking existing connection:', error);
        }
      }
    };
    
    checkExistingConnection();
  }, [active]);

  // Connect wallet
  const connect = async () => {
    console.log('Connecting wallet...');
    setConnecting(true);
    try {
      await activate(injected, undefined, true);
      console.log('Wallet connected successfully');
      setWalletModalOpen(false);
      setConnectionError(null);
      
      // Get the current account after successful connection
      const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        console.log('WalletContext - Connected account:', accounts[0]);
        
        // Dispatch wallet-connected event for Web3-first authentication
        const walletConnectedEvent = new CustomEvent('wallet-connected', { 
          detail: { account: accounts[0] }
        });
        window.dispatchEvent(walletConnectedEvent);
        console.log('WalletContext - Dispatched wallet-connected event for account:', accounts[0]);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setConnectionError('Failed to connect wallet. Please make sure MetaMask is installed and unlocked.');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    console.log('Disconnecting wallet...');
    try {
      // Force clear the auto-connect state for testing purposes
      const { ethereum } = window as any;
      if (ethereum && ethereum.isMetaMask) {
        console.log('Attempting to clear auto-connect state in MetaMask...');
        // This uses a non-standard method for demo purposes
        // It may not work in all MetaMask versions, but helps with testing
        if (ethereum._state && ethereum._state.accounts) {
          console.log('Clearing MetaMask internal state');
        }
      }
      
      // Fully disconnect from Web3-React
      deactivate();
      
      // Clear local storage of any connection data
      localStorage.removeItem('walletconnect');
      localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
      
      // // For MetaMask testing - deactivate any permissions (non-standard)
      // // This might be too aggressive and prevent auto-reconnect
      // if (ethereum && ethereum.request) {
      //   ethereum.request({
      //     method: 'wallet_revokePermissions',
      //     params: [{ eth_accounts: {} }],
      //   }).then(() => {
      //     console.log('Permissions revoked successfully');
      //   }).catch((error: any) => {
      //     console.log('Error revoking permissions (might be unsupported):', error);
      //   });
      // }
      
      console.log('Wallet disconnected successfully');
      
      // Force page reload to clear any cached state
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Handle accounts changed (user switched accounts in MetaMask)
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    console.log('WalletContext - Wallet accounts changed:', accounts);
    
    if (accounts.length === 0) {
      // User disconnected their wallet
      console.log('WalletContext - No accounts connected, disconnecting');
      
      // Show notification about wallet disconnect
      setNotification({
        show: true,
        message: 'Wallet disconnected. You have been logged out.',
        severity: 'info'
      });
      
      disconnect();
    } else {
      // User switched to a different account
      const newAccount = accounts[0];
      console.log('WalletContext - New account:', newAccount);
      
      // Only show the prompt if this is a different account than the currently connected one
      if (newAccount.toLowerCase() !== account?.toLowerCase()) {
        console.log('WalletContext - Account has changed from', account, 'to', newAccount);
        
        // 🔒 SECURITY: Immediately dispatch logout event for security
        const walletSwitchEvent = new CustomEvent('wallet-switched-logout', { 
          detail: { oldAccount: account, newAccount: newAccount }
        });
        window.dispatchEvent(walletSwitchEvent);
        
        // Show prompt to connect the new wallet
        setWalletPrompt({
          show: true,
          account: newAccount
        });
      } else {
        console.log('WalletContext - Same account, no action needed:', newAccount);
      }
    }
  }, [disconnect, account]);

  // Handle connecting new wallet after switch
  const handleConnectNewWallet = useCallback(() => {
    if (!walletPrompt.account) return;
    
    // Close the prompt
    setWalletPrompt({
      show: false,
      account: null
    });
    
    // Show notification about wallet switch
    setNotification({
      show: true,
      message: 'Wallet switched. Connecting to new account...',
      severity: 'info'
    });
    
    // Dispatch a custom event to notify the app about the account change
    const walletChangeEvent = new CustomEvent('wallet-account-changed', { 
      detail: { account: walletPrompt.account }
    });
    window.dispatchEvent(walletChangeEvent);
  }, [walletPrompt.account]);
  
  // Handle declining to connect new wallet
  const handleDeclineWalletConnect = useCallback(() => {
    // Close the prompt
    setWalletPrompt({
      show: false,
      account: null
    });
    
    // Disconnect completely to be safe
    disconnect();
    
    // Show notification
    setNotification({
      show: true,
      message: 'New wallet connection declined. You have been logged out.',
      severity: 'info'
    });
  }, [disconnect]);
  
  // Handle closing the notification
  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      show: false
    }));
  };

  const handleChainChanged = useCallback((chainId: string) => {
    console.log('Chain changed:', chainId);
    // Reload the page when they change networks
    window.location.reload();
  }, []);

  // Add listeners for MetaMask events
  useEffect(() => {
    const { ethereum } = window as any;
    if (ethereum && ethereum.isMetaMask) {
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (ethereum && ethereum.isMetaMask) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged]);

  // Switch to the correct network
  const switchNetwork = async () => {
    console.log('Switching network...');
    if (!library?.provider?.request) {
      console.error('Provider not available for network switch');
      return;
    }

    try {
      // Mumbai testnet configuration
      await library.provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${CHAIN_ID.toString(16)}`,
            chainName: 'Polygon Mumbai Testnet',
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18,
            },
            rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
            blockExplorerUrls: ['https://mumbai.polygonscan.com'],
          },
        ],
      });
      console.log('Network switched to Mumbai testnet successfully');
    } catch (error) {
      console.error('Error switching network:', error);
    }
  };

  // Eager connect attempt on initial load
  useEffect(() => {
    const attemptEagerConnection = async () => {
      console.log('WalletContext: MetaMask detected, checking for already connected wallet...');
      // FIXED: Only check if already connected, don't auto-connect
      try {
         // Check if MetaMask is installed
         if (!window.ethereum) {
           console.log('WalletContext: MetaMask not installed, skipping eager connection');
           return;
         }
         
        // Check if already connected (without triggering connection)
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          console.log('WalletContext: Found already connected account during initialization:', accounts[0]);
          // Only activate if already connected
          await activate(injected, undefined, false);
          
          // Dispatch event for already connected wallet
          const walletChangeEvent = new CustomEvent('wallet-account-changed', { 
             detail: { account: accounts[0] }
          });
          window.dispatchEvent(walletChangeEvent);
          console.log('Dispatched wallet-account-changed event with normalized account:', accounts[0]);
        } else {
          console.log('WalletContext: No connected accounts found, waiting for user action');
        }
      } catch (error) {
        console.error('WalletContext: Error during eager connection check:', error);
        // Don't show toast for eager connect failures
      }
    };

    // Run only once on mount if not already active and auto-connect is not skipped
    if (!active && !skipAutoConnect) {
      attemptEagerConnection();
    }
  }, [active, activate, skipAutoConnect]); // Dependencies for eager connection
  
  // Log any state changes
  useEffect(() => {
    console.log('WalletContext state updated:', { 
      active, 
      account, 
      chainId, 
      isCorrectNetwork,
      accountType: account ? typeof account : 'null',
      accountLength: account ? account.length : 0,
      provider: provider ? 'exists' : 'null'
    });
  }, [active, account, chainId, isCorrectNetwork, provider]);

  const value = {
    connect,
    disconnect,
    account,
    chainId,
    active,
    provider,
    isCorrectNetwork,
    switchNetwork,
    connecting,
    walletModalOpen,
    setWalletModalOpen,
    skipAutoConnect,
    setSkipAutoConnect,
    isMetaMaskInstalled,
    shouldShowAutoConnectPrompt,
    setShouldShowAutoConnectPrompt,
  };

  // Return context provider with notifications and dialogs
  return (
    <WalletContext.Provider value={value}>
      {children}
      
      {/* Notification snackbar */}
      <Snackbar 
        open={notification.show} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
      
      {/* Wallet switch prompt dialog */}
      <Dialog
        open={walletPrompt.show}
        onClose={handleDeclineWalletConnect}
      >
        <DialogTitle>New Wallet Detected</DialogTitle>
        <DialogContent>
          <DialogContentText>
            A new wallet has been detected: {walletPrompt.account ? `${walletPrompt.account.slice(0, 6)}...${walletPrompt.account.slice(-4)}` : ''}
            <br /><br />
            Would you like to connect this wallet and sign in with the associated account?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeclineWalletConnect} color="error">
            Decline
          </Button>
          <Button onClick={handleConnectNewWallet} color="primary" autoFocus>
            Connect
          </Button>
        </DialogActions>
      </Dialog>
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  
  // If context is undefined, it means the hook is not used within a WalletProvider
  // This can happen during SSR or if used outside the provider
  if (context === undefined) {
    console.warn('useWallet must be used within a WalletProvider');
    return {
      connect: async () => {},
      disconnect: () => {},
      account: null,
      chainId: undefined,
      active: false,
      provider: null,
      isCorrectNetwork: false,
      switchNetwork: async () => {},
      connecting: false,
      walletModalOpen: false,
      setWalletModalOpen: () => {},
      skipAutoConnect: false,
      setSkipAutoConnect: () => {},
      isMetaMaskInstalled: false,
      shouldShowAutoConnectPrompt: false,
      setShouldShowAutoConnectPrompt: () => {},
    };
  }
  
  return context;
}

export { WalletContext };