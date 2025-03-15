import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useWallet } from './WalletContext';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  requestProStatus: (proData: ProVerificationData) => Promise<boolean>;
  loading: boolean;
  error: string | null;
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
      
      // Extract the new account from the event if available
      const newAccount = (event as CustomEvent)?.detail?.account;
      console.log('AuthContext - New wallet account:', newAccount);
      
      // Reset auto-login tracking for the new account
      if (newAccount) {
        autoLoginAttemptedRef.current[newAccount] = false;
        
        // Force logout the current user if authenticated
        if (state.isAuthenticated) {
          console.log('AuthContext - Logging out current user due to wallet change');
          setState({
            user: null,
            loading: false,
            error: null,
            isAuthenticated: false,
          });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        
        // Queue the auto-login attempt after this render cycle
        setTimeout(() => {
          // Store the wallet address for login attempt after functions are defined
          localStorage.setItem('pendingWalletLogin', newAccount);
        }, 100);
      }
    };
    
    window.addEventListener('wallet-account-changed', handleWalletAccountChanged);
    
    return () => {
      window.removeEventListener('wallet-account-changed', handleWalletAccountChanged);
    };
  }, [state.isAuthenticated]);
  
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
    if (state.isAuthenticated && state.user && account && account !== state.user.walletAddress) {
      const updatedUser = { ...state.user, walletAddress: account };
      setState({
        ...state,
        user: updatedUser,
      });
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // In a real app, you would update this on the server as well
    }
  }, [account, state.isAuthenticated, state.user]);

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
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setState({
      ...state,
      loading: true,
      error: null,
    });
    
    try {
      // In a real app, this would be an API call
      // Simulating API call for development
      
      // Create roles array with default user role
      const roles = ['user'];
      
      // For demo purposes, add admin role for specific test email
      if (email === 'admin@example.com') {
        roles.push('admin');
      }
      
      // Mock successful registration
      const mockResponse = {
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: {
            id: Date.now().toString(),
            username,
            email,
            roles,
            walletAddress: account || undefined
          }
        }
      };
      
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
        throw new Error('Registration failed');
      }
    } catch (err: any) {
      setState({
        ...state,
        error: err.message || 'Registration failed',
        loading: false,
      });
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

  const value = {
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    login,
    logout,
    register,
    requestProStatus,
    loading: state.loading,
    error: state.error
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