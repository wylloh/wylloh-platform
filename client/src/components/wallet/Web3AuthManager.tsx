import React, { useEffect, useState, useRef } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import Web3AuthModal from './Web3AuthModal';

/**
 * Web3AuthManager - Handles automatic Web3-first authentication
 * 
 * This component listens for wallet connection events and automatically
 * triggers the Web3 authentication flow when a wallet connects.
 * 
 * Features:
 * - Event deduplication to prevent multiple authentication attempts
 * - Timeout handling for authentication processes
 * - State synchronization between wallet and auth contexts
 * - Proper error handling and recovery
 * 
 * It should be placed high in the component tree (like in App.tsx)
 * to handle authentication across the entire application.
 */
const Web3AuthManager: React.FC = () => {
  const { active, account } = useWallet();
  const { isAuthenticated, authenticateWithWallet, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [hasProcessedWallet, setHasProcessedWallet] = useState<string | null>(null);
  
  // Use refs to track authentication attempts and prevent duplicates
  const authenticationAttempts = useRef<Map<string, boolean>>(new Map());
  const authenticationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const processingWallet = useRef<string | null>(null);

  // Cleanup function to clear timeouts and attempts
  const cleanupWalletProcessing = (walletAddress: string) => {
    const timeout = authenticationTimeouts.current.get(walletAddress);
    if (timeout) {
      clearTimeout(timeout);
      authenticationTimeouts.current.delete(walletAddress);
    }
    authenticationAttempts.current.delete(walletAddress);
  };

  // Enhanced wallet processing with deduplication
  const processWalletConnection = async (walletAddress: string, eventSource: string) => {
    // Prevent duplicate processing
    if (processingWallet.current === walletAddress) {
      console.log(`Web3AuthManager - Already processing wallet ${walletAddress}, skipping`);
      return;
    }
    
    if (authenticationAttempts.current.get(walletAddress)) {
      console.log(`Web3AuthManager - Authentication already attempted for ${walletAddress}, skipping`);
      return;
    }
    
    // Check if user is already authenticated with this wallet
    if (isAuthenticated && account?.toLowerCase() === walletAddress.toLowerCase()) {
      console.log(`Web3AuthManager - User already authenticated with wallet ${walletAddress}`);
      setHasProcessedWallet(walletAddress);
      return;
    }
    
    console.log(`Web3AuthManager - Processing wallet connection from ${eventSource}:`, walletAddress);
    
    // Mark as processing and set timeout
    processingWallet.current = walletAddress;
    authenticationAttempts.current.set(walletAddress, true);
    
    // Set timeout to prevent stuck processing
    const timeoutId = setTimeout(() => {
      console.warn(`Web3AuthManager - Authentication timeout for ${walletAddress}`);
      cleanupWalletProcessing(walletAddress);
      processingWallet.current = null;
    }, 30000); // 30 second timeout
    
    authenticationTimeouts.current.set(walletAddress, timeoutId);
    
    try {
      // Try to authenticate with existing wallet account
      const existingAuth = await authenticateWithWallet(walletAddress);
      
      if (existingAuth) {
        console.log(`Web3AuthManager - Existing wallet authenticated successfully: ${walletAddress}`);
        setHasProcessedWallet(walletAddress);
      } else {
        console.log(`Web3AuthManager - New wallet detected, showing modal: ${walletAddress}`);
        setShowModal(true);
        setHasProcessedWallet(walletAddress);
      }
    } catch (error) {
      console.error(`Web3AuthManager - Error processing wallet ${walletAddress}:`, error);
    } finally {
      // Clean up processing state
      cleanupWalletProcessing(walletAddress);
      processingWallet.current = null;
    }
  };

  // Listen for wallet-connected events from WalletContext
  useEffect(() => {
    const handleWalletConnected = async (event: Event) => {
      const walletAccount = (event as CustomEvent)?.detail?.account;
      
      if (!walletAccount) {
        console.warn('Web3AuthManager - Wallet event received without account');
        return;
      }
      
      await processWalletConnection(walletAccount, 'wallet-connected-event');
    };
    
    const handleWalletAccountChanged = async (event: Event) => {
      const walletAccount = (event as CustomEvent)?.detail?.account;
      
      if (!walletAccount) {
        console.warn('Web3AuthManager - Wallet account changed event received without account');
        return;
      }
      
      await processWalletConnection(walletAccount, 'wallet-account-changed-event');
    };

    // Listen for both wallet-connected and wallet-account-changed events
    // wallet-connected: New wallet connections
    // wallet-account-changed: Already connected wallets on page load
    window.addEventListener('wallet-connected', handleWalletConnected);
    window.addEventListener('wallet-account-changed', handleWalletAccountChanged);
    
    return () => {
      window.removeEventListener('wallet-connected', handleWalletConnected);
      window.removeEventListener('wallet-account-changed', handleWalletAccountChanged);
    };
  }, [processWalletConnection]);

  // Handle wallet that's already connected on mount
  useEffect(() => {
    if (active && account && !isAuthenticated && !hasProcessedWallet && !loading) {
      console.log('Web3AuthManager - Wallet already connected on mount, processing:', account);
      processWalletConnection(account, 'mount-already-connected');
    }
  }, [active, account, isAuthenticated, hasProcessedWallet, loading, processWalletConnection]);

  // Reset processed wallet when wallet disconnects
  useEffect(() => {
    if (!active || !account) {
      if (hasProcessedWallet) {
        console.log('Web3AuthManager - Wallet disconnected, resetting processed state');
        setHasProcessedWallet(null);
        setShowModal(false);
        
        // Clear any pending authentication attempts
        authenticationAttempts.current.clear();
        authenticationTimeouts.current.forEach(timeout => clearTimeout(timeout));
        authenticationTimeouts.current.clear();
        processingWallet.current = null;
      }
    }
  }, [active, account, hasProcessedWallet]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts on unmount
      authenticationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

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