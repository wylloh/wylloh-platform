/**
 * API client for wallet authentication
 * Replaces localStorage with database persistence
 */

// 🔒 SECURITY: Correct API URL configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

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
  async connectWallet(walletAddress: string): Promise<{ success: boolean; user?: WalletUser; needsProfile?: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/wallet/connect`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ walletAddress }),
      });

      const data: APIResponse<WalletUser> = await response.json();

      if (data.success && data.user && data.token) {
        // Store authentication data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log(`Wallet authenticated successfully: ${data.user.username} (${walletAddress})`);
        return { success: true, user: data.user };
      } else {
        // User doesn't exist, needs to create profile
        console.log(`No profile found for wallet: ${walletAddress}`);
        return { success: false, needsProfile: true };
      }
    } catch (error) {
      console.error('Wallet connect API error:', error);
      return { success: false };
    }
  }

  /**
   * Create new wallet profile
   */
  async createWalletProfile(walletAddress: string, username: string, email?: string): Promise<{ success: boolean; user?: WalletUser; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/wallet/create-profile`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ walletAddress, username, email }),
      });

      const data: APIResponse<WalletUser> = await response.json();

      if (data.success && data.user && data.token) {
        // Store authentication data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
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
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
    }
    return null;
  }

  /**
   * Clear authentication data
   */
  clearAuth(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }
}

export const authAPI = new AuthAPI();
export type { WalletUser }; 