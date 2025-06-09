import { IPFSHTTPClient, create as createIPFS } from 'ipfs-http-client';
import { EventEmitter } from 'events';
import axios from 'axios';
import NodeCache from 'node-cache';

// Types
interface IPFSNode {
  id: string;
  url: string;
  client: IPFSHTTPClient;
  isHealthy: boolean;
  lastHealthCheck: number;
  latency: number;
  consecutiveFailures: number;
  region?: string;
  priority: number;
}

interface NodeHealth {
  nodeId: string;
  isHealthy: boolean;
  latency: number;
  peerCount: number;
  repoSize: number;
  version: string;
  lastCheck: number;
}

interface ContentAvailability {
  cid: string;
  availableNodes: string[];
  totalNodes: number;
  lastChecked: number;
  replicationFactor: number;
}

interface ReplicationConfig {
  minReplicas: number;
  maxReplicas: number;
  preferredRegions: string[];
  priorityThreshold: number;
}

/**
 * Service for managing distributed IPFS nodes
 */
export class DistributedNodeService extends EventEmitter {
  private nodes: Map<string, IPFSNode> = new Map();
  private healthCache = new NodeCache({ stdTTL: 60, checkperiod: 30 }); // 1 minute TTL
  private contentAvailabilityCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 minutes TTL
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private replicationConfig: ReplicationConfig;

  constructor(replicationConfig?: Partial<ReplicationConfig>) {
    super();
    this.replicationConfig = {
      minReplicas: 3,
      maxReplicas: 5,
      preferredRegions: ['us-east', 'us-west', 'eu-west'],
      priorityThreshold: 80,
      ...replicationConfig
    };
  }

  /**
   * Initialize the distributed node service
   */
  async initialize(): Promise<void> {
    console.log('Initializing distributed IPFS node service...');
    
    // Load node configuration from environment
    await this.loadNodeConfiguration();
    
    // Perform initial health checks
    await this.performHealthChecks();
    
    // Start periodic health monitoring
    this.startHealthMonitoring();
    
    console.log(`Distributed node service initialized with ${this.nodes.size} nodes`);
  }

  /**
   * Load node configuration from environment variables
   */
  private async loadNodeConfiguration(): Promise<void> {
    const nodeConfigs = process.env.IPFS_NODES ? JSON.parse(process.env.IPFS_NODES) : [];
    
    // Default local node
    const defaultNodes = [
      {
        id: 'local-primary',
        url: process.env.IPFS_API_URL || 'http://localhost:5001',
        region: 'local',
        priority: 100
      }
    ];

    // Add additional nodes from configuration
    const allNodeConfigs = [...defaultNodes, ...nodeConfigs];

    for (const config of allNodeConfigs) {
      try {
        const client = createIPFS({ url: config.url });
        
        const node: IPFSNode = {
          id: config.id,
          url: config.url,
          client,
          isHealthy: false,
          lastHealthCheck: 0,
          latency: Infinity,
          consecutiveFailures: 0,
          region: config.region,
          priority: config.priority || 50
        };

        this.nodes.set(config.id, node);
        console.log(`Added IPFS node: ${config.id} (${config.url})`);
      } catch (error) {
        console.error(`Failed to create client for node ${config.id}:`, error);
      }
    }
  }

  /**
   * Perform health checks on all nodes
   */
  async performHealthChecks(): Promise<void> {
    const healthPromises = Array.from(this.nodes.values()).map(node => 
      this.checkNodeHealth(node)
    );

    await Promise.allSettled(healthPromises);
    
    const healthyNodes = Array.from(this.nodes.values()).filter(node => node.isHealthy);
    console.log(`Health check complete: ${healthyNodes.length}/${this.nodes.size} nodes healthy`);
    
    this.emit('healthCheckComplete', {
      totalNodes: this.nodes.size,
      healthyNodes: healthyNodes.length,
      unhealthyNodes: this.nodes.size - healthyNodes.length
    });
  }

