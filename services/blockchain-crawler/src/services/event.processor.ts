import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { TokenService } from './token.service';
import { WalletRegistry } from '../models/wallet.registry';
import { Logger, createLogger } from '../utils/logger';
import { DatabaseService } from './database.service';

// Define event types
export interface TransferEvent {
  chain: string;
  from: string;
  to: string;
  tokenId: string;
  value: string;
  timestamp: number;
  transactionHash: string;
}

export interface BalanceEvent {
  chain: string;
  account: string;
  tokenId: string;
  newBalance: string;
  timestamp: number;
}

export interface LibraryUpdate {
  userId: string;
  walletAddress: string;
  tokenId: string;
  amount: string;
  chain: string;
  tokenInfo: any;
  timestamp: number;
}

export interface StoreUpdate {
  tokenId: string;
  from: string;
  to: string;
  amount: string;
  chain: string;
  tokenInfo: any;
  timestamp: number;
}

export interface ProcessingStatus {
  success: number;
  failures: number;
  pending: number;
  lastProcessedTimestamp: number;
}

/**
 * EventProcessor handles wallet and token events
 * for real-time updates and data synchronization
 */
export class EventProcessor extends EventEmitter {
  private readonly redis: Redis;
  private readonly tokenService: TokenService;
  private readonly walletRegistry: WalletRegistry;
  private readonly databaseService: DatabaseService;
  private readonly logger: Logger;
  private readonly processingStatus: ProcessingStatus;
  private readonly retryLimit: number = 3;
  private readonly retryDelay: number = 5000; // 5 seconds

  constructor(
    redis: Redis,
    tokenService: TokenService,
    walletRegistry: WalletRegistry,
    databaseService: DatabaseService
  ) {
    super();
    this.redis = redis;
    this.tokenService = tokenService;
    this.walletRegistry = walletRegistry;
    this.databaseService = databaseService;
    this.logger = createLogger('event-processor');
    this.processingStatus = {
      success: 0,
      failures: 0,
      pending: 0,
      lastProcessedTimestamp: Date.now()
    };

    // Set up Redis subscription for library and store updates
    this.setupRedisSubscriptions();
  }

  /**
   * Setup Redis subscriptions for library and store updates
   */
  private setupRedisSubscriptions(): void {
    const subscriber = this.redis.duplicate();
    
    subscriber.subscribe('library:update', 'store:update', (err) => {
      if (err) {
        this.logger.error(`Error subscribing to Redis channels: ${err.message}`);
        return;
      }
      this.logger.info('Subscribed to library and store update channels');
    });

    subscriber.on('message', async (channel, message) => {
      try {
        if (channel === 'library:update') {
          const update = JSON.parse(message) as LibraryUpdate;
          await this.processLibraryUpdate(update);
        } else if (channel === 'store:update') {
          const update = JSON.parse(message) as StoreUpdate;
          await this.processStoreUpdate(update);
        }
      } catch (error) {
        this.logger.error(`Error processing ${channel} message: ${error.message}`);
      }
    });
  }

  /**
   * Process a library update event
   */
  private async processLibraryUpdate(update: LibraryUpdate): Promise<void> {
    try {
      this.processingStatus.pending++;
      
      // Log the update
      this.logger.info(`Processing library update for user ${update.userId}, token ${update.tokenId}`);
      
      // Process token ownership update in database
      await this.tokenService.handleTransfer(
        update.tokenId,
        update.tokenInfo?.tokenAddress || 'unknown',
        update.chain,
        update.walletAddress === update.from ? '0x0000000000000000000000000000000000000000' : update.from,
        update.walletAddress,
        parseInt(update.amount)
      );
      
      // Store wallet activity in database
      await this.databaseService.storeWalletActivity({
        walletAddress: update.walletAddress,
        userId: update.userId,
        chain: update.chain,
        activityType: 'receive',
        timestamp: update.timestamp || Date.now(),
        transactionHash: update.tokenInfo?.transactionHash || 'unknown',
        tokenId: update.tokenId,
        tokenAddress: update.tokenInfo?.tokenAddress || 'unknown',
        value: update.amount,
        status: 'confirmed',
        metadata: update.tokenInfo
      });
      
      // Emit event for WebSocket notifications
      this.emit('libraryUpdated', {
        userId: update.userId,
        tokenId: update.tokenId,
        change: 'added',
        timestamp: update.timestamp || Date.now()
      });
      
      this.processingStatus.success++;
      this.processingStatus.lastProcessedTimestamp = Date.now();
    } catch (error) {
      this.processingStatus.failures++;
      this.logger.error(`Failed to process library update: ${error.message}`);
      
      // Implement retry mechanism for failed updates
      await this.retryLibraryUpdate(update, 0);
    } finally {
      this.processingStatus.pending--;
    }
  }

