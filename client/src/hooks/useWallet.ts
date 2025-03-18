import { useContext } from 'react';
import { WalletContext } from '../contexts/WalletContext';

/**
 * Hook to access wallet functionality from the WalletContext
 * Provides easy access to wallet state and methods
 */
export const useWallet = () => {
  const context = useContext(WalletContext);
  
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  
  return context;
}; 