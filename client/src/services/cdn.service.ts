import axios from 'axios';
import { normalizeCid } from '../utils/ipfs';

// List of public IPFS gateways to use
const PUBLIC_GATEWAYS = [
  'https://cloudflare-ipfs.com/ipfs',
  'https://ipfs.io/ipfs',
  'https://gateway.pinata.cloud/ipfs',
  'https://dweb.link/ipfs',
  'https://ipfs.fleek.co/ipfs',
  'https://gateway.ipfs.io/ipfs'
];

// Project's own gateway (will be the preferred option when available)
const PROJECT_GATEWAY = process.env.REACT_APP_IPFS_GATEWAY || '/api/ipfs';

// Demo mode local gateway
const LOCAL_GATEWAY = 'http://localhost:8080/ipfs';

// Default cache time in milliseconds (10 minutes)
const DEFAULT_CACHE_TIME = 10 * 60 * 1000;

// Interface for gateway performance data
interface GatewayPerformance {
  gateway: string;
  latency: number; // in milliseconds
  successRate: number; // 0-1
  lastChecked: number; // timestamp
  available: boolean;
}

// Interface for cached content
interface CachedContent {
  cid: string;
  gatewayUrl: string;
  cachedAt: number;
  expiresAt: number;
}

// Interface for user node as gateway
interface UserNode {
  peerId: string;
  gateway: string; 
  performance: GatewayPerformance;
  contentAvailable: string[]; // List of CIDs available on this node
}

/**
 * CDN Service for optimized content delivery
 * Handles gateway selection, performance tracking, and caching
 */
class CdnService {
  private gatewayPerformance: Map<string, GatewayPerformance> = new Map();
  private contentCache: Map<string, CachedContent> = new Map();
  private userNodes: Map<string, UserNode> = new Map(); // Track user nodes by peerId
  private isInitialized: boolean = false;
  private isDemoMode: boolean;
  
  constructor() {
    // Use demo mode if in development or explicitly set
    this.isDemoMode = process.env.NODE_ENV === 'development' || 
                     process.env.REACT_APP_DEMO_MODE === 'true';
                     
    // Initialize default performance metrics for all gateways
    this.initializeGatewayPerformance();
  }
  
  /**
   * Initialize default performance data for all gateways
   */
  private initializeGatewayPerformance(): void {
    // Start with all gateways having default values
    [...PUBLIC_GATEWAYS, PROJECT_GATEWAY, LOCAL_GATEWAY].forEach(gateway => {
      this.gatewayPerformance.set(gateway, {
        gateway,
        latency: 1000, // Default 1 second latency
        successRate: 0.9, // Default 90% success rate
        lastChecked: 0, // Never checked
        available: true // Assume available until checked
      });
    });
    
    // Mark the service as initialized
    this.isInitialized = true;
  }
  
  /**
   * Check and update gateway performance metrics
   */
  async updateGatewayPerformance(): Promise<void> {
    try {
      // Use a test CID that should exist on all gateways
      const testCid = 'QmPChd2hVbrJ6bfo3WBcTW4iZnpHm8TEzWkLHmLpXhF68A'; // Small test file
      
      // Check each gateway
      const gateways = [...PUBLIC_GATEWAYS];
      
      // Always add project gateway 
      if (PROJECT_GATEWAY) gateways.push(PROJECT_GATEWAY);
      
      // Add local gateway in demo mode
      if (this.isDemoMode) gateways.push(LOCAL_GATEWAY);
      
      // Add user nodes (if any are registered)
      const userNodeGateways = Array.from(this.userNodes.values()).map(node => node.gateway);
      gateways.push(...userNodeGateways);
      
      // Test each gateway and update metrics
      for (const gateway of gateways) {
        try {
          const start = Date.now();
          
          // Add cache-busting parameter to prevent browser caching
          const url = `${gateway}/${testCid}?cache=${Date.now()}`;
          
          // Test with a HEAD request to minimize data transfer
          const response = await axios.head(url, { 
            timeout: 5000,
            headers: { 'Cache-Control': 'no-cache' }
          });
          
          const latency = Date.now() - start;
          const success = response.status >= 200 && response.status < 300;
          
          // Get current metrics or default
          const current = this.gatewayPerformance.get(gateway) || {
            gateway,
            latency: 1000,
            successRate: 0,
            lastChecked: 0,
            available: false
          };
          
          // Update metrics with weighted average (30% new, 70% historical)
          const updatedMetrics: GatewayPerformance = {
            gateway,
            latency: success ? (0.3 * latency + 0.7 * current.latency) : current.latency * 1.5,
            successRate: 0.3 * (success ? 1 : 0) + 0.7 * current.successRate,
            lastChecked: Date.now(),
            available: success
          };
          
          // Store updated metrics
          this.gatewayPerformance.set(gateway, updatedMetrics);
          
          // If it's a user node, update its performance in the userNodes map
          const userNode = Array.from(this.userNodes.values()).find(node => node.gateway === gateway);
          if (userNode) {
            userNode.performance = updatedMetrics;
          }
          
          console.log(`Gateway ${gateway} performance: ${latency}ms, success: ${success}`);
        } catch (error) {
          // Gateway failed - mark as unavailable with increased latency
          const current = this.gatewayPerformance.get(gateway);
          if (current) {
            this.gatewayPerformance.set(gateway, {
              ...current,
              latency: current.latency * 1.5, // Penalize failed gateways
              successRate: 0.7 * current.successRate, // Reduce success rate
              lastChecked: Date.now(),
              available: false
            });
            
            // If it's a user node, update its performance in the userNodes map
            const userNode = Array.from(this.userNodes.values()).find(node => node.gateway === gateway);
            if (userNode) {
              userNode.performance = this.gatewayPerformance.get(gateway)!;
            }
          }
          console.warn(`Gateway ${gateway} test failed:`, error);
        }
      }
      
      console.log('Gateway performance update completed');
    } catch (error) {
      console.error('Error updating gateway performance:', error);
    }
  }
  
