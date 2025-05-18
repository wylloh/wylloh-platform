import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { createLogger, Logger } from '../utils/logger';
import { WalletMonitoringService } from './wallet.service';
import { TokenService } from './token.service';
import { WalletRegistry } from '../models/wallet.registry';
import { ChainAdapterFactory } from '../adapters/chain.adapter.factory';
import { EventProcessor } from './event.processor';
import { DatabaseService } from './database.service';

export class CrawlerService extends EventEmitter {
  private readonly walletMonitor: WalletMonitoringService;
  private readonly walletRegistry: WalletRegistry;
  private readonly eventProcessor: EventProcessor;
  private readonly databaseService: DatabaseService;
  private readonly logger: Logger;
  private readonly syncInterval: number = 1000 * 60 * 15; // 15 minutes
  private syncTimer?: NodeJS.Timeout;

  constructor(
    chainAdapterFactory: ChainAdapterFactory,
    redis: Redis,
    tokenService: TokenService,
    databaseService: DatabaseService,
    mongoDbUri: string
  ) {
    super();
    this.logger = createLogger('crawler-service');
    this.walletRegistry = new WalletRegistry(redis, this.logger);
    this.databaseService = databaseService;
    this.walletMonitor = new WalletMonitoringService(
      chainAdapterFactory,
      this.walletRegistry,
      tokenService,
      redis,
      this.logger
    );
    this.eventProcessor = new EventProcessor(
      redis,
      tokenService,
      this.walletRegistry,
      this.databaseService
    );

    // Listen for wallet monitor events
    this.setupEventListeners();
  }

  /**
   * Start monitoring service
   */
  public async start(): Promise<void> {
    try {
      this.logger.info('Starting wallet monitoring service');
      
      // Initialize database connection
      this.logger.info('Initializing database connection');
      
      // Start monitoring active wallets
      await this.monitorActiveWallets();
      
      // Setup periodic sync for inactive wallets
      this.startPeriodicSync();
      
      // Process any failed events
      await this.eventProcessor.processFailedUpdates();
      
      this.logger.info('Wallet monitoring service started successfully');
    } catch (error) {
      this.logger.error(`Error starting monitoring service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop monitoring service
   */
  public async stop(): Promise<void> {
    try {
      this.logger.info('Stopping wallet monitoring service');
      
      // Clear sync timer
      if (this.syncTimer) {
        clearInterval(this.syncTimer);
      }
      
      // Close database connection
      await this.databaseService.close();
      
      this.logger.info('Wallet monitoring service stopped successfully');
    } catch (error) {
      this.logger.error(`Error stopping monitoring service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Register a wallet for monitoring
   */
  public async registerWallet(walletAddress: string, userId: string): Promise<void> {
    try {
      this.logger.info(`Registering wallet ${walletAddress} for user ${userId}`);
      await this.walletMonitor.startWalletMonitoring(walletAddress, userId);
    } catch (error) {
      this.logger.error(`Error registering wallet: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deregister a wallet from monitoring
   */
  public async deregisterWallet(walletAddress: string): Promise<void> {
    try {
      this.logger.info(`Deregistering wallet ${walletAddress}`);
      await this.walletMonitor.stopWalletMonitoring(walletAddress);
    } catch (error) {
      this.logger.error(`Error deregistering wallet: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start periodic sync for inactive wallets
   */
  private startPeriodicSync(): void {
    this.syncTimer = setInterval(async () => {
      try {
        await this.syncInactiveWallets();
      } catch (error) {
        this.logger.error(`Error in periodic sync: ${error.message}`);
      }
    }, this.syncInterval);
  }

  /**
   * Sync inactive wallets
   */
  private async syncInactiveWallets(): Promise<void> {
    try {
      this.logger.info('Syncing inactive wallets');
      
      const walletsToSync = await this.walletRegistry.getWalletsNeedingSync(this.syncInterval);
      
      this.logger.info(`Found ${walletsToSync.length} wallets needing sync`);
      
      for (const wallet of walletsToSync) {
        try {
          const userId = await this.walletRegistry.getUserIdForWallet(wallet);
          if (userId) {
            this.logger.info(`Syncing wallet ${wallet} for user ${userId}`);
            // Perform a full sync of the wallet's tokens
            await this.syncWalletData(wallet, userId);
          }
        } catch (error) {
          this.logger.error(`Error syncing wallet ${wallet}: ${error.message}`);
        }
      }
      
      this.logger.info('Finished syncing inactive wallets');
    } catch (error) {
      this.logger.error(`Error syncing inactive wallets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync wallet data for a specific wallet
   */
  private async syncWalletData(walletAddress: string, userId: string): Promise<void> {
    // This would typically query the blockchain for the wallet's current tokens
    // and update the database accordingly
    
    // For now, just update the sync timestamp
    await this.walletRegistry.updateLastSyncTimestamp(walletAddress, Date.now());
  }

  /**
   * Monitor all currently active wallets
   */
  private async monitorActiveWallets(): Promise<void> {
    try {
      const activeWallets = await this.walletRegistry.getAllActiveWallets();
      
      for (const wallet of activeWallets) {
        const userId = await this.walletRegistry.getUserIdForWallet(wallet);
        if (userId) {
          await this.walletMonitor.startWalletMonitoring(wallet, userId);
        }
      }
    } catch (error) {
      this.logger.error(`Error monitoring active wallets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Setup event listeners for wallet monitor events
   */
  private setupEventListeners(): void {
    // Listen for transfer events
    this.walletMonitor.on('transfer', (event) => {
      this.eventProcessor.processTransferEvent(event)
        .catch(error => this.logger.error(`Error forwarding transfer event: ${error.message}`));
      
      // Forward the event to external listeners
      this.emit('transfer', event);
    });

    // Listen for balance change events
    this.walletMonitor.on('balanceChanged', (event) => {
      this.eventProcessor.processBalanceEvent(event)
        .catch(error => this.logger.error(`Error forwarding balance event: ${error.message}`));
      
      // Forward the event to external listeners
      this.emit('balanceChanged', event);
    });
    
    // Listen for library update events
    this.eventProcessor.on('libraryUpdated', (event) => {
      // Forward the event to external listeners
      this.emit('libraryUpdated', event);
    });
    
    // Listen for store update events
    this.eventProcessor.on('storeUpdated', (event) => {
      // Forward the event to external listeners
      this.emit('storeUpdated', event);
    });
  }
  
  /**
   * Get health status of the crawler service
   */
  public getHealthStatus(): any {
    const processingStatus = this.eventProcessor.getStatus();
    
    return {
      status: 'healthy',
      activeWallets: 0, // This would be populated by calling walletRegistry.getActiveWalletCount()
      eventProcessing: processingStatus,
      lastSyncTime: new Date(processingStatus.lastProcessedTimestamp).toISOString(),
      dbConnection: this.databaseService.isConnected ? 'connected' : 'disconnected'
    };
  }
} 