  /**
   * Retry a failed library update
   */
  private async retryLibraryUpdate(update: LibraryUpdate, retryCount: number): Promise<void> {
    if (retryCount >= this.retryLimit) {
      this.logger.error(`Max retries reached for library update: ${update.tokenId}`);
      
      // Store failed updates for later recovery
      await this.storeFailed('library:failed', update);
      return;
    }
    
    this.logger.info(`Retrying library update (${retryCount + 1}/${this.retryLimit})`);
    
    // Exponential backoff
    const delay = this.retryDelay * Math.pow(2, retryCount);
    
    setTimeout(async () => {
      try {
        await this.processLibraryUpdate(update);
      } catch (error) {
        await this.retryLibraryUpdate(update, retryCount + 1);
      }
    }, delay);
  }

  /**
   * Process a store update event
   */
  private async processStoreUpdate(update: StoreUpdate): Promise<void> {
    try {
      this.processingStatus.pending++;
      
      // Log the update
      this.logger.info(`Processing store update for token ${update.tokenId}`);
      
      // Check if this is a listing or purchase by analyzing tokenInfo
      if (update.tokenInfo?.forSale) {
        // Handle marketplace listing
        await this.handleMarketplaceListing(update);
      } else {
        // Handle normal token transfer
        await this.handleTokenTransfer(update);
      }
      
      // Store transaction in database
      await this.databaseService.storeTransaction({
        transactionHash: update.tokenInfo?.transactionHash || 'unknown',
        chain: update.chain,
        blockNumber: update.tokenInfo?.blockNumber || 0,
        timestamp: update.timestamp || Date.now(),
        from: update.from,
        to: update.to,
        tokenId: update.tokenId,
        tokenAddress: update.tokenInfo?.tokenAddress || 'unknown',
        value: update.amount,
        eventType: update.tokenInfo?.forSale ? 'list' : 'transfer',
        status: 'confirmed',
        metadata: update.tokenInfo,
        processingStatus: 'processed'
      });
      
      // Emit event for WebSocket notifications
      this.emit('storeUpdated', {
        tokenId: update.tokenId,
        from: update.from,
        to: update.to,
        timestamp: update.timestamp || Date.now()
      });
      
      this.processingStatus.success++;
      this.processingStatus.lastProcessedTimestamp = Date.now();
    } catch (error) {
      this.processingStatus.failures++;
      this.logger.error(`Failed to process store update: ${error.message}`);
      
      // Implement retry mechanism for failed updates
      await this.retryStoreUpdate(update, 0);
    } finally {
      this.processingStatus.pending--;
    }
  }

  /**
   * Retry a failed store update
   */
  private async retryStoreUpdate(update: StoreUpdate, retryCount: number): Promise<void> {
    if (retryCount >= this.retryLimit) {
      this.logger.error(`Max retries reached for store update: ${update.tokenId}`);
      
      // Store failed updates for later recovery
      await this.storeFailed('store:failed', update);
      return;
    }
    
    this.logger.info(`Retrying store update (${retryCount + 1}/${this.retryLimit})`);
    
    // Exponential backoff
    const delay = this.retryDelay * Math.pow(2, retryCount);
    
    setTimeout(async () => {
      try {
        await this.processStoreUpdate(update);
      } catch (error) {
        await this.retryStoreUpdate(update, retryCount + 1);
      }
    }, delay);
  }

