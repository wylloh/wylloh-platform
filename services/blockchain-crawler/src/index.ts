import { BlockWorker } from './services/worker/block.worker';
import { HealthMonitor } from './services/monitoring/health.service';
import { logger } from './utils/logger';
import { workerConfig } from './config/worker';

class BlockchainCrawler {
  private blockWorker: BlockWorker;
  private healthMonitor: HealthMonitor;

  constructor() {
    this.blockWorker = new BlockWorker();
    this.healthMonitor = new HealthMonitor();

    // Register workers with health monitor
    this.healthMonitor.registerWorker('block-worker', this.blockWorker);

    // Set up health monitoring events
    this.healthMonitor.on('health', (metrics) => {
      logger.debug('Worker health metrics:', metrics);
    });

    this.healthMonitor.on('healthError', (error) => {
      logger.error('Health monitoring error:', error);
    });
  }

  public async start(): Promise<void> {
    try {
      logger.info('Starting blockchain crawler service...');

      // Start workers
      await this.blockWorker.start();
      logger.info('Block worker started successfully');

      // Start health monitoring
      await this.healthMonitor.start();
      logger.info('Health monitoring started successfully');

      // Handle process termination
      this.setupGracefulShutdown();

      logger.info('Blockchain crawler service is running');
    } catch (error) {
      logger.error('Failed to start blockchain crawler service:', error);
      await this.stop();
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    logger.info('Stopping blockchain crawler service...');

    try {
      // Stop health monitoring first
      await this.healthMonitor.stop();
      logger.info('Health monitoring stopped');

      // Stop workers
      await this.blockWorker.stop();
      logger.info('Block worker stopped');

      logger.info('Blockchain crawler service stopped successfully');
    } catch (error) {
      logger.error('Error stopping blockchain crawler service:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, starting graceful shutdown...`);
        await this.stop();
        process.exit(0);
      });
    });

    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception:', error);
      await this.stop();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason) => {
      logger.error('Unhandled rejection:', reason);
      await this.stop();
      process.exit(1);
    });
  }
}

// Start the crawler service
const crawler = new BlockchainCrawler();
crawler.start().catch((error) => {
  logger.error('Failed to start crawler:', error);
  process.exit(1);
}); 