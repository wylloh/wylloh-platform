import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useWallet } from './WalletContext';
import { authAPI, WalletUser } from '../services/authAPI';
import websocketService from '../services/websocketService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: RegistrationData) => Promise<boolean>;
  requestProStatus: (proData: ProVerificationData) => Promise<boolean>;
  updateProfile: (profileData: { username: string; email: string }) => Promise<boolean>;
  refreshUser: () => Promise<boolean>;
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
  
  // Session-level Pro status refresh tracking
  const sessionProRefreshCompletedRef = useRef(false);
  
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

    // 🔒 SECURITY: Handle immediate logout when wallet switches
    const handleWalletSwitchLogout = (event: Event) => {
      const { oldAccount, newAccount } = (event as CustomEvent)?.detail || {};
      if (state.isAuthenticated) {
        console.log('🔒 AuthContext - Wallet switched, force logout for security');
        logout();
      }
    };

    window.addEventListener('wallet-connected', handleWalletAccountChange);
    window.addEventListener('wallet-switched-logout', handleWalletSwitchLogout);
    
    return () => {
      window.removeEventListener('wallet-connected', handleWalletAccountChange);
      window.removeEventListener('wallet-switched-logout', handleWalletSwitchLogout);
    };
  }, [state.isAuthenticated, state.user?.walletAddress]); 
  
  // Load user from localStorage on initial render
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // 🔒 ENTERPRISE SECURITY: Verify token with server, no localStorage user data
          try {
            const result = await authAPI.refreshUser();
            if (result.success && result.user) {
              setState({
                user: result.user as any,
                loading: false,
                error: null,
                isAuthenticated: true,
                isInitialized: true,
                authenticationInProgress: false,
                lastSyncedWallet: null,
              });
            } else {
              // Invalid token or user not found
              localStorage.removeItem('token');
              setState(prevState => ({
                ...prevState,
                loading: false,
                isInitialized: true,
              }));
            }
          } catch (error) {
            // Token verification failed
            localStorage.removeItem('token');
            setState(prevState => ({
              ...prevState,
              loading: false,
              error: 'Session expired. Please log in again.',
              isInitialized: true,
            }));
          }
        } else {
          setState(prevState => ({
            ...prevState,
            loading: false,
            isInitialized: true,
          }));
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

  // Session-level Pro Status Refresh will be added after refreshUser is defined

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
      // 🔒 ENTERPRISE SECURITY: No localStorage user data writes
    }
  }, [account, state.isAuthenticated, state.user]);

  // 🔄 PHASE 1: Context-Aware Refresh - Moved to after refreshUser definition

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
      
      // Use authAPI service to submit Pro status request
      const result = await authAPI.requestProStatus(proData);
      
      if (result.success) {
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
        // 🔒 ENTERPRISE SECURITY: No localStorage user data writes
        return true;
      } else {
        throw new Error(result.error || 'Failed to submit Pro status request');
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
  const logout = useCallback(() => {
    console.log('AuthContext - Logout initiated');
    
    // Clear authentication state
    setState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      isInitialized: true,
      authenticationInProgress: false,
      lastSyncedWallet: null,
    });
    
    // 🔒 ENTERPRISE SECURITY: Clear only JWT token, no user data in localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('walletAddress');
    
    // SECURITY FIX: Force wallet disconnection on explicit logout
    // Override enterprise session persistence for security compliance
    try {
      const { ethereum } = window as any;
      if (ethereum && ethereum.isMetaMask) {
        // Clear MetaMask connection state
        ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        }).catch((error: any) => {
          console.log('Wallet permissions revocation not supported:', error);
        });
      }
    } catch (error) {
      console.log('Error during wallet disconnection:', error);
    }
    
    // Force page reload to ensure complete session clear
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, []);

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
      
      if (result.success && result.user && result.token) {
        // ✅ ENTERPRISE SECURITY: Store only JWT token, fetch user data from server
        localStorage.setItem('token', result.token);
        
        // Update state with authenticated user from MongoDB
        setState({
          user: result.user as any,
          loading: false,
          error: null,
          isAuthenticated: true,
          isInitialized: true,
          authenticationInProgress: false,
          lastSyncedWallet: walletAddress,
        });
        
        console.log(`✅ MongoDB authentication successful: ${(result.user as any).username} (${walletAddress})`);
        return true;
      } else if (result.success && result.isNewWallet) {
        // New wallet needs profile creation
        setState(prevState => ({ 
          ...prevState, 
          loading: false, 
          authenticationInProgress: false 
        }));
        console.log('🆕 New wallet detected, profile creation needed');
        return false;
      } else {
        // API error or authentication failed
        setState(prevState => ({
          ...prevState,
          loading: false,
          authenticationInProgress: false,
          error: result.message || 'Failed to authenticate with MongoDB.'
        }));
        console.error('❌ MongoDB authentication failed:', result);
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
      
      // Use API to create wallet profile in MongoDB
      const result = await authAPI.createWalletProfile(walletAddress, username.trim(), email?.trim());
      
      if (result.success && result.user) {
        // ✅ ENTERPRISE SECURITY: User data managed by server, only token stored locally
        setState(prevState => ({
          ...prevState,
          user: result.user as any, // Convert WalletUser to User type
          isAuthenticated: true,
          loading: false,
          authenticationInProgress: false,
          lastSyncedWallet: walletAddress,
        }));
        
        console.log(`✅ Wallet profile created in MongoDB: ${result.user.username} (${walletAddress})`);
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
    setState({
      ...state,
      loading: true,
      error: null,
    });
    
    try {
      // Use authAPI service to update profile
      const result = await authAPI.updateProfile(profileData);
      
      if (result.success && result.user) {
        const updatedUser = {
          ...state.user,
          ...result.user,
        };
        
        setState({
          ...state,
          user: updatedUser,
          loading: false,
        });
        return true;
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setState({
        ...state,
        error: err.message || 'Profile update failed',
        loading: false,
      });
      return false;
    }
  };

  // Refresh user data from server - FIXED: Use useCallback to prevent infinite loops
  const refreshUser = useCallback(async (): Promise<boolean> => {
    setState(prevState => ({
      ...prevState,
      loading: true,
      error: null,
    }));
    
    try {
      // Use authAPI service to refresh user data
      const result = await authAPI.refreshUser();
      
      if (result.success && result.user) {
        setState(prevState => {
          const updatedUser: User = {
            ...prevState.user!,
            ...result.user!,
          };
          
          // Log only for target wallet
          if (result.user!.walletAddress?.toLowerCase() === '0x2ae0d658e356e2b687e604af13afac3f4e265504') {
            console.log('🔍 Pro status update:', {
              old: prevState.user?.proStatus,
              new: result.user!.proStatus
            });
          }
          
          return {
            ...prevState,
            user: updatedUser,
            loading: false,
          };
        });
        return true;
      } else {
        throw new Error(result.error || 'Failed to refresh user data');
      }
    } catch (err: any) {
      setState(prevState => ({
        ...prevState,
        error: (err as Error).message || 'Failed to refresh user data',
        loading: false,
      }));
      return false;
    }
  }, []); // Empty dependency array - function is stable

  // 🎯 Session-level Pro Status Refresh (Industry Standard)
  // Runs once per session regardless of which page user lands on
  useEffect(() => {
    const performSessionProRefresh = async () => {
      if (!state.isAuthenticated || !state.user?.walletAddress || 
          state.loading || sessionProRefreshCompletedRef.current) {
        return;
      }

      try {
        console.log('AuthContext: Performing session-level Pro status refresh for:', state.user.walletAddress);
        
        // Special logging for the target wallet
        if (state.user.walletAddress === '0x2Ae0D658e356e2b687e604Af13aFAc3f4E265504') {
          console.log('🎯 AuthContext: Target Pro wallet detected - session refresh');
        }

        const success = await refreshUser();
        if (success) {
          sessionProRefreshCompletedRef.current = true;
          console.log('AuthContext: Session Pro status refresh completed');
        }
      } catch (error) {
        console.error('AuthContext: Session Pro status refresh failed:', error);
      }
    };

    // Only run once when user is fully authenticated and loaded
    if (state.isAuthenticated && state.user && !state.loading && state.isInitialized) {
      performSessionProRefresh();
    }
  }, [state.isAuthenticated, state.user?.walletAddress, state.loading, state.isInitialized]);

  // Reset session refresh flag on logout
  useEffect(() => {
    if (!state.isAuthenticated) {
      sessionProRefreshCompletedRef.current = false;
    }
  }, [state.isAuthenticated]);

  // 🔌 ENTERPRISE WEBSOCKET INTEGRATION
  // Real-time Pro status updates without client-side polling
  useEffect(() => {
    const setupWebSocket = async () => {
      if (state.isAuthenticated && state.user && !state.loading) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            console.log('🔌 Setting up WebSocket connection for authenticated user');
            
            // Connect to WebSocket server
            await websocketService.connect(token);
            
            // Set up Pro status update handler
            websocketService.on('pro:status:update', (data: any) => {
              console.log('🎯 Received Pro status update:', data);
              
              setState(prevState => ({
                ...prevState,
                user: prevState.user ? {
                  ...prevState.user,
                  proStatus: data.proStatus,
                  dateProApproved: data.dateProApproved
                } : null
              }));
            });

            // Set up Pro verification celebration
            websocketService.on('pro:verified', (data: any) => {
              console.log('🎉 Pro status verified!', data.message);
              
              setState(prevState => ({
                ...prevState,
                user: prevState.user ? {
                  ...prevState.user,
                  proStatus: 'verified',
                  dateProApproved: data.timestamp
                } : null
              }));
              
              // Could trigger a celebration UI here
              // e.g., toast notification, confetti, etc.
            });

            console.log('✅ WebSocket real-time Pro status updates enabled');
            
          } catch (error) {
            console.error('❌ WebSocket connection failed:', error);
            // Graceful degradation - user can still use the app
          }
        }
      }
    };

    setupWebSocket();

    // Cleanup WebSocket on logout
    return () => {
      if (!state.isAuthenticated) {
        websocketService.disconnect();
      }
    };
  }, [state.isAuthenticated, state.user?.id, state.loading]);

  // Clean up WebSocket on logout
  useEffect(() => {
    if (!state.isAuthenticated) {
      websocketService.disconnect();
    }
  }, [state.isAuthenticated]);

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
    
    // SECURITY FIX: Disable automatic wallet sync authentication
    // This was causing automatic login without user consent
    // Users must explicitly click Connect Wallet for proper security
    
    // DISABLED: Automatic wallet authentication for security compliance
    // if (account && !state.isAuthenticated) {
    //   console.log('Wallet connected but not authenticated, attempting sync authentication');
    //   
    //   setState(prevState => ({ ...prevState, authenticationInProgress: true }));
    //   
    //   try {
    //     const success = await authenticateWithWallet(account);
    //     if (!success) {
    //       console.log('No existing account found for wallet during sync');
    //     }
    //   } catch (error) {
    //     console.error('Error during wallet sync authentication:', error);
    //   } finally {
    //     setState(prevState => ({ ...prevState, authenticationInProgress: false }));
    //   }
    // }
    
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

  // 🔧 ENTERPRISE FIX: Wallet transition tolerance (prevent aggressive clearing)
  // Brief wallet disconnections during MetaMask operations are normal
  // Only clear wallet from user state if disconnection persists
  const WALLET_TRANSITION_TOLERANCE = 3000; // Increased from 1500ms to 3000ms for stability

  const value = {
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    login,
    logout,
    register,
    requestProStatus,
    updateProfile,
    refreshUser,
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