import { EventEmitter } from 'events';
import { BlockWorker } from './block.worker';
import { workerConfig } from '../../config/worker';
import { logger } from '../../utils/logger';

export class WorkerManager extends EventEmitter {
  private workers: Map<string, BlockWorker> = new Map();
  private isRunning: boolean = false;

  constructor() {
    super();
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    // Create workers based on configuration
    const workerCount = workerConfig.worker.concurrency;
    for (let i = 0; i < workerCount; i++) {
      const workerId = `block-worker-${i + 1}`;
      const worker = new BlockWorker(workerId);

      // Set up worker event handlers
      worker.on('error', (error) => {
        logger.error(`Error in worker ${workerId}:`, error);
        this.emit('workerError', { worker: workerId, error });
      });

      worker.on('jobFailed', (job, error) => {
        logger.error(`Job ${job.id} failed in worker ${workerId}:`, error);
        this.emit('jobFailed', { worker: workerId, job, error });
      });

      worker.on('jobStalled', (job) => {
        logger.warn(`Job ${job.id} stalled in worker ${workerId}`);
        this.emit('jobStalled', { worker: workerId, job });
      });

      worker.on('jobCompleted', (job) => {
        this.emit('jobCompleted', {
          worker: workerId,
          blockNumber: job.data.blockNumber,
          chainId: job.data.chainId,
        });
      });

      this.workers.set(workerId, worker);
    }
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Worker manager is already running');
      return;
    }

    try {
      this.isRunning = true;

      // Start all workers
      const startPromises = Array.from(this.workers.entries()).map(async ([workerId, worker]) => {
        try {
          await worker.start();
          logger.info(`Started worker ${workerId}`);
        } catch (error) {
          logger.error(`Failed to start worker ${workerId}:`, error);
          throw error;
        }
      });

      await Promise.all(startPromises);
      logger.info('All workers started successfully');
    } catch (error) {
      this.isRunning = false;
      logger.error('Failed to start worker manager:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Stop all workers
      const stopPromises = Array.from(this.workers.entries()).map(async ([workerId, worker]) => {
        try {
          await worker.stop();
          logger.info(`Stopped worker ${workerId}`);
        } catch (error) {
          logger.error(`Failed to stop worker ${workerId}:`, error);
          throw error;
        }
      });

      await Promise.all(stopPromises);
      this.isRunning = false;
      logger.info('All workers stopped successfully');
    } catch (error) {
      logger.error('Failed to stop worker manager:', error);
      throw error;
    }
  }

  public async getBlockWorker(): Promise<BlockWorker> {
    // Get the least loaded worker
    let leastLoadedWorker: BlockWorker | null = null;
    let minActiveJobs = Infinity;

    // Get metrics for all workers
    const workerMetrics = await Promise.all(
      Array.from(this.workers.entries()).map(async ([_, worker]) => ({
        worker,
        metrics: await worker.getQueueMetrics(),
      }))
    );

    // Find the worker with the least active jobs
    for (const { worker, metrics } of workerMetrics) {
      if (metrics.active < minActiveJobs) {
        minActiveJobs = metrics.active;
        leastLoadedWorker = worker;
      }
    }

    if (!leastLoadedWorker) {
      throw new Error('No workers available');
    }

    return leastLoadedWorker;
  }

  public async getWorkerMetrics(): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {};

    for (const [workerId, worker] of this.workers.entries()) {
      try {
        metrics[workerId] = await worker.getQueueMetrics();
      } catch (error) {
        logger.error(`Failed to get metrics for worker ${workerId}:`, error);
        metrics[workerId] = { error: 'Failed to get metrics' };
      }
    }

    return metrics;
  }

  public async restartWorker(workerId: string): Promise<void> {
    try {
      // Stop the existing worker
      const worker = this.workers.get(workerId);
      if (worker) {
        await worker.stop();
        this.workers.delete(workerId);
      }

      // Create and start a new worker
      const newWorker = new BlockWorker(workerId);
      
      // Set up worker event handlers
      newWorker.on('error', (error) => {
        logger.error(`Error in worker ${workerId}:`, error);
        this.emit('workerError', { worker: workerId, error });
      });

      newWorker.on('jobFailed', (job, error) => {
        logger.error(`Job ${job.id} failed in worker ${workerId}:`, error);
        this.emit('jobFailed', { worker: workerId, job, error });
      });

      newWorker.on('jobStalled', (job) => {
        logger.warn(`Job ${job.id} stalled in worker ${workerId}`);
        this.emit('jobStalled', { worker: workerId, job });
      });

      newWorker.on('jobCompleted', (job) => {
        this.emit('jobCompleted', {
          worker: workerId,
          blockNumber: job.data.blockNumber,
          chainId: job.data.chainId,
        });
      });

      await newWorker.start();
      this.workers.set(workerId, newWorker);
      
      logger.info(`Successfully restarted worker ${workerId}`);
    } catch (error) {
      logger.error(`Failed to restart worker ${workerId}:`, error);
      throw error;
    }
  }
} 