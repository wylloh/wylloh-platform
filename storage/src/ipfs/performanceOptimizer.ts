import { IPFSHTTPClient } from 'ipfs-http-client';
import NodeCache from 'node-cache';
import { EventEmitter } from 'events';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

// Performance optimization configuration
interface PerformanceConfig {
  cacheSize: number; // MB
  cacheTTL: number; // seconds
  prefetchThreshold: number; // access count threshold
  pinningStrategy: 'popularity' | 'size' | 'age' | 'hybrid';
  maxConcurrentRequests: number;
  compressionEnabled: boolean;
  cdnEnabled: boolean;
}

// Content access statistics
interface ContentStats {
  cid: string;
  accessCount: number;
  lastAccessed: number;
  size: number;
  downloadTime: number;
  popularity: number;
  pinned: boolean;
  cached: boolean;
}

// Performance metrics
interface PerformanceMetrics {
  cacheHitRate: number;
  averageDownloadTime: number;
  totalRequests: number;
  totalCacheHits: number;
  totalCacheMisses: number;
  bandwidthSaved: number;
  activeConnections: number;
}

// CDN configuration
interface CDNConfig {
  provider: 'cloudflare' | 'aws' | 'custom';
  endpoints: string[];
  cacheRules: {
    pattern: string;
    ttl: number;
  }[];
}

class IPFSPerformanceOptimizer extends EventEmitter {
  private ipfsClient: IPFSHTTPClient;
  private config: PerformanceConfig;
  private contentCache: NodeCache;
  private metadataCache: NodeCache;
  private contentStats: Map<string, ContentStats>;
  private performanceMetrics: PerformanceMetrics;
  private activeRequests: Map<string, Promise<Buffer>>;
  private prefetchQueue: Set<string>;
  private cdnConfig?: CDNConfig;

  constructor(ipfsClient: IPFSHTTPClient, config: Partial<PerformanceConfig> = {}) {
    super();
    
    this.ipfsClient = ipfsClient;
    this.config = {
      cacheSize: 500, // 500MB default
      cacheTTL: 3600, // 1 hour
      prefetchThreshold: 5, // prefetch after 5 accesses
      pinningStrategy: 'hybrid',
      maxConcurrentRequests: 10,
      compressionEnabled: true,
      cdnEnabled: false,
      ...config
    };

    // Initialize caches
    this.contentCache = new NodeCache({
      stdTTL: this.config.cacheTTL,
      maxKeys: Math.floor(this.config.cacheSize * 1024 * 1024 / 1000000), // Estimate based on average file size
      useClones: false
    });

    this.metadataCache = new NodeCache({
      stdTTL: this.config.cacheTTL * 2, // Metadata cached longer
      maxKeys: 10000
    });

    // Initialize tracking
    this.contentStats = new Map();
    this.activeRequests = new Map();
    this.prefetchQueue = new Set();

    // Initialize performance metrics
    this.performanceMetrics = {
      cacheHitRate: 0,
      averageDownloadTime: 0,
      totalRequests: 0,
      totalCacheHits: 0,
      totalCacheMisses: 0,
      bandwidthSaved: 0,
      activeConnections: 0
    };

    // Set up cache event listeners
    this.setupCacheEventListeners();

    // Start background optimization tasks
    this.startBackgroundTasks();
  }

