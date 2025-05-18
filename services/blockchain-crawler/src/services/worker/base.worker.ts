import Bull, { Queue, Job, JobOptions } from 'bull';
import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { workerConfig } from '../../config/worker';

export abstract class BaseWorker extends EventEmitter {
  protected queue: Queue;
  protected isRunning: boolean = false;
  protected workerCount: number = 0;

  constructor(
    protected readonly queueName: string,
    protected readonly options: {
      concurrency?: number;
      maxJobsPerWorker?: number;
    } = {}
  ) {
    super();
    this.queue = new Bull(queueName, {
      redis: workerConfig.redis,
      defaultJobOptions: {
        attempts: workerConfig.worker.retryLimit,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
        timeout: workerConfig.worker.stalledTimeout,
      },
    });

    this.setupQueueEvents();
  }

  private setupQueueEvents(): void {
    this.queue.on('error', (error) => {
      logger.error(`Queue ${this.queueName} error:`, error);
      this.emit('error', error);
    });

    this.queue.on('failed', (job, error) => {
      logger.error(`Job ${job.id} in queue ${this.queueName} failed:`, error);
      this.emit('jobFailed', { job, error });
    });

    this.queue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} in queue ${this.queueName} is stalled`);
      this.emit('jobStalled', job);
    });
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn(`Worker for queue ${this.queueName} is already running`);
      return;
    }

    try {
      this.isRunning = true;
      const concurrency = this.options.concurrency || workerConfig.worker.concurrency;
      
      this.queue.process(concurrency, async (job) => {
        try {
          logger.info(`Processing job ${job.id} in queue ${this.queueName}`);
          const result = await this.processJob(job);
          logger.info(`Successfully processed job ${job.id} in queue ${this.queueName}`);
          return result;
        } catch (error) {
          logger.error(`Error processing job ${job.id} in queue ${this.queueName}:`, error);
          throw error;
        }
      });

      logger.info(`Started worker for queue ${this.queueName} with concurrency ${concurrency}`);
    } catch (error) {
      this.isRunning = false;
      logger.error(`Failed to start worker for queue ${this.queueName}:`, error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.queue.pause(true);
      await this.queue.close();
      this.isRunning = false;
      logger.info(`Stopped worker for queue ${this.queueName}`);
    } catch (error) {
      logger.error(`Error stopping worker for queue ${this.queueName}:`, error);
      throw error;
    }
  }

  public async addJob<T>(data: T, options?: JobOptions): Promise<Job<T>> {
    try {
      const job = await this.queue.add(data, {
        ...options,
        attempts: options?.attempts || workerConfig.worker.retryLimit,
      });
      logger.info(`Added job ${job.id} to queue ${this.queueName}`);
      return job;
    } catch (error) {
      logger.error(`Failed to add job to queue ${this.queueName}:`, error);
      throw error;
    }
  }

  public async getQueueMetrics(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  protected abstract processJob(job: Job): Promise<any>;
} 