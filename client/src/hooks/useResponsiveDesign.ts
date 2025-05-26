import { useState, useEffect } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';

interface ResponsiveBreakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  screenSize: 'mobile' | 'tablet' | 'desktop' | 'large';
}

interface ResponsiveConfig {
  gridColumns: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  containerMaxWidth: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  spacing: number;
  typography: {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    body1: string;
    body2: string;
  };
}

/**
 * Custom hook for responsive design utilities
 * Provides breakpoint detection and responsive configuration
 */
export const useResponsiveDesign = () => {
  const theme = useTheme();
  
  // Breakpoint detection
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  // Determine current screen size
  const getScreenSize = (): 'mobile' | 'tablet' | 'desktop' | 'large' => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    if (isDesktop) return 'desktop';
    return 'large';
  };

  const breakpoints: ResponsiveBreakpoints = {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    screenSize: getScreenSize(),
  };

  // Responsive grid configuration
  const getGridColumns = (contentType: 'content' | 'analytics' | 'library' = 'content') => {
    const configs = {
      content: {
        xs: 1,
        sm: 2,
        md: 3,
        lg: 4,
        xl: 5,
      },
      analytics: {
        xs: 1,
        sm: 1,
        md: 2,
        lg: 3,
        xl: 4,
      },
      library: {
        xs: 1,
        sm: 2,
        md: 3,
        lg: 4,
        xl: 6,
      },
    };
    
    return configs[contentType];
  };

  // Responsive container configuration
  const getContainerConfig = (): ResponsiveConfig => {
    return {
      gridColumns: getGridColumns(),
      containerMaxWidth: isMobile ? 'sm' : isTablet ? 'md' : 'lg',
      spacing: isMobile ? 2 : isTablet ? 3 : 4,
      typography: {
        h1: isMobile ? 'h3' : isTablet ? 'h2' : 'h1',
        h2: isMobile ? 'h4' : isTablet ? 'h3' : 'h2',
        h3: isMobile ? 'h5' : isTablet ? 'h4' : 'h3',
        h4: isMobile ? 'h6' : isTablet ? 'h5' : 'h4',
        body1: 'body1',
        body2: 'body2',
      },
    };
  };

  // Responsive navigation configuration
  const getNavigationConfig = () => {
    return {
      showLabels: !isMobile,
      variant: isMobile ? 'bottom' : 'side',
      collapsed: isMobile,
      drawerWidth: isMobile ? '100%' : isTablet ? 280 : 320,
    };
  };

  // Responsive dialog configuration
  const getDialogConfig = () => {
    return {
      fullScreen: isMobile,
      maxWidth: isMobile ? false : isTablet ? 'sm' : 'md',
      fullWidth: true,
    };
  };

  // Responsive table configuration
  const getTableConfig = () => {
    return {
      size: isMobile ? 'small' : 'medium',
      stickyHeader: true,
      hideColumns: isMobile ? ['description', 'creator', 'date'] : isTablet ? ['description'] : [],
      pagination: {
        rowsPerPageOptions: isMobile ? [5, 10] : isTablet ? [10, 25] : [10, 25, 50],
        defaultRowsPerPage: isMobile ? 5 : 10,
      },
    };
  };

  // Responsive card configuration
  const getCardConfig = () => {
    return {
      elevation: isMobile ? 1 : 2,
      variant: 'outlined' as const,
      imageHeight: isMobile ? 160 : isTablet ? 200 : 240,
      showFullDescription: !isMobile,
      actionsOrientation: isMobile ? 'vertical' : 'horizontal',
    };
  };

  // Responsive form configuration
  const getFormConfig = () => {
    return {
      size: isMobile ? 'small' : 'medium',
      variant: 'outlined' as const,
      fullWidth: true,
      margin: isMobile ? 'dense' : 'normal',
      spacing: isMobile ? 2 : 3,
    };
  };

  // Responsive button configuration
  const getButtonConfig = () => {
    return {
      size: isMobile ? 'small' : 'medium',
      fullWidth: isMobile,
      variant: 'contained' as const,
      showIcons: !isMobile,
    };
  };

  // Responsive spacing utilities
  const getSpacing = (base: number = 1) => {
    const multiplier = isMobile ? 0.75 : isTablet ? 0.875 : 1;
    return base * multiplier;
  };

  // Responsive font size utilities
  const getFontSize = (variant: 'small' | 'medium' | 'large' = 'medium') => {
    const sizes = {
      small: isMobile ? '0.75rem' : '0.875rem',
      medium: isMobile ? '0.875rem' : '1rem',
      large: isMobile ? '1rem' : '1.125rem',
    };
    
    return sizes[variant];
  };

  return {
    breakpoints,
    config: getContainerConfig(),
    navigation: getNavigationConfig(),
    dialog: getDialogConfig(),
    table: getTableConfig(),
    card: getCardConfig(),
    form: getFormConfig(),
    button: getButtonConfig(),
    getGridColumns,
    getSpacing,
    getFontSize,
  };
}; 