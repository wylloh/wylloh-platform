/**
 * Content Classification and Filtering Service
 * Handles content visibility based on classification and user permissions
 */

import { 
  ContentClass, 
  EnhancedContentMetadata, 
  ContentVisibility, 
  TestMetadata,
  User 
} from '../../types/user.types';
import { permissionService } from '../../services/permission.service';

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  contentClass: ContentClass;
  testMetadata?: TestMetadata;
  visibility: ContentVisibility;
  createdAt: string;
  updatedAt: string;
  // ... other content fields
}

export interface ContentFilterOptions {
  includeTestContent?: boolean;
  includeDevContent?: boolean;
  includeDemoContent?: boolean;
  showContentLabels?: boolean;
  userContext?: User | null;
}

export interface FilteredContent<T extends ContentItem> {
  items: T[];
  totalCount: number;
  filteredCount: number;
  hiddenCount: number;
  classifications: {
    production: number;
    test: number;
    demo: number;
    development: number;
  };
}

export class ContentFilterService {
  private static instance: ContentFilterService;

  static getInstance(): ContentFilterService {
    if (!ContentFilterService.instance) {
      ContentFilterService.instance = new ContentFilterService();
    }
    return ContentFilterService.instance;
  }

  /**
   * Filter content based on classification and user permissions
   */
  async filterContent<T extends ContentItem>(
    content: T[],
    options: ContentFilterOptions = {}
  ): Promise<FilteredContent<T>> {
    const {
      includeTestContent = false,
      includeDevContent = false,
      includeDemoContent = true,
      showContentLabels = false,
      userContext = null
    } = options;

    // Get user permissions for development content
    const canViewTestContent = userContext ? 
      await permissionService.hasPermission(userContext, 'viewTestContent', 'development') : false;
    const canViewDevContent = userContext ? 
      await permissionService.hasPermission(userContext, 'accessDevTools', 'development') : false;

    // Get development mode configuration
    const devConfig = permissionService.getDevModeConfig();
    const isDevModeEnabled = permissionService.isDevelopmentEnvironment();

    // Determine what content to include based on permissions and settings
    const shouldIncludeTest = includeTestContent && 
      (canViewTestContent || (isDevModeEnabled && devConfig.showTestContent));
    const shouldIncludeDev = includeDevContent && 
      (canViewDevContent || isDevModeEnabled);
    const shouldIncludeDemo = includeDemoContent;

    // Filter content
    const filteredItems: T[] = [];
    const classifications = {
      production: 0,
      test: 0,
      demo: 0,
      development: 0
    };

    for (const item of content) {
      // Count classifications
      classifications[item.contentClass]++;

      // Apply filtering logic
      let shouldInclude = false;

      switch (item.contentClass) {
        case 'production':
          shouldInclude = item.visibility.showInStore || item.visibility.showInSearch;
          break;
        case 'test':
          shouldInclude = shouldIncludeTest;
          break;
        case 'demo':
          shouldInclude = shouldIncludeDemo;
          break;
        case 'development':
          shouldInclude = shouldIncludeDev;
          break;
      }

      // Additional visibility checks
      if (shouldInclude) {
        // Check if content is expired (for test content)
        if (item.testMetadata?.expirationIntent) {
          const now = new Date();
          const expiration = new Date(item.testMetadata.expirationIntent);
          if (now > expiration) {
            shouldInclude = false;
          }
        }

        // Apply visibility settings
        if (item.contentClass === 'production') {
          // For production content, respect visibility settings
          shouldInclude = item.visibility.showInStore || 
                         item.visibility.showInSearch || 
                         item.visibility.showInRecommendations;
        }
      }

      if (shouldInclude) {
        filteredItems.push(item);
      }
    }

    return {
      items: filteredItems,
      totalCount: content.length,
      filteredCount: filteredItems.length,
      hiddenCount: content.length - filteredItems.length,
      classifications
    };
  }

  /**
   * Create content classification metadata
   */
  createContentClassification(
    contentClass: ContentClass,
    options: {
      testMetadata?: Partial<TestMetadata>;
      visibility?: Partial<ContentVisibility>;
      developmentInfo?: {
        branch?: string;
        commit?: string;
        developer?: string;
        buildNumber?: string;
      };
    } = {}
  ): EnhancedContentMetadata {
    const defaultVisibility: ContentVisibility = {
      showInStore: contentClass === 'production',
      showInSearch: contentClass === 'production' || contentClass === 'demo',
      showInRecommendations: contentClass === 'production',
      showInAnalytics: true,
      showInPublicLists: contentClass === 'production'
    };

    const metadata: EnhancedContentMetadata = {
      contentClass,
      visibility: { ...defaultVisibility, ...options.visibility }
    };

    // Add test metadata if applicable
    if (contentClass !== 'production' && options.testMetadata) {
      metadata.testMetadata = {
        testSuite: options.testMetadata.testSuite || 'general',
        testId: options.testMetadata.testId || `test-${Date.now()}`,
        createdBy: options.testMetadata.createdBy || 'unknown',
        purpose: options.testMetadata.purpose || 'development',
        tags: options.testMetadata.tags || [],
        ...options.testMetadata
      };
    }

    // Add development info if applicable
    if (options.developmentInfo) {
      metadata.developmentInfo = options.developmentInfo;
    }

    return metadata;
  }

