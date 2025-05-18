import { ChainAdapterFactory } from '../../adapters/chain.adapter.factory';
import { BlockWorker } from '../worker/block.worker';
import { WorkerManager } from '../worker/worker.manager';
import { workerConfig } from '../../config/worker';
import { logger } from '../../utils/logger';
import { EventEmitter } from 'events';

interface ChainProgress {
  lastProcessedBlock: number;
  targetBlock: number;
  isProcessing: boolean;
  failedBlocks: Set<number>;
  retryCount: Map<number, number>;
  lastUpdateTime: number;
  processingRate: number;
  errorRate: number;
  totalProcessed: number;
  totalFailed: number;
  lastVerifiedBlock: number; // For reorg detection
  pendingBlocks: Set<number>; // For backpressure handling
}

interface ChainPriority {
  chainId: string;
  priority: number;
  lastProcessTime: number;
  healthScore: number; // For worker health tracking
}

interface WorkerHealth {
  lastActiveTime: number;
  successRate: number;
  responseTime: number;
  activeJobs: number;
}

export class JobCoordinator extends EventEmitter {
  private static instance: JobCoordinator;
  private readonly chainProgress: Map<string, ChainProgress> = new Map();
  private readonly adapterFactory: ChainAdapterFactory;
  private readonly workerManager: WorkerManager;
  private coordinationInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private chainPriorities: ChainPriority[] = [];
  private workerHealth: Map<string, WorkerHealth> = new Map();
  private readonly maxConcurrentChains: number;
  private readonly maxBlocksPerBatch: number;
  private readonly minBlocksPerBatch: number;
  private readonly targetProcessingRate: number;
  private readonly maxPendingBlocks: number;
  private readonly reorgThreshold: number;

  private constructor() {
    super();
    this.adapterFactory = ChainAdapterFactory.getInstance();
    this.workerManager = new WorkerManager();
    this.maxConcurrentChains = Math.max(1, Math.floor(workerConfig.worker.concurrency / 2));
    this.maxBlocksPerBatch = workerConfig.worker.concurrency * 2;
    this.minBlocksPerBatch = Math.max(1, Math.floor(workerConfig.worker.concurrency / 2));
    this.targetProcessingRate = 10; // Target blocks per second
    this.maxPendingBlocks = this.maxBlocksPerBatch * 3; // Maximum blocks in processing
    this.reorgThreshold = 12; // Number of confirmations to consider a block final
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.workerManager.on('workerError', ({ worker, error }) => {
      this.handleWorkerError(worker, error);
    });

    this.workerManager.on('jobCompleted', ({ worker, blockNumber, chainId }) => {
      this.handleJobCompletion(worker, blockNumber, chainId);
    });

    this.workerManager.on('jobFailed', ({ worker, job, error }) => {
      this.handleJobFailure(worker, job, error);
    });
  }

  private async handleWorkerError(workerId: string, error: Error): Promise<void> {
    const health = this.workerHealth.get(workerId) || this.initializeWorkerHealth();
    health.successRate *= 0.9; // Decay success rate on error
    this.workerHealth.set(workerId, health);
    
    logger.error(`Worker ${workerId} error:`, error);
    this.emit('workerError', { workerId, error });
  }

  private async handleJobCompletion(workerId: string, blockNumber: number, chainId: string): Promise<void> {
    const health = this.workerHealth.get(workerId) || this.initializeWorkerHealth();
    health.successRate = health.successRate * 0.9 + 0.1; // Exponential moving average
    health.activeJobs--;
    this.workerHealth.set(workerId, health);

    const progress = this.chainProgress.get(chainId);
    if (progress) {
      progress.pendingBlocks.delete(blockNumber);
      await this.verifyBlockAndUpdateProgress(chainId, blockNumber);
    }
  }

  private async handleJobFailure(workerId: string, job: any, error: Error): Promise<void> {
    const health = this.workerHealth.get(workerId) || this.initializeWorkerHealth();
    health.successRate *= 0.8; // Significant decay on failure
    health.activeJobs--;
    this.workerHealth.set(workerId, health);

    if (job.data.chainId && job.data.blockNumber) {
      await this.handleFailedBlock(job.data.chainId, job.data.blockNumber);
    }
  }

  private initializeWorkerHealth(): WorkerHealth {
    return {
      lastActiveTime: Date.now(),
      successRate: 1,
      responseTime: 0,
      activeJobs: 0,
    };
  }

