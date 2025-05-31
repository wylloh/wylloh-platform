/**
 * Development Mode Hook
 * Provides access to development features and configuration
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { permissionService } from '../../services/permission.service';
import { DevModeConfig } from '../../types/user.types';

// Mock useAuth hook for now - this should be replaced with actual auth hook
const useAuth = () => ({
  user: null as any, // Replace with actual user type
});

export interface DevModeState {
  isEnabled: boolean;
  config: DevModeConfig;
  canAccess: boolean;
  isLoading: boolean;
}

export interface DevModeActions {
  toggleDevMode: () => Promise<void>;
  updateConfig: (config: Partial<DevModeConfig>) => void;
  hasDevPermission: (permission: string) => Promise<boolean>;
  canAccessFeature: (featureId: string) => Promise<boolean>;
}

export function useDevMode(): DevModeState & DevModeActions {
  const { user } = useAuth();
  const [state, setState] = useState<DevModeState>({
    isEnabled: false,
    config: {
      enabled: false,
      showTestContent: false,
      showContentLabels: false,
      enableDebugMode: false,
      mockServices: false,
      logLevel: 'info',
    },
    canAccess: false,
    isLoading: true,
  });

  // Initialize development mode state
  useEffect(() => {
    const initializeDevMode = async () => {
      try {
        const config = permissionService.getDevModeConfig();
        const canAccess = user ? await permissionService.hasPermission(
          user, 
          'accessDevDashboard', 
          'development'
        ) : false;

        setState(prev => ({
          ...prev,
          isEnabled: config.enabled,
          config,
          canAccess,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Failed to initialize dev mode:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeDevMode();
  }, [user]);

  // Listen for dev mode changes
  useEffect(() => {
    const handleDevModeChange = (event: CustomEvent) => {
      const { enabled } = event.detail;
      setState(prev => ({
        ...prev,
        isEnabled: enabled,
        config: { ...prev.config, enabled },
      }));
    };

    window.addEventListener('devModeChanged', handleDevModeChange as EventListener);
    return () => {
      window.removeEventListener('devModeChanged', handleDevModeChange as EventListener);
    };
  }, []);

  // Toggle development mode
  const toggleDevMode = useCallback(async () => {
    if (!user) return;

    try {
      const newEnabled = !state.isEnabled;
      await permissionService.setDevMode(user.id, newEnabled);
      
      setState(prev => ({
        ...prev,
        isEnabled: newEnabled,
        config: { ...prev.config, enabled: newEnabled },
      }));
    } catch (error) {
      console.error('Failed to toggle dev mode:', error);
    }
  }, [user, state.isEnabled]);

  // Update development mode configuration
  const updateConfig = useCallback((configUpdate: Partial<DevModeConfig>) => {
    const newConfig = { ...state.config, ...configUpdate };
    permissionService.updateDevModeConfig(configUpdate);
    
    setState(prev => ({
      ...prev,
      config: newConfig,
    }));
  }, [state.config]);

  // Check development permission
  const hasDevPermission = useCallback(async (permission: string): Promise<boolean> => {
    if (!user) return false;
    return permissionService.hasPermission(user, permission, 'development');
  }, [user]);

  // Check feature access
  const canAccessFeature = useCallback(async (featureId: string): Promise<boolean> => {
    if (!user) return false;
    return permissionService.canAccessFeature(user, featureId);
  }, [user]);

  return {
    ...state,
    toggleDevMode,
    updateConfig,
    hasDevPermission,
    canAccessFeature,
  };
}

// Development mode context for easier access
const DevModeContext = createContext<(DevModeState & DevModeActions) | null>(null);

export function DevModeProvider({ children }: { children: ReactNode }) {
  const devMode = useDevMode();

  return (
    <DevModeContext.Provider value={devMode}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevModeContext() {
  const context = useContext(DevModeContext);
  if (!context) {
    throw new Error('useDevModeContext must be used within a DevModeProvider');
  }
  return context;
} 