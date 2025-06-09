import { EventEmitter } from 'events';
import { IPFSHTTPClient } from 'ipfs-http-client';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

// Monitoring configuration
interface MonitoringConfig {
  metricsInterval: number; // seconds
  alertThresholds: {
    cpuUsage: number; // percentage
    memoryUsage: number; // percentage
    diskUsage: number; // percentage
    responseTime: number; // milliseconds
    errorRate: number; // percentage
    connectionCount: number; // number of connections
  };
  retentionPeriod: number; // hours
  enableAlerts: boolean;
  alertWebhook?: string;
}

// System metrics
interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number; // percentage
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number; // percentage
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number; // percentage
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
}

// IPFS metrics
interface IPFSMetrics {
  timestamp: number;
  peers: {
    connected: number;
    total: number;
  };
  bandwidth: {
    totalIn: number;
    totalOut: number;
    rateIn: number;
    rateOut: number;
  };
  repository: {
    size: number;
    objects: number;
  };
  pinned: {
    count: number;
    size: number;
  };
  gateway: {
    requests: number;
    errors: number;
    averageResponseTime: number;
  };
}

// Performance metrics
interface PerformanceMetrics {
  timestamp: number;
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  };
  content: {
    uploads: number;
    downloads: number;
    totalSize: number;
  };
}

// Alert types
interface Alert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'ipfs' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  metadata?: Record<string, any>;
}

// Health status
interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    ipfs: 'healthy' | 'degraded' | 'unhealthy';
    storage: 'healthy' | 'degraded' | 'unhealthy';
    network: 'healthy' | 'degraded' | 'unhealthy';
    performance: 'healthy' | 'degraded' | 'unhealthy';
  };
  lastCheck: number;
}

class IPFSProductionMonitor extends EventEmitter {
  private ipfsClient: IPFSHTTPClient;
  private config: MonitoringConfig;
  private systemMetrics: SystemMetrics[] = [];
  private ipfsMetrics: IPFSMetrics[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private alerts: Map<string, Alert> = new Map();
  private healthStatus: HealthStatus;
  private monitoringTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  private lastNetworkStats: any = null;

  constructor(ipfsClient: IPFSHTTPClient, config: Partial<MonitoringConfig> = {}) {
    super();
    
    this.ipfsClient = ipfsClient;
    this.config = {
      metricsInterval: 30, // 30 seconds
      alertThresholds: {
        cpuUsage: 80,
        memoryUsage: 85,
        diskUsage: 90,
        responseTime: 5000,
        errorRate: 5,
        connectionCount: 1000
      },
      retentionPeriod: 24, // 24 hours
      enableAlerts: true,
      ...config
    };

    this.healthStatus = {
      overall: 'healthy',
      components: {
        ipfs: 'healthy',
        storage: 'healthy',
        network: 'healthy',
        performance: 'healthy'
      },
      lastCheck: Date.now()
    };

    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Start monitoring processes
   */
  private startMonitoring(): void {
    // Collect metrics at regular intervals
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.checkHealth();
        this.checkAlerts();
      } catch (error) {
        console.error('Monitoring error:', error);
        this.emit('monitoringError', error);
      }
    }, this.config.metricsInterval * 1000);

