import { Job } from 'bull';
import { Contract } from 'ethers';
import { BaseWorker } from './base.worker';
import { ChainAdapterFactory } from '../../adapters/chain.adapter.factory';
import { TokenService } from '../token.service';
import { workerConfig } from '../../config/worker';
import { logger } from '../../utils/logger';

interface BlockJob {
  chainId: string;
  blockNumber: number;
  timestamp: number;
  priority?: number;
}

export class BlockWorker extends BaseWorker {
  private readonly tokenService: TokenService;
  private readonly adapterFactory: ChainAdapterFactory;

  constructor() {
    super(workerConfig.queues.blockProcessing, {
      concurrency: workerConfig.worker.concurrency,
    });
    
    this.tokenService = new TokenService();
    this.adapterFactory = ChainAdapterFactory.getInstance();
  }

  protected async processJob(job: Job<BlockJob>): Promise<void> {
    const { chainId, blockNumber, timestamp } = job.data;
    
    try {
      logger.info(`Processing block ${blockNumber} for chain ${chainId}`);
      
      const adapter = await this.adapterFactory.getAdapter(chainId);
      if (!adapter) {
        throw new Error(`No adapter found for chain ${chainId}`);
      }

      // Get block with transactions
      const block = await adapter.getBlock(blockNumber);
      if (!block) {
        throw new Error(`Block ${blockNumber} not found on chain ${chainId}`);
      }

      // Process all transactions in the block
      const txHashes = block.transactions;
      await Promise.all(
        txHashes.map(async (txHash) => {
          try {
            const tx = await adapter.getTransaction(txHash);
            if (tx) {
              await this.processTransaction(chainId, tx, timestamp);
            }
          } catch (error) {
            logger.error(`Error processing transaction ${txHash}:`, error);
            // Continue processing other transactions
          }
        })
      );

      logger.info(`Successfully processed block ${blockNumber} for chain ${chainId}`);
    } catch (error) {
      logger.error(`Failed to process block ${blockNumber} for chain ${chainId}:`, error);
      throw error;
    }
  }

  private async processTransaction(
    chainId: string,
    tx: any,
    timestamp: number
  ): Promise<void> {
    try {
      const adapter = await this.adapterFactory.getAdapter(chainId);
      const receipt = await adapter.provider.getTransactionReceipt(tx.hash);
      if (!receipt) return;

      // Process logs for token transfers and listings
      for (const log of receipt.logs) {
        try {
          const contract = new Contract(log.address, adapter.wyllohAbi, adapter.provider);
          const parsedLog = contract.interface.parseLog(log);
          if (!parsedLog) continue;

          switch (parsedLog.name) {
            case 'Transfer':
              const transferEvent = await adapter.processTransferEvent({
                ...parsedLog,
                transactionHash: tx.hash,
                blockNumber: tx.blockNumber,
                address: log.address,
              });
              await this.tokenService.handleTransfer(
                transferEvent.tokenId,
                transferEvent.tokenAddress,
                chainId,
                transferEvent.from,
                transferEvent.to,
                transferEvent.amount
              );
              break;

            case 'TokenListed':
              const listingEvent = await adapter.processListingEvent({
                ...parsedLog,
                transactionHash: tx.hash,
                blockNumber: tx.blockNumber,
                address: log.address,
              });
              await this.tokenService.handleListing(
                listingEvent.tokenId,
                listingEvent.tokenAddress,
                chainId,
                listingEvent.seller,
                listingEvent.price,
                listingEvent.quantity,
                listingEvent.transactionHash
              );
              break;

            case 'TokenPurchased':
              const purchaseEvent = await adapter.processPurchaseEvent({
                ...parsedLog,
                transactionHash: tx.hash,
                blockNumber: tx.blockNumber,
                address: log.address,
              });
              await this.tokenService.handlePurchase(
                purchaseEvent.tokenId,
                purchaseEvent.tokenAddress,
                chainId,
                purchaseEvent.buyer,
                purchaseEvent.seller,
                purchaseEvent.quantity,
                purchaseEvent.transactionHash
              );
              break;
          }
        } catch (error) {
          logger.error(`Error processing log in transaction ${tx.hash}:`, error);
          // Continue processing other logs
        }
      }
    } catch (error) {
      logger.error(`Error processing transaction ${tx.hash}:`, error);
      throw error;
    }
  }

  public async addBlockJob(data: BlockJob): Promise<Job<BlockJob>> {
    return this.addJob(data, {
      priority: data.priority || 0,
      timeout: workerConfig.worker.stalledTimeout,
      removeOnComplete: true,
      removeOnFail: false,
      attempts: workerConfig.worker.retryLimit,
      backoff: {
        type: 'exponential',
        delay: workerConfig.worker.backoffDelay,
      },
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize chain adapters before starting the worker
      await this.adapterFactory.initializeAllAdapters();
      logger.info('Chain adapters initialized successfully');

      // Start processing jobs
      await super.start();
    } catch (error) {
      logger.error('Failed to start block worker:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      await super.stop();
      logger.info('Block worker stopped successfully');
    } catch (error) {
      logger.error('Error stopping block worker:', error);
      throw error;
    }
  }
} 