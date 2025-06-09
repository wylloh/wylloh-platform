import { IPFSHTTPClient } from 'ipfs-http-client';
import { EventEmitter } from 'events';
import axios from 'axios';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Redundancy configuration
interface RedundancyConfig {
  minReplicas: number;
  maxReplicas: number;
  replicationStrategy: 'popularity' | 'geographic' | 'random' | 'hybrid';
  integrityCheckInterval: number; // minutes
  backupEnabled: boolean;
  backupInterval: number; // hours
  geographicDistribution: boolean;
}

// Replica information
interface ReplicaInfo {
  cid: string;
  nodeId: string;
  location?: string;
  lastVerified: number;
  status: 'active' | 'inactive' | 'failed';
  verificationAttempts: number;
}

// Content integrity information
interface ContentIntegrity {
  cid: string;
  hash: string;
  size: number;
  replicas: ReplicaInfo[];
  lastIntegrityCheck: number;
  integrityStatus: 'verified' | 'corrupted' | 'unknown';
  backupStatus: 'backed_up' | 'pending' | 'failed';
}

// Backup configuration
interface BackupConfig {
  provider: 'filecoin' | 'arweave' | 'aws' | 'custom';
  endpoint?: string;
  credentials?: {
    accessKey?: string;
    secretKey?: string;
    token?: string;
  };
  retentionPeriod: number; // days
}

// Geographic node information
interface GeographicNode {
  nodeId: string;
  location: {
    country: string;
    region: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  capacity: number;
  reliability: number;
  lastSeen: number;
}

class IPFSRedundancyManager extends EventEmitter {
  private ipfsClient: IPFSHTTPClient;
  private config: RedundancyConfig;
  private contentRegistry: Map<string, ContentIntegrity>;
  private nodeRegistry: Map<string, GeographicNode>;
  private backupConfig?: BackupConfig;
  private integrityCheckTimer?: NodeJS.Timeout;
  private backupTimer?: NodeJS.Timeout;

  constructor(ipfsClient: IPFSHTTPClient, config: Partial<RedundancyConfig> = {}) {
    super();
    
    this.ipfsClient = ipfsClient;
    this.config = {
      minReplicas: 3,
      maxReplicas: 10,
      replicationStrategy: 'hybrid',
      integrityCheckInterval: 60, // 1 hour
      backupEnabled: true,
      backupInterval: 24, // 24 hours
      geographicDistribution: true,
      ...config
    };

    this.contentRegistry = new Map();
    this.nodeRegistry = new Map();

    // Start background tasks
    this.startBackgroundTasks();
  }

