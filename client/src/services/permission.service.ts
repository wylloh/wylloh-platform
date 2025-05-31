/**
 * Environment-Aware Permission Service
 * Handles permissions for production, development, and testing contexts
 */

import { 
  User, 
  UserRole, 
  UserPermissions, 
  PermissionContext, 
  DEFAULT_PERMISSIONS,
  DevModeConfig,
  FeatureFlag 
} from '../types/user.types';

export class PermissionService {
  private static instance: PermissionService;
  private isDevelopment = process.env.NODE_ENV === 'development';
  private devModeConfig: DevModeConfig;
  private featureFlags: Map<string, FeatureFlag> = new Map();

  constructor() {
    this.devModeConfig = this.loadDevModeConfig();
    this.loadFeatureFlags();
  }

  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  /**
   * Main permission checking method with environment awareness
   */
  async hasPermission(
    user: User | null,
    permission: string,
    context: PermissionContext = 'production'
  ): Promise<boolean> {
    if (!user) return false;

    // Development permissions only available in dev mode or when explicitly enabled
    if (context === 'development') {
      if (!this.isDevelopmentModeAvailable(user)) {
        return false;
      }
      return this.checkDevelopmentPermission(user, permission);
    }

    // Production permissions
    if (context === 'production') {
      return this.checkProductionPermission(user, permission);
    }

    // Testing permissions
    if (context === 'testing') {
      return this.checkTestingPermission(user, permission);
    }

    return false;
  }

  /**
   * Check if development mode is available for the user
   */
  private isDevelopmentModeAvailable(user: User): boolean {
    // Always available in development environment
    if (this.isDevelopment) return true;

    // Available if user has dev mode enabled and appropriate role
    if (user.settings.devModeEnabled && this.hasDevRole(user)) {
      return true;
    }

    // Available if global dev mode is enabled (for testing in production)
    return this.devModeConfig.enabled;
  }

  /**
   * Check if user has a development-capable role
   */
  private hasDevRole(user: User): boolean {
    const devRoles: UserRole[] = ['developer', 'admin', 'tester'];
    return user.roles.some(role => devRoles.includes(role));
  }

  /**
   * Check production permissions
   */
  private checkProductionPermission(user: User, permission: string): boolean {
    return user.permissions.production[permission as keyof typeof user.permissions.production] || false;
  }

  /**
   * Check development permissions
   */
  private checkDevelopmentPermission(user: User, permission: string): boolean {
    return user.permissions.development[permission as keyof typeof user.permissions.development] || false;
  }

  /**
   * Check testing permissions
   */
  private checkTestingPermission(user: User, permission: string): boolean {
    return user.permissions.testing[permission as keyof typeof user.permissions.testing] || false;
  }

  /**
   * Check if user can access a specific feature flag
   */
  async canAccessFeature(user: User | null, featureId: string): Promise<boolean> {
    const feature = this.featureFlags.get(featureId);
    if (!feature || !feature.enabled) return false;

    if (!user) return false;

    // Check role conditions
    if (feature.conditions?.userRoles) {
      const hasRequiredRole = user.roles.some(role => 
        feature.conditions!.userRoles!.includes(role)
      );
      if (!hasRequiredRole) return false;
    }

    // Check user ID conditions
    if (feature.conditions?.userIds) {
      if (!feature.conditions.userIds.includes(user.id)) return false;
    }

    // Check environment conditions
    if (feature.conditions?.environment) {
      const currentEnv = this.isDevelopment ? 'development' : 'production';
      if (!feature.conditions.environment.includes(currentEnv)) return false;
    }

    // Check rollout percentage
    if (feature.rolloutPercentage < 100) {
      const userHash = this.hashUserId(user.id);
      const userPercentile = userHash % 100;
      if (userPercentile >= feature.rolloutPercentage) return false;
    }

    return true;
  }

  /**
   * Get user permissions with role-based defaults
   */
  getUserPermissions(roles: UserRole[]): UserPermissions {
    const permissions: UserPermissions = {
      production: {
        manageUsers: false,
        moderateContent: false,
        viewAnalytics: false,
        manageTokens: false,
        accessAdminPanel: false,
      },
      development: {
        viewTestContent: false,
        createTestContent: false,
        accessDevTools: false,
        manageFeatureFlags: false,
        viewSystemMetrics: false,
        accessDevDashboard: false,
        manageContentClassification: false,
      },
      testing: {
        submitTestReports: false,
        accessBetaFeatures: false,
        earnTestingRewards: false,
        viewTestingDashboard: false,
        participateInCanaryTesting: false,
      },
    };

    // Merge permissions from all roles (OR operation)
    roles.forEach(role => {
      const rolePermissions = DEFAULT_PERMISSIONS[role];
      
      // Merge production permissions
      Object.keys(rolePermissions.production).forEach(key => {
        const permKey = key as keyof typeof permissions.production;
        permissions.production[permKey] = permissions.production[permKey] || 
          rolePermissions.production[permKey];
      });

      // Merge development permissions
      Object.keys(rolePermissions.development).forEach(key => {
        const permKey = key as keyof typeof permissions.development;
        permissions.development[permKey] = permissions.development[permKey] || 
          rolePermissions.development[permKey];
      });

      // Merge testing permissions
      Object.keys(rolePermissions.testing).forEach(key => {
        const permKey = key as keyof typeof permissions.testing;
        permissions.testing[permKey] = permissions.testing[permKey] || 
          rolePermissions.testing[permKey];
      });
    });

    return permissions;
  }