  /**
   * Get content classification label for UI display
   */
  getContentLabel(contentClass: ContentClass, testMetadata?: TestMetadata): {
    text: string;
    color: string;
    icon: string;
    description: string;
  } {
    switch (contentClass) {
      case 'production':
        return {
          text: 'LIVE',
          color: 'success',
          icon: '🟢',
          description: 'Production content visible to all users'
        };
      case 'test':
        return {
          text: testMetadata?.purpose?.toUpperCase() || 'TEST',
          color: 'warning',
          icon: '🧪',
          description: 'Test content - only visible in development mode'
        };
      case 'demo':
        return {
          text: 'DEMO',
          color: 'info',
          icon: '🎬',
          description: 'Demo content for showcasing features'
        };
      case 'development':
        return {
          text: 'DEV',
          color: 'secondary',
          icon: '🔧',
          description: 'Development content - only visible to developers'
        };
      default:
        return {
          text: 'UNKNOWN',
          color: 'error',
          icon: '❓',
          description: 'Unknown content classification'
        };
    }
  }

  /**
   * Validate content classification
   */
  validateContentClassification(metadata: EnhancedContentMetadata): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate content class
    const validClasses: ContentClass[] = ['production', 'test', 'demo', 'development'];
    if (!validClasses.includes(metadata.contentClass)) {
      errors.push(`Invalid content class: ${metadata.contentClass}`);
    }

    // Validate test metadata for non-production content
    if (metadata.contentClass !== 'production') {
      if (!metadata.testMetadata) {
        warnings.push('Test metadata recommended for non-production content');
      } else {
        if (!metadata.testMetadata.testSuite) {
          warnings.push('Test suite not specified');
        }
        if (!metadata.testMetadata.createdBy) {
          warnings.push('Creator not specified in test metadata');
        }
        if (metadata.testMetadata.expirationIntent) {
          const expiration = new Date(metadata.testMetadata.expirationIntent);
          const now = new Date();
          if (expiration <= now) {
            warnings.push('Content has expired');
          }
        }
      }
    }

    // Validate visibility settings
    if (metadata.contentClass === 'production') {
      if (!metadata.visibility.showInStore && !metadata.visibility.showInSearch) {
        warnings.push('Production content not visible in store or search');
      }
    }

    if (metadata.contentClass === 'test' || metadata.contentClass === 'development') {
      if (metadata.visibility.showInStore || metadata.visibility.showInSearch) {
        errors.push('Test/development content should not be visible in store or search');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create test content with automatic expiration
   */
  createTestContent(
    baseContent: Partial<ContentItem>,
    testOptions: {
      testSuite: string;
      purpose: TestMetadata['purpose'];
      expirationHours?: number;
      tags?: string[];
      developer?: string;
    }
  ): ContentItem {
    const now = new Date();
    const expiration = new Date(now.getTime() + (testOptions.expirationHours || 24) * 60 * 60 * 1000);

    const testMetadata: TestMetadata = {
      testSuite: testOptions.testSuite,
      testId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdBy: testOptions.developer || 'unknown',
      expirationIntent: expiration,
      purpose: testOptions.purpose,
      tags: testOptions.tags || []
    };

    const visibility: ContentVisibility = {
      showInStore: false,
      showInSearch: false,
      showInRecommendations: false,
      showInAnalytics: true,
      showInPublicLists: false
    };

    return {
      id: baseContent.id || `test-content-${Date.now()}`,
      title: baseContent.title || 'Test Content',
      description: baseContent.description,
      contentClass: 'test',
      testMetadata,
      visibility,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      ...baseContent
    } as ContentItem;
  }

  /**
   * Get content statistics by classification
   */
  getContentStatistics(content: ContentItem[]): {
    total: number;
    byClassification: Record<ContentClass, number>;
    byVisibility: {
      visible: number;
      hidden: number;
      expired: number;
    };
  } {
    const stats = {
      total: content.length,
      byClassification: {
        production: 0,
        test: 0,
        demo: 0,
        development: 0
      } as Record<ContentClass, number>,
      byVisibility: {
        visible: 0,
        hidden: 0,
        expired: 0
      }
    };

    const now = new Date();

    content.forEach(item => {
      stats.byClassification[item.contentClass]++;

      // Check visibility
      const isVisible = item.visibility.showInStore || 
                       item.visibility.showInSearch || 
                       item.visibility.showInRecommendations;
      
      // Check expiration
      const isExpired = item.testMetadata?.expirationIntent ? 
        new Date(item.testMetadata.expirationIntent) <= now : false;

      if (isExpired) {
        stats.byVisibility.expired++;
      } else if (isVisible) {
        stats.byVisibility.visible++;
      } else {
        stats.byVisibility.hidden++;
      }
    });

    return stats;
  }
}

// Export singleton instance
export const contentFilterService = ContentFilterService.getInstance(); 