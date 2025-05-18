import { EventEmitter } from 'events';
import { BaseWorker } from '../worker/base.worker';
import { ChainAdapterFactory } from '../../adapters/chain.adapter.factory';
import { logger } from '../../utils/logger';
import { workerConfig } from '../../config/worker';

interface BaseWorkerMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface WorkerMetrics extends BaseWorkerMetrics {
  status: 'healthy' | 'warning' | 'error';
  lastProcessedBlock?: number;
  processingRate?: number;
  errorRate?: number;
  lastError?: string;
}

interface ChainMetrics {
  latestBlock: number;
  syncStatus: boolean;
  peerCount: number;
  blocksBehind: number;
  processingStatus: 'synced' | 'syncing' | 'error';
  lastError?: string;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  uptime: number;
}

export class HealthMonitor extends EventEmitter {
  private workers: Map<string, BaseWorker> = new Map();
  private adapterFactory: ChainAdapterFactory;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsHistory: Map<string, WorkerMetrics[]> = new Map();
  private readonly historySize = 10; // Keep last 10 metrics for trend analysis

  constructor() {
    super();
    this.adapterFactory = ChainAdapterFactory.getInstance();
  }

  public registerWorker(name: string, worker: BaseWorker): void {
    this.workers.set(name, worker);
    this.metricsHistory.set(name, []);
    logger.info(`Registered worker ${name} for health monitoring`);
  }

  public async start(): Promise<void> {
    if (this.healthCheckInterval) {
      logger.warn('Health monitor is already running');
      return;
    }

    this.healthCheckInterval = setInterval(
      () => this.checkHealth(),
      workerConfig.monitoring.healthCheckInterval
    );

    logger.info('Started health monitoring service');
  }

  public async stop(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    logger.info('Stopped health monitoring service');
  }

  private async checkHealth(): Promise<void> {
    try {
      const [workerHealth, chainHealth, systemHealth] = await Promise.all([
        this.collectWorkerMetrics(),
        this.collectChainMetrics(),
        this.collectSystemMetrics(),
      ]);

      const healthStatus = {
        workers: workerHealth,
        chains: chainHealth,
        system: systemHealth,
        timestamp: Date.now(),
      };

      this.emit('health', healthStatus);
      
      // Analyze metrics and emit warnings/errors
      this.analyzeMetrics(healthStatus);
    } catch (error) {
      logger.error('Error checking system health:', error);
      this.emit('healthError', error);
    }
  }

  private async collectWorkerMetrics(): Promise<Record<string, WorkerMetrics>> {
    const metrics: Record<string, WorkerMetrics> = {};

    for (const [name, worker] of this.workers.entries()) {
      try {
        const baseMetrics = await worker.getQueueMetrics() as BaseWorkerMetrics;
        const history = this.metricsHistory.get(name) || [];

        // Calculate processing rate (jobs/minute)
        const processingRate = history.length > 0
          ? (baseMetrics.completed - history[0].completed) / (history.length)
          : 0;

        // Calculate error rate (errors/minute)
        const errorRate = history.length > 0
          ? (baseMetrics.failed - history[0].failed) / (history.length)
          : 0;

        const status = this.determineWorkerStatus(baseMetrics, processingRate, errorRate);

        const newMetrics: WorkerMetrics = {
          ...baseMetrics,
          status,
          processingRate,
          errorRate,
        };

        // Update history
        history.push(newMetrics);
        if (history.length > this.historySize) {
          history.shift();
        }
        this.metricsHistory.set(name, history);

        metrics[name] = newMetrics;
      } catch (error) {
        logger.error(`Error collecting metrics for worker ${name}:`, error);
        metrics[name] = {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          status: 'error',
          lastError: error.message,
        };
      }
    }

    return metrics;
  }

