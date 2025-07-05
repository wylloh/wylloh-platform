// UI Constants for Wylloh Platform
// Consistent styling and dimensions across components

export const POSTER_ASPECT_RATIOS = {
  // Classic movie poster aspect ratio (27:40 ≈ 2:3)
  MOVIE_POSTER: '2/3',
  
  // Alternative ratios for different content types
  LANDSCAPE: '16/9',
  SQUARE: '1/1',
  PORTRAIT: '3/4'
} as const;

export const POSTER_DIMENSIONS = {
  // Heights for different contexts
  MARKETPLACE_CARD: 240,
  LIBRARY_CARD: 240,
  DETAIL_VIEW: 400,
  THUMBNAIL: 120,
  
  // Widths calculated from aspect ratios
  MARKETPLACE_CARD_WIDTH: 160, // 240 * (2/3)
  LIBRARY_CARD_WIDTH: 160,
  DETAIL_VIEW_WIDTH: 267, // 400 * (2/3)
  THUMBNAIL_WIDTH: 80 // 120 * (2/3)
} as const;

export const POSTER_STYLES = {
  // Common styles for movie posters
  MOVIE_POSTER: {
    aspectRatio: POSTER_ASPECT_RATIOS.MOVIE_POSTER,
    objectFit: 'cover' as const,
    backgroundColor: '#f5f5f5', // Subtle background for missing posters
    borderRadius: '8px', // Consistent border radius
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)' // Subtle shadow for depth
  },
  
  // Fallback/placeholder styles
  PLACEHOLDER: {
    backgroundColor: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#757575',
    fontSize: '0.875rem'
  }
} as const;

export const GRID_SPACING = {
  // Consistent spacing for content grids
  MARKETPLACE: 3,
  LIBRARY: 3,
  SEARCH_RESULTS: 2,
  FEATURED: 4
} as const;

export const BREAKPOINTS = {
  // Responsive breakpoints for content cards
  CARDS_PER_ROW: {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5
  }
} as const;

export const CONTENT_CARD_COLORS = {
  // Status colors for content cards
  OWNED: '#4caf50',
  AVAILABLE: '#2196f3',
  UNAVAILABLE: '#f44336',
  RENTED: '#ff9800',
  SOLD: '#9c27b0'
} as const;

// Export everything as a single object for easier importing
export const UI_CONSTANTS = {
  POSTER_ASPECT_RATIOS,
  POSTER_DIMENSIONS,
  POSTER_STYLES,
  GRID_SPACING,
  BREAKPOINTS,
  CONTENT_CARD_COLORS
} as const; 