  /**
   * Handle marketplace listing
   */
  private async handleMarketplaceListing(update: StoreUpdate): Promise<void> {
    // Handle marketplace listing
    this.logger.info(`Handling marketplace listing for token ${update.tokenId}`);
    
    // This would integrate with your marketplace service
    // For now, we'll just log it
    this.logger.info(`Token ${update.tokenId} listed in marketplace`);
    
    // Store wallet activity for the seller
    await this.databaseService.storeWalletActivity({
      walletAddress: update.from,
      chain: update.chain,
      activityType: 'listing',
      timestamp: update.timestamp || Date.now(),
      transactionHash: update.tokenInfo?.transactionHash || 'unknown',
      tokenId: update.tokenId,
      tokenAddress: update.tokenInfo?.tokenAddress || 'unknown',
      value: update.amount,
      status: 'confirmed',
      metadata: {
        ...update.tokenInfo,
        price: update.tokenInfo?.price || '0'
      }
    });
  }

  /**
   * Handle normal token transfer
   */
  private async handleTokenTransfer(update: StoreUpdate): Promise<void> {
    // Handle normal token transfer
    this.logger.info(`Handling token transfer: ${update.tokenId} from ${update.from} to ${update.to}`);
    
    // Update token ownership in database
    await this.tokenService.handleTransfer(
      update.tokenId,
      update.tokenInfo?.tokenAddress || 'unknown',
      update.chain,
      update.from,
      update.to,
      parseInt(update.amount)
    );
    
    // Store wallet activity for sender
    await this.databaseService.storeWalletActivity({
      walletAddress: update.from,
      chain: update.chain,
      activityType: 'send',
      timestamp: update.timestamp || Date.now(),
      transactionHash: update.tokenInfo?.transactionHash || 'unknown',
      tokenId: update.tokenId,
      tokenAddress: update.tokenInfo?.tokenAddress || 'unknown',
      value: update.amount,
      counterpartyAddress: update.to,
      status: 'confirmed',
      metadata: update.tokenInfo
    });
    
    // Store wallet activity for receiver
    const userId = await this.walletRegistry.getUserIdForWallet(update.to);
    await this.databaseService.storeWalletActivity({
      walletAddress: update.to,
      userId,
      chain: update.chain,
      activityType: 'receive',
      timestamp: update.timestamp || Date.now(),
      transactionHash: update.tokenInfo?.transactionHash || 'unknown',
      tokenId: update.tokenId,
      tokenAddress: update.tokenInfo?.tokenAddress || 'unknown',
      value: update.amount,
      counterpartyAddress: update.from,
      status: 'confirmed',
      metadata: update.tokenInfo
    });
  }

  /**
   * Store failed updates for later recovery
   */
  private async storeFailed(key: string, data: any): Promise<void> {
    try {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await this.redis.hset(key, id, JSON.stringify(data));
      this.logger.info(`Stored failed update in ${key} with ID ${id}`);
    } catch (error) {
      this.logger.error(`Failed to store failed update: ${error.message}`);
    }
  }

  /**
   * Process a transfer event
   */
  public async processTransferEvent(event: TransferEvent): Promise<void> {
    try {
      this.logger.info(`Processing transfer event: Token ${event.tokenId} from ${event.from} to ${event.to}`);
      
      // Store transaction in database
      await this.databaseService.storeTransaction({
        transactionHash: event.transactionHash,
        chain: event.chain,
        blockNumber: 0, // Would be populated in real implementation
        timestamp: event.timestamp,
        from: event.from,
        to: event.to,
        tokenId: event.tokenId,
        value: event.value,
        eventType: 'transfer',
        status: 'confirmed',
        processingStatus: 'new'
      });
      
      // Determine the user ID for the recipient wallet
      const toUserId = await this.walletRegistry.getUserIdForWallet(event.to);
      
      if (toUserId) {
        // If recipient is a registered user, update their library
        const tokenInfo = await this.tokenService.getTokenInfo(event.tokenId, event.chain);
        
        const libraryUpdate: LibraryUpdate = {
          userId: toUserId,
          walletAddress: event.to,
          tokenId: event.tokenId,
          amount: event.value,
          chain: event.chain,
          tokenInfo,
          timestamp: event.timestamp
        };
        
        await this.processLibraryUpdate(libraryUpdate);
      }
      
      // Always update the global store
      const tokenInfo = await this.tokenService.getTokenInfo(event.tokenId, event.chain);
      
      const storeUpdate: StoreUpdate = {
        tokenId: event.tokenId,
        from: event.from,
        to: event.to,
        amount: event.value,
        chain: event.chain,
        tokenInfo,
        timestamp: event.timestamp
      };
      
      await this.processStoreUpdate(storeUpdate);
      
    } catch (error) {
      this.logger.error(`Error processing transfer event: ${error.message}`);
    }
  }

