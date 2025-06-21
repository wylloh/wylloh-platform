import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useWallet } from './WalletContext';
import { authAPI, WalletUser } from '../services/authAPI';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: RegistrationData) => Promise<boolean>;
  requestProStatus: (proData: ProVerificationData) => Promise<boolean>;
  updateProfile: (profileData: { username: string; email: string }) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  getDisplayName: () => string;
  // New Web3-first methods
  authenticateWithWallet: (walletAddress: string) => Promise<boolean>;
  createWalletProfile: (walletAddress: string, username: string, email?: string) => Promise<boolean>;
  // Enhanced state management
  isInitialized: boolean;
  authenticationInProgress: boolean;
}

interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  walletAddress?: string;
  proStatus?: 'pending' | 'verified' | 'rejected';
  proVerificationData?: ProVerificationData;
  dateProRequested?: string;
  dateProVerified?: string;
  isWalletOnlyAccount?: boolean;
  profile?: {
    displayName: string;
  };
}

// Export the interface to make it available to other components
export interface ProVerificationData {
  fullName: string;
  biography: string;
  professionalLinks: {
    imdb?: string;
    website?: string;
    vimeo?: string;
    linkedin?: string;
  };
  filmographyHighlights?: string;
}

// AuthState interface to strongly type the state
interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  // Add new fields for robust state management
  isInitialized: boolean;
  authenticationInProgress: boolean;
  lastSyncedWallet: string | null;
}