  private async verifyBlockAndUpdateProgress(chainId: string, blockNumber: number): Promise<void> {
    const progress = this.chainProgress.get(chainId);
    if (!progress) return;

    const adapter = await this.adapterFactory.getAdapter(chainId);
    if (!adapter) return;

    try {
      // Verify block is still valid (no reorg)
      const block = await adapter.getBlock(blockNumber);
      if (!block) {
        logger.warn(`Block ${blockNumber} on chain ${chainId} no longer exists (possible reorg)`);
        await this.handleChainReorg(chainId, blockNumber);
        return;
      }

      // Update progress
      progress.lastVerifiedBlock = Math.max(progress.lastVerifiedBlock, blockNumber);
      progress.lastProcessedBlock = Math.max(progress.lastProcessedBlock, blockNumber);
      progress.totalProcessed++;
    } catch (error) {
      logger.error(`Error verifying block ${blockNumber} on chain ${chainId}:`, error);
      await this.handleFailedBlock(chainId, blockNumber);
    }
  }

  private async handleChainReorg(chainId: string, blockNumber: number): Promise<void> {
    const progress = this.chainProgress.get(chainId);
    if (!progress) return;

    // Find the last valid block
    const adapter = await this.adapterFactory.getAdapter(chainId);
    if (!adapter) return;

    try {
      let lastValidBlock = blockNumber - 1;
      while (lastValidBlock > progress.lastVerifiedBlock - this.reorgThreshold) {
        const block = await adapter.getBlock(lastValidBlock);
        if (block) break;
        lastValidBlock--;
      }

      // Reset progress to last valid block
      progress.lastProcessedBlock = lastValidBlock;
      progress.lastVerifiedBlock = lastValidBlock;
      progress.pendingBlocks.clear();
      
      logger.warn(`Chain reorg detected on ${chainId}, reset to block ${lastValidBlock}`);
      this.emit('chainReorg', { chainId, lastValidBlock, reorgDepth: blockNumber - lastValidBlock });
    } catch (error) {
      logger.error(`Error handling chain reorg for ${chainId}:`, error);
    }
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(
      () => this.checkWorkersHealth(),
      workerConfig.monitoring.healthCheckInterval
    );
  }

  private async checkWorkersHealth(): Promise<void> {
    const now = Date.now();
    const deadWorkers = new Set<string>();

    // Check each worker's health
    for (const [workerId, health] of this.workerHealth.entries()) {
      const timeSinceActive = now - health.lastActiveTime;
      const isHealthy = health.successRate > 0.7 && timeSinceActive < 60000;

      if (!isHealthy) {
        deadWorkers.add(workerId);
        logger.warn(`Worker ${workerId} appears unhealthy:`, {
          successRate: health.successRate,
          timeSinceActive,
          activeJobs: health.activeJobs,
        });
      }
    }

    // Handle dead workers
    if (deadWorkers.size > 0) {
      await this.handleDeadWorkers(deadWorkers);
    }
  }

  private async handleDeadWorkers(deadWorkers: Set<string>): Promise<void> {
    try {
      // Restart dead workers
      for (const workerId of deadWorkers) {
        await this.workerManager.restartWorker(workerId);
        this.workerHealth.set(workerId, this.initializeWorkerHealth());
      }

      // Requeue jobs from dead workers
      for (const progress of this.chainProgress.values()) {
        for (const blockNumber of progress.pendingBlocks) {
          progress.pendingBlocks.delete(blockNumber);
          progress.failedBlocks.add(blockNumber);
        }
      }
    } catch (error) {
      logger.error('Error handling dead workers:', error);
    }
  }

  private calculateOptimalBatchSize(progress: ChainProgress): number {
    // Start with base batch size based on processing rate
    let batchSize = Math.ceil(progress.processingRate * workerConfig.worker.backoffDelay / 1000);
    
    // Adjust for error rate
    if (progress.errorRate > 0.1) {
      batchSize = Math.max(this.minBlocksPerBatch, Math.floor(batchSize * 0.8));
    }

    // Adjust for pending blocks (backpressure)
    const pendingRatio = progress.pendingBlocks.size / this.maxPendingBlocks;
    if (pendingRatio > 0.8) {
      batchSize = Math.max(this.minBlocksPerBatch, Math.floor(batchSize * 0.5));
    }

    // Ensure within bounds
    return Math.max(
      this.minBlocksPerBatch,
      Math.min(this.maxBlocksPerBatch, batchSize)
    );
  }

