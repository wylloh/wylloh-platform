import { Router, Request, Response } from 'express';
import { CrawlerService } from '../services/crawler.service';
import { WalletRegistry } from '../models/wallet.registry';
import { createLogger } from '../utils/logger';
import { body, validationResult } from 'express-validator';

/**
 * Wallet controller for managing wallet monitoring
 */
export class WalletController {
  private readonly router: Router;
  private readonly crawlerService: CrawlerService;
  private readonly walletRegistry: WalletRegistry;
  private readonly logger = createLogger('wallet-controller');

  constructor(crawlerService: CrawlerService, walletRegistry: WalletRegistry) {
    this.router = Router();
    this.crawlerService = crawlerService;
    this.walletRegistry = walletRegistry;
    this.setupRoutes();
  }

  /**
   * Setup controller routes
   */
  private setupRoutes(): void {
    // Get all wallets for a user
    this.router.get('/user/:userId/wallets', this.getWalletsForUser.bind(this));
    
    // Register a wallet for monitoring
    this.router.post(
      '/register',
      [
        body('walletAddress').isString().isLength({ min: 42, max: 42 }).withMessage('Valid wallet address is required'),
        body('userId').isString().notEmpty().withMessage('User ID is required')
      ],
      this.registerWallet.bind(this)
    );
    
    // Deregister a wallet from monitoring
    this.router.post(
      '/deregister',
      [
        body('walletAddress').isString().isLength({ min: 42, max: 42 }).withMessage('Valid wallet address is required')
      ],
      this.deregisterWallet.bind(this)
    );
    
    // Get wallet status
    this.router.get('/status/:walletAddress', this.getWalletStatus.bind(this));
    
    // Force sync for a wallet
    this.router.post('/sync/:walletAddress', this.syncWallet.bind(this));
    
    // Get monitoring health status
    this.router.get('/health', this.getHealthStatus.bind(this));
  }

  /**
   * Get the Express router
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Get all wallets for a user
   */
  private async getWalletsForUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      this.logger.info(`Getting wallets for user ${userId}`);
      
      const wallets = await this.walletRegistry.getWalletsForUser(userId);
      
      res.json({
        userId,
        wallets
      });
    } catch (error) {
      this.logger.error(`Error getting wallets for user: ${error.message}`);
      res.status(500).json({
        error: 'Failed to get wallets for user',
        message: error.message
      });
    }
  }

  /**
   * Register a wallet for monitoring
   */
  private async registerWallet(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const { walletAddress, userId } = req.body;
      
      this.logger.info(`Registering wallet ${walletAddress} for user ${userId}`);
      
      await this.crawlerService.registerWallet(walletAddress, userId);
      
      res.json({
        success: true,
        message: `Wallet ${walletAddress} registered for monitoring`,
        walletAddress,
        userId
      });
    } catch (error) {
      this.logger.error(`Error registering wallet: ${error.message}`);
      
      // Check if wallet is already registered to a different user
      if (error.message.includes('already registered')) {
        res.status(409).json({
          error: 'Wallet already registered',
          message: error.message
        });
        return;
      }
      
      res.status(500).json({
        error: 'Failed to register wallet',
        message: error.message
      });
    }
  }

  /**
   * Deregister a wallet from monitoring
   */
  private async deregisterWallet(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const { walletAddress } = req.body;
      
      this.logger.info(`Deregistering wallet ${walletAddress}`);
      
      await this.crawlerService.deregisterWallet(walletAddress);
      
      res.json({
        success: true,
        message: `Wallet ${walletAddress} deregistered from monitoring`,
        walletAddress
      });
    } catch (error) {
      this.logger.error(`Error deregistering wallet: ${error.message}`);
      res.status(500).json({
        error: 'Failed to deregister wallet',
        message: error.message
      });
    }
  }

  /**
   * Get wallet status
   */
  private async getWalletStatus(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;
      
      this.logger.info(`Getting status for wallet ${walletAddress}`);
      
      // Verify wallet exists
      const userId = await this.walletRegistry.getUserIdForWallet(walletAddress);
      if (!userId) {
        res.status(404).json({
          error: 'Wallet not found',
          message: `Wallet ${walletAddress} is not registered for monitoring`
        });
        return;
      }
      
      // Get last sync timestamp
      const lastSyncTimestamp = await this.walletRegistry.getLastSyncTimestamp(walletAddress);
      
      res.json({
        walletAddress,
        userId,
        isActive: true,
        lastSyncTimestamp,
        lastSyncTimeFormatted: new Date(lastSyncTimestamp).toISOString()
      });
    } catch (error) {
      this.logger.error(`Error getting wallet status: ${error.message}`);
      res.status(500).json({
        error: 'Failed to get wallet status',
        message: error.message
      });
    }
  }

  /**
   * Force sync for a wallet
   */
  private async syncWallet(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;
      
      this.logger.info(`Forcing sync for wallet ${walletAddress}`);
      
      // Verify wallet exists
      const userId = await this.walletRegistry.getUserIdForWallet(walletAddress);
      if (!userId) {
        res.status(404).json({
          error: 'Wallet not found',
          message: `Wallet ${walletAddress} is not registered for monitoring`
        });
        return;
      }
      
      // Force sync by restarting monitoring for the wallet
      await this.crawlerService.registerWallet(walletAddress, userId);
      
      // Update last sync timestamp
      const currentTimestamp = Date.now();
      await this.walletRegistry.updateLastSyncTimestamp(walletAddress, currentTimestamp);
      
      res.json({
        success: true,
        message: `Wallet ${walletAddress} sync initiated`,
        walletAddress,
        userId,
        syncTimestamp: currentTimestamp
      });
    } catch (error) {
      this.logger.error(`Error syncing wallet: ${error.message}`);
      res.status(500).json({
        error: 'Failed to sync wallet',
        message: error.message
      });
    }
  }

  /**
   * Get monitoring health status
   */
  private async getHealthStatus(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('Getting wallet monitoring health status');
      
      const healthStatus = this.crawlerService.getHealthStatus();
      
      // Get active wallet count
      const activeWallets = await this.walletRegistry.getAllActiveWallets();
      
      res.json({
        ...healthStatus,
        activeWalletCount: activeWallets.length,
        timestamp: Date.now()
      });
    } catch (error) {
      this.logger.error(`Error getting health status: ${error.message}`);
      res.status(500).json({
        error: 'Failed to get health status',
        message: error.message
      });
    }
  }
} 