  /**
   * Enable/disable development mode for a user
   */
  async setDevMode(userId: string, enabled: boolean): Promise<void> {
    // Store in localStorage for client-side persistence
    localStorage.setItem(`wylloh_dev_mode_${userId}`, enabled.toString());
    
    // Update dev mode config
    this.devModeConfig.enabled = enabled;
    this.saveDevModeConfig();

    // Emit event for UI updates
    window.dispatchEvent(new CustomEvent('devModeChanged', { 
      detail: { enabled, userId } 
    }));
  }

  /**
   * Get current development mode configuration
   */
  getDevModeConfig(): DevModeConfig {
    return { ...this.devModeConfig };
  }

  /**
   * Update development mode configuration
   */
  updateDevModeConfig(config: Partial<DevModeConfig>): void {
    this.devModeConfig = { ...this.devModeConfig, ...config };
    this.saveDevModeConfig();
  }

  /**
   * Load development mode configuration
   */
  private loadDevModeConfig(): DevModeConfig {
    const stored = localStorage.getItem('wylloh_dev_mode_config');
    const defaultConfig: DevModeConfig = {
      enabled: this.isDevelopment,
      showTestContent: this.isDevelopment,
      showContentLabels: this.isDevelopment,
      enableDebugMode: this.isDevelopment,
      mockServices: false,
      logLevel: this.isDevelopment ? 'debug' : 'info',
    };

    if (stored) {
      try {
        return { ...defaultConfig, ...JSON.parse(stored) };
      } catch (error) {
        console.warn('Failed to parse dev mode config:', error);
      }
    }

    return defaultConfig;
  }

  /**
   * Save development mode configuration
   */
  private saveDevModeConfig(): void {
    localStorage.setItem('wylloh_dev_mode_config', JSON.stringify(this.devModeConfig));
  }

  /**
   * Load feature flags (in production, this would come from a service)
   */
  private async loadFeatureFlags(): Promise<void> {
    // In development, load from localStorage or use defaults
    const stored = localStorage.getItem('wylloh_feature_flags');
    
    if (stored) {
      try {
        const flags = JSON.parse(stored);
        flags.forEach((flag: FeatureFlag) => {
          this.featureFlags.set(flag.id, flag);
        });
        return;
      } catch (error) {
        console.warn('Failed to parse feature flags:', error);
      }
    }

    // Default feature flags for development
    const defaultFlags: FeatureFlag[] = [
      {
        id: 'dev-dashboard',
        name: 'Development Dashboard',
        description: 'Access to development tools and metrics',
        enabled: true,
        rolloutPercentage: 100,
        conditions: {
          userRoles: ['developer', 'admin'],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
      },
      {
        id: 'test-content-visibility',
        name: 'Test Content Visibility',
        description: 'Show test content in production with labels',
        enabled: false,
        rolloutPercentage: 0,
        conditions: {
          userRoles: ['developer', 'admin', 'tester'],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
      },
      {
        id: 'community-testing',
        name: 'Community Testing Program',
        description: 'Access to beta features and testing rewards',
        enabled: true,
        rolloutPercentage: 25,
        conditions: {
          userRoles: ['creator', 'tester', 'developer', 'admin'],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
      },
    ];

    defaultFlags.forEach(flag => {
      this.featureFlags.set(flag.id, flag);
    });
  }

  /**
   * Update a feature flag
   */
  async updateFeatureFlag(flag: FeatureFlag): Promise<void> {
    this.featureFlags.set(flag.id, flag);
    
    // Save to localStorage in development
    if (this.isDevelopment) {
      const flags = Array.from(this.featureFlags.values());
      localStorage.setItem('wylloh_feature_flags', JSON.stringify(flags));
    }
    
    // In production, this would sync with the backend
  }

  /**
   * Get all feature flags
   */
  getFeatureFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values());
  }

  /**
   * Simple hash function for user ID to determine rollout percentage
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Check if current environment supports development features
   */
  isDevelopmentEnvironment(): boolean {
    return this.isDevelopment || this.devModeConfig.enabled;
  }

  /**
   * Get permission summary for debugging
   */
  getPermissionSummary(user: User): {
    production: string[];
    development: string[];
    testing: string[];
    features: string[];
  } {
    const summary = {
      production: [] as string[],
      development: [] as string[],
      testing: [] as string[],
      features: [] as string[],
    };

    // Production permissions
    Object.entries(user.permissions.production).forEach(([key, value]) => {
      if (value) summary.production.push(key);
    });

    // Development permissions (only if dev mode available)
    if (this.isDevelopmentModeAvailable(user)) {
      Object.entries(user.permissions.development).forEach(([key, value]) => {
        if (value) summary.development.push(key);
      });
    }

    // Testing permissions
    Object.entries(user.permissions.testing).forEach(([key, value]) => {
      if (value) summary.testing.push(key);
    });

    // Available features
    this.featureFlags.forEach((flag, id) => {
      if (flag.enabled) summary.features.push(id);
    });

    return summary;
  }
}

// Export singleton instance
export const permissionService = PermissionService.getInstance(); 