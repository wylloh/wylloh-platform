/**
 * Enhanced User Types for Development and Testing Features
 */

export type UserRole = 'user' | 'creator' | 'admin' | 'developer' | 'tester';

export type ContentClass = 'production' | 'test' | 'demo' | 'development';

export interface UserPermissions {
  // Production permissions
  production: {
    manageUsers: boolean;
    moderateContent: boolean;
    viewAnalytics: boolean;
    manageTokens: boolean;
    accessAdminPanel: boolean;
  };
  
  // Development permissions (only available in dev mode)
  development: {
    viewTestContent: boolean;
    createTestContent: boolean;
    accessDevTools: boolean;
    manageFeatureFlags: boolean;
    viewSystemMetrics: boolean;
    accessDevDashboard: boolean;
    manageContentClassification: boolean;
  };
  
  // Testing permissions
  testing: {
    submitTestReports: boolean;
    accessBetaFeatures: boolean;
    earnTestingRewards: boolean;
    viewTestingDashboard: boolean;
    participateInCanaryTesting: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  walletAddress?: string;
  roles: UserRole[];
  permissions: UserPermissions;
  profile: {
    displayName: string;
    avatar?: string;
    bio?: string;
  };
  settings: {
    devModeEnabled: boolean;
    showTestContent: boolean;
    participateInTesting: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TestMetadata {
  testSuite: string;
  testId: string;
  createdBy: string;
  expirationIntent?: Date;
  purpose: 'unit-test' | 'integration-test' | 'demo' | 'development' | 'community-test';
  tags: string[];
}

export interface ContentVisibility {
  showInStore: boolean;
  showInSearch: boolean;
  showInRecommendations: boolean;
  showInAnalytics: boolean;
  showInPublicLists: boolean;
}

export interface EnhancedContentMetadata {
  // Existing metadata fields...
  
  // New classification fields
  contentClass: ContentClass;
  testMetadata?: TestMetadata;
  visibility: ContentVisibility;
  
  // Development tracking
  developmentInfo?: {
    branch?: string;
    commit?: string;
    developer?: string;
    buildNumber?: string;
  };
}

// Permission context types
export type PermissionContext = 'production' | 'development' | 'testing';

// Feature flag types
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions?: {
    userRoles?: UserRole[];
    environment?: string[];
    userIds?: string[];
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Development mode configuration
export interface DevModeConfig {
  enabled: boolean;
  showTestContent: boolean;
  showContentLabels: boolean;
  enableDebugMode: boolean;
  mockServices: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Testing report types
export interface TestReport {
  id: string;
  feature: string;
  testType: 'manual' | 'automated' | 'exploratory';
  status: 'pass' | 'fail' | 'blocked';
  issues: TestIssue[];
  quality: number; // 1-10 rating
  timeSpent: number; // minutes
  environment: string;
  browser?: string;
  device?: string;
  submittedBy: string;
  submittedAt: string;
}

export interface TestIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'bug' | 'usability' | 'performance' | 'security';
  title: string;
  description: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  screenshots?: string[];
  logs?: string[];
}

// Default permission sets for each role
export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  user: {
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
  },
  
  creator: {
    production: {
      manageUsers: false,
      moderateContent: false,
      viewAnalytics: true, // Can view their own content analytics
      manageTokens: true,  // Can manage their own tokens
      accessAdminPanel: false,
    },
    development: {
      viewTestContent: true,
      createTestContent: true,
      accessDevTools: false,
      manageFeatureFlags: false,
      viewSystemMetrics: false,
      accessDevDashboard: false,
      manageContentClassification: false,
    },
    testing: {
      submitTestReports: true,
      accessBetaFeatures: true,
      earnTestingRewards: true,
      viewTestingDashboard: true,
      participateInCanaryTesting: true,
    },
  },
  
  tester: {
    production: {
      manageUsers: false,
      moderateContent: false,
      viewAnalytics: false,
      manageTokens: false,
      accessAdminPanel: false,
    },
    development: {
      viewTestContent: true,
      createTestContent: true,
      accessDevTools: true,
      manageFeatureFlags: false,
      viewSystemMetrics: true,
      accessDevDashboard: true,
      manageContentClassification: false,
    },
    testing: {
      submitTestReports: true,
      accessBetaFeatures: true,
      earnTestingRewards: true,
      viewTestingDashboard: true,
      participateInCanaryTesting: true,
    },
  },
  
  developer: {
    production: {
      manageUsers: false,
      moderateContent: false,
      viewAnalytics: true,
      manageTokens: false,
      accessAdminPanel: false,
    },
    development: {
      viewTestContent: true,
      createTestContent: true,
      accessDevTools: true,
      manageFeatureFlags: true,
      viewSystemMetrics: true,
      accessDevDashboard: true,
      manageContentClassification: true,
    },
    testing: {
      submitTestReports: true,
      accessBetaFeatures: true,
      earnTestingRewards: true,
      viewTestingDashboard: true,
      participateInCanaryTesting: true,
    },
  },
  
  admin: {
    production: {
      manageUsers: true,
      moderateContent: true,
      viewAnalytics: true,
      manageTokens: true,
      accessAdminPanel: true,
    },
    development: {
      viewTestContent: true,
      createTestContent: true,
      accessDevTools: true,
      manageFeatureFlags: true,
      viewSystemMetrics: true,
      accessDevDashboard: true,
      manageContentClassification: true,
    },
    testing: {
      submitTestReports: true,
      accessBetaFeatures: true,
      earnTestingRewards: true,
      viewTestingDashboard: true,
      participateInCanaryTesting: true,
    },
  },
}; 