  /**
   * Get the fastest available gateway based on performance metrics
   * @returns The URL of the fastest gateway
   */
  getFastestGateway(): string {
    // In demo mode, prioritize local gateway if available
    if (this.isDemoMode) {
      const localGatewayMetrics = this.gatewayPerformance.get(LOCAL_GATEWAY);
      if (localGatewayMetrics?.available) {
        return LOCAL_GATEWAY;
      }
    }
    
    // Try project gateway first if available
    const projectGatewayMetrics = this.gatewayPerformance.get(PROJECT_GATEWAY);
    if (projectGatewayMetrics?.available && projectGatewayMetrics.successRate > 0.8) {
      return PROJECT_GATEWAY;
    }
    
    // Otherwise, find the fastest available gateway (including user nodes)
    let fastestGateway = PUBLIC_GATEWAYS[0];
    let bestScore = Number.MAX_VALUE;
    
    // Include all gateways in the performance map
    Array.from(this.gatewayPerformance.entries()).forEach(([gateway, metrics]) => {
      if (metrics && metrics.available) {
        // Score = latency / successRate (lower is better)
        const score = metrics.latency / (metrics.successRate || 0.1);
        
        if (score < bestScore) {
          bestScore = score;
          fastestGateway = gateway;
        }
      }
    });
    
    return fastestGateway;
  }
  
  /**
   * Find the best gateway for a specific CID
   * Prioritizes user nodes that have the content
   * @param cid IPFS CID
   * @returns Best gateway URL for this content
   */
  getBestGatewayForCid(cid: string): string {
    const normalizedCid = normalizeCid(cid);
    
    // First check if any user nodes have this content
    const nodesWithContent = Array.from(this.userNodes.values())
      .filter(node => 
        node.contentAvailable.includes(normalizedCid) && 
        node.performance.available
      );
    
    if (nodesWithContent.length > 0) {
      // Sort by performance score (latency / success rate)
      nodesWithContent.sort((a, b) => {
        const scoreA = a.performance.latency / (a.performance.successRate || 0.1);
        const scoreB = b.performance.latency / (b.performance.successRate || 0.1);
        return scoreA - scoreB;
      });
      
      // Return the best performing node's gateway
      return nodesWithContent[0].gateway;
    }
    
    // If no user nodes have the content, fall back to fastest gateway
    return this.getFastestGateway();
  }
  
  /**
   * Get optimized content URL with the fastest gateway
   * @param cid IPFS CID
   * @returns Full gateway URL for the content
   */
  getOptimizedUrl(cid: string): string {
    // Clean the CID
    const normalizedCid = normalizeCid(cid);
    if (!normalizedCid) return '';
    
    // Check cache first
    const cached = this.contentCache.get(normalizedCid);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.gatewayUrl;
    }
    
    // Get the best gateway for this CID (may be a user node)
    const gateway = this.getBestGatewayForCid(normalizedCid);
    
    // Create the full URL
    const url = `${gateway}/${normalizedCid}`;
    
    // Cache the result
    this.contentCache.set(normalizedCid, {
      cid: normalizedCid,
      gatewayUrl: url,
      cachedAt: Date.now(),
      expiresAt: Date.now() + DEFAULT_CACHE_TIME
    });
    
