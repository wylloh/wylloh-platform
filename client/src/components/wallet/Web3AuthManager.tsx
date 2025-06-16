import React, { useEffect, useState } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import Web3AuthModal from './Web3AuthModal';

/**
 * Web3AuthManager - Handles automatic Web3-first authentication
 * 
 * This component listens for wallet connection events and automatically
 * triggers the Web3 authentication flow when a wallet connects.
 * 
 * It should be placed high in the component tree (like in App.tsx)
 * to handle authentication across the entire application.
 */
const Web3AuthManager: React.FC = () => {
  const { active, account } = useWallet();
  const { isAuthenticated, authenticateWithWallet } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [hasProcessedWallet, setHasProcessedWallet] = useState<string | null>(null);

  // Listen for wallet-connected events from WalletContext
  useEffect(() => {
    const handleWalletConnected = async (event: Event) => {
      const walletAccount = (event as CustomEvent)?.detail?.account;
      
      if (!walletAccount) return;
      
      console.log('Web3AuthManager - Wallet connected event received:', walletAccount);
      
      // Avoid processing the same wallet multiple times
      if (hasProcessedWallet === walletAccount) {
        console.log('Web3AuthManager - Wallet already processed, skipping');
        return;
      }
      
      // If user is already authenticated with this wallet, do nothing
      if (isAuthenticated && account?.toLowerCase() === walletAccount.toLowerCase()) {
        console.log('Web3AuthManager - User already authenticated with this wallet');
        setHasProcessedWallet(walletAccount);
        return;
      }
      
      // Try to authenticate with existing wallet account
      console.log('Web3AuthManager - Attempting to authenticate wallet:', walletAccount);
      const existingAuth = await authenticateWithWallet(walletAccount);
      
      if (existingAuth) {
        console.log('Web3AuthManager - Existing wallet authenticated successfully');
        setHasProcessedWallet(walletAccount);
      } else {
        console.log('Web3AuthManager - New wallet detected, showing modal');
        setShowModal(true);
        setHasProcessedWallet(walletAccount);
      }
    };

    window.addEventListener('wallet-connected', handleWalletConnected);
    
    return () => {
      window.removeEventListener('wallet-connected', handleWalletConnected);
    };
  }, [authenticateWithWallet, isAuthenticated, account, hasProcessedWallet]);

  // Reset processed wallet when wallet disconnects
  useEffect(() => {
    if (!active || !account) {
      setHasProcessedWallet(null);
      setShowModal(false);
    }
  }, [active, account]);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <Web3AuthModal
      open={showModal}
      onClose={handleCloseModal}
    />
  );
};

export default Web3AuthManager; 