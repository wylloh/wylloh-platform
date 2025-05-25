import Redis from 'ioredis';
import { createLogger } from './utils/logger';
import { CrawlerService } from './services/crawler.service';
import { TokenService } from './services/token.service';
import { AnalyticsService } from './services/analytics.service';
import { ChainAdapterFactory } from './adapters/chain.adapter.factory';
import { WalletRegistry } from './models/wallet.registry';
import { WalletController } from './api/wallet.controller';
import { AnalyticsController } from './api/analytics.controller';
import { DatabaseService } from './services/database.service';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Initialize logger
const logger = createLogger('main');

// Load environment variables
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wylloh-blockchain';
const PORT = process.env.PORT || 3001;

// Initialize Redis client
const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
});

// Initialize services
const chainAdapterFactory = ChainAdapterFactory.getInstance();
const tokenService = new TokenService();
const walletRegistry = new WalletRegistry(redis, logger);
const databaseService = new DatabaseService();
const analyticsService = new AnalyticsService(databaseService);

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan('combined'));

// Initialize the database connection
databaseService.initialize(MONGODB_URI)
  .then(() => {
    logger.info('Database connection established');
    
    // Initialize crawler service after database is connected
    const crawlerService = new CrawlerService(
      chainAdapterFactory,
      redis,
      tokenService,
      databaseService,
      MONGODB_URI
    );

    // Initialize controllers
    const walletController = new WalletController(crawlerService, walletRegistry);
    const analyticsController = new AnalyticsController(analyticsService);

    // Setup routes
    app.use('/api/wallet', walletController.getRouter());
    app.use('/api/analytics', analyticsController.getRouter());

    // Root health check
    app.get('/', (req, res) => {
      res.json({ 
        status: 'ok', 
        service: 'blockchain-crawler',
        endpoints: {
          wallet: '/api/wallet',
          analytics: '/api/analytics'
        }
      });
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

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error(`Error handling request: ${err.message}`);
      res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        status: err.status || 500
      });
    });

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`);
      logger.info(`Analytics API available at http://localhost:${PORT}/api/analytics`);
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
  })
  .catch(error => {
    logger.error(`Error initializing database: ${error.message}`);
    process.exit(1);
  }); 