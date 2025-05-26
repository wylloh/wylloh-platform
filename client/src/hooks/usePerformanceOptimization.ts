import { useCallback, useRef, useMemo, useEffect } from 'react';

/**
 * Custom hook for performance optimization utilities
 * Provides debouncing, throttling, and memoization helpers
 */
export const usePerformanceOptimization = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, []);

  /**
   * Debounce function - delays execution until after delay has passed since last call
   */
  const debounce = useCallback((func: Function, delay: number = 300) => {
    return (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        func.apply(null, args);
      }, delay);
    };
  }, []);

  /**
   * Throttle function - limits execution to once per delay period
   */
  const throttle = useCallback((func: Function, delay: number = 100) => {
    return (...args: any[]) => {
      const now = Date.now();
      
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        func.apply(null, args);
      } else if (!throttleRef.current) {
        throttleRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          func.apply(null, args);
          throttleRef.current = null;
        }, delay - (now - lastCallRef.current));
      }
    };
  }, []);

  /**
   * Memoized search function for filtering large datasets
   */
  const createMemoizedFilter = useCallback(<T>(
    items: T[],
    filterFn: (item: T, query: string) => boolean,
    dependencies: any[] = []
  ) => {
    return useMemo(() => {
      return (query: string) => {
        if (!query.trim()) return items;
        return items.filter(item => filterFn(item, query.toLowerCase()));
      };
    }, [items, filterFn, ...dependencies]);
  }, []);

  /**
   * Optimized pagination helper
   */
  const createPagination = useCallback(<T>(
    items: T[],
    pageSize: number = 12
  ) => {
    return useMemo(() => {
      const totalPages = Math.ceil(items.length / pageSize);
      
      return {
        totalPages,
        totalItems: items.length,
        getPage: (page: number) => {
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          return items.slice(startIndex, endIndex);
        },
        hasNextPage: (page: number) => page < totalPages,
        hasPrevPage: (page: number) => page > 1,
      };
    }, [items, pageSize]);
  }, []);

  /**
   * Image lazy loading helper
   */
  const createImageLoader = useCallback(() => {
    const imageCache = new Map<string, boolean>();
    
    return {
      preloadImage: (src: string): Promise<void> => {
        if (imageCache.has(src)) {
          return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            imageCache.set(src, true);
            resolve();
          };
          img.onerror = reject;
          img.src = src;
        });
      },
      
      preloadImages: async (sources: string[]): Promise<void> => {
        const uncachedSources = sources.filter(src => !imageCache.has(src));
        
        if (uncachedSources.length === 0) return;
        
        const promises = uncachedSources.map(src => {
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              imageCache.set(src, true);
              resolve();
            };
            img.onerror = () => resolve(); // Don't fail the batch for one image
            img.src = src;
          });
        });
        
        await Promise.all(promises);
      },
      
      isImageCached: (src: string) => imageCache.has(src),
    };
  }, []);

  /**
   * Performance monitoring helper
   */
  const createPerformanceMonitor = useCallback(() => {
    const metrics = new Map<string, number>();
    
    return {
      startTiming: (label: string) => {
        metrics.set(label, performance.now());
      },
      
      endTiming: (label: string): number => {
        const startTime = metrics.get(label);
        if (!startTime) return 0;
        
        const duration = performance.now() - startTime;
        metrics.delete(label);
        
        // Log slow operations in development
        if (process.env.NODE_ENV === 'development' && duration > 100) {
          console.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
        }
        
        return duration;
      },
      
      measureAsync: async <T>(label: string, asyncFn: () => Promise<T>): Promise<T> => {
        const startTime = performance.now();
        try {
          const result = await asyncFn();
          const duration = performance.now() - startTime;
          
          if (process.env.NODE_ENV === 'development' && duration > 200) {
            console.warn(`Slow async operation: ${label} took ${duration.toFixed(2)}ms`);
          }
          
          return result;
        } catch (error) {
          const duration = performance.now() - startTime;
          console.error(`Failed operation: ${label} failed after ${duration.toFixed(2)}ms`, error);
          throw error;
        }
      },
    };
  }, []);

  return {
    debounce,
    throttle,
    createMemoizedFilter,
    createPagination,
    createImageLoader,
    createPerformanceMonitor,
  };
}; 