import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { ethers } from 'ethers';

// Define chain IDs for supported networks
const POLYGON_MAINNET_ID = 137;
const POLYGON_MUMBAI_ID = 80001;

// Get chain ID from environment, defaulting to Mumbai testnet
const CHAIN_ID = parseInt(process.env.REACT_APP_CHAIN_ID || '80001', 10);

// Configure the connectors
const injected = new InjectedConnector({
  supportedChainIds: [POLYGON_MAINNET_ID, POLYGON_MUMBAI_ID],
});

const walletconnect = new WalletConnectConnector({
  rpc: {
    [POLYGON_MAINNET_ID]: 'https://polygon-rpc.com',
    [POLYGON_MUMBAI_ID]: 'https://rpc-mumbai.maticvigil.com',
  },
  qrcode: true,
//  pollingInterval: 12000,
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
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { activate, deactivate, active, account, chainId, library } = useWeb3React();
  const [connecting, setConnecting] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // Check if connected to the correct network
  const isCorrectNetwork = chainId === CHAIN_ID;

  // Get provider
  const provider = library ? library as ethers.providers.Web3Provider : null;

  // Connect wallet
  const connect = async () => {
    setConnecting(true);
    try {
      await activate(injected, undefined, true);
      setWalletModalOpen(false);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    try {
      deactivate();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Switch to the correct network
  const switchNetwork = async () => {
    if (!library?.provider?.request) {
      return;
    }

    try {
      // Check if Mumbai testnet
      if (CHAIN_ID === POLYGON_MUMBAI_ID) {
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
    } catch (error) {
      console.error('Error switching network:', error);
    }
  };

  // Auto-connect if previously connected
  useEffect(() => {
    injected.isAuthorized().then((isAuthorized) => {
      if (isAuthorized) {
        activate(injected, undefined, true).catch((error) => {
          console.error('Error auto-connecting wallet:', error);
        });
      }
    });
  }, [activate]);

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
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}