    // Clean up old metrics
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000); // Every hour

    console.log('Production monitoring started');
  }

  /**
   * Collect all metrics
   */
  private async collectMetrics(): Promise<void> {
    const timestamp = Date.now();

    // Collect system metrics
    const systemMetrics = await this.collectSystemMetrics(timestamp);
    this.systemMetrics.push(systemMetrics);

    // Collect IPFS metrics
    const ipfsMetrics = await this.collectIPFSMetrics(timestamp);
    this.ipfsMetrics.push(ipfsMetrics);

    // Collect performance metrics
    const performanceMetrics = await this.collectPerformanceMetrics(timestamp);
    this.performanceMetrics.push(performanceMetrics);

    this.emit('metricsCollected', {
      system: systemMetrics,
      ipfs: ipfsMetrics,
      performance: performanceMetrics
    });
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(timestamp: number): Promise<SystemMetrics> {
    // CPU metrics
    const cpus = os.cpus();
    const cpuUsage = await this.getCPUUsage();
    const loadAverage = os.loadavg();

    // Memory metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;

    // Disk metrics
    const diskStats = await this.getDiskUsage();

    // Network metrics
    const networkStats = await this.getNetworkStats();

    return {
      timestamp,
      cpu: {
        usage: cpuUsage,
        loadAverage
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usage: memoryUsage
      },
      disk: diskStats,
      network: networkStats
    };
  }

  /**
   * Collect IPFS metrics
   */
  private async collectIPFSMetrics(timestamp: number): Promise<IPFSMetrics> {
    try {
      // Peer information
      const peers = await this.ipfsClient.swarm.peers();
      const connectedPeers = peers.length;

      // Bandwidth statistics - handle async iterable
      let bandwidthStats = { totalIn: 0, totalOut: 0, rateIn: 0, rateOut: 0 };
      try {
        const bwIterator = this.ipfsClient.stats.bw();
        for await (const bw of bwIterator) {
          bandwidthStats = {
            totalIn: Number(bw.totalIn),
            totalOut: Number(bw.totalOut),
            rateIn: Number(bw.rateIn),
            rateOut: Number(bw.rateOut)
          };
          break; // Take first result
        }
      } catch (bwError) {
        console.warn('Failed to get bandwidth stats:', bwError);
      }

      // Repository statistics
      const repoStats = await this.ipfsClient.stats.repo();

      // Pin statistics
      const pins = [];
      for await (const pin of this.ipfsClient.pin.ls()) {
        pins.push(pin);
      }

      return {
        timestamp,
        peers: {
          connected: connectedPeers,
          total: connectedPeers // In production, would track total known peers
        },
        bandwidth: bandwidthStats,
        repository: {
          size: Number(repoStats.repoSize),
          objects: Number(repoStats.numObjects)
        },
        pinned: {
          count: pins.length,
          size: 0 // Would calculate total pinned size in production
        },
        gateway: {
          requests: 0, // Would track gateway requests
          errors: 0,
          averageResponseTime: 0
        }
      };
    } catch (error) {
      console.error('Failed to collect IPFS metrics:', error);
      return {
        timestamp,
        peers: { connected: 0, total: 0 },
        bandwidth: { totalIn: 0, totalOut: 0, rateIn: 0, rateOut: 0 },
        repository: { size: 0, objects: 0 },
        pinned: { count: 0, size: 0 },
        gateway: { requests: 0, errors: 0, averageResponseTime: 0 }
      };
    }
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(timestamp: number): Promise<PerformanceMetrics> {
    // In production, these would be collected from actual application metrics
    return {
      timestamp,
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0
      },
      content: {
        uploads: 0,
        downloads: 0,
        totalSize: 0
      }
    };
  }

  /**
   * Get CPU usage percentage
   */
  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startMeasure = this.cpuAverage();
      
      setTimeout(() => {
        const endMeasure = this.cpuAverage();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
        resolve(percentageCPU);
      }, 1000);
    });
  }

  /**
   * Calculate CPU average
   */
  private cpuAverage(): { idle: number; total: number } {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    }

    return {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length
    };
  }

  /**
   * Get disk usage statistics
   */
  private async getDiskUsage(): Promise<{ total: number; used: number; free: number; usage: number }> {
    try {
      const stats = await fs.promises.statfs(process.cwd());
      const total = stats.blocks * stats.bsize;
      const free = stats.bavail * stats.bsize;
      const used = total - free;
      const usage = (used / total) * 100;

      return { total, used, free, usage };
    } catch (error) {
      // Fallback for systems without statfs
      return { total: 0, used: 0, free: 0, usage: 0 };
    }
  }

  /**
   * Get network statistics
   */
  private async getNetworkStats(): Promise<{ bytesIn: number; bytesOut: number; packetsIn: number; packetsOut: number }> {
    try {
      // Read network statistics from /proc/net/dev on Linux
      if (process.platform === 'linux') {
        const data = await fs.promises.readFile('/proc/net/dev', 'utf8');
        const lines = data.split('\n');
        let totalBytesIn = 0;
        let totalBytesOut = 0;
        let totalPacketsIn = 0;
        let totalPacketsOut = 0;

        for (const line of lines) {
          if (line.includes(':') && !line.includes('lo:')) { // Skip loopback
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 10) {
              totalBytesIn += parseInt(parts[1]) || 0;
              totalPacketsIn += parseInt(parts[2]) || 0;
              totalBytesOut += parseInt(parts[9]) || 0;
              totalPacketsOut += parseInt(parts[10]) || 0;
            }
          }
        }

        return {
          bytesIn: totalBytesIn,
          bytesOut: totalBytesOut,
          packetsIn: totalPacketsIn,
          packetsOut: totalPacketsOut
        };
      }
    } catch (error) {
      // Fallback for non-Linux systems or errors
    }

    return { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 };
  }

  /**
   * Check system health
   */
  private async checkHealth(): Promise<void> {
    const latestSystem = this.systemMetrics[this.systemMetrics.length - 1];
    const latestIPFS = this.ipfsMetrics[this.ipfsMetrics.length - 1];
    const latestPerformance = this.performanceMetrics[this.performanceMetrics.length - 1];

    if (!latestSystem || !latestIPFS || !latestPerformance) return;

    // Check IPFS health
    const ipfsHealth = latestIPFS.peers.connected > 0 ? 'healthy' : 'unhealthy';

    // Check storage health
    const storageHealth = latestSystem.disk.usage < 95 ? 'healthy' : 
                         latestSystem.disk.usage < 98 ? 'degraded' : 'unhealthy';

    // Check network health
    const networkHealth = latestIPFS.bandwidth.rateIn > 0 || latestIPFS.bandwidth.rateOut > 0 ? 'healthy' : 'degraded';

    // Check performance health
    const performanceHealth = latestPerformance.requests.averageResponseTime < 5000 ? 'healthy' : 'degraded';

    // Update component health
    this.healthStatus.components = {
      ipfs: ipfsHealth,
      storage: storageHealth,
      network: networkHealth,
      performance: performanceHealth
    };

    // Calculate overall health
    const componentStatuses = Object.values(this.healthStatus.components);
    if (componentStatuses.every(status => status === 'healthy')) {
      this.healthStatus.overall = 'healthy';
    } else if (componentStatuses.some(status => status === 'unhealthy')) {
      this.healthStatus.overall = 'unhealthy';
    } else {
      this.healthStatus.overall = 'degraded';
    }

    this.healthStatus.lastCheck = Date.now();

    this.emit('healthUpdated', this.healthStatus);
  }

  /**
   * Check for alert conditions
   */
  private checkAlerts(): void {
    if (!this.config.enableAlerts) return;

    const latestSystem = this.systemMetrics[this.systemMetrics.length - 1];
    const latestIPFS = this.ipfsMetrics[this.ipfsMetrics.length - 1];

    if (!latestSystem || !latestIPFS) return;

    // Check CPU usage
    if (latestSystem.cpu.usage > this.config.alertThresholds.cpuUsage) {
      this.createAlert('cpu', 'high', `High CPU usage: ${latestSystem.cpu.usage.toFixed(1)}%`, {
        usage: latestSystem.cpu.usage,
        threshold: this.config.alertThresholds.cpuUsage
      });
    }

    // Check memory usage
    if (latestSystem.memory.usage > this.config.alertThresholds.memoryUsage) {
      this.createAlert('memory', 'high', `High memory usage: ${latestSystem.memory.usage.toFixed(1)}%`, {
        usage: latestSystem.memory.usage,
        threshold: this.config.alertThresholds.memoryUsage
      });
    }

    // Check disk usage
    if (latestSystem.disk.usage > this.config.alertThresholds.diskUsage) {
      this.createAlert('disk', 'critical', `High disk usage: ${latestSystem.disk.usage.toFixed(1)}%`, {
        usage: latestSystem.disk.usage,
        threshold: this.config.alertThresholds.diskUsage
      });
    }

    // Check IPFS peer connections
    if (latestIPFS.peers.connected === 0) {
      this.createAlert('ipfs', 'critical', 'No IPFS peers connected', {
        connectedPeers: latestIPFS.peers.connected
      });
    }
  }

  /**
   * Create an alert
   */
  private createAlert(
    type: Alert['type'], 
    severity: Alert['severity'], 
    message: string, 
    metadata?: Record<string, any>
  ): void {
    const alertId = `${type}-${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      type,
      severity,
      message,
      timestamp: Date.now(),
      resolved: false,
      metadata
    };

    this.alerts.set(alertId, alert);
    this.emit('alertCreated', alert);

    // Send webhook notification if configured
    if (this.config.alertWebhook) {
      this.sendAlertWebhook(alert).catch(error => {
        console.error('Failed to send alert webhook:', error);
      });
    }
  }

  /**
   * Send alert webhook
   */
  private async sendAlertWebhook(alert: Alert): Promise<void> {
    if (!this.config.alertWebhook) return;

    try {
      const axios = require('axios');
      await axios.post(this.config.alertWebhook, {
        alert,
        timestamp: new Date().toISOString(),
        service: 'wylloh-ipfs'
      });
    } catch (error) {
      console.error('Webhook delivery failed:', error);
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved) return false;

    alert.resolved = true;
    alert.resolvedAt = Date.now();
    this.alerts.set(alertId, alert);

    this.emit('alertResolved', alert);
    return true;
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - (this.config.retentionPeriod * 60 * 60 * 1000);

    // Clean system metrics
    this.systemMetrics = this.systemMetrics.filter(metric => metric.timestamp > cutoffTime);

    // Clean IPFS metrics
    this.ipfsMetrics = this.ipfsMetrics.filter(metric => metric.timestamp > cutoffTime);

    // Clean performance metrics
    this.performanceMetrics = this.performanceMetrics.filter(metric => metric.timestamp > cutoffTime);

    // Clean resolved alerts older than 7 days
    const alertCutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < alertCutoff) {
        this.alerts.delete(id);
      }
    }

    this.emit('metricsCleanedUp', {
      systemMetrics: this.systemMetrics.length,
      ipfsMetrics: this.ipfsMetrics.length,
      performanceMetrics: this.performanceMetrics.length,
      activeAlerts: Array.from(this.alerts.values()).filter(a => !a.resolved).length
    });
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): {
    system: SystemMetrics | null;
    ipfs: IPFSMetrics | null;
    performance: PerformanceMetrics | null;
    health: HealthStatus;
    alerts: Alert[];
  } {
    return {
      system: this.systemMetrics[this.systemMetrics.length - 1] || null,
      ipfs: this.ipfsMetrics[this.ipfsMetrics.length - 1] || null,
      performance: this.performanceMetrics[this.performanceMetrics.length - 1] || null,
      health: this.healthStatus,
      alerts: Array.from(this.alerts.values()).filter(a => !a.resolved)
    };
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(hours: number = 1): {
    system: SystemMetrics[];
    ipfs: IPFSMetrics[];
    performance: PerformanceMetrics[];
  } {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);

    return {
      system: this.systemMetrics.filter(m => m.timestamp > cutoffTime),
      ipfs: this.ipfsMetrics.filter(m => m.timestamp > cutoffTime),
      performance: this.performanceMetrics.filter(m => m.timestamp > cutoffTime)
    };
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(a => !a.resolved);
  }

  /**
   * Export metrics to file
   */
  async exportMetrics(filePath: string): Promise<void> {
    const data = {
      exportTime: new Date().toISOString(),
      systemMetrics: this.systemMetrics,
      ipfsMetrics: this.ipfsMetrics,
      performanceMetrics: this.performanceMetrics,
      alerts: Array.from(this.alerts.values()),
      healthStatus: this.healthStatus
    };

    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    this.emit('metricsExported', { filePath, recordCount: this.systemMetrics.length });
  }

  /**
   * Shutdown monitoring
   */
  shutdown(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.removeAllListeners();
    console.log('Production monitoring stopped');
  }
}

export default IPFSProductionMonitor;
export type { 
  MonitoringConfig, 
  SystemMetrics, 
  IPFSMetrics, 
  PerformanceMetrics, 
  Alert, 
  HealthStatus 
}; 