import Redis from 'ioredis';
import { createLogger } from './utils/logger';
import { CrawlerService } from './services/crawler.service';
import { TokenService } from './services/token.service';
import { ChainAdapterFactory } from './adapters/chain.adapter.factory';
import { WalletRegistry } from './models/wallet.registry';
import { WalletController } from './api/wallet.controller';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Initialize logger
const logger = createLogger('main');

// Initialize Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

// Initialize services
const chainAdapterFactory = ChainAdapterFactory.getInstance();
const tokenService = new TokenService();
const walletRegistry = new WalletRegistry(redis, logger);
const crawlerService = new CrawlerService(chainAdapterFactory, redis, tokenService);

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan('combined'));

// Initialize controllers
const walletController = new WalletController(crawlerService, walletRegistry);

// Setup routes
app.use('/api/wallet', walletController.getRouter());

// Root health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'blockchain-crawler' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error handling request: ${err.message}`);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
});

// Start the crawler service
crawlerService.start()
  .then(() => {
    logger.info('Crawler service started successfully');
  })
  .catch(error => {
    logger.error(`Error starting crawler service: ${error.message}`);
    process.exit(1);
  });

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  
  try {
    await crawlerService.stop();
    logger.info('Crawler service stopped successfully');
    
    process.exit(0);
  } catch (error) {
    logger.error(`Error stopping crawler service: ${error.message}`);
    process.exit(1);
  }
}); 