import React, { createContext, useState, useEffect, useContext } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  accountType: 'standard' | 'pro' | 'admin';
  isVerified: boolean;
  createdAt: string;
  preferences?: Record<string, any>;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  updateUser: (userData: Partial<User>) => Promise<void>;
  logout: () => void;
}

// Create the context with a default value
export const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  error: null,
  updateUser: async () => {},
  logout: () => {},
});

// Custom hook to use the user context
export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data on initial mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In production, we would fetch from API
        // const response = await fetch('/api/user');
        // const userData = await response.json();
        
        // Mock data for development
        const storedUser = localStorage.getItem('wylloh_user');
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // Default mock user for development
          const mockUser: User = {
            id: 'user123',
            username: 'testuser',
            email: 'user@example.com',
            accountType: 'standard',
            isVerified: true,
            createdAt: new Date().toISOString(),
          };
          
          localStorage.setItem('wylloh_user', JSON.stringify(mockUser));
          setUser(mockUser);
        }
      } catch (err) {
        setError('Failed to load user data');
        console.error('Error loading user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Update user information
  const updateUser = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      
      // In production, we would update via API
      // const response = await fetch('/api/user', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(userData),
      // });
      // const updatedUser = await response.json();
      
      // Mock update for development
      if (user) {
        const updatedUser = { ...user, ...userData } as User;
        localStorage.setItem('wylloh_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (err) {
      setError('Failed to update user data');
      console.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('wylloh_user');
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loading, error, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider; 