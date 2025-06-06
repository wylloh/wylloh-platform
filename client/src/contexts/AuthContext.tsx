import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useWallet } from './WalletContext';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: RegistrationData) => Promise<boolean>;
  requestProStatus: (proData: ProVerificationData) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  getDisplayName: () => string;
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
  
  // Listen for the wallet-account-changed event
  useEffect(() => {
    const handleWalletAccountChanged = (event: Event) => {
      console.log('AuthContext - wallet-account-changed event received');
      const newAccount = (event as CustomEvent)?.detail?.account;
      console.log('AuthContext - New wallet account from event:', newAccount);

      if (!newAccount) return; // Ignore if no account detail

      // Get current auth state values
      const currentIsAuthenticated = state.isAuthenticated;
      const currentUserWallet = state.user?.walletAddress;
      
      console.log('AuthContext - State before check:', { 
          currentIsAuthenticated, 
          currentUserWalletState: currentUserWallet?.toLowerCase(),
          newAccountLower: newAccount.toLowerCase()
      });

      // Reset auto-login attempt flag for the new account
      autoLoginAttemptedRef.current[newAccount] = false;

      // Determine if the new account corresponds to a demo user
      const demoWallets: Record<string, string> = {
        '0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1': 'pro@example.com',
        '0x8db97c7cece249c2b98bdc0226cc4c2a57bf52fc': 'user@example.com',
      };
      const newAccountLower = newAccount.toLowerCase();
      const isDemoAccount = !!demoWallets[newAccountLower];

      // Scenario 1: User is currently authenticated
      if (currentIsAuthenticated) {
        // Scenario 1a: The new account (from event) is DIFFERENT from the current user's wallet in state
        if (!currentUserWallet || currentUserWallet.toLowerCase() !== newAccountLower) {
          console.log(`AuthContext - Wallet account changed from ${currentUserWallet || 'none'} to ${newAccount}. Logging out previous user.`);
          // Logout previous user
          setState(prevState => ({
            ...prevState,
            user: null,
            error: null,
            isAuthenticated: false,
          }));
          localStorage.removeItem('token');
          localStorage.removeItem('user');

          // Queue login attempt for the NEW account if it's a demo account
          if (isDemoAccount) {
             console.log(`AuthContext - Queuing login for new demo account: ${newAccount}`);
             setTimeout(() => {
                localStorage.setItem('pendingWalletLogin', newAccount);
             }, 100); 
          } else {
             console.log('AuthContext - New account is not a demo account, login not queued.');
          }

        } else {
          // Scenario 1b: The new account is the SAME as the logged-in user's account state.
          console.log('AuthContext - Event received for the same authenticated account state. No logout/login needed.');
        }
      } 
      // Scenario 2: User is NOT authenticated
      else {
         // Queue login attempt for the NEW account if it's a demo account
         if (isDemoAccount) {
            console.log('AuthContext - Not currently authenticated. Queuing login attempt for new demo account:', newAccount);
            setTimeout(() => {
               localStorage.setItem('pendingWalletLogin', newAccount);
            }, 100);
         } else {
             console.log('AuthContext - Not authenticated, and new account is not a demo account. Login not queued.');
         }
      }
    };

    window.addEventListener('wallet-account-changed', handleWalletAccountChanged);

    return () => {
      window.removeEventListener('wallet-account-changed', handleWalletAccountChanged);
    };
    // Use state dependencies, account from hook is unreliable here
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
        });
      }
    };

    checkAuth();
  }, []);

  // Auto-login based on wallet address for demo purposes
  useEffect(() => {
    const autoLoginForDemo = async () => {
      // Only try to auto-login if not already authenticated and we have a wallet address
      // Also respect the skipAutoConnect flag from WalletContext
      if (!state.isAuthenticated && account && !state.loading && !active) {
        // Skip if we've already tried to auto-login with this account
        if (autoLoginAttemptedRef.current[account]) {
          return;
        }
        
        console.log('Debug - Auto-login check:', { 
          isAuthenticated: state.isAuthenticated, 
          account, 
          loading: state.loading,
          active,
          accountLowerCase: account.toLowerCase(),
        });
        
        // Mark that we've attempted login with this account
        autoLoginAttemptedRef.current[account] = true;
        
        // Map of demo wallet addresses to emails (convert to lowercase for case-insensitive matching)
        const demoWallets: Record<string, string> = {
          '0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1': 'pro@example.com',
          '0x8db97c7cece249c2b98bdc0226cc4c2a57bf52fc': 'user@example.com',
        };
        
        // If we recognize this wallet, auto-login that user (use lowercase for matching)
        const accountLower = account.toLowerCase();
        if (demoWallets[accountLower]) {
          console.log(`Auto-logging in as ${demoWallets[accountLower]} for demo`);
          try {
            // Use the existing login function
            const success = await login(demoWallets[accountLower], 'password');
            console.log('Auto-login result:', success);
          } catch (error) {
            console.error('Error during auto-login:', error);
          }
        } else {
          console.log('Wallet not recognized for auto-login:', accountLower);
          console.log('Available wallets:', Object.keys(demoWallets));
        }
      }
    };
    
    autoLoginForDemo();
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
      }));
      // Update localStorage as well
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } else if (state.isAuthenticated && state.user && !account && state.user.walletAddress) {
      // Handle case where wallet disconnects while user is logged in
      console.log('AuthContext - Wallet disconnected, clearing wallet address from user state');
       const updatedUser = { ...state.user, walletAddress: undefined };
      setState(prevState => ({
        ...prevState,
        user: updatedUser,
      }));
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }, [account, state.isAuthenticated, state.user]); // Rerun when account or auth state changes

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setState({
      ...state,
      loading: true,
      error: null,
    });
    
    try {
      // In a real app, this would be an API call
      // Simulating API call for development
      
      // Mock successful login
      const mockResponse = {
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: {
            id: '1',
            username: 'testuser',
            email: email,
            roles: ['user'], // Default role
            // Explicitly set walletAddress using the *current* account from the hook
            walletAddress: account || undefined,
            proStatus: email === 'pro@example.com' ? 'verified' as const : undefined // Demo only: pre-verified pro for demo
          }
        }
      };
      
      // For demo purposes, add admin role for specific test email
      if (email === 'admin@example.com') {
        mockResponse.data.user.roles.push('admin');
      }
      
      if (mockResponse.success) {
        const { token, user } = mockResponse.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        setState({
          user,
          loading: false,
          error: null,
          isAuthenticated: true,
        });
        return true;
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err: any) {
      setState({
        ...state,
        error: err.message || 'Login failed',
        loading: false,
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

      // In a real app, send registration data to server
      // For demo, we'll simulate this with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validate input
      if (!data.username) {
        throw new Error('Username is required');
      }
      
      // For wallet-based registration, require wallet address
      if (!data.walletAddress) {
        throw new Error('Wallet address is required for wallet-based registration');
      }

      // Create a demo user with a token
      const newUser: User = {
        id: `user_${Date.now()}`,
        username: data.username,
        email: data.email || `wallet_user_${Date.now().toString(36)}@example.com`, // Generate temp email if not provided
        roles: ['user'],
        walletAddress: data.walletAddress,
        isWalletOnlyAccount: !data.email // Flag to indicate this is a wallet-only account
      };

      // Store token and user in localStorage
      localStorage.setItem('token', `demo_token_${Date.now()}`);
      localStorage.setItem('user', JSON.stringify(newUser));

      // Update state
      setState({
        user: newUser,
        loading: false,
        error: null,
        isAuthenticated: true
      });

      console.log(`User registered successfully: ${data.username} with wallet ${data.walletAddress}`);
      return true;
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
    });
    
    try {
      // In a real app, this would be an API call
      // Simulating API call for development
      
      if (!state.user) {
        throw new Error('You must be logged in to request Pro status');
      }
      
      // Mock successful pro status request
      const mockResponse = {
        success: true
      };
      
      if (mockResponse.success) {
        const updatedUser = {
          ...state.user,
          proStatus: 'pending' as const, // Use const assertion
          proVerificationData: proData,
          dateProRequested: new Date().toISOString()
        };
        
        setState({
          ...state,
          user: updatedUser,
        });
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setState({
          ...state,
          loading: false,
        });
        return true;
      } else {
        throw new Error('Failed to submit Pro status request');
      }
    } catch (err: any) {
      setState({
        ...state,
        error: err.message || 'Pro status request failed',
        loading: false,
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
    });
  };

  // Function to attempt auto-login with a wallet address
  const attemptAutoLoginWithWallet = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;
    
    console.log('AuthContext - Attempting auto-login with wallet:', walletAddress);
    
    // Make sure we're operating with a clean state before attempting login
    // This prevents the previous user from remaining logged in
    if (state.isAuthenticated) {
      console.log('AuthContext - Logging out previous user before attempting auto-login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Update state immediately to ensure clean login
      setState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    }
    
    // Map of demo wallet addresses to emails (convert to lowercase for case-insensitivity)
    const demoWallets: Record<string, string> = {
      '0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1': 'pro@example.com',
      '0x8db97c7cece249c2b98bdc0226cc4c2a57bf52fc': 'user@example.com',
    };
    
    // Ensure we have a lowercase version for case-insensitive comparison
    const accountLower = walletAddress.toLowerCase();
    
    // Log the available wallets and the current wallet
    console.log('AuthContext - Available wallets:', Object.keys(demoWallets));
    console.log('AuthContext - Current wallet (lowercase):', accountLower);
    
    // If we recognize this wallet, auto-login that user (use lowercase for matching)
    if (demoWallets[accountLower]) {
      const email = demoWallets[accountLower];
      console.log(`AuthContext - Auto-logging in as ${email} for wallet ${accountLower}`);
      
      try {
        // Add a small delay to ensure previous state changes have taken effect
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Use the existing login function
        const success = await login(email, 'password');
        console.log('AuthContext - Auto-login result:', success ? 'SUCCESS' : 'FAILED', 'for', email);
        
        if (success) {
          // Additional confirmation of the login
          console.log('AuthContext - Successfully logged in as:', email);
        }
      } catch (error) {
        console.error('AuthContext - Error during auto-login:', error);
      }
    } else {
      console.log('AuthContext - Wallet not recognized for auto-login:', accountLower);
    }
  }, [login, state.isAuthenticated]);
  
  // Check for pending wallet login after functions are defined
  useEffect(() => {
    const pendingWallet = localStorage.getItem('pendingWalletLogin');
    if (pendingWallet) {
      console.log('AuthContext - Found pending wallet login:', pendingWallet);
      attemptAutoLoginWithWallet(pendingWallet);
      localStorage.removeItem('pendingWalletLogin');
    }
  }, [attemptAutoLoginWithWallet]);

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

  const value = {
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    login,
    logout,
    register,
    requestProStatus,
    loading: state.loading,
    error: state.error,
    getDisplayName
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