/**
 * Content Filter Hook
 * Provides easy integration of content filtering with permission checking
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDevMode } from './useDevMode';
import { 
  contentFilterService, 
  ContentItem, 
  ContentFilterOptions, 
  FilteredContent 
} from '../services/contentFilter.service';

export interface UseContentFilterOptions {
  autoFilter?: boolean;
  defaultOptions?: Partial<ContentFilterOptions>;
}

export interface UseContentFilterReturn<T extends ContentItem> {
  // Filtered content
  filteredContent: FilteredContent<T> | null;
  isFiltering: boolean;
  
  // Filter options
  filterOptions: ContentFilterOptions;
  updateFilterOptions: (options: Partial<ContentFilterOptions>) => void;
  resetFilterOptions: () => void;
  
  // Filter actions
  filterContent: (content: T[]) => Promise<void>;
  
  // Utility functions
  createTestContent: (baseContent: Partial<ContentItem>, testOptions: any) => ContentItem;
  getContentLabel: (contentClass: any, testMetadata?: any) => any;
  validateContent: (metadata: any) => any;
  
  // Statistics
  contentStats: ReturnType<typeof contentFilterService.getContentStatistics> | null;
}

export function useContentFilter<T extends ContentItem>(
  content: T[] = [],
  options: UseContentFilterOptions = {}
): UseContentFilterReturn<T> {
  const { autoFilter = true, defaultOptions = {} } = options;
  const { config, canAccess, hasDevPermission } = useDevMode();
  
  // State
  const [filteredContent, setFilteredContent] = useState<FilteredContent<T> | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterOptions, setFilterOptions] = useState<ContentFilterOptions>({
    includeTestContent: false,
    includeDevContent: false,
    includeDemoContent: true,
    showContentLabels: config.showContentLabels,
    userContext: null,
    ...defaultOptions
  });

  // Update filter options when dev config changes
  useEffect(() => {
    setFilterOptions(prev => ({
      ...prev,
      showContentLabels: config.showContentLabels
    }));
  }, [config.showContentLabels]);

  // Filter content function
  const filterContent = useCallback(async (contentToFilter: T[]) => {
    if (!contentToFilter.length) {
      setFilteredContent(null);
      return;
    }

    setIsFiltering(true);
    try {
      const result = await contentFilterService.filterContent(contentToFilter, filterOptions);
      setFilteredContent(result);
    } catch (error) {
      console.error('Failed to filter content:', error);
      setFilteredContent(null);
    } finally {
      setIsFiltering(false);
    }
  }, [filterOptions]);

  // Auto-filter when content or options change
  useEffect(() => {
    if (autoFilter && content.length > 0) {
      filterContent(content);
    }
  }, [content, filterOptions, autoFilter, filterContent]);

  // Update filter options
  const updateFilterOptions = useCallback((newOptions: Partial<ContentFilterOptions>) => {
    setFilterOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  // Reset filter options
  const resetFilterOptions = useCallback(() => {
    setFilterOptions({
      includeTestContent: false,
      includeDevContent: false,
      includeDemoContent: true,
      showContentLabels: config.showContentLabels,
      userContext: null,
      ...defaultOptions
    });
  }, [config.showContentLabels, defaultOptions]);

  // Utility functions
  const createTestContent = useCallback((
    baseContent: Partial<ContentItem>, 
    testOptions: any
  ) => {
    return contentFilterService.createTestContent(baseContent, testOptions);
  }, []);

  const getContentLabel = useCallback((contentClass: any, testMetadata?: any) => {
    return contentFilterService.getContentLabel(contentClass, testMetadata);
  }, []);

  const validateContent = useCallback((metadata: any) => {
    return contentFilterService.validateContentClassification(metadata);
  }, []);

  // Content statistics
  const contentStats = useMemo(() => {
    if (content.length > 0) {
      return contentFilterService.getContentStatistics(content);
    }
    return null;
  }, [content]);

  return {
    filteredContent,
    isFiltering,
    filterOptions,
    updateFilterOptions,
    resetFilterOptions,
    filterContent,
    createTestContent,
    getContentLabel,
    validateContent,
    contentStats
  };
}

/**
 * Hook for managing test content creation
 */
export function useTestContentCreator() {
  const { hasDevPermission } = useDevMode();
  const [canCreate, setCanCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      const permission = await hasDevPermission('createTestContent');
      setCanCreate(permission);
    };
    checkPermissions();
  }, [hasDevPermission]);

  const createTestContent = useCallback(async (
    baseContent: Partial<ContentItem>,
    testOptions: {
      testSuite: string;
      purpose: any;
      expirationHours?: number;
      tags?: string[];
      developer?: string;
    }
  ) => {
    if (!canCreate) {
      throw new Error('No permission to create test content');
    }

    setIsCreating(true);
    try {
      const content = contentFilterService.createTestContent(baseContent, testOptions);
      return content;
    } finally {
      setIsCreating(false);
    }
  }, [canCreate]);

  return {
    canCreate,
    isCreating,
    createTestContent
  };
}

/**
 * Hook for content classification validation
 */
export function useContentValidation() {
  const validateContent = useCallback((metadata: any) => {
    return contentFilterService.validateContentClassification(metadata);
  }, []);

  const getContentLabel = useCallback((contentClass: any, testMetadata?: any) => {
    return contentFilterService.getContentLabel(contentClass, testMetadata);
  }, []);

  const createClassification = useCallback((contentClass: any, options: any = {}) => {
    return contentFilterService.createContentClassification(contentClass, options);
  }, []);

  return {
    validateContent,
    getContentLabel,
    createClassification
  };
} 