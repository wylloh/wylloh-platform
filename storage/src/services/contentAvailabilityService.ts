import { EventEmitter } from 'events';
import { distributedNodeService } from '../ipfs/distributedNodeService';
import NodeCache from 'node-cache';

// Types
interface ContentRecord {
  cid: string;
  uploadedAt: number;
  lastChecked: number;
  replicationFactor: number;
  targetReplicas: number;
  availableNodes: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  contentType: string;
  size: number;
  checkCount: number;
  consecutiveFailures: number;
}

interface AvailabilityReport {
  totalContent: number;
  underReplicated: number;
  overReplicated: number;
  healthy: number;
  critical: number;
  averageReplicationFactor: number;
  lastScanTime: number;
}

interface ReplicationJob {
  cid: string;
  priority: number;
  targetNodes: string[];
  attempts: number;
  lastAttempt: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

/**
 * Service for monitoring content availability across the distributed IPFS network
 */
export class ContentAvailabilityService extends EventEmitter {
  private contentRegistry = new Map<string, ContentRecord>();
  private replicationQueue: ReplicationJob[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private replicationInterval: NodeJS.Timeout | null = null;
  private cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 minutes TTL
  private isRunning = false;

  constructor() {
    super();
  }

  /**
   * Initialize the content availability service
   */
  async initialize(): Promise<void> {
    console.log('Initializing content availability service...');
    
    // Load existing content registry
    await this.loadContentRegistry();
    
    // Start monitoring
    this.startMonitoring();
    
    // Start replication worker
    this.startReplicationWorker();
    
    this.isRunning = true;
    console.log(`Content availability service initialized with ${this.contentRegistry.size} tracked items`);
  }

  /**
   * Register new content for monitoring
   */
  async registerContent(
    cid: string,
    options: {
      contentType?: string;
      size?: number;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      targetReplicas?: number;
    } = {}
  ): Promise<void> {
    const {
      contentType = 'unknown',
      size = 0,
      priority = 'medium',
      targetReplicas = 3
    } = options;

    // Check current availability
    const availability = await distributedNodeService.checkContentAvailability(cid);

    const record: ContentRecord = {
      cid,
      uploadedAt: Date.now(),
      lastChecked: Date.now(),
      replicationFactor: availability.replicationFactor,
      targetReplicas,
      availableNodes: availability.availableNodes,
      priority,
      contentType,
      size,
      checkCount: 1,
      consecutiveFailures: 0
    };

    this.contentRegistry.set(cid, record);
    
    // If under-replicated, add to replication queue
    if (availability.replicationFactor < targetReplicas) {
      this.addToReplicationQueue(cid, priority);
    }

    this.emit('contentRegistered', { cid, record });
    console.log(`Registered content for monitoring: ${cid} (${availability.replicationFactor}/${targetReplicas} replicas)`);
  }

  /**
   * Check availability of specific content
   */
  async checkContentAvailability(cid: string): Promise<ContentRecord | null> {
    const record = this.contentRegistry.get(cid);
    if (!record) {
      return null;
    }

    try {
      const availability = await distributedNodeService.checkContentAvailability(cid);
      
      // Update record
      record.lastChecked = Date.now();
      record.replicationFactor = availability.replicationFactor;
      record.availableNodes = availability.availableNodes;
      record.checkCount += 1;
      record.consecutiveFailures = 0;

      this.contentRegistry.set(cid, record);

      // Check if replication is needed
      if (availability.replicationFactor < record.targetReplicas) {
        this.addToReplicationQueue(cid, record.priority);
      }

      return record;
    } catch (error) {
      record.consecutiveFailures += 1;
      record.lastChecked = Date.now();
      this.contentRegistry.set(cid, record);
      
      console.error(`Failed to check availability for ${cid}:`, error);
      return record;
    }
  }

  /**
   * Perform full availability scan
   */
  async performAvailabilityScan(): Promise<AvailabilityReport> {
    console.log('Starting content availability scan...');
    const startTime = Date.now();
    
    const scanPromises = Array.from(this.contentRegistry.keys()).map(cid => 
      this.checkContentAvailability(cid)
    );

    await Promise.allSettled(scanPromises);

    // Generate report
    const records = Array.from(this.contentRegistry.values());
    const totalContent = records.length;
    const underReplicated = records.filter(r => r.replicationFactor < r.targetReplicas).length;
    const overReplicated = records.filter(r => r.replicationFactor > r.targetReplicas).length;
    const healthy = records.filter(r => r.replicationFactor === r.targetReplicas).length;
    const critical = records.filter(r => r.replicationFactor === 0 || r.consecutiveFailures > 3).length;
    
    const averageReplicationFactor = records.length > 0 
      ? records.reduce((sum, r) => sum + r.replicationFactor, 0) / records.length 
      : 0;

    const report: AvailabilityReport = {
      totalContent,
      underReplicated,
      overReplicated,
      healthy,
      critical,
      averageReplicationFactor,
      lastScanTime: Date.now()
    };

    this.cache.set('lastAvailabilityReport', report);
    this.emit('availabilityScanComplete', report);
    
    console.log(`Availability scan complete in ${Date.now() - startTime}ms:`, report);
    return report;
  }

  /**
   * Add content to replication queue
   */
  private addToReplicationQueue(cid: string, priority: 'low' | 'medium' | 'high' | 'critical'): void {
    // Check if already in queue
    const existingJob = this.replicationQueue.find(job => job.cid === cid);
    if (existingJob && existingJob.status === 'pending') {
      return; // Already queued
    }

    const priorityMap = { low: 1, medium: 2, high: 3, critical: 4 };
    
    const job: ReplicationJob = {
      cid,
      priority: priorityMap[priority],
      targetNodes: [],
      attempts: 0,
      lastAttempt: 0,
      status: 'pending'
    };

    this.replicationQueue.push(job);
    
    // Sort queue by priority
    this.replicationQueue.sort((a, b) => b.priority - a.priority);
    
    console.log(`Added ${cid} to replication queue (priority: ${priority})`);
  }

  /**
   * Process replication queue
   */
  private async processReplicationQueue(): Promise<void> {
    if (this.replicationQueue.length === 0) {
      return;
    }

    const job = this.replicationQueue.find(j => j.status === 'pending');
    if (!job) {
      return;
    }

    job.status = 'in-progress';
    job.attempts += 1;
    job.lastAttempt = Date.now();

    try {
      console.log(`Processing replication job for ${job.cid} (attempt ${job.attempts})`);
      
      await distributedNodeService.ensureReplication(job.cid);
      
      job.status = 'completed';
      this.emit('replicationCompleted', { cid: job.cid, attempts: job.attempts });
      
      // Remove completed job
      this.replicationQueue = this.replicationQueue.filter(j => j.cid !== job.cid);
      
    } catch (error) {
      console.error(`Replication failed for ${job.cid}:`, error);
      
      if (job.attempts >= 3) {
        job.status = 'failed';
        this.emit('replicationFailed', { cid: job.cid, attempts: job.attempts, error });
        
        // Remove failed job after 3 attempts
        this.replicationQueue = this.replicationQueue.filter(j => j.cid !== job.cid);
      } else {
        job.status = 'pending'; // Retry later
      }
    }
  }

  /**
   * Start monitoring loop
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performAvailabilityScan();
      } catch (error) {
        console.error('Error during availability scan:', error);
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Start replication worker
   */
  private startReplicationWorker(): void {
    if (this.replicationInterval) {
      clearInterval(this.replicationInterval);
    }

    this.replicationInterval = setInterval(async () => {
      try {
        await this.processReplicationQueue();
      } catch (error) {
        console.error('Error processing replication queue:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Load content registry from persistent storage
   */
  private async loadContentRegistry(): Promise<void> {
    // In a real implementation, this would load from a database
    // For now, we'll start with an empty registry
    console.log('Content registry loaded (empty for now)');
  }

  /**
   * Get content statistics
   */
  getContentStats(): {
    totalTracked: number;
    replicationQueue: number;
    lastScanTime: number | null;
    averageReplicationFactor: number;
  } {
    const records = Array.from(this.contentRegistry.values());
    const lastReport = this.cache.get<AvailabilityReport>('lastAvailabilityReport');
    
    return {
      totalTracked: records.length,
      replicationQueue: this.replicationQueue.length,
      lastScanTime: lastReport?.lastScanTime || null,
      averageReplicationFactor: lastReport?.averageReplicationFactor || 0
    };
  }

  /**
   * Get content by priority
   */
  getContentByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): ContentRecord[] {
    return Array.from(this.contentRegistry.values())
      .filter(record => record.priority === priority);
  }

  /**
   * Get under-replicated content
   */
  getUnderReplicatedContent(): ContentRecord[] {
    return Array.from(this.contentRegistry.values())
      .filter(record => record.replicationFactor < record.targetReplicas);
  }

  /**
   * Get critical content (no replicas or multiple failures)
   */
  getCriticalContent(): ContentRecord[] {
    return Array.from(this.contentRegistry.values())
      .filter(record => record.replicationFactor === 0 || record.consecutiveFailures > 3);
  }

  /**
   * Get latest availability report
   */
  getLatestReport(): AvailabilityReport | null {
    return this.cache.get<AvailabilityReport>('lastAvailabilityReport') || null;
  }

  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    this.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.replicationInterval) {
      clearInterval(this.replicationInterval);
      this.replicationInterval = null;
    }
    
    console.log('Content availability service shut down');
  }
}

// Export singleton instance
export const contentAvailabilityService = new ContentAvailabilityService(); 