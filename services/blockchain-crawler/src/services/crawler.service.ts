import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { createLogger, Logger } from '../utils/logger';
import { WalletMonitoringService } from './wallet.service';
import { TokenService } from './token.service';
import { WalletRegistry } from '../models/wallet.registry';
import { ChainAdapterFactory } from '../adapters/chain.adapter.factory';

export class CrawlerService extends EventEmitter {
  private readonly walletMonitor: WalletMonitoringService;
  private readonly walletRegistry: WalletRegistry;
  private readonly logger: Logger;
  private readonly syncInterval: number = 1000 * 60 * 15; // 15 minutes
  private syncTimer?: NodeJS.Timeout;

  constructor(
    chainAdapterFactory: ChainAdapterFactory,
    redis: Redis,
    tokenService: TokenService
  ) {
    super();
    this.logger = createLogger('crawler-service');
    this.walletRegistry = new WalletRegistry(redis, this.logger);
    this.walletMonitor = new WalletMonitoringService(
      chainAdapterFactory,
      this.walletRegistry,
      tokenService,
      redis,
      this.logger
    );

    // Listen for wallet monitor events
    this.setupEventListeners();
  }

  /**
   * Start the crawler service
   */
  public async start(): Promise<void> {
    try {
      this.logger.info('Starting crawler service');

      // Start periodic sync
      this.startPeriodicSync();

      // Start monitoring all active wallets
      await this.monitorActiveWallets();

      this.logger.info('Crawler service started successfully');
    } catch (error) {
      this.logger.error(`Error starting crawler service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop the crawler service
   */
  public async stop(): Promise<void> {
    try {
      this.logger.info('Stopping crawler service');

      // Stop periodic sync
      if (this.syncTimer) {
        clearInterval(this.syncTimer);
      }

      // Get all active wallets
      const activeWallets = await this.walletRegistry.getAllActiveWallets();

      // Stop monitoring each wallet
      for (const wallet of activeWallets) {
        await this.walletMonitor.stopWalletMonitoring(wallet);
      }

      this.logger.info('Crawler service stopped successfully');
    } catch (error) {
      this.logger.error(`Error stopping crawler service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start monitoring a specific wallet
   */
  public async startWalletMonitoring(walletAddress: string, userId: string): Promise<void> {
    try {
      await this.walletMonitor.startWalletMonitoring(walletAddress, userId);
      this.logger.info(`Started monitoring wallet ${walletAddress} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error starting wallet monitoring: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop monitoring a specific wallet
   */
  public async stopWalletMonitoring(walletAddress: string): Promise<void> {
    try {
      await this.walletMonitor.stopWalletMonitoring(walletAddress);
      this.logger.info(`Stopped monitoring wallet ${walletAddress}`);
    } catch (error) {
      this.logger.error(`Error stopping wallet monitoring: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start periodic sync for inactive wallets
   */
  private startPeriodicSync(): void {
    this.syncTimer = setInterval(async () => {
      try {
        const outdatedWallets = await this.walletRegistry.getWalletsNeedingSync(this.syncInterval);
        
        for (const wallet of outdatedWallets) {
          const userId = await this.walletRegistry.getUserIdForWallet(wallet);
          if (userId) {
            await this.walletMonitor.startWalletMonitoring(wallet, userId);
          }
        }
      } catch (error) {
        this.logger.error(`Error in periodic sync: ${error.message}`);
      }
    }, this.syncInterval);
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
    this.walletMonitor.on('transfer', (event) => {
      this.emit('transfer', event);
    });

    this.walletMonitor.on('balanceChanged', (event) => {
      this.emit('balanceChanged', event);
    });
  }
} 