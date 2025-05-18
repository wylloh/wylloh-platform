/**
 * Tag data models for the Wylloh platform.
 * These interfaces define the structure of tags and tag categories in the system.
 */

/**
 * Base Tag interface representing a content tag
 */
export interface Tag {
  /**
   * Unique identifier for the tag
   */
  id: string;
  
  /**
   * Display name of the tag
   */
  name: string;
  
  /**
   * Optional description of what the tag represents
   */
  description?: string;
  
  /**
   * Category ID this tag belongs to
   */
  categoryId?: string;
  
  /**
   * Usage count - how many content items use this tag
   */
  usageCount: number;
  
  /**
   * Creation date
   */
  createdAt: string;
  
  /**
   * Last modified date
   */
  updatedAt: string;
  
  /**
   * Creator user ID
   */
  createdBy: string;
  
  /**
   * Whether this is a system tag that can't be deleted
   */
  isSystem?: boolean;
}

/**
 * Tag Category for organizing tags
 */
export interface TagCategory {
  /**
   * Unique identifier for the category
   */
  id: string;
  
  /**
   * Display name of the category
   */
  name: string;
  
  /**
   * Optional description of what the category represents
   */
  description?: string;
  
  /**
   * Color used for visual representation
   */
  color?: string;
  
  /**
   * Optional icon name
   */
  icon?: string;
  
  /**
   * Creation date
   */
  createdAt: string;
  
  /**
   * Creator user ID
   */
  createdBy: string;
  
  /**
   * Whether this is a system category that can't be deleted
   */
  isSystem?: boolean;
}

/**
 * Extended tag with category information
 */
export interface TagWithCategory extends Tag {
  /**
   * The full category object
   */
  category?: TagCategory;
}

/**
 * Tag Suggestion with confidence score
 */
export interface TagSuggestion {
  /**
   * Tag ID or name if not yet created
   */
  tagId?: string;
  
  /**
   * Display name of the tag
   */
  name: string;
  
  /**
   * Category ID this tag belongs to
   */
  categoryId?: string;
  
  /**
   * Confidence score (0-100)
   */
  confidence: number;
  
  /**
   * Source of this suggestion (AI, user history, popular, etc.)
   */
  source: 'ai' | 'history' | 'popular' | 'similar-content';
}

/**
 * Tag Filter criteria
 */
export interface TagFilter {
  /**
   * Unique identifier for the filter
   */
  id?: string;
  
  /**
   * Display name of the filter
   */
  name?: string;
  
  /**
   * Tags to include
   */
  includeTags: string[];
  
  /**
   * Tags to exclude
   */
  excludeTags?: string[];
  
  /**
   * Whether to match all include tags (AND) or any (OR)
   */
  matchAllTags?: boolean;
  
  /**
   * Categories to filter by
   */
  categories?: string[];
  
  /**
   * Whether this filter is saved as a favorite
   */
  isFavorite?: boolean;
  
  /**
   * Creation date
   */
  createdAt?: string;
  
  /**
   * Creator user ID
   */
  createdBy?: string;
} 