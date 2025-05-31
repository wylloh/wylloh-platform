import React from 'react';

/**
 * Standardized Component Interface Definitions
 * 
 * This file establishes consistent patterns for component props across the Wylloh platform.
 * All components should extend these base interfaces to ensure consistency and interoperability.
 */

// ============================================================================
// BASE CALLBACK TYPES
// ============================================================================

/**
 * Standard callback for content item interactions
 */
export type ContentCallback<T = any> = (item: T) => void;

/**
 * Standard callback for content item interactions with event
 */
export type ContentCallbackWithEvent<T = any> = (event: React.MouseEvent, item: T) => void;

/**
 * Standard callback for simple actions with just an ID
 */
export type IdCallback = (id: string) => void;

/**
 * Standard callback for selection actions
 */
export type SelectionCallback = (id: string, selected: boolean) => void;

// ============================================================================
// BASE COMPONENT INTERFACES
// ============================================================================

/**
 * Base interface for components that handle content items
 */
export interface BaseContentComponentProps<T = any> {
  onItemClick?: ContentCallback<T>;
  onPlayClick?: ContentCallbackWithEvent<T>;
  onFavoriteClick?: ContentCallbackWithEvent<T>;
  onShareClick?: ContentCallbackWithEvent<T>;
  onInfoClick?: ContentCallbackWithEvent<T>;
}

/**
 * Base interface for data-driven components
 */
export interface BaseDataComponentProps<T = any> {
  items: T[];
  loading?: boolean;
  error?: string | null;
  maxItems?: number;
  emptyStateMessage?: string;
  emptyStateTitle?: string;
}

/**
 * Base interface for styling customization
 */
export interface BaseStyledComponentProps {
  variant?: 'compact' | 'standard' | 'detailed';
  elevation?: number;
  className?: string;
  sx?: object; // MUI sx prop for custom styling
}

/**
 * Base interface for layout components
 */
export interface BaseLayoutComponentProps {
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  showActions?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Base interface for components with selection capabilities
 */
export interface BaseSelectableComponentProps {
  isSelected?: boolean;
  onSelect?: SelectionCallback;
  selectable?: boolean;
}

/**
 * Base interface for components with loading states
 */
export interface BaseLoadingComponentProps {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// ============================================================================
// CONTENT-SPECIFIC INTERFACES
// ============================================================================

/**
 * Standard interface for recommendation item data
 */
export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  genre: string[];
  rating: number;
  duration: string;
  year: number;
  director: string;
  type: 'movie' | 'series' | 'documentary';
  price?: number;
  isOwned?: boolean;
}

/**
 * Standard interface for recommendation components
 */
export interface BaseRecommendationComponentProps 
  extends BaseContentComponentProps<RecommendationItem>,
          BaseDataComponentProps<RecommendationItem>,
          BaseStyledComponentProps,
          BaseLayoutComponentProps,
          BaseLoadingComponentProps {
  recommendations?: RecommendationItem[]; // Alternative to items for backward compatibility
  showActions?: boolean;
  context?: 'store' | 'search' | 'dashboard' | 'profile';
}

/**
 * Standard interface for content card components
 */
export interface BaseContentCardProps<T = any>
  extends BaseContentComponentProps<T>,
          BaseStyledComponentProps,
          BaseSelectableComponentProps,
          BaseLoadingComponentProps {
  content: T;
  context?: 'store' | 'search' | 'pro' | 'consumer' | 'library';
  showPrice?: boolean;
  hideStatus?: boolean;
  isFavorite?: boolean;
  // Additional content-specific callbacks
  onBuy?: IdCallback;
  onRent?: IdCallback;
  onView?: IdCallback;
}

// ============================================================================
// PANEL/CONTAINER INTERFACES
// ============================================================================

/**
 * Standard interface for panel/container components
 */
export interface BasePanelComponentProps
  extends BaseStyledComponentProps,
          BaseLayoutComponentProps,
          BaseLoadingComponentProps {
  showTabs?: boolean;
  defaultTab?: number;
  onTabChange?: (tabIndex: number) => void;
}

/**
 * Standard interface for list components
 */
export interface BaseListComponentProps<T = any>
  extends BaseDataComponentProps<T>,
          BaseStyledComponentProps,
          BaseLayoutComponentProps {
  renderItem?: (item: T, index: number) => React.ReactNode;
  itemProps?: Partial<BaseContentCardProps<T>>;
  gridProps?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

// ============================================================================
// FORM/INPUT INTERFACES
// ============================================================================

/**
 * Standard interface for form components
 */
export interface BaseFormComponentProps {
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

/**
 * Standard interface for search components
 */
export interface BaseSearchComponentProps extends BaseFormComponentProps {
  placeholder?: string;
  value?: string;
  onSearch?: (query: string) => void;
  onClear?: () => void;
  suggestions?: string[];
  showSuggestions?: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Helper type for making all properties optional except specified ones
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Helper type for component props with children
 */
export interface WithChildren {
  children?: React.ReactNode;
}

/**
 * Helper type for components that can be used as controlled or uncontrolled
 */
export interface ControllableProps<T> {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
}

// ============================================================================
// THEME/STYLING TYPES
// ============================================================================

/**
 * Standard color variants used across components
 */
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/**
 * Standard size variants used across components
 */
export type SizeVariant = 'small' | 'medium' | 'large';

/**
 * Standard spacing values
 */
export type SpacingVariant = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  // Re-export React types for convenience
  React,
};

/**
 * Usage Examples:
 * 
 * // Recommendation component
 * interface MyRecommendationProps extends BaseRecommendationComponentProps {
 *   customProp?: string;
 * }
 * 
 * // Content card component
 * interface MyContentCardProps extends BaseContentCardProps<Content> {
 *   showAnalytics?: boolean;
 * }
 * 
 * // Panel component
 * interface MyPanelProps extends BasePanelComponentProps {
 *   data: any[];
 * }
 */ 