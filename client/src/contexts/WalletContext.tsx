import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { ethers } from 'ethers';

// Define chain IDs for supported networks
const POLYGON_MAINNET_ID = 137;
const POLYGON_MUMBAI_ID = 80001;

// For local development with Ganache
const GANACHE_ID = 1337;

// Get chain ID from environment, defaulting to Ganache for local development
const CHAIN_ID = parseInt(process.env.REACT_APP_CHAIN_ID || '1337', 10);

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

  // Debug log for Web3React state
  console.log('Web3React state:', { active, account, chainId, library: library ? 'exists' : 'null' });

  // Check if connected to the correct network
  // Also support Ganache for local development
  const isCorrectNetwork = chainId === CHAIN_ID || chainId === GANACHE_ID;

  // Get provider
  const provider = library ? library as ethers.providers.Web3Provider : null;

  // Connect wallet
  const connect = async () => {
    console.log('Connecting wallet...');
    setConnecting(true);
    try {
      await activate(injected, undefined, true);
      console.log('Wallet connected successfully');
      setWalletModalOpen(false);
    } catch (error) {
      console.error('Error connecting wallet:', error);
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

  // Handle MetaMask events
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    console.log('Accounts changed:', accounts);
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      disconnect();
    }
  }, []);

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

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
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