  /**
   * Check health of a specific node
   */
  private async checkNodeHealth(node: IPFSNode): Promise<NodeHealth> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      const id = await node.client.id();
      const stats = await node.client.stats.repo();
      const peers = await node.client.swarm.peers();
      
      const latency = Date.now() - startTime;
      
      // Update node status
      node.isHealthy = true;
      node.lastHealthCheck = Date.now();
      node.latency = latency;
      node.consecutiveFailures = 0;

      const health: NodeHealth = {
        nodeId: node.id,
        isHealthy: true,
        latency,
        peerCount: peers.length,
        repoSize: Number(stats.repoSize), // Convert bigint to number
        version: id.agentVersion || 'unknown',
        lastCheck: Date.now()
      };

      this.healthCache.set(node.id, health);
      return health;
    } catch (err) {
      const error = err as Error;
      node.consecutiveFailures += 1;
      node.isHealthy = node.consecutiveFailures < 3; // Mark unhealthy after 3 failures
      node.lastHealthCheck = Date.now();

      const health: NodeHealth = {
        nodeId: node.id,
        isHealthy: false,
        latency: Infinity,
        peerCount: 0,
        repoSize: 0,
        version: 'unknown',
        lastCheck: Date.now()
      };

      this.healthCache.set(node.id, health);
      console.error(`Health check failed for node ${node.id}:`, error.message);
      return health;
    }
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 60000); // Check every minute
  }

  /**
   * Get healthy nodes sorted by priority and latency
   */
  getHealthyNodes(): IPFSNode[] {
    return Array.from(this.nodes.values())
      .filter(node => node.isHealthy)
      .sort((a, b) => {
        // Sort by priority first, then by latency
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.latency - b.latency; // Lower latency first
      });
  }

  /**
   * Get the best node for a specific operation
   */
  getBestNode(operation: 'read' | 'write' = 'read'): IPFSNode | null {
    const healthyNodes = this.getHealthyNodes();
    
    if (healthyNodes.length === 0) {
      return null;
    }

    // For write operations, prefer higher priority nodes
    if (operation === 'write') {
      return healthyNodes.find(node => node.priority >= this.replicationConfig.priorityThreshold) || healthyNodes[0];
    }

    // For read operations, prefer fastest nodes
    return healthyNodes[0];
  }

  /**
   * Upload content to multiple nodes for redundancy
   */
  async uploadToMultipleNodes(
    content: Buffer, 
    options: { minReplicas?: number; preferredNodes?: string[] } = {}
  ): Promise<{ cid: string; replicatedNodes: string[] }> {
    const minReplicas = options.minReplicas || this.replicationConfig.minReplicas;
    const healthyNodes = this.getHealthyNodes();
    
    if (healthyNodes.length === 0) {
      throw new Error('No healthy nodes available for upload');
    }

    // Select nodes for replication
    let targetNodes = healthyNodes.slice(0, Math.min(minReplicas, healthyNodes.length));
    
    // Add preferred nodes if specified
    if (options.preferredNodes) {
      const preferredHealthyNodes = healthyNodes.filter(node => 
        options.preferredNodes!.includes(node.id)
      );
      targetNodes = [...preferredHealthyNodes, ...targetNodes].slice(0, minReplicas);
    }

    // Upload to primary node first
    const primaryNode = targetNodes[0];
    const uploadResult = await primaryNode.client.add(content, { pin: true });
    const cid = uploadResult.cid.toString();

    console.log(`Content uploaded to primary node ${primaryNode.id}: ${cid}`);

    // Replicate to other nodes
    const replicationPromises = targetNodes.slice(1).map(async (node) => {
      try {
        await node.client.pin.add(cid);
        console.log(`Content replicated to node ${node.id}: ${cid}`);
        return node.id;
      } catch (err) {
        const error = err as Error;
        console.error(`Failed to replicate to node ${node.id}:`, error.message);
        return null;
      }
    });

    const replicationResults = await Promise.allSettled(replicationPromises);
    const replicatedNodes = [primaryNode.id];
    
    replicationResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        replicatedNodes.push(result.value);
      }
    });

    // Cache content availability
    const availability: ContentAvailability = {
      cid,
      availableNodes: replicatedNodes,
      totalNodes: this.nodes.size,
      lastChecked: Date.now(),
      replicationFactor: replicatedNodes.length
    };
    
    this.contentAvailabilityCache.set(cid, availability);

    this.emit('contentUploaded', {
      cid,
      replicatedNodes,
      targetReplicas: minReplicas,
      actualReplicas: replicatedNodes.length
    });

    return { cid, replicatedNodes };
  }

  /**
   * Check content availability across nodes
   */
  async checkContentAvailability(cid: string): Promise<ContentAvailability> {
    // Check cache first
    const cached = this.contentAvailabilityCache.get<ContentAvailability>(cid);
    if (cached && Date.now() - cached.lastChecked < 300000) { // 5 minutes
      return cached;
    }

    const healthyNodes = this.getHealthyNodes();
    const availabilityPromises = healthyNodes.map(async (node) => {
      try {
        const pins = await node.client.pin.ls({ paths: [cid] });
        // If we get here without error, the content is pinned
        return node.id;
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.allSettled(availabilityPromises);
    const availableNodes: string[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        availableNodes.push(result.value);
      }
    });

    const availability: ContentAvailability = {
      cid,
      availableNodes,
      totalNodes: this.nodes.size,
      lastChecked: Date.now(),
      replicationFactor: availableNodes.length
    };

    this.contentAvailabilityCache.set(cid, availability);
    return availability;
  }

  /**
   * Ensure content meets minimum replication requirements
   */
  async ensureReplication(cid: string): Promise<void> {
    const availability = await this.checkContentAvailability(cid);
    
    if (availability.replicationFactor >= this.replicationConfig.minReplicas) {
      return; // Already sufficiently replicated
    }

    const healthyNodes = this.getHealthyNodes();
    const nodesNeedingReplication = healthyNodes.filter(node => 
      !availability.availableNodes.includes(node.id)
    );

    const replicationsNeeded = this.replicationConfig.minReplicas - availability.replicationFactor;
    const targetNodes = nodesNeedingReplication.slice(0, replicationsNeeded);

    console.log(`Ensuring replication for ${cid}: need ${replicationsNeeded} more replicas`);

    const replicationPromises = targetNodes.map(async (node) => {
      try {
        await node.client.pin.add(cid);
        console.log(`Replicated ${cid} to node ${node.id}`);
        return node.id;
      } catch (err) {
        const error = err as Error;
        console.error(`Failed to replicate ${cid} to node ${node.id}:`, error.message);
        return null;
      }
    });

    await Promise.allSettled(replicationPromises);
    
    // Update cache
    this.contentAvailabilityCache.del(cid);
  }

  /**
   * Get node health statistics
   */
  getNodeHealthStats(): Map<string, NodeHealth> {
    const stats = new Map<string, NodeHealth>();
    
    for (const [nodeId] of this.nodes) {
      const health = this.healthCache.get<NodeHealth>(nodeId);
      if (health) {
        stats.set(nodeId, health);
      }
    }
    
    return stats;
  }

  /**
   * Get overall service health
   */
  getServiceHealth(): {
    totalNodes: number;
    healthyNodes: number;
    unhealthyNodes: number;
    averageLatency: number;
    lastHealthCheck: number;
  } {
    const healthyNodes = Array.from(this.nodes.values()).filter(node => node.isHealthy);
    const averageLatency = healthyNodes.length > 0 
      ? healthyNodes.reduce((sum, node) => sum + node.latency, 0) / healthyNodes.length 
      : Infinity;

    return {
      totalNodes: this.nodes.size,
      healthyNodes: healthyNodes.length,
      unhealthyNodes: this.nodes.size - healthyNodes.length,
      averageLatency,
      lastHealthCheck: Math.max(...Array.from(this.nodes.values()).map(node => node.lastHealthCheck))
    };
  }

  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    console.log('Distributed node service shut down');
  }
}

// Export singleton instance
export const distributedNodeService = new DistributedNodeService(); 