  public async start(): Promise<void> {
    try {
      logger.info('Starting job coordinator...');

      // Initialize chain adapters
      await this.adapterFactory.initializeAllAdapters();

      // Initialize progress tracking for each chain
      const adapters = this.adapterFactory.getAllAdapters();
      for (const adapter of adapters) {
        const chainId = adapter.config.chainId;
        const startBlock = adapter.config.startBlock;
        const latestBlock = await adapter.getLatestBlock();

        this.chainProgress.set(chainId, {
          lastProcessedBlock: startBlock - 1,
          targetBlock: latestBlock,
          isProcessing: false,
          failedBlocks: new Set(),
          retryCount: new Map(),
          lastUpdateTime: Date.now(),
          processingRate: 0,
          errorRate: 0,
          totalProcessed: 0,
          totalFailed: 0,
          lastVerifiedBlock: startBlock - 1,
          pendingBlocks: new Set(),
        });

        this.chainPriorities.push({
          chainId,
          priority: 1,
          lastProcessTime: Date.now(),
          healthScore: 1,
        });

        logger.info(`Initialized chain ${chainId} progress: ${startBlock} -> ${latestBlock}`);
      }

      // Start the worker manager
      await this.workerManager.start();

      // Start coordination loop and health checks
      this.startCoordinationLoop();
      this.startHealthCheck();

      logger.info('Job coordinator started successfully');
    } catch (error) {
      logger.error('Failed to start job coordinator:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      logger.info('Stopping job coordinator...');

      // Stop coordination loop and health checks
      if (this.coordinationInterval) {
        clearInterval(this.coordinationInterval);
        this.coordinationInterval = null;
      }
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      // Stop worker manager
      await this.workerManager.stop();

      logger.info('Job coordinator stopped successfully');
    } catch (error) {
      logger.error('Error stopping job coordinator:', error);
      throw error;
    }
  }

  private startCoordinationLoop(): void {
    this.coordinationInterval = setInterval(
      () => this.coordinateJobs(),
      workerConfig.worker.backoffDelay
    );
  }

  private async coordinateJobs(): Promise<void> {
    try {
      // Update chain priorities
      await this.updateChainPriorities();

      // Get active chains based on priority
      const activeChains = this.chainPriorities
        .sort((a, b) => b.priority - a.priority)
        .slice(0, this.maxConcurrentChains)
        .map(chain => chain.chainId);

      // Process active chains
      for (const chainId of activeChains) {
        const progress = this.chainProgress.get(chainId);
        if (!progress) continue;

        // Update target block if needed
        const adapter = await this.adapterFactory.getAdapter(chainId);
        if (!adapter) continue;

        const latestBlock = await adapter.getLatestBlock();
        const confirmations = adapter.config.confirmations;
        progress.targetBlock = latestBlock - confirmations;

        // Skip if we're already at the target
        if (progress.lastProcessedBlock >= progress.targetBlock) {
          continue;
        }

        // Process any failed blocks first
        if (progress.failedBlocks.size > 0) {
          await this.retryFailedBlocks(chainId, progress);
          continue;
        }

        // Process next batch of blocks
        if (!progress.isProcessing) {
          await this.processNextBatch(chainId, progress);
        }
      }
    } catch (error) {
      logger.error('Error in job coordination loop:', error);
    }
  }

  private async updateChainPriorities(): Promise<void> {
    const now = Date.now();

    // Update processing rates and priorities
    for (const chain of this.chainPriorities) {
      const progress = this.chainProgress.get(chain.chainId);
      if (!progress) continue;

      const timeDiff = (now - progress.lastUpdateTime) / 1000; // Convert to seconds
      if (timeDiff > 0) {
        // Update processing rate (blocks/second)
        progress.processingRate = progress.totalProcessed / timeDiff;
        // Update error rate (errors/second)
        progress.errorRate = progress.totalFailed / timeDiff;

        // Calculate priority based on multiple factors
        const blocksBehind = progress.targetBlock - progress.lastProcessedBlock;
        const processingRateScore = Math.max(0, 1 - (progress.processingRate / this.targetProcessingRate));
        const errorRateScore = Math.max(0, 1 - progress.errorRate);
        const timeSinceLastProcess = (now - chain.lastProcessTime) / 1000;
        const timeScore = Math.min(1, timeSinceLastProcess / 60); // Normalize to 1 minute

        chain.priority = (
          blocksBehind * 0.4 + // Weight for blocks behind
          processingRateScore * 0.3 + // Weight for processing rate
          errorRateScore * 0.2 + // Weight for error rate
          timeScore * 0.1 // Weight for time since last process
        );

        // Reset counters
        progress.totalProcessed = 0;
        progress.totalFailed = 0;
        progress.lastUpdateTime = now;
      }
    }

    // Sort chains by priority
    this.chainPriorities.sort((a, b) => b.priority - a.priority);
  }

  private async retryFailedBlocks(chainId: string, progress: ChainProgress): Promise<void> {
    const maxRetries = workerConfig.worker.retryLimit;
    const now = Date.now();

    for (const blockNumber of progress.failedBlocks) {
      const retryCount = progress.retryCount.get(blockNumber) || 0;
      
      if (retryCount >= maxRetries) {
        logger.error(`Block ${blockNumber} on chain ${chainId} failed after ${maxRetries} retries`);
        progress.failedBlocks.delete(blockNumber);
        progress.retryCount.delete(blockNumber);
        progress.totalFailed++;
        continue;
      }

      try {
        const worker = await this.workerManager.getBlockWorker();
        await worker.addBlockJob({
          chainId,
          blockNumber,
          timestamp: Math.floor(now / 1000),
          priority: 1, // Higher priority for retries
        });

        progress.failedBlocks.delete(blockNumber);
        progress.retryCount.delete(blockNumber);
        progress.totalProcessed++;
        logger.info(`Retrying block ${blockNumber} on chain ${chainId} (attempt ${retryCount + 1})`);
      } catch (error) {
        logger.error(`Error retrying block ${blockNumber} on chain ${chainId}:`, error);
        progress.retryCount.set(blockNumber, retryCount + 1);
        progress.totalFailed++;
      }
    }
  }

  private async processNextBatch(chainId: string, progress: ChainProgress): Promise<void> {
    try {
      // Check backpressure
      if (progress.pendingBlocks.size >= this.maxPendingBlocks) {
        logger.warn(`Skipping batch for chain ${chainId} due to backpressure`);
        return;
      }

      progress.isProcessing = true;
      const now = Date.now();

      // Calculate optimal batch size
      const batchSize = this.calculateOptimalBatchSize(progress);
      const startBlock = progress.lastProcessedBlock + 1;
      const endBlock = Math.min(startBlock + batchSize - 1, progress.targetBlock);

      logger.info(`Processing blocks ${startBlock} -> ${endBlock} on chain ${chainId}`);

      // Create jobs for each block in the batch
      const jobs = [];
      for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
        const worker = await this.workerManager.getBlockWorker();
        const workerId = worker.getId();
        const health = this.workerHealth.get(workerId) || this.initializeWorkerHealth();
        
        // Update worker health
        health.lastActiveTime = now;
        health.activeJobs++;
        this.workerHealth.set(workerId, health);

        // Track pending block
        progress.pendingBlocks.add(blockNumber);

        jobs.push(
          worker.addBlockJob({
            chainId,
            blockNumber,
            timestamp: Math.floor(now / 1000),
            priority: 0,
          })
        );
      }

      // Wait for all jobs to be created
      await Promise.all(jobs);
      progress.isProcessing = false;

      // Update chain priority
      const chainPriority = this.chainPriorities.find(chain => chain.chainId === chainId);
      if (chainPriority) {
        chainPriority.lastProcessTime = now;
      }

      logger.info(`Successfully queued blocks ${startBlock} -> ${endBlock} on chain ${chainId}`);
    } catch (error) {
      logger.error(`Error processing batch for chain ${chainId}:`, error);
      progress.isProcessing = false;
      progress.totalFailed++;
    }
  }

  public async handleFailedBlock(chainId: string, blockNumber: number): Promise<void> {
    const progress = this.chainProgress.get(chainId);
    if (!progress) return;

    progress.failedBlocks.add(blockNumber);
    progress.retryCount.set(blockNumber, 0);
    progress.totalFailed++;
    logger.warn(`Added block ${blockNumber} on chain ${chainId} to retry queue`);
  }

  public getChainProgress(): Record<string, { processed: number; target: number; failed: number; rate: number }> {
    const progress: Record<string, { processed: number; target: number; failed: number; rate: number }> = {};
    
    for (const [chainId, chainProgress] of this.chainProgress.entries()) {
      progress[chainId] = {
        processed: chainProgress.lastProcessedBlock,
        target: chainProgress.targetBlock,
        failed: chainProgress.failedBlocks.size,
        rate: chainProgress.processingRate,
      };
    }

    return progress;
  }
} 