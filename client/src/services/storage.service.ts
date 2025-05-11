/**
 * Service for managing local storage of content and assets
 */
export class StorageService {
  private cachePrefix = 'wylloh_cache_';
  private metadataPrefix = 'wylloh_meta_';
  private maxCacheSize = 500 * 1024 * 1024; // 500MB max cache size
  private currentCacheSize = 0;
  
  constructor() {
    this.calculateCurrentCacheSize();
  }
  
  /**
   * Calculate the current cache size
   */
  private calculateCurrentCacheSize(): void {
    try {
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.cachePrefix)) {
          const item = localStorage.getItem(key);
          if (item) {
            totalSize += item.length;
          }
        }
      }
      
      this.currentCacheSize = totalSize;
      console.log(`StorageService: Current cache size: ${this.formatSize(this.currentCacheSize)}`);
    } catch (error) {
      console.error('StorageService: Error calculating cache size:', error);
    }
  }
  
  /**
   * Format bytes to human-readable size
   * 
   * @param bytes Size in bytes
   * @returns Formatted size string
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  }
  
  /**
   * Store data in cache
   * 
   * @param key Cache key
   * @param data Data to store
   * @param metadata Optional metadata
   * @returns True if stored successfully
   */
  public store(key: string, data: string, metadata?: any): boolean {
    try {
      const dataSize = data.length;
      
      // Check if adding this would exceed cache size
      if (this.currentCacheSize + dataSize > this.maxCacheSize) {
        // Need to clear some space
        this.clearOldestEntries(dataSize);
      }
      
      // Store the data
      localStorage.setItem(`${this.cachePrefix}${key}`, data);
      
      // Store metadata if provided
      if (metadata) {
        localStorage.setItem(
          `${this.metadataPrefix}${key}`, 
          JSON.stringify({
            ...metadata,
            size: dataSize,
            timestamp: Date.now()
          })
        );
      }
      
      // Update current cache size
      this.currentCacheSize += dataSize;
      
      return true;
    } catch (error) {
      console.error(`StorageService: Error storing data for key ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Retrieve data from cache
   * 
   * @param key Cache key
   * @returns Cached data or null if not found
   */
  public retrieve(key: string): string | null {
    try {
      return localStorage.getItem(`${this.cachePrefix}${key}`);
    } catch (error) {
      console.error(`StorageService: Error retrieving data for key ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Get metadata for a cached item
   * 
   * @param key Cache key
   * @returns Metadata object or null if not found
   */
  public getMetadata(key: string): any | null {
    try {
      const metadataStr = localStorage.getItem(`${this.metadataPrefix}${key}`);
      return metadataStr ? JSON.parse(metadataStr) : null;
    } catch (error) {
      console.error(`StorageService: Error retrieving metadata for key ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Clear oldest entries to make space for new data
   * 
   * @param requiredSpace Space required in bytes
   */
  private clearOldestEntries(requiredSpace: number): void {
    try {
      // Get all cache entries with their timestamps
      const entries: Array<{key: string, timestamp: number, size: number}> = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.metadataPrefix)) {
          const metadataKey = key.slice(this.metadataPrefix.length);
          const metadata = this.getMetadata(metadataKey);
          
          if (metadata && metadata.timestamp) {
            entries.push({
              key: metadataKey,
              timestamp: metadata.timestamp,
              size: metadata.size || 0
            });
          }
        }
      }
      
      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest entries until we have enough space
      let freedSpace = 0;
      for (const entry of entries) {
        if (freedSpace >= requiredSpace) {
          break;
        }
        
        // Remove data and metadata
        localStorage.removeItem(`${this.cachePrefix}${entry.key}`);
        localStorage.removeItem(`${this.metadataPrefix}${entry.key}`);
        
        freedSpace += entry.size;
        this.currentCacheSize -= entry.size;
        
        console.log(`StorageService: Removed ${entry.key} from cache (${this.formatSize(entry.size)})`);
      }
      
      console.log(`StorageService: Freed ${this.formatSize(freedSpace)} of space`);
    } catch (error) {
      console.error('StorageService: Error clearing oldest entries:', error);
    }
  }
  
  /**
   * Clear all cached data
   */
  public clearCache(): void {
    try {
      const keysToRemove: string[] = [];
      
      // Collect all cache keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(this.cachePrefix) || key.startsWith(this.metadataPrefix))) {
          keysToRemove.push(key);
        }
      }
      
      // Remove all collected keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      this.currentCacheSize = 0;
      console.log('StorageService: Cache cleared');
    } catch (error) {
      console.error('StorageService: Error clearing cache:', error);
    }
  }
}

export const storageService = new StorageService(); 