  /**
   * Process a balance change event
   */
  public async processBalanceEvent(event: BalanceEvent): Promise<void> {
    try {
      this.logger.info(`Processing balance event: Account ${event.account}, Token ${event.tokenId}`);
      
      // Determine the user ID for the wallet
      const userId = await this.walletRegistry.getUserIdForWallet(event.account);
      
      if (userId) {
        // If wallet belongs to a registered user, update their library
        const tokenInfo = await this.tokenService.getTokenInfo(event.tokenId, event.chain);
        
        // Store wallet activity
        await this.databaseService.storeWalletActivity({
          walletAddress: event.account,
          userId,
          chain: event.chain,
          activityType: 'receive', // This is a simplification
          timestamp: event.timestamp,
          transactionHash: 'balance-update', // Not a real transaction hash
          tokenId: event.tokenId,
          tokenAddress: tokenInfo?.tokenAddress || 'unknown',
          value: event.newBalance,
          status: 'confirmed',
          metadata: tokenInfo
        });
        
        const libraryUpdate: LibraryUpdate = {
          userId,
          walletAddress: event.account,
          tokenId: event.tokenId,
          amount: event.newBalance,
          chain: event.chain,
          tokenInfo,
          timestamp: event.timestamp
        };
        
        await this.processLibraryUpdate(libraryUpdate);
      }
    } catch (error) {
      this.logger.error(`Error processing balance event: ${error.message}`);
    }
  }

  /**
   * Get event processing status
   */
  public getStatus(): ProcessingStatus {
    return { ...this.processingStatus };
  }

  /**
   * Process failed updates
   */
  public async processFailedUpdates(): Promise<void> {
    try {
      // Process failed library updates
      const libraryFailedKeys = await this.redis.hkeys('library:failed');
      this.logger.info(`Processing ${libraryFailedKeys.length} failed library updates`);
      
      for (const key of libraryFailedKeys) {
        const failedUpdate = await this.redis.hget('library:failed', key);
        if (failedUpdate) {
          try {
            await this.processLibraryUpdate(JSON.parse(failedUpdate));
            await this.redis.hdel('library:failed', key);
          } catch (error) {
            this.logger.error(`Failed to process failed library update ${key}: ${error.message}`);
          }
        }
      }
      
      // Process failed store updates
      const storeFailedKeys = await this.redis.hkeys('store:failed');
      this.logger.info(`Processing ${storeFailedKeys.length} failed store updates`);
      
      for (const key of storeFailedKeys) {
        const failedUpdate = await this.redis.hget('store:failed', key);
        if (failedUpdate) {
          try {
            await this.processStoreUpdate(JSON.parse(failedUpdate));
            await this.redis.hdel('store:failed', key);
          } catch (error) {
            this.logger.error(`Failed to process failed store update ${key}: ${error.message}`);
          }
        }
      }
      
      // Process pending database transactions
      this.logger.info('Processing pending database transactions');
      const pendingTransactions = await this.databaseService.getPendingTransactions();
      this.logger.info(`Found ${pendingTransactions.length} pending transactions`);
      
      for (const transaction of pendingTransactions) {
        try {
          // Create a transfer event from the transaction
          const transferEvent: TransferEvent = {
            chain: transaction.chain,
            from: transaction.from,
            to: transaction.to,
            tokenId: transaction.tokenId || '0',
            value: transaction.value || '0',
            timestamp: transaction.timestamp,
            transactionHash: transaction.transactionHash
          };
          
          // Process the transfer event
          await this.processTransferEvent(transferEvent);
          
          // Update the transaction status
          transaction.processingStatus = 'processed';
          await transaction.save();
          
          this.logger.info(`Successfully processed pending transaction ${transaction.transactionHash}`);
        } catch (error) {
          // Update processing attempts
          transaction.processingAttempts += 1;
          transaction.processingError = error.message;
          
          if (transaction.processingAttempts >= this.retryLimit) {
            transaction.processingStatus = 'failed';
          } else {
            transaction.processingStatus = 'retrying';
          }
          
          await transaction.save();
          
          this.logger.error(`Error processing pending transaction ${transaction.transactionHash}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error processing failed updates: ${error.message}`);
    }
  }
} 