  /**
   * Optimized content retrieval with caching and prefetching
   */
  async getContent(cid: string, options: { priority?: 'high' | 'normal' | 'low' } = {}): Promise<Buffer> {
    const startTime = Date.now();
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.activeConnections++;

    try {
      // Check cache first
      const cachedContent = this.contentCache.get<Buffer>(cid);
      if (cachedContent) {
        this.performanceMetrics.totalCacheHits++;
        this.performanceMetrics.activeConnections--;
        this.updateContentStats(cid, Date.now() - startTime, true);
        this.emit('cacheHit', { cid, size: cachedContent.length });
        return cachedContent;
      }

      this.performanceMetrics.totalCacheMisses++;

      // Check if request is already in progress
      const existingRequest = this.activeRequests.get(cid);
      if (existingRequest) {
        const content = await existingRequest;
        this.performanceMetrics.activeConnections--;
        return content;
      }

      // Create new request
      const requestPromise = this.fetchContentOptimized(cid, options);
      this.activeRequests.set(cid, requestPromise);

      try {
        const content = await requestPromise;
        const downloadTime = Date.now() - startTime;

        // Cache the content
        this.cacheContent(cid, content);

        // Update statistics
        this.updateContentStats(cid, downloadTime, false);

        // Check if content should be prefetched in the future
        this.evaluatePrefetching(cid);

        this.emit('contentRetrieved', { cid, size: content.length, downloadTime, cached: false });

        return content;
      } finally {
        this.activeRequests.delete(cid);
        this.performanceMetrics.activeConnections--;
      }
    } catch (error) {
      this.performanceMetrics.activeConnections--;
      this.emit('retrievalError', { cid, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Optimized content fetching with multiple strategies
   */
  private async fetchContentOptimized(
    cid: string, 
    options: { priority?: 'high' | 'normal' | 'low' }
  ): Promise<Buffer> {
    const strategies = this.getRetrievalStrategies(cid, options);
    
    for (const strategy of strategies) {
      try {
        const content = await strategy();
        if (content && content.length > 0) {
          return content;
        }
      } catch (error) {
        console.warn(`Retrieval strategy failed for CID ${cid}:`, error);
        continue;
      }
    }

    throw new Error(`Failed to retrieve content for CID ${cid} using all strategies`);
  }

  /**
   * Get retrieval strategies in order of preference
   */
  private getRetrievalStrategies(
    cid: string, 
    options: { priority?: 'high' | 'normal' | 'low' }
  ): (() => Promise<Buffer>)[] {
    const strategies: (() => Promise<Buffer>)[] = [];

    // Strategy 1: CDN (if enabled and available)
    if (this.config.cdnEnabled && this.cdnConfig) {
      strategies.push(() => this.fetchFromCDN(cid));
    }

    // Strategy 2: Local IPFS node
    strategies.push(() => this.fetchFromLocalNode(cid));

    // Strategy 3: Optimized gateways (parallel requests for high priority)
    if (options.priority === 'high') {
      strategies.push(() => this.fetchFromGatewaysParallel(cid));
    } else {
      strategies.push(() => this.fetchFromGatewaysSequential(cid));
    }

    // Strategy 4: Peer-to-peer network
    strategies.push(() => this.fetchFromPeers(cid));

    return strategies;
  }

  /**
   * Fetch content from CDN
   */
  private async fetchFromCDN(cid: string): Promise<Buffer> {
    if (!this.cdnConfig) {
      throw new Error('CDN not configured');
    }

    for (const endpoint of this.cdnConfig.endpoints) {
      try {
        const response = await axios.get(`${endpoint}/${cid}`, {
          responseType: 'arraybuffer',
          timeout: 10000
        });
        return Buffer.from(response.data);
      } catch (error) {
        continue;
      }
    }

    throw new Error('CDN retrieval failed');
  }

  /**
   * Fetch content from local IPFS node
   */
  private async fetchFromLocalNode(cid: string): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of this.ipfsClient.cat(cid, { timeout: 30000 })) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  /**
   * Fetch content from gateways in parallel (for high priority)
   */
  private async fetchFromGatewaysParallel(cid: string): Promise<Buffer> {
    const gateways = [
      'https://ipfs.io/ipfs/',
      'https://dweb.link/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/'
    ];

    const requests = gateways.map(async (gateway) => {
      const response = await axios.get(`${gateway}${cid}`, {
        responseType: 'arraybuffer',
        timeout: 15000
      });
      return Buffer.from(response.data);
    });

    // Return the first successful response using Promise.race with error handling
    return new Promise((resolve, reject) => {
      let rejectedCount = 0;
      const errors: Error[] = [];

      requests.forEach((request) => {
        request
          .then(resolve)
          .catch((error) => {
            errors.push(error);
            rejectedCount++;
            if (rejectedCount === requests.length) {
              reject(new Error(`All gateway requests failed: ${errors.map(e => e.message).join(', ')}`));
            }
          });
      });
    });
  }

  /**
   * Fetch content from gateways sequentially
   */
  private async fetchFromGatewaysSequential(cid: string): Promise<Buffer> {
    const gateways = [
      'https://ipfs.io/ipfs/',
      'https://dweb.link/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://gateway.pinata.cloud/ipfs/'
    ];

    for (const gateway of gateways) {
      try {
        const response = await axios.get(`${gateway}${cid}`, {
          responseType: 'arraybuffer',
          timeout: 20000
        });
        return Buffer.from(response.data);
      } catch (error) {
        continue;
      }
    }

    throw new Error('Gateway retrieval failed');
  }

  /**
   * Fetch content from peer network
   */
  private async fetchFromPeers(cid: string): Promise<Buffer> {
    // This would implement peer discovery and direct peer connections
    // For now, fallback to basic IPFS client
    return this.fetchFromLocalNode(cid);
  }

  /**
   * Cache content with intelligent eviction
   */
  private cacheContent(cid: string, content: Buffer): void {
    const size = content.length;
    
    // Don't cache very large files (>50MB) unless they're popular
    if (size > 50 * 1024 * 1024) {
      const stats = this.contentStats.get(cid);
      if (!stats || stats.accessCount < this.config.prefetchThreshold) {
        return;
      }
    }

    // Calculate cache priority based on content stats
    const priority = this.calculateCachePriority(cid, size);
    
    // Store with priority-based TTL
    const ttl = this.config.cacheTTL * priority;
    this.contentCache.set(cid, content, ttl);

    // Update bandwidth saved metric
    this.performanceMetrics.bandwidthSaved += size;

    this.emit('contentCached', { cid, size, ttl, priority });
  }

  /**
   * Calculate cache priority for content
   */
  private calculateCachePriority(cid: string, size: number): number {
    const stats = this.contentStats.get(cid);
    if (!stats) return 1;

    let priority = 1;

    // Factor in access frequency
    priority *= Math.min(stats.accessCount / 10, 2);

    // Factor in recency
    const hoursSinceAccess = (Date.now() - stats.lastAccessed) / (1000 * 60 * 60);
    priority *= Math.max(0.1, 1 - hoursSinceAccess / 24);

    // Factor in size (prefer smaller files)
    if (size < 1024 * 1024) priority *= 1.5; // <1MB
    else if (size < 10 * 1024 * 1024) priority *= 1.2; // <10MB
    else if (size > 100 * 1024 * 1024) priority *= 0.5; // >100MB

    return Math.max(0.1, Math.min(3, priority));
  }

  /**
   * Update content access statistics
   */
  private updateContentStats(cid: string, downloadTime: number, fromCache: boolean): void {
    const existing = this.contentStats.get(cid) || {
      cid,
      accessCount: 0,
      lastAccessed: 0,
      size: 0,
      downloadTime: 0,
      popularity: 0,
      pinned: false,
      cached: false
    };

    existing.accessCount++;
    existing.lastAccessed = Date.now();
    existing.cached = fromCache;
    
    if (!fromCache) {
      existing.downloadTime = existing.downloadTime === 0 
        ? downloadTime 
        : (existing.downloadTime * 0.7 + downloadTime * 0.3); // Weighted average
    }

    // Calculate popularity score
    existing.popularity = this.calculatePopularityScore(existing);

    this.contentStats.set(cid, existing);

    // Update global metrics
    this.updateGlobalMetrics();
  }

  /**
   * Calculate popularity score for content
   */
  private calculatePopularityScore(stats: ContentStats): number {
    const accessWeight = Math.log(stats.accessCount + 1);
    const recencyWeight = Math.max(0, 1 - (Date.now() - stats.lastAccessed) / (7 * 24 * 60 * 60 * 1000)); // 7 days
    const sizeWeight = stats.size > 0 ? Math.max(0.1, 1 - stats.size / (100 * 1024 * 1024)) : 1; // Prefer smaller files
    
    return accessWeight * recencyWeight * sizeWeight;
  }

  /**
   * Evaluate if content should be prefetched
   */
  private evaluatePrefetching(cid: string): void {
    const stats = this.contentStats.get(cid);
    if (!stats) return;

    // Prefetch if content is accessed frequently
    if (stats.accessCount >= this.config.prefetchThreshold && !stats.pinned) {
      this.prefetchQueue.add(cid);
      this.emit('prefetchQueued', { cid, accessCount: stats.accessCount });
    }
  }

  /**
   * Process prefetch queue
   */
  private async processPrefetchQueue(): Promise<void> {
    if (this.prefetchQueue.size === 0) return;

    const batch = Array.from(this.prefetchQueue).slice(0, 5); // Process 5 at a time
    this.prefetchQueue.clear();

    for (const cid of batch) {
      try {
        await this.pinContent(cid);
        const stats = this.contentStats.get(cid);
        if (stats) {
          stats.pinned = true;
          this.contentStats.set(cid, stats);
        }
        this.emit('contentPrefetched', { cid });
      } catch (error) {
        console.warn(`Failed to prefetch content ${cid}:`, error);
      }
    }
  }

  /**
   * Pin content to local node
   */
  private async pinContent(cid: string): Promise<void> {
    try {
      await this.ipfsClient.pin.add(cid);
    } catch (error) {
      throw new Error(`Failed to pin content ${cid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update global performance metrics
   */
  private updateGlobalMetrics(): void {
    const totalRequests = this.performanceMetrics.totalRequests;
    if (totalRequests > 0) {
      this.performanceMetrics.cacheHitRate = this.performanceMetrics.totalCacheHits / totalRequests;
    }

    // Calculate average download time from content stats
    const downloadTimes = Array.from(this.contentStats.values())
      .filter(stats => stats.downloadTime > 0)
      .map(stats => stats.downloadTime);
    
    if (downloadTimes.length > 0) {
      this.performanceMetrics.averageDownloadTime = 
        downloadTimes.reduce((sum, time) => sum + time, 0) / downloadTimes.length;
    }
  }

  /**
   * Set up cache event listeners
   */
  private setupCacheEventListeners(): void {
    this.contentCache.on('expired', (key: string) => {
      this.emit('cacheExpired', { cid: key });
    });

    this.contentCache.on('del', (key: string) => {
      this.emit('cacheEvicted', { cid: key });
    });
  }

  /**
   * Start background optimization tasks
   */
  private startBackgroundTasks(): void {
    // Process prefetch queue every 30 seconds
    setInterval(() => {
      this.processPrefetchQueue().catch(error => {
        console.error('Error processing prefetch queue:', error);
      });
    }, 30000);

    // Clean up old statistics every hour
    setInterval(() => {
      this.cleanupOldStats();
    }, 60 * 60 * 1000);

    // Update performance metrics every 5 minutes
    setInterval(() => {
      this.updateGlobalMetrics();
      this.emit('metricsUpdated', this.performanceMetrics);
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up old content statistics
   */
  private cleanupOldStats(): void {
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    
    for (const [cid, stats] of this.contentStats.entries()) {
      if (stats.lastAccessed < cutoffTime && stats.accessCount < 2) {
        this.contentStats.delete(cid);
      }
    }
  }

  /**
   * Configure CDN settings
   */
  configureCDN(config: CDNConfig): void {
    this.cdnConfig = config;
    this.config.cdnEnabled = true;
    this.emit('cdnConfigured', config);
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    this.updateGlobalMetrics();
    return { ...this.performanceMetrics };
  }

  /**
   * Get content statistics
   */
  getContentStats(): ContentStats[] {
    return Array.from(this.contentStats.values());
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      keys: this.contentCache.keys().length,
      hits: this.contentCache.getStats().hits,
      misses: this.contentCache.getStats().misses,
      ksize: this.contentCache.getStats().ksize,
      vsize: this.contentCache.getStats().vsize
    };
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.contentCache.flushAll();
    this.metadataCache.flushAll();
    this.emit('cachesCleared');
  }

  /**
   * Shutdown the optimizer
   */
  shutdown(): void {
    this.contentCache.close();
    this.metadataCache.close();
    this.removeAllListeners();
  }
}

export default IPFSPerformanceOptimizer;
export type { PerformanceConfig, ContentStats, PerformanceMetrics, CDNConfig }; 