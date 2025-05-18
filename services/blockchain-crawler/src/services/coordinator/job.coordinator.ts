import { ChainAdapterFactory } from '../../adapters/chain.adapter.factory';
import { BlockWorker } from '../worker/block.worker';
import { WorkerManager } from '../worker/worker.manager';
import { workerConfig } from '../../config/worker';
import { logger } from '../../utils/logger';

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
}

interface ChainPriority {
  chainId: string;
  priority: number;
  lastProcessTime: number;
}

export class JobCoordinator {
  private static instance: JobCoordinator;
  private readonly chainProgress: Map<string, ChainProgress> = new Map();
  private readonly adapterFactory: ChainAdapterFactory;
  private readonly workerManager: WorkerManager;
  private coordinationInterval: NodeJS.Timeout | null = null;
  private chainPriorities: ChainPriority[] = [];
  private readonly maxConcurrentChains: number;
  private readonly maxBlocksPerBatch: number;
  private readonly minBlocksPerBatch: number;
  private readonly targetProcessingRate: number;

  private constructor() {
    this.adapterFactory = ChainAdapterFactory.getInstance();
    this.workerManager = new WorkerManager();
    this.maxConcurrentChains = Math.max(1, Math.floor(workerConfig.worker.concurrency / 2));
    this.maxBlocksPerBatch = workerConfig.worker.concurrency * 2;
    this.minBlocksPerBatch = Math.max(1, Math.floor(workerConfig.worker.concurrency / 2));
    this.targetProcessingRate = 10; // Target blocks per second
  }

  public static getInstance(): JobCoordinator {
    if (!JobCoordinator.instance) {
      JobCoordinator.instance = new JobCoordinator();
    }
    return JobCoordinator.instance;
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
        });

        this.chainPriorities.push({
          chainId,
          priority: 1,
          lastProcessTime: Date.now(),
        });

        logger.info(`Initialized chain ${chainId} progress: ${startBlock} -> ${latestBlock}`);
      }

      // Start the worker manager
      await this.workerManager.start();

      // Start coordination loop
      this.startCoordinationLoop();

      logger.info('Job coordinator started successfully');
    } catch (error) {
      logger.error('Failed to start job coordinator:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      logger.info('Stopping job coordinator...');

      // Stop coordination loop
      if (this.coordinationInterval) {
        clearInterval(this.coordinationInterval);
        this.coordinationInterval = null;
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
      progress.isProcessing = true;
      const now = Date.now();

      // Calculate optimal batch size based on processing rate
      let batchSize = Math.floor(progress.processingRate * workerConfig.worker.backoffDelay / 1000);
      batchSize = Math.max(this.minBlocksPerBatch, Math.min(this.maxBlocksPerBatch, batchSize));

      const startBlock = progress.lastProcessedBlock + 1;
      const endBlock = Math.min(startBlock + batchSize - 1, progress.targetBlock);

      logger.info(`Processing blocks ${startBlock} -> ${endBlock} on chain ${chainId}`);

      // Create jobs for each block in the batch
      const jobs = [];
      for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
        const worker = await this.workerManager.getBlockWorker();
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
      progress.lastProcessedBlock = endBlock;
      progress.isProcessing = false;
      progress.totalProcessed += (endBlock - startBlock + 1);

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