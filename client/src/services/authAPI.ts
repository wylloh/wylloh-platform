/**
 * API client for wallet authentication
 * Replaces localStorage with database persistence
 */

import { User } from '../types/user.types';
import { API_BASE_URL } from '../config';

interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  token?: string;
  user?: T;
}

interface WalletUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  walletAddress: string;
  proStatus?: 'pending' | 'verified' | 'rejected';
  proVerificationData?: {
    fullName: string;
    biography: string;
    professionalLinks: {
      imdb?: string;
      website?: string;
      vimeo?: string;
      linkedin?: string;
    };
    filmographyHighlights?: string;
  };
  dateProRequested?: string;
  dateProApproved?: string;
}

export interface WalletConnectRequest {
  walletAddress: string;
  chainId: number;
  signature?: string;
}

export interface WalletConnectResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  isNewWallet?: boolean;
}

export interface CreateProfileRequest {
  walletAddress: string;
  username: string;
  email?: string;
  profileType: 'consumer' | 'pro';
  chainId: number;
}

export interface CreateProfileResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

class AuthAPI {
  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Connect wallet and authenticate (or check for existing profile)
   */
  async connectWallet(request: WalletConnectRequest): Promise<WalletConnectResponse> {
    try {
      console.log('🔗 Attempting wallet connection:', {
        address: request.walletAddress,
        chainId: request.chainId
      });

      const response = await fetch(`${API_BASE_URL}/auth/wallet/connect`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Wallet connection response:', data);
      return data;
    } catch (error) {
      console.error('❌ Wallet connect API error:', error);
      throw error;
    }
  }

  /**
   * Create new wallet profile
   */
  async createWalletProfile(walletAddress: string, username: string, email?: string): Promise<{ success: boolean; user?: WalletUser; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/wallet/create-profile`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ walletAddress, username, email }),
      });

      const data: APIResponse<WalletUser> = await response.json();

      if (data.success && data.user && data.token) {
        // 🔒 ENTERPRISE SECURITY: Store only JWT token, no user data in localStorage
        localStorage.setItem('token', data.token);
        
        console.log(`Wallet profile created successfully: ${data.user.username} (${walletAddress})`);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || 'Failed to create profile' };
      }
    } catch (error) {
      console.error('Create wallet profile API error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Get current user from stored token
   */
  getCurrentUser(): WalletUser | null {
    // 🔒 ENTERPRISE SECURITY: No localStorage user data - always fetch from server
    return null;
  }

  /**
   * Clear authentication data
   */
  clearAuth(): void {
    localStorage.removeItem('token');
    // 🔒 ENTERPRISE SECURITY: No user data in localStorage to clear
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: { username: string; email: string }): Promise<{ success: boolean; user?: WalletUser; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: this.getHeaders(true), // Include auth token
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (data.success && data.user) {
        // 🔒 ENTERPRISE SECURITY: No localStorage writes - return fresh server data
        console.log(`✅ Profile updated in MongoDB: ${data.user.username}`);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || 'Failed to update profile' };
      }
    } catch (error) {
      console.error('❌ Update profile API error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Request Pro status verification
   */
  async requestProStatus(proData: { fullName: string; biography: string; professionalLinks: any; filmographyHighlights?: string }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/pro-status/request`, {
        method: 'POST',
        headers: this.getHeaders(true), // Include auth token
        body: JSON.stringify(proData),
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Pro status request submitted successfully`);
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.message || 'Failed to submit Pro status request' };
      }
    } catch (error) {
      console.error('❌ Pro status request API error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  /**
   * Refresh user data from server
   */
  async refreshUser(): Promise<{ success: boolean; user?: WalletUser; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'GET',
        headers: this.getHeaders(true), // Include auth token
      });

      const data = await response.json();

      if (data.success && data.user) {
        // 🔒 ENTERPRISE SECURITY: No localStorage writes - return fresh server data
        console.log(`✅ User data refreshed from server: ${data.user.username}`);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || 'Failed to refresh user data' };
      }
    } catch (error) {
      console.error('❌ Refresh user API error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export const authAPI = new AuthAPI();
export type { WalletUser }; 