// Registration data interface for both email and wallet-based registration
export interface RegistrationData {
  username: string;
  email?: string;
  password?: string;
  walletAddress?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    isInitialized: false,
    authenticationInProgress: false,
    lastSyncedWallet: null,
  });
  
  // Get wallet context
  const { account, active } = useWallet();
  
  // Keep track of previous account to detect changes
  const previousAccountRef = React.useRef<string | null | undefined>(account);
  
  // Track attempts to avoid infinite auto-login loops
  const autoLoginAttemptedRef = React.useRef<Record<string, boolean>>({});

  // When wallet account changes, log out current user if authenticated
  useEffect(() => {
    // Skip initial render
    if (previousAccountRef.current !== undefined && 
        account !== previousAccountRef.current && 
        state.isAuthenticated) {
      console.log('AuthContext - Wallet account changed, logging out current user');
      logout();
    }
    
    // Update the ref for next comparison
    previousAccountRef.current = account;
  }, [account, state.isAuthenticated]);
  
  // Handle wallet account changes (logout if different wallet connects)
  useEffect(() => {
    const handleWalletAccountChange = (event: Event) => {
      const newAccount = (event as CustomEvent)?.detail?.account;
      if (!newAccount) return;

      // If user is authenticated but with a different wallet, log them out
      if (state.isAuthenticated && state.user?.walletAddress && 
          state.user.walletAddress.toLowerCase() !== newAccount.toLowerCase()) {
        console.log('AuthContext - Different wallet connected, logging out current user');
        logout();
      }
    };

    window.addEventListener('wallet-connected', handleWalletAccountChange);
    return () => {
      window.removeEventListener('wallet-connected', handleWalletAccountChange);
    };
  }, [state.isAuthenticated, state.user?.walletAddress]); 
  
  // Load user from localStorage on initial render
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // In a real app, validate the token with the server
          // For now, we'll just simulate this
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          
          if (userData && userData.id) {
            setState({
              user: userData,
              loading: false,
              error: null,
              isAuthenticated: true,
              isInitialized: true,
              authenticationInProgress: false,
              lastSyncedWallet: account || null,
            });
          } else {
            // Invalid stored user data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setState({
          user: null,
          loading: false,
          error: 'Authentication verification failed',
          isAuthenticated: false,
          isInitialized: true,
          authenticationInProgress: false,
          lastSyncedWallet: null,
        });
      }
    };

    checkAuth();
  }, []);

  // Auto-login based on wallet address for demo purposes
  // Web3 authentication is handled by Web3AuthManager - no auto-login needed
  useEffect(() => {
    console.log('AuthContext: Wallet connection state changed', { 
      active, 
      account, 
      isAuthenticated: state.isAuthenticated 
    });
  }, [account, state.isAuthenticated, state.loading, active]);

  // Update user wallet address when wallet connection changes
  useEffect(() => {
    console.log('AuthContext: Wallet sync effect running.', { 
      isAuthenticated: state.isAuthenticated, 
      userId: state.user?.id, 
      userWallet: state.user?.walletAddress,
      hookAccount: account 
    });
    // This effect ensures the user object in AuthContext state
    // always reflects the currently connected wallet address from WalletContext
    if (state.isAuthenticated && state.user && account && 
        (!state.user.walletAddress || state.user.walletAddress.toLowerCase() !== account.toLowerCase())) {
      console.log(`AuthContext - Syncing wallet address to user state: ${account}`);
      const updatedUser = { ...state.user, walletAddress: account };
      setState(prevState => ({
        ...prevState,
        user: updatedUser,
        lastSyncedWallet: account,
      }));
      // Update localStorage as well
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } else if (state.isAuthenticated && state.user && !account && state.user.walletAddress && !state.authenticationInProgress) {
      // Handle case where wallet disconnects while user is logged in
      // ENTERPRISE APPROACH: Only clear wallet if user explicitly disconnects
      // Don't clear on temporary MetaMask state transitions
      console.log('AuthContext - Wallet disconnected, preserving user session (enterprise approach)');
      
      // Option 1: Preserve user session, just note wallet disconnection
      // Option 2: Only clear if this is a deliberate logout action
      // For now, we maintain the authenticated session even if wallet disconnects
      // This follows enterprise patterns where session != wallet connection state
    }
  }, [account, state.isAuthenticated, state.user]); // Rerun when account or auth state changes

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setState({
      ...state,
      loading: true,
      error: null,
      authenticationInProgress: true,
    });
    
    try {
      // TODO: Remove traditional email/password login entirely
      // This is a legacy method - Web3 authentication should use authenticateWithWallet instead
      console.warn('Traditional email/password login is deprecated - use Web3 authentication');
      throw new Error('Email/password login is no longer supported. Please use wallet authentication.');
    } catch (err: any) {
      setState({
        ...state,
        error: err.message || 'Login failed',
        loading: false,
        authenticationInProgress: false,
      });
      return false;
    }
  };

  // Register function
  const register = async (data: RegistrationData): Promise<boolean> => {
    try {
      setState(prevState => ({
        ...prevState,
        loading: true,
        error: null
      }));

      // Validate input
      if (!data.username) {
        throw new Error('Username is required');
      }
      
      // For wallet-based registration, require wallet address
      if (!data.walletAddress) {
        throw new Error('Wallet address is required for wallet-based registration');
      }

      // Use proper API for wallet profile creation
      const result = await authAPI.createWalletProfile(data.walletAddress, data.username, data.email);
      
      if (result.success && result.user) {
        // Update state with new user from API
        setState({
          user: result.user as any,
          loading: false,
          error: null,
          isAuthenticated: true,
          isInitialized: true,
          authenticationInProgress: false,
          lastSyncedWallet: data.walletAddress,
        });

        console.log(`User registered successfully: ${data.username} with wallet ${data.walletAddress}`);
        return true;
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: 'Registration failed. Please try again.'
      }));
      return false;
    }
  };

  // Request Pro Status function
  const requestProStatus = async (proData: ProVerificationData): Promise<boolean> => {
    setState({
      ...state,
      loading: true,
      error: null,
      authenticationInProgress: true,
    });
    
    try {
      if (!state.user) {
        throw new Error('You must be logged in to request Pro status');
      }
      
      // Make API call to submit Pro status request
      const response = await fetch('/api/users/pro-status/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(proData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit Pro status request');
      }
      
      if (data.success) {
        const updatedUser = {
          ...state.user,
          proStatus: 'pending' as const,
          proVerificationData: proData,
          dateProRequested: new Date().toISOString()
        };
        
        setState({
          ...state,
          user: updatedUser,
          authenticationInProgress: false,
          loading: false,
        });
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return true;
      } else {
        throw new Error('Failed to submit Pro status request');
      }
    } catch (err: any) {
      setState({
        ...state,
        error: err.message || 'Pro status request failed',
        loading: false,
        authenticationInProgress: false,
      });
      return false;
    }
  };

  // Logout function
  const logout = () => {
    console.log('AuthContext - Logging out user:', state.user?.email);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      isInitialized: true,
      authenticationInProgress: false,
      lastSyncedWallet: null,
    });
  };

  // Clean up any old pending wallet login data
  useEffect(() => {
    localStorage.removeItem('pendingWalletLogin');
  }, []);

  // Helper function to get user display name
  const getDisplayName = (): string => {
    if (!state.user) return 'Guest';
    
    // If user has a username, use that
    if (state.user.username) {
      return state.user.username;
    }
    
    // If this is a wallet-only account, use a shortened wallet address
    if (state.user.walletAddress) {
      const addr = state.user.walletAddress;
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
    
    // Fallback to email or generic name
    return state.user.email || 'User';
  };

  // Web3-first authentication - check if wallet has existing account
  const authenticateWithWallet = async (walletAddress: string): Promise<boolean> => {
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null, authenticationInProgress: true }));
      
      // Get current chainId from wallet context
      const { ethereum } = window as any;
      let chainId = 137; // Default to Polygon mainnet
      
      if (ethereum) {
        try {
          const currentChainId = await ethereum.request({ method: 'eth_chainId' });
          chainId = parseInt(currentChainId, 16);
        } catch (error) {
          console.warn('Could not get chainId from wallet, using default:', error);
        }
      }
      
      // Use API to connect wallet (checks database for existing user)
      const result = await authAPI.connectWallet({
        walletAddress,
        chainId
      });
      
      if (result.success && result.user) {
        // Update state with authenticated user
        setState({
          user: result.user as any, // Convert WalletUser to User type
          loading: false,
          error: null,
          isAuthenticated: true,
          isInitialized: true,
          authenticationInProgress: false,
          lastSyncedWallet: walletAddress,
        });
        
        console.log(`Wallet authentication successful: ${(result.user as any).username || (result.user as any).profile?.displayName || result.user.id} (${walletAddress})`);
        return true;
      } else if (result.isNewWallet) {
        // No existing account for this wallet
        setState(prevState => ({ 
          ...prevState, 
          loading: false, 
          authenticationInProgress: false 
        }));
        console.log('New wallet detected, profile creation needed');
        return false;
      } else {
        // API error
        setState(prevState => ({
          ...prevState,
          loading: false,
          authenticationInProgress: false,
          error: result.message || 'Failed to connect to wallet service.'
        }));
        return false;
      }
    } catch (err: any) {
      console.error('Wallet authentication error:', err);
      setState(prevState => ({
        ...prevState,
        loading: false,
        authenticationInProgress: false,
        error: err.message || 'Wallet authentication failed.'
      }));
      return false;
    }
  };

  // Create new wallet-based profile
  const createWalletProfile = async (walletAddress: string, username: string, email?: string): Promise<boolean> => {
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null, authenticationInProgress: true }));
      
      // Validate username
      if (!username || username.trim().length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }
      
      // Use API to create wallet profile
      const result = await authAPI.createWalletProfile(walletAddress, username.trim(), email);
      
      if (result.success && result.user) {
        // Update state with new user
        setState({
          user: result.user as any, // Convert WalletUser to User type
          loading: false,
          error: null,
          isAuthenticated: true,
          isInitialized: true,
          authenticationInProgress: false,
          lastSyncedWallet: walletAddress,
        });
        
        console.log(`Wallet profile created successfully: ${result.user.username} (${walletAddress})`);
        return true;
      } else {
        // Profile creation failed
        setState(prevState => ({
          ...prevState,
          loading: false,
          authenticationInProgress: false,
          error: result.error || 'Failed to create wallet profile.'
        }));
        return false;
      }
    } catch (err: any) {
      console.error('Wallet profile creation error:', err);
      setState(prevState => ({
        ...prevState,
        loading: false,
        authenticationInProgress: false,
        error: err.message || 'Failed to create wallet profile.'
      }));
      return false;
    }
  };

  // Update user profile
  const updateProfile = async (profileData: { username: string; email: string }): Promise<boolean> => {
    try {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      
      if (!state.user) {
        throw new Error('No user logged in');
      }

      // Validate input
      if (!profileData.username || profileData.username.trim().length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      // For now, update local state (in production this would be an API call)
      const updatedUser = {
        ...state.user,
        username: profileData.username.trim(),
        email: profileData.email.trim()
      };

      setState(prevState => ({
        ...prevState,
        user: updatedUser,
        loading: false,
        error: null
      }));

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log(`Profile updated successfully: ${updatedUser.username}`);
      return true;
    } catch (err: any) {
      console.error('Profile update error:', err);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: err.message || 'Failed to update profile.'
      }));
      return false;
    }
  };

  // State validation and synchronization methods
  const validateAuthState = useCallback(() => {
    const { isAuthenticated, user, lastSyncedWallet } = state;
    const hasToken = Boolean(localStorage.getItem('token'));
    const hasStoredUser = Boolean(localStorage.getItem('user'));
    
    // Check for inconsistencies
    const inconsistencies = [];
    
    if (isAuthenticated && !hasToken) {
      inconsistencies.push('User authenticated but no token in localStorage');
    }
    
    if (isAuthenticated && !user) {
      inconsistencies.push('User authenticated but no user object in state');
    }
    
    if (account && isAuthenticated && user?.walletAddress && 
        account.toLowerCase() !== user.walletAddress.toLowerCase()) {
      inconsistencies.push('Connected wallet differs from authenticated user wallet');
    }
    
    if (lastSyncedWallet && account && 
        lastSyncedWallet.toLowerCase() !== account.toLowerCase()) {
      inconsistencies.push('Wallet state out of sync');
    }
    
    if (inconsistencies.length > 0) {
      console.warn('AuthContext state inconsistencies detected:', inconsistencies);
      return false;
    }
    
    return true;
  }, [state, account]);

  const syncWalletState = useCallback(async () => {
    if (state.authenticationInProgress) {
      console.log('Authentication in progress, skipping sync');
      return;
    }
    
    if (!state.isInitialized) {
      console.log('Auth not initialized, skipping sync');
      return;
    }
    
    // If wallet is connected but we're not authenticated, try to authenticate
    if (account && !state.isAuthenticated) {
      console.log('Wallet connected but not authenticated, attempting sync authentication');
      
      setState(prevState => ({ ...prevState, authenticationInProgress: true }));
      
      try {
        const success = await authenticateWithWallet(account);
        if (!success) {
          console.log('No existing account found for wallet during sync');
        }
      } catch (error) {
        console.error('Error during wallet sync authentication:', error);
      } finally {
        setState(prevState => ({ ...prevState, authenticationInProgress: false }));
      }
    }
    
      // ENTERPRISE APPROACH: Separate session management from wallet connection state
  // Authenticated users remain authenticated even if wallet temporarily disconnects
  if (state.isAuthenticated && state.user?.walletAddress && !account && !state.authenticationInProgress) {
    console.log('Authenticated user wallet disconnected - maintaining session (enterprise pattern)');
    
    // Enterprise pattern: Session persistence independent of wallet connection
    // User remains logged in, but wallet-dependent features become unavailable
    // This prevents accidental logouts during MetaMask operations
  }
  }, [account, state, authenticateWithWallet]);

  // Validate state periodically and on key changes
  useEffect(() => {
    if (state.isInitialized && !state.authenticationInProgress) {
      const isValid = validateAuthState();
      if (!isValid) {
        console.log('State validation failed, attempting sync');
        syncWalletState();
      }
    }
  }, [state.isInitialized, state.authenticationInProgress, validateAuthState, syncWalletState]);

  const value = {
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    login,
    logout,
    register,
    requestProStatus,
    updateProfile,
    loading: state.loading,
    error: state.error,
    getDisplayName,
    authenticateWithWallet,
    createWalletProfile,
    isInitialized: state.isInitialized,
    authenticationInProgress: state.authenticationInProgress,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}