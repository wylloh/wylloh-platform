import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Safely get wallet context, providing default values
  const { account = null } = useWallet();

  // Check for existing session on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // In a real app, validate the token with the server
          // For now, we'll just simulate this
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          
          if (userData && userData.id) {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // Invalid stored user data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Authentication verification failed');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Update user wallet address when wallet connection changes
  useEffect(() => {
    if (isAuthenticated && user && account && account !== user.walletAddress) {
      const updatedUser = { ...user, walletAddress: account };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // In a real app, you would update this on the server as well
    }
  }, [account, isAuthenticated, user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
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
        
        setUser(user);
        setIsAuthenticated(true);
        setLoading(false);
        return true;
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
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
        
        setUser(user);
        setIsAuthenticated(true);
        setLoading(false);
        return true;
      } else {
        throw new Error('Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setLoading(false);
      return false;
    }
  };

  const requestProStatus = async (proData: ProVerificationData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // Simulating API call for development
      
      if (!user) {
        throw new Error('You must be logged in to request Pro status');
      }
      
      // Mock successful pro status request
      const mockResponse = {
        success: true
      };
      
      if (mockResponse.success) {
        const updatedUser = {
          ...user,
          proStatus: 'pending' as const, // Use const assertion
          proVerificationData: proData,
          dateProRequested: new Date().toISOString()
        };
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setLoading(false);
        return true;
      } else {
        throw new Error('Failed to submit Pro status request');
      }
    } catch (err: any) {
      setError(err.message || 'Pro status request failed');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    register,
    requestProStatus,
    loading,
    error
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