import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { Box, Skeleton, useTheme } from '@mui/material';

interface LazyLoadWrapperProps {
  children: ReactNode;
  height?: number | string;
  width?: number | string;
  threshold?: number;
  rootMargin?: string;
  fallback?: ReactNode;
  skeletonVariant?: 'text' | 'rectangular' | 'circular';
  skeletonAnimation?: 'pulse' | 'wave' | false;
  className?: string;
}

/**
 * LazyLoadWrapper - Optimizes performance by lazy loading components when they enter viewport
 * Uses Intersection Observer API for efficient viewport detection
 * Provides customizable skeleton loading states
 */
const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({
  children,
  height = 200,
  width = '100%',
  threshold = 0.1,
  rootMargin = '50px',
  fallback,
  skeletonVariant = 'rectangular',
  skeletonAnimation = 'wave',
  className
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsIntersecting(true);
          setHasLoaded(true);
          // Disconnect observer after first load for performance
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
      observer.disconnect();
    };
  }, [threshold, rootMargin, hasLoaded]);

  const renderFallback = () => {
    if (fallback) {
      return fallback;
    }

    return (
      <Skeleton
        variant={skeletonVariant}
        animation={skeletonAnimation}
        width={width}
        height={height}
        sx={{
          bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.300',
          borderRadius: 1,
        }}
      />
    );
  };

  return (
    <Box
      ref={elementRef}
      className={className}
      sx={{
        width,
        height: isIntersecting ? 'auto' : height,
        minHeight: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isIntersecting ? children : renderFallback()}
    </Box>
  );
};

export default LazyLoadWrapper; 