    return url;
  }
  
  /**
   * Get optimized streaming URL for video content
   * @param cid IPFS CID
   * @returns URL optimized for video streaming
   */
  getStreamingUrl(cid: string): string {
    const normalizedCid = normalizeCid(cid);
    if (!normalizedCid) return '';
    
    // For streaming, we prefer Cloudflare's gateway due to its strong infrastructure
    // But we fallback to our determined fastest gateway if needed
    const streamingGateways = [
      'https://cloudflare-ipfs.com/ipfs',
      this.getFastestGateway()
    ];
    
    // In demo mode, use local gateway first
    if (this.isDemoMode) {
      streamingGateways.unshift(LOCAL_GATEWAY);
    }
    
    // Add user nodes that have this content (for peer-assisted streaming)
    const nodesWithContent = Array.from(this.userNodes.values())
      .filter(node => 
        node.contentAvailable.includes(normalizedCid) && 
        node.performance.available
      )
      .map(node => node.gateway);
    
    if (nodesWithContent.length > 0) {
      // Add user nodes at the beginning for priority (faster local streaming)
      streamingGateways.unshift(...nodesWithContent);
    }
    
    // Find first available streaming gateway
    for (const gateway of streamingGateways) {
      const metrics = this.gatewayPerformance.get(gateway);
      if (metrics?.available) {
        return `${gateway}/${normalizedCid}`;
      }
    }
    
    // If none available, use default
    return `${PUBLIC_GATEWAYS[0]}/${normalizedCid}`;
  }
  
  /**
   * Get a thumbnail URL with CDN optimization
   * @param cid Thumbnail CID
   * @returns Optimized thumbnail URL
   */
  getThumbnailUrl(cid: string): string {
    // For thumbnails, we use query parameters to optimize for thumbnails
    // e.g., some gateways support image resizing with ?width=300&height=300
    const url = this.getOptimizedUrl(cid);
    
    // Add optimization parameters if it's a Cloudflare gateway
    if (url.includes('cloudflare-ipfs.com')) {
      return `${url}?width=300&height=300&fit=cover&quality=80`;
    }
    
    return url;
  }
  
  /**
   * Prefetch content to cache it for faster access
   * @param cid IPFS CID to prefetch
   */
  async prefetchContent(cid: string): Promise<void> {
    try {
      const url = this.getOptimizedUrl(cid);
      
      // Use a HEAD request to minimize data transfer
      await axios.head(url, { 
        timeout: 5000,
        headers: { 'Cache-Control': 'max-age=3600' } // Allow browser caching
      });
      
      console.log(`Prefetched content: ${cid}`);
    } catch (error) {
      console.warn(`Failed to prefetch content ${cid}:`, error);
    }
  }
  
  /**
   * Get a content URL with appropriate cache-control headers
   * @param cid Content CID
   * @param maxAge Cache max age in seconds (default 1 hour)
   * @returns URL with cache parameters
   */
  getCacheControlUrl(cid: string, maxAge: number = 3600): string {
    const url = this.getOptimizedUrl(cid);
    
    // Add cache control query parameter if gateway supports it
    return `${url}?cache-control=max-age=${maxAge}`;
  }
  
  /**
   * Register a user node as a potential gateway for content
   * @param peerId The peer ID of the node
   * @param nodeUrl The gateway URL for the node
   */
  registerUserNode(peerId: string, nodeUrl: string): void {
    const gateway = nodeUrl.endsWith('/ipfs') ? nodeUrl : `${nodeUrl}/ipfs`;
    
    // Create or update the user node entry
    this.userNodes.set(peerId, {
      peerId,
      gateway,
      performance: {
        gateway,
        latency: 500, // Default to optimistic latency for local nodes
        successRate: 0.9,
        lastChecked: 0,
        available: true
      },
      contentAvailable: []
    });
    
    // Add to gateway performance tracking
    this.gatewayPerformance.set(gateway, this.userNodes.get(peerId)!.performance);
    
    console.log(`Registered user node: ${peerId} at ${gateway}`);
    
    // Trigger a performance update to include the new node
    this.updateGatewayPerformance();
  }
  
  /**
   * Unregister a user node
   * @param peerId The peer ID of the node to unregister
   */
  unregisterUserNode(peerId: string): void {
    const node = this.userNodes.get(peerId);
    if (node) {
      // Remove from gateway performance tracking
      this.gatewayPerformance.delete(node.gateway);
      
      // Remove from user nodes
      this.userNodes.delete(peerId);
      
      console.log(`Unregistered user node: ${peerId}`);
    }
  }
  
  /**
   * Update the list of content available on a user node
   * @param peerId The peer ID of the node
   * @param cids Array of CIDs available on this node
   */
  updateUserNodeContent(peerId: string, cids: string[]): void {
    const node = this.userNodes.get(peerId);
    if (node) {
      // Update the list of available content
      node.contentAvailable = cids.map(cid => normalizeCid(cid));
      console.log(`Updated content for node ${peerId}: ${cids.length} items`);
    }
  }

  /**
   * Check if content is available on any user node
   * @param cid The CID to check
   * @returns Boolean indicating if content is available on user nodes
   */
  isContentOnUserNodes(cid: string): boolean {
    const normalizedCid = normalizeCid(cid);
    
    // Check if any user node has this content
    return Array.from(this.userNodes.values()).some(
      node => node.contentAvailable.includes(normalizedCid) && node.performance.available
    );
  }
  
  /**
   * Get all registered user nodes
   * @returns Array of registered user nodes
   */
  getUserNodes(): UserNode[] {
    return Array.from(this.userNodes.values());
  }
  
  /**
   * Initialize the service and run initial gateway checks
   */
  async initialize(): Promise<void> {
    if (!this.isInitialized) {
      this.initializeGatewayPerformance();
    }
    
    // Run initial performance check
    await this.updateGatewayPerformance();
    
    // Set up periodic checks every 5 minutes
    setInterval(() => {
      this.updateGatewayPerformance();
    }, 5 * 60 * 1000);
  }
}

// Export a singleton instance
export const cdnService = new CdnService();
export default cdnService; 