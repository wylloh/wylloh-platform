import Redis from 'ioredis';
import { createLogger } from './utils/logger';
import { CrawlerService } from './services/crawler.service';
import { TokenService } from './services/token.service';
import { ChainAdapterFactory } from './adapters/chain.adapter.factory';
import express from 'express';
import cors from 'cors';

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
const crawlerService = new CrawlerService(chainAdapterFactory, redis, tokenService);

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start monitoring a wallet
app.post('/wallets/:address/monitor', async (req, res) => {
  try {
    const { address } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    await crawlerService.startWalletMonitoring(address, userId);
    res.json({ message: `Started monitoring wallet ${address}` });
  } catch (error) {
    logger.error(`Error starting wallet monitoring: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Stop monitoring a wallet
app.post('/wallets/:address/stop', async (req, res) => {
  try {
    const { address } = req.params;
    await crawlerService.stopWalletMonitoring(address);
    res.json({ message: `Stopped monitoring wallet ${address}` });
  } catch (error) {
    logger.error(`Error stopping wallet monitoring: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Start the service
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Start the crawler service
    await crawlerService.start();
    logger.info('Crawler service started successfully');

    // Start the HTTP server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });

    // Handle shutdown gracefully
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM signal. Shutting down gracefully...');
      await crawlerService.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT signal. Shutting down gracefully...');
      await crawlerService.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error(`Failed to start service: ${error.message}`);
    process.exit(1);
  }
}

start(); 