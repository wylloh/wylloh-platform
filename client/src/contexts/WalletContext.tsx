import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { ethers } from 'ethers';
import { blockchainService } from '../services/blockchain.service';

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
const POLYGON_MUMBAI_ID = 80001;

// For local development with Ganache
const GANACHE_ID = 1337;

// Define chain ID for the app
// For local development, use Ganache
const CHAIN_ID = GANACHE_ID;

console.log('WalletContext initialized with CHAIN_ID:', CHAIN_ID);

// Configure the connectors
const injected = new InjectedConnector({
  supportedChainIds: [POLYGON_MAINNET_ID, POLYGON_MUMBAI_ID, GANACHE_ID],
});

const walletconnect = new WalletConnectConnector({
  rpc: {
    [POLYGON_MAINNET_ID]: 'https://polygon-rpc.com',
    [POLYGON_MUMBAI_ID]: 'https://rpc-mumbai.maticvigil.com',
    [GANACHE_ID]: 'http://localhost:8545',
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
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const { activate, deactivate, active, account, chainId, library } = useWeb3React();
  const [connecting, setConnecting] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [skipAutoConnect, setSkipAutoConnect] = useState(false);
  
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

  // Initialize blockchain service when provider becomes available
  useEffect(() => {
    if (active && provider && account) {
      try {
        blockchainService.initialize(provider);
        console.log('Blockchain service initialized with provider');
      } catch (error) {
        console.error('Failed to initialize blockchain service:', error);
        setConnectionError('Failed to connect to blockchain contracts. Please try again.');
      }
    }
  }, [active, provider, account]);

  // Connect wallet
  const connect = async () => {
    console.log('Connecting wallet...');
    setConnecting(true);
    try {
      await activate(injected, undefined, true);
      console.log('Wallet connected successfully');
      setWalletModalOpen(false);
      setConnectionError(null);
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
      
      // For MetaMask testing - deactivate any permissions (non-standard)
      if (ethereum && ethereum.request) {
        ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        }).then(() => {
          console.log('Permissions revoked successfully');
        }).catch((error: any) => {
          console.log('Error revoking permissions (might be unsupported):', error);
        });
      }
      
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
      // For local Ganache
      if (CHAIN_ID === GANACHE_ID) {
        await library.provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${GANACHE_ID.toString(16)}`,
              chainName: 'Ganache Local',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['http://localhost:8545'],
            },
          ],
        });
      }
      // Check if Mumbai testnet
      else if (CHAIN_ID === POLYGON_MUMBAI_ID) {
        await library.provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${POLYGON_MUMBAI_ID.toString(16)}`,
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
      } 
      // Polygon mainnet
      else if (CHAIN_ID === POLYGON_MAINNET_ID) {
        await library.provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${POLYGON_MAINNET_ID.toString(16)}`,
              chainName: 'Polygon Mainnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
              },
              rpcUrls: ['https://polygon-rpc.com'],
              blockExplorerUrls: ['https://polygonscan.com'],
            },
          ],
        });
      }
      console.log('Network switched successfully');
    } catch (error) {
      console.error('Error switching network:', error);
    }
  };

  // Auto-connect if previously connected
  useEffect(() => {
    console.log('Checking for auto-connect...', { skipAutoConnect });
    
    // Skip auto-connect if the skip flag is set
    if (skipAutoConnect) {
      console.log('Skipping auto-connect due to skipAutoConnect flag');
      return;
    }
    
    injected.isAuthorized().then((isAuthorized) => {
      console.log('isAuthorized:', isAuthorized);
      if (isAuthorized) {
        activate(injected, undefined, true)
          .then(() => {
            console.log('Wallet auto-connected successfully');
          })
          .catch((error) => {
            console.error('Error auto-connecting wallet:', error);
          });
      }
    });
  }, [activate, skipAutoConnect]);

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
    };
  }
  
  return context;
}

export { WalletContext };