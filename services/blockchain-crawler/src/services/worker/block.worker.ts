import { EventEmitter } from 'events';
import { ChainAdapterFactory } from '../../adapters/chain.adapter.factory';
import { TokenService } from '../token.service';
import { workerConfig } from '../../config/worker';
import { logger } from '../../utils/logger';
import { TransactionResponse, Block } from 'ethers';

interface BlockJob {
  chainId: string;
  blockNumber: number;
  timestamp: number;
  priority?: number;
}

interface JobResult {
  success: boolean;
  error?: Error;
}

interface BlockWithTransactions extends Block {
  transactions: Array<TransactionResponse | string>;
}

export class BlockWorker extends EventEmitter {
  private readonly workerId: string;
  private readonly tokenService: TokenService;
  private readonly adapterFactory: ChainAdapterFactory;

  constructor(workerId: string) {
    super();
    this.workerId = workerId;
    this.tokenService = new TokenService();
    this.adapterFactory = ChainAdapterFactory.getInstance();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Event handlers will be set up by the worker manager
  }

  public getId(): string {
    return this.workerId;
  }

  public async start(): Promise<void> {
    try {
      // Initialize chain adapters before starting the worker
      await this.adapterFactory.initializeAllAdapters();
      logger.info(`Worker ${this.workerId} started`);
    } catch (error) {
      logger.error(`Failed to start worker ${this.workerId}:`, error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      logger.info(`Worker ${this.workerId} stopped`);
    } catch (error) {
      logger.error(`Failed to stop worker ${this.workerId}:`, error);
      throw error;
    }
  }

  public async addBlockJob(job: BlockJob): Promise<void> {
    try {
      await this.processBlock(job);
    } catch (error) {
      logger.error(`Failed to process block in worker ${this.workerId}:`, error);
      throw error;
    }
  }

  private async processBlock(job: BlockJob): Promise<JobResult> {
    try {
      const adapter = await this.adapterFactory.getAdapter(job.chainId);
      if (!adapter) {
        throw new Error(`No adapter found for chain ${job.chainId}`);
      }

      const block = await adapter.getBlock(job.blockNumber);
      if (!block) {
        throw new Error(`Block ${job.blockNumber} not found on chain ${job.chainId}`);
      }

      // Process transactions in the block
      const blockWithTx = block as BlockWithTransactions;
      for (const tx of blockWithTx.transactions || []) {
        const txHash = typeof tx === 'string' ? tx : tx.hash;
        const transaction = await adapter.getTransaction(txHash);
        if (!transaction) continue;

        // Process transaction events
        // This is a placeholder for now - will be implemented in the next phase
        await this.processTransaction(transaction, adapter);
      }

      return { success: true };
    } catch (error) {
      logger.error(`Error processing block in worker ${this.workerId}:`, error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  private async processTransaction(transaction: TransactionResponse, adapter: any): Promise<void> {
    // Transaction processing logic will be implemented in the next phase
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  public async getQueueMetrics(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    // This is a placeholder until we implement the actual queue
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }
} 