  /**
   * Register content for redundancy management
   */
  async registerContent(cid: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    try {
      // Get content information
      const stats = await this.getContentStats(cid);
      
      // Calculate required replicas based on priority
      const requiredReplicas = this.calculateRequiredReplicas(priority, stats.size);
      
      // Create content integrity record
      const integrity: ContentIntegrity = {
        cid,
        hash: await this.calculateContentHash(cid),
        size: stats.size,
        replicas: [],
        lastIntegrityCheck: Date.now(),
        integrityStatus: 'unknown',
        backupStatus: 'pending'
      };

      this.contentRegistry.set(cid, integrity);

      // Start replication process
      await this.ensureReplication(cid, requiredReplicas);

      // Schedule backup if enabled
      if (this.config.backupEnabled) {
        await this.scheduleBackup(cid);
      }

      this.emit('contentRegistered', { cid, requiredReplicas, priority });
    } catch (error) {
      this.emit('registrationError', { cid, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Ensure content has sufficient replicas
   */
  async ensureReplication(cid: string, targetReplicas: number): Promise<void> {
    const integrity = this.contentRegistry.get(cid);
    if (!integrity) {
      throw new Error(`Content ${cid} not registered`);
    }

    // Get current active replicas
    const activeReplicas = integrity.replicas.filter(r => r.status === 'active');
    const currentCount = activeReplicas.length;

    if (currentCount >= targetReplicas) {
      this.emit('replicationSufficient', { cid, current: currentCount, target: targetReplicas });
      return;
    }

    const needed = targetReplicas - currentCount;
    this.emit('replicationNeeded', { cid, current: currentCount, target: targetReplicas, needed });

    // Select nodes for replication
    const selectedNodes = await this.selectReplicationNodes(cid, needed);

    // Replicate to selected nodes
    for (const node of selectedNodes) {
      try {
        await this.replicateToNode(cid, node);
        
        // Add replica to registry
        const replica: ReplicaInfo = {
          cid,
          nodeId: node.nodeId,
          location: `${node.location.country}-${node.location.region}`,
          lastVerified: Date.now(),
          status: 'active',
          verificationAttempts: 0
        };

        integrity.replicas.push(replica);
        this.emit('replicaCreated', { cid, nodeId: node.nodeId, location: replica.location });
      } catch (error) {
        this.emit('replicationFailed', { 
          cid, 
          nodeId: node.nodeId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    // Update registry
    this.contentRegistry.set(cid, integrity);
  }

  /**
   * Select optimal nodes for replication
   */
  private async selectReplicationNodes(cid: string, count: number): Promise<GeographicNode[]> {
    const availableNodes = Array.from(this.nodeRegistry.values())
      .filter(node => node.reliability > 0.8 && node.lastSeen > Date.now() - 24 * 60 * 60 * 1000);

    if (availableNodes.length === 0) {
      // Fallback to discovering nodes
      await this.discoverNodes();
      return this.selectReplicationNodes(cid, count);
    }

    const integrity = this.contentRegistry.get(cid);
    const existingLocations = integrity?.replicas.map(r => r.location) || [];

    let selectedNodes: GeographicNode[] = [];

    switch (this.config.replicationStrategy) {
      case 'geographic':
        selectedNodes = this.selectGeographicNodes(availableNodes, existingLocations, count);
        break;
      case 'popularity':
        selectedNodes = this.selectPopularityNodes(availableNodes, count);
        break;
      case 'random':
        selectedNodes = this.selectRandomNodes(availableNodes, count);
        break;
      case 'hybrid':
      default:
        selectedNodes = this.selectHybridNodes(availableNodes, existingLocations, count);
        break;
    }

    return selectedNodes.slice(0, count);
  }

  /**
   * Select nodes based on geographic distribution
   */
  private selectGeographicNodes(
    nodes: GeographicNode[], 
    existingLocations: (string | undefined)[], 
    count: number
  ): GeographicNode[] {
    const locationCounts = new Map<string, number>();
    existingLocations.forEach(loc => {
      if (loc) {
        const [country] = loc.split('-');
        locationCounts.set(country, (locationCounts.get(country) || 0) + 1);
      }
    });

    // Sort nodes by geographic diversity and reliability
    return nodes.sort((a, b) => {
      const aCountryCount = locationCounts.get(a.location.country) || 0;
      const bCountryCount = locationCounts.get(b.location.country) || 0;
      
      // Prefer nodes in countries with fewer replicas
      if (aCountryCount !== bCountryCount) {
        return aCountryCount - bCountryCount;
      }
      
      // Then by reliability
      return b.reliability - a.reliability;
    });
  }

  /**
   * Select nodes based on popularity/capacity
   */
  private selectPopularityNodes(nodes: GeographicNode[], count: number): GeographicNode[] {
    return nodes.sort((a, b) => {
      const aScore = a.reliability * a.capacity;
      const bScore = b.reliability * b.capacity;
      return bScore - aScore;
    });
  }

  /**
   * Select random nodes
   */
  private selectRandomNodes(nodes: GeographicNode[], count: number): GeographicNode[] {
    const shuffled = [...nodes].sort(() => Math.random() - 0.5);
    return shuffled;
  }

  /**
   * Select nodes using hybrid strategy
   */
  private selectHybridNodes(
    nodes: GeographicNode[], 
    existingLocations: (string | undefined)[], 
    count: number
  ): GeographicNode[] {
    // 60% geographic diversity, 40% reliability/capacity
    const geoNodes = this.selectGeographicNodes(nodes, existingLocations, Math.ceil(count * 0.6));
    const remainingNodes = nodes.filter(n => !geoNodes.includes(n));
    const popularNodes = this.selectPopularityNodes(remainingNodes, Math.floor(count * 0.4));
    
    return [...geoNodes, ...popularNodes];
  }

  /**
   * Replicate content to a specific node
   */
  private async replicateToNode(cid: string, node: GeographicNode): Promise<void> {
    // In a real implementation, this would use IPFS cluster or direct node communication
    // For now, we'll simulate the replication process
    
    try {
      // Pin content to ensure it's available
      await this.ipfsClient.pin.add(cid);
      
      // In production, would send replication request to specific node
      // await this.sendReplicationRequest(node.nodeId, cid);
      
      console.log(`Replicated content ${cid} to node ${node.nodeId} in ${node.location.country}`);
    } catch (error) {
      throw new Error(`Failed to replicate to node ${node.nodeId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify content integrity across all replicas
   */
  async verifyContentIntegrity(cid: string): Promise<boolean> {
    const integrity = this.contentRegistry.get(cid);
    if (!integrity) {
      throw new Error(`Content ${cid} not registered`);
    }

    let verifiedReplicas = 0;
    const failedReplicas: string[] = [];

    for (const replica of integrity.replicas) {
      try {
        const isValid = await this.verifyReplica(cid, replica);
        if (isValid) {
          replica.status = 'active';
          replica.lastVerified = Date.now();
          replica.verificationAttempts = 0;
          verifiedReplicas++;
        } else {
          replica.verificationAttempts++;
          if (replica.verificationAttempts >= 3) {
            replica.status = 'failed';
            failedReplicas.push(replica.nodeId);
          }
        }
      } catch (error) {
        replica.verificationAttempts++;
        if (replica.verificationAttempts >= 3) {
          replica.status = 'failed';
          failedReplicas.push(replica.nodeId);
        }
      }
    }

    // Update integrity status
    integrity.lastIntegrityCheck = Date.now();
    integrity.integrityStatus = verifiedReplicas >= this.config.minReplicas ? 'verified' : 'corrupted';
    
    this.contentRegistry.set(cid, integrity);

    // Handle failed replicas
    if (failedReplicas.length > 0) {
      this.emit('replicasFailure', { cid, failedNodes: failedReplicas });
      
      // Trigger re-replication if needed
      const activeReplicas = integrity.replicas.filter(r => r.status === 'active').length;
      if (activeReplicas < this.config.minReplicas) {
        await this.ensureReplication(cid, this.config.minReplicas);
      }
    }

    this.emit('integrityVerified', { 
      cid, 
      verifiedReplicas, 
      totalReplicas: integrity.replicas.length,
      status: integrity.integrityStatus 
    });

    return integrity.integrityStatus === 'verified';
  }

  /**
   * Verify a specific replica
   */
  private async verifyReplica(cid: string, replica: ReplicaInfo): Promise<boolean> {
    try {
      // Get content hash from replica
      const replicaHash = await this.getReplicaHash(cid, replica.nodeId);
      
      // Compare with expected hash
      const integrity = this.contentRegistry.get(cid);
      if (!integrity) return false;

      return replicaHash === integrity.hash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get content hash from a specific replica
   */
  private async getReplicaHash(cid: string, nodeId: string): Promise<string> {
    // In production, this would query the specific node
    // For now, calculate hash from local content
    try {
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.ipfsClient.cat(cid)) {
        chunks.push(chunk);
      }
      const content = Buffer.concat(chunks);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      throw new Error(`Failed to get hash for ${cid} from node ${nodeId}`);
    }
  }

  /**
   * Calculate content hash
   */
  private async calculateContentHash(cid: string): Promise<string> {
    try {
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.ipfsClient.cat(cid)) {
        chunks.push(chunk);
      }
      const content = Buffer.concat(chunks);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      throw new Error(`Failed to calculate hash for ${cid}`);
    }
  }

  /**
   * Get content statistics
   */
  private async getContentStats(cid: string): Promise<{ size: number }> {
    try {
      const stats = await this.ipfsClient.files.stat(`/ipfs/${cid}`);
      return { size: stats.size };
    } catch (error) {
      // Fallback: get size by downloading content
      try {
        const chunks: Uint8Array[] = [];
        for await (const chunk of this.ipfsClient.cat(cid)) {
          chunks.push(chunk);
        }
        const content = Buffer.concat(chunks);
        return { size: content.length };
      } catch (fallbackError) {
        throw new Error(`Failed to get stats for ${cid}`);
      }
    }
  }

  /**
   * Calculate required replicas based on priority and size
   */
  private calculateRequiredReplicas(priority: 'high' | 'medium' | 'low', size: number): number {
    let baseReplicas = this.config.minReplicas;

    // Adjust based on priority
    switch (priority) {
      case 'high':
        baseReplicas = Math.max(baseReplicas, 5);
        break;
      case 'medium':
        baseReplicas = Math.max(baseReplicas, 3);
        break;
      case 'low':
        baseReplicas = Math.max(baseReplicas, 2);
        break;
    }

    // Adjust based on size (larger files get more replicas)
    if (size > 100 * 1024 * 1024) { // >100MB
      baseReplicas += 2;
    } else if (size > 10 * 1024 * 1024) { // >10MB
      baseReplicas += 1;
    }

    return Math.min(baseReplicas, this.config.maxReplicas);
  }

  /**
   * Schedule content backup
   */
  private async scheduleBackup(cid: string): Promise<void> {
    if (!this.backupConfig) {
      console.warn('Backup scheduled but no backup configuration provided');
      return;
    }

    // Add to backup queue (in production, this would be a persistent queue)
    setTimeout(async () => {
      try {
        await this.backupContent(cid);
      } catch (error) {
        this.emit('backupFailed', { 
          cid, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }, 5000); // 5 second delay for demo
  }

  /**
   * Backup content to external storage
   */
  private async backupContent(cid: string): Promise<void> {
    const integrity = this.contentRegistry.get(cid);
    if (!integrity) {
      throw new Error(`Content ${cid} not registered`);
    }

    try {
      // Get content
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.ipfsClient.cat(cid)) {
        chunks.push(chunk);
      }
      const content = Buffer.concat(chunks);

      // Backup based on provider
      switch (this.backupConfig?.provider) {
        case 'filecoin':
          await this.backupToFilecoin(cid, content);
          break;
        case 'arweave':
          await this.backupToArweave(cid, content);
          break;
        case 'aws':
          await this.backupToAWS(cid, content);
          break;
        default:
          throw new Error(`Unsupported backup provider: ${this.backupConfig?.provider}`);
      }

      // Update backup status
      integrity.backupStatus = 'backed_up';
      this.contentRegistry.set(cid, integrity);

      this.emit('contentBackedUp', { cid, provider: this.backupConfig?.provider });
    } catch (error) {
      const integrity = this.contentRegistry.get(cid);
      if (integrity) {
        integrity.backupStatus = 'failed';
        this.contentRegistry.set(cid, integrity);
      }
      throw error;
    }
  }

  /**
   * Backup to Filecoin
   */
  private async backupToFilecoin(cid: string, content: Buffer): Promise<void> {
    // Implementation would integrate with Filecoin storage deals
    console.log(`Backing up ${cid} to Filecoin (${content.length} bytes)`);
    // Simulate backup delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Backup to Arweave
   */
  private async backupToArweave(cid: string, content: Buffer): Promise<void> {
    // Implementation would integrate with Arweave
    console.log(`Backing up ${cid} to Arweave (${content.length} bytes)`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Backup to AWS S3
   */
  private async backupToAWS(cid: string, content: Buffer): Promise<void> {
    // Implementation would integrate with AWS S3
    console.log(`Backing up ${cid} to AWS S3 (${content.length} bytes)`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Discover available nodes
   */
  private async discoverNodes(): Promise<void> {
    try {
      // Get connected peers
      const peers = await this.ipfsClient.swarm.peers();
      
      for (const peer of peers.slice(0, 10)) { // Limit to 10 peers
        const nodeId = peer.peer.toString();
        
        // Create mock geographic data (in production, would query node info)
        const mockNode: GeographicNode = {
          nodeId,
          location: {
            country: ['US', 'EU', 'AS', 'CA', 'AU'][Math.floor(Math.random() * 5)],
            region: `region-${Math.floor(Math.random() * 10)}`,
          },
          capacity: Math.random() * 1000,
          reliability: 0.8 + Math.random() * 0.2,
          lastSeen: Date.now()
        };

        this.nodeRegistry.set(nodeId, mockNode);
      }

      this.emit('nodesDiscovered', { count: peers.length });
    } catch (error) {
      console.warn('Failed to discover nodes:', error);
    }
  }

  /**
   * Start background tasks
   */
  private startBackgroundTasks(): void {
    // Integrity check timer
    this.integrityCheckTimer = setInterval(async () => {
      for (const cid of this.contentRegistry.keys()) {
        try {
          await this.verifyContentIntegrity(cid);
        } catch (error) {
          console.error(`Integrity check failed for ${cid}:`, error);
        }
      }
    }, this.config.integrityCheckInterval * 60 * 1000);

    // Backup timer
    if (this.config.backupEnabled) {
      this.backupTimer = setInterval(async () => {
        for (const [cid, integrity] of this.contentRegistry.entries()) {
          if (integrity.backupStatus === 'pending' || integrity.backupStatus === 'failed') {
            try {
              await this.backupContent(cid);
            } catch (error) {
              console.error(`Backup failed for ${cid}:`, error);
            }
          }
        }
      }, this.config.backupInterval * 60 * 60 * 1000);
    }

    // Node discovery timer
    setInterval(() => {
      this.discoverNodes().catch(error => {
        console.error('Node discovery failed:', error);
      });
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  /**
   * Configure backup settings
   */
  configureBackup(config: BackupConfig): void {
    this.backupConfig = config;
    this.emit('backupConfigured', config);
  }

  /**
   * Get redundancy status for content
   */
  getRedundancyStatus(cid: string): ContentIntegrity | null {
    return this.contentRegistry.get(cid) || null;
  }

  /**
   * Get all registered content
   */
  getAllContent(): ContentIntegrity[] {
    return Array.from(this.contentRegistry.values());
  }

  /**
   * Get node registry
   */
  getNodeRegistry(): GeographicNode[] {
    return Array.from(this.nodeRegistry.values());
  }

  /**
   * Shutdown the redundancy manager
   */
  shutdown(): void {
    if (this.integrityCheckTimer) {
      clearInterval(this.integrityCheckTimer);
    }
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    this.removeAllListeners();
  }
}

export default IPFSRedundancyManager;
export type { 
  RedundancyConfig, 
  ContentIntegrity, 
  ReplicaInfo, 
  BackupConfig, 
  GeographicNode 
}; 