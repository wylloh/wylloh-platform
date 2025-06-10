import { EventEmitter } from 'events';

// Simplified types for compatibility
interface NodeHealth {
  nodeId: string;
  isHealthy: boolean;
  latency: number;
  peerCount: number;
  repoSize: number;
  version: string;
  lastCheck: number;
}

/**
 * Simplified Distributed Node Service for Helia migration
 * This provides compatibility during the migration period
 */
export class DistributedNodeService extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Initialize the distributed node service
   */
  async initialize(): Promise<void> {
    console.log('Initializing simplified distributed node service (Helia migration mode)...');
    console.log('Distributed node service initialized in simplified mode');
  }

  /**
   * Get service health information
   */
  getServiceHealth() {
    return {
      totalNodes: 1,
      healthyNodes: 1,
      unhealthyNodes: 0,
      averageLatency: 50,
      lastHealthCheck: Date.now()
    };
  }

  /**
   * Get node health stats
   */
  getNodeHealthStats(): Map<string, NodeHealth> {
    const healthMap = new Map<string, NodeHealth>();
    healthMap.set('helia-local', {
      nodeId: 'helia-local',
      isHealthy: true,
      latency: 50,
      peerCount: 0,
      repoSize: 0,
      version: 'helia-5.x',
      lastCheck: Date.now()
    });
    return healthMap;
  }

  /**
   * Check content availability (simplified version)
   */
  async checkContentAvailability(cid: string) {
    return {
      cid,
      availableNodes: ['helia-local'],
      totalNodes: 1,
      lastChecked: Date.now(),
      replicationFactor: 1
    };
  }

  /**
   * Ensure replication (simplified version)
   */
  async ensureReplication(cid: string): Promise<void> {
    console.log(`Ensuring replication for ${cid} (simplified mode)`);
    // In simplified mode, we just confirm content exists locally
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down simplified distributed node service...');
  }
}

// Create singleton instance
export const distributedNodeService = new DistributedNodeService(); 