import { EventEmitter } from 'events';
import { WorkerManager } from './worker/worker.manager';
import { JobCoordinator } from './coordinator/job.coordinator';
import { logger } from '../utils/logger';

export class BlockchainCrawlerService extends EventEmitter {
  private workerManager: WorkerManager;
  private jobCoordinator: JobCoordinator;
  private isRunning: boolean = false;

  constructor() {
    super();
    this.workerManager = new WorkerManager();
    this.jobCoordinator = JobCoordinator.getInstance();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.workerManager.on('workerError', ({ worker, error }) => {
      logger.error(`Worker error in ${worker}:`, error);
      this.emit('error', { component: worker, error });
    });

    this.workerManager.on('jobFailed', ({ worker, job, error }) => {
      logger.error(`Job failed in ${worker}:`, { jobId: job.id, error });
      this.emit('jobFailed', { component: worker, jobId: job.id, error });
      
      // Add failed block to retry queue
      if (job.data.chainId && job.data.blockNumber) {
        this.jobCoordinator.handleFailedBlock(job.data.chainId, job.data.blockNumber);
      }
    });
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Blockchain crawler service is already running');
      return;
    }

    try {
      this.isRunning = true;

      // Start the worker manager
      await this.workerManager.start();
      
      // Start the job coordinator
      await this.jobCoordinator.start();

      logger.info('Blockchain crawler service started successfully');
    } catch (error) {
      this.isRunning = false;
      logger.error('Failed to start blockchain crawler service:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Stop the job coordinator
      await this.jobCoordinator.stop();

      // Stop the worker manager
      await this.workerManager.stop();
      this.isRunning = false;
      logger.info('Blockchain crawler service stopped successfully');
    } catch (error) {
      logger.error('Failed to stop blockchain crawler service:', error);
      throw error;
    }
  }

  public async getMetrics(): Promise<Record<string, any>> {
    try {
      const [workerMetrics, chainProgress] = await Promise.all([
        this.workerManager.getWorkerMetrics(),
        this.jobCoordinator.getChainProgress(),
      ]);

      return {
        status: this.isRunning ? 'running' : 'stopped',
        workers: workerMetrics,
        chains: chainProgress,
      };
    } catch (error) {
      logger.error('Failed to get crawler metrics:', error);
      throw error;
    }
  }
} 