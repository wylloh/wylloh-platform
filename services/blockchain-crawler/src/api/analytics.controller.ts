import { Router, Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { createLogger } from '../utils/logger';
import { query, param, validationResult } from 'express-validator';

/**
 * Analytics controller for providing blockchain analytics data
 */
export class AnalyticsController {
  private readonly router: Router;
  private readonly analyticsService: AnalyticsService;
  private readonly logger = createLogger('analytics-controller');

  constructor(analyticsService: AnalyticsService) {
    this.router = Router();
    this.analyticsService = analyticsService;
    this.setupRoutes();
  }

  /**
   * Setup controller routes
   */
  private setupRoutes(): void {
    // Get wallet transaction analytics
    this.router.get(
      '/wallet/:walletAddress/transactions',
      [
        param('walletAddress').isString().isLength({ min: 42, max: 42 }).withMessage('Valid wallet address is required'),
        query('timeRange').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid time range'),
        query('startTime').optional().isNumeric().withMessage('Start time must be a number'),
        query('endTime').optional().isNumeric().withMessage('End time must be a number')
      ],
      this.getWalletTransactionAnalytics.bind(this)
    );

    // Get wallet token analytics
    this.router.get(
      '/wallet/:walletAddress/tokens',
      [
        param('walletAddress').isString().isLength({ min: 42, max: 42 }).withMessage('Valid wallet address is required'),
        query('timeRange').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid time range'),
        query('startTime').optional().isNumeric().withMessage('Start time must be a number'),
        query('endTime').optional().isNumeric().withMessage('End time must be a number')
      ],
      this.getWalletTokenAnalytics.bind(this)
    );

    // Get user activity analytics
    this.router.get(
      '/user/:userId/activity',
      [
        param('userId').isString().notEmpty().withMessage('User ID is required'),
        query('timeRange').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid time range'),
        query('startTime').optional().isNumeric().withMessage('Start time must be a number'),
        query('endTime').optional().isNumeric().withMessage('End time must be a number')
      ],
      this.getUserActivityAnalytics.bind(this)
    );

    // Get platform analytics
    this.router.get(
      '/platform',
      [
        query('timeRange').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid time range'),
        query('startTime').optional().isNumeric().withMessage('Start time must be a number'),
        query('endTime').optional().isNumeric().withMessage('End time must be a number')
      ],
      this.getPlatformAnalytics.bind(this)
    );

    // Health check endpoint
    this.router.get('/health', this.getHealthStatus.bind(this));
  }

  /**
   * Get the Express router
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Get wallet transaction analytics
   */
  private async getWalletTransactionAnalytics(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { walletAddress } = req.params;
      const { timeRange, startTime, endTime } = req.query;

      this.logger.info(`Getting transaction analytics for wallet ${walletAddress}`);

      const options: any = {};
      if (timeRange) options.timeRange = timeRange;
      if (startTime) options.startTime = parseInt(startTime as string, 10);
      if (endTime) options.endTime = parseInt(endTime as string, 10);

      const analytics = await this.analyticsService.getWalletTransactionAnalytics(walletAddress, options);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      this.logger.error(`Error getting wallet transaction analytics: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get wallet transaction analytics',
        message: error.message
      });
    }
  }

  /**
   * Get wallet token analytics
   */
  private async getWalletTokenAnalytics(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { walletAddress } = req.params;
      const { timeRange, startTime, endTime } = req.query;

      this.logger.info(`Getting token analytics for wallet ${walletAddress}`);

      const options: any = {};
      if (timeRange) options.timeRange = timeRange;
      if (startTime) options.startTime = parseInt(startTime as string, 10);
      if (endTime) options.endTime = parseInt(endTime as string, 10);

      const analytics = await this.analyticsService.getWalletTokenAnalytics(walletAddress, options);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      this.logger.error(`Error getting wallet token analytics: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get wallet token analytics',
        message: error.message
      });
    }
  }

  /**
   * Get user activity analytics
   */
  private async getUserActivityAnalytics(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { userId } = req.params;
      const { timeRange, startTime, endTime } = req.query;

      this.logger.info(`Getting activity analytics for user ${userId}`);

      const options: any = {};
      if (timeRange) options.timeRange = timeRange;
      if (startTime) options.startTime = parseInt(startTime as string, 10);
      if (endTime) options.endTime = parseInt(endTime as string, 10);

      const analytics = await this.analyticsService.getUserActivityAnalytics(userId, options);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      this.logger.error(`Error getting user activity analytics: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get user activity analytics',
        message: error.message
      });
    }
  }

  /**
   * Get platform analytics
   */
  private async getPlatformAnalytics(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { timeRange, startTime, endTime } = req.query;

      this.logger.info('Getting platform analytics');

      const options: any = {};
      if (timeRange) options.timeRange = timeRange;
      if (startTime) options.startTime = parseInt(startTime as string, 10);
      if (endTime) options.endTime = parseInt(endTime as string, 10);

      const analytics = await this.analyticsService.getPlatformAnalytics(options);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      this.logger.error(`Error getting platform analytics: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get platform analytics',
        message: error.message
      });
    }
  }

  /**
   * Get health status
   */
  private async getHealthStatus(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        service: 'analytics',
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error(`Error getting health status: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Health check failed',
        message: error.message
      });
    }
  }
} 