  private async collectChainMetrics(): Promise<Record<string, ChainMetrics>> {
    const metrics: Record<string, ChainMetrics> = {};

    try {
      const adapters = await Promise.all(
        Object.keys(workerConfig.chains).map(async (chainId) => ({
          chainId,
          adapter: await this.adapterFactory.getAdapter(chainId),
        }))
      );

      for (const { chainId, adapter } of adapters) {
        if (!adapter) {
          metrics[chainId] = {
            latestBlock: 0,
            syncStatus: false,
            peerCount: 0,
            blocksBehind: 0,
            processingStatus: 'error',
            lastError: 'Adapter not available',
          };
          continue;
        }

        try {
          const status = await adapter.getChainStatus();
          const config = adapter.config;
          const blocksBehind = status.latestBlock - config.startBlock;

          metrics[chainId] = {
            ...status,
            blocksBehind,
            processingStatus: this.determineChainStatus(status, blocksBehind),
          };
        } catch (error) {
          logger.error(`Error getting chain status for ${chainId}:`, error);
          metrics[chainId] = {
            latestBlock: 0,
            syncStatus: false,
            peerCount: 0,
            blocksBehind: 0,
            processingStatus: 'error',
            lastError: error.message,
          };
        }
      }
    } catch (error) {
      logger.error('Error collecting chain metrics:', error);
    }

    return metrics;
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    try {
      const os = await import('os');
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      return {
        cpu: {
          usage: process.cpuUsage().user / 1000000, // Convert to seconds
          loadAverage: os.loadavg(),
        },
        memory: {
          total: totalMemory,
          used: usedMemory,
          free: freeMemory,
        },
        uptime: process.uptime(),
      };
    } catch (error) {
      logger.error('Error collecting system metrics:', error);
      return {
        cpu: { usage: 0, loadAverage: [0, 0, 0] },
        memory: { total: 0, used: 0, free: 0 },
        uptime: 0,
      };
    }
  }

  private determineWorkerStatus(
    metrics: BaseWorkerMetrics,
    processingRate: number,
    errorRate: number
  ): 'healthy' | 'warning' | 'error' {
    if (metrics.failed > metrics.completed * 0.1) { // More than 10% failure rate
      return 'error';
    }
    if (errorRate > 5 || metrics.delayed > 100 || processingRate < 1) { // High error rate or slow processing
      return 'warning';
    }
    return 'healthy';
  }

  private determineChainStatus(
    status: { latestBlock: number; syncStatus: boolean },
    blocksBehind: number
  ): 'synced' | 'syncing' | 'error' {
    if (!status.syncStatus) {
      return 'error';
    }
    if (blocksBehind > 1000) { // More than 1000 blocks behind
      return 'syncing';
    }
    return 'synced';
  }

  private analyzeMetrics(healthStatus: any): void {
    // Analyze worker metrics
    for (const [workerName, metrics] of Object.entries<WorkerMetrics>(healthStatus.workers)) {
      if (metrics.status === 'error') {
        logger.error(`Worker ${workerName} is in error state`, {
          failed: metrics.failed,
          errorRate: metrics.errorRate,
          lastError: metrics.lastError,
        });
      } else if (metrics.status === 'warning') {
        logger.warn(`Worker ${workerName} performance degraded`, {
          delayed: metrics.delayed,
          processingRate: metrics.processingRate,
        });
      }
    }

    // Analyze chain metrics
    for (const [chainId, metrics] of Object.entries<ChainMetrics>(healthStatus.chains)) {
      if (metrics.processingStatus === 'error') {
        logger.error(`Chain ${chainId} is in error state`, {
          syncStatus: metrics.syncStatus,
          peerCount: metrics.peerCount,
          lastError: metrics.lastError,
        });
      } else if (metrics.processingStatus === 'syncing' && metrics.blocksBehind > 10000) {
        logger.warn(`Chain ${chainId} is significantly behind`, {
          blocksBehind: metrics.blocksBehind,
        });
      }
    }

    // Analyze system metrics
    const system = healthStatus.system as SystemMetrics;
    const memoryUsagePercent = (system.memory.used / system.memory.total) * 100;
    if (memoryUsagePercent > 90) {
      logger.error('System memory usage critical', {
        usagePercent: memoryUsagePercent,
        free: system.memory.free,
      });
    } else if (memoryUsagePercent > 80) {
      logger.warn('System memory usage high', {
        usagePercent: memoryUsagePercent,
        free: system.memory.free,
      });
    }

    if (system.cpu.loadAverage[0] > 0.9) {
      logger.warn('High CPU load detected', {
        loadAverage: system.cpu.loadAverage,
        cpuUsage: system.cpu.usage,
      });
    }
  }
} 