import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { create as createIPFS } from 'ipfs-http-client';

// Import configuration and utilities
import { config, validateConfig } from './config';
import { logger, createServiceLogger } from './utils/logger';

// Import routes
import contentRoutes from './routes/contentRoutes';
import ipfsRoutes from './routes/ipfsRoutes';
import encryptionRoutes from './routes/encryptionRoutes';
import gatewayRoutes from './routes/gatewayRoutes';
import filecoinRoutes from './routes/filecoinRoutes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/authMiddleware';

// Import services
import { initializeIPFSService, distributedNodeService } from './ipfs';
import { contentAvailabilityService } from './services/contentAvailabilityService';
import { filecoinService } from './services/filecoin.service';

// Create service logger
const serviceLogger = createServiceLogger('storage-main');

// Create Express app
const app: Express = express();

// Validate configuration
try {
  validateConfig();
  serviceLogger.info('Configuration validated successfully');
} catch (error) {
  serviceLogger.error('Configuration validation failed:', error);
  process.exit(1);
}

// Configure IPFS
const ipfs = createIPFS({ url: config.ipfs.apiUrl });

// Initialize services
async function initializeServices(): Promise<void> {
  try {
    serviceLogger.info('Initializing storage services...');

    // Initialize IPFS service
    initializeIPFSService(ipfs);
    serviceLogger.info('IPFS service initialized');

    // Initialize distributed node service
    await distributedNodeService.initialize();
    serviceLogger.info('Distributed node service initialized');

    // Initialize content availability service
    await contentAvailabilityService.initialize();
    serviceLogger.info('Content availability service initialized');

    // Initialize Filecoin service
    await filecoinService.initialize();
    serviceLogger.info('Filecoin service initialized');

    serviceLogger.info('All storage services initialized successfully');
  } catch (error) {
    serviceLogger.error('Failed to initialize services:', error);
    throw error;
  }
}

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors({ 
  origin: config.security.corsOrigins,
  credentials: true 
})); // Enable CORS
app.use(morgan('combined', { 
  stream: { write: (message) => serviceLogger.info(message.trim()) }
})); // Logging
app.use(compression() as any); // Compress responses - type fixed for CI/CD
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  const nodeHealth = distributedNodeService.getServiceHealth();
  const contentStats = contentAvailabilityService.getContentStats();
  const filecoinDeals = filecoinService.getAllDeals();

  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      ipfs: {
        totalNodes: nodeHealth.totalNodes,
        healthyNodes: nodeHealth.healthyNodes,
        averageLatency: nodeHealth.averageLatency
      },
      contentAvailability: {
        totalTracked: contentStats.totalTracked,
        replicationQueue: contentStats.replicationQueue,
        lastScanTime: contentStats.lastScanTime
      },
      filecoin: {
        totalDeals: filecoinDeals.length,
        activeDeals: filecoinDeals.filter(d => d.status === 'active').length,
        pendingDeals: filecoinDeals.filter(d => d.status === 'pending').length
      }
    }
  });
});

// Detailed health endpoint
app.get('/health/detailed', (req, res) => {
  const nodeHealth = distributedNodeService.getServiceHealth();
  const nodeStats = distributedNodeService.getNodeHealthStats();
  const contentStats = contentAvailabilityService.getContentStats();
  const availabilityReport = contentAvailabilityService.getLatestReport();
  const filecoinDeals = filecoinService.getAllDeals();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      distributedNodes: {
        overview: nodeHealth,
        nodeDetails: Object.fromEntries(nodeStats)
      },
      contentAvailability: {
        stats: contentStats,
        latestReport: availabilityReport,
        underReplicated: contentAvailabilityService.getUnderReplicatedContent().length,
        critical: contentAvailabilityService.getCriticalContent().length
      },
      filecoin: {
        deals: filecoinDeals,
        summary: {
          total: filecoinDeals.length,
          active: filecoinDeals.filter(d => d.status === 'active').length,
          pending: filecoinDeals.filter(d => d.status === 'pending').length,
          failed: filecoinDeals.filter(d => d.status === 'failed').length
        }
      }
    }
  });
});

// Apply routes
app.use('/api/content', contentRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/encryption', encryptionRoutes);
app.use('/api/gateways', gatewayRoutes);
app.use('/api/filecoin', filecoinRoutes);

// Apply error handling middleware
app.use(errorHandler);

// Initialize and start server
async function startServer(): Promise<void> {
  try {
    // Initialize all services
    await initializeServices();

    // Start server
    app.listen(config.server.port, () => {
      serviceLogger.info(`Storage server running on port ${config.server.port}`);
      serviceLogger.info(`Environment: ${config.server.environment}`);
      serviceLogger.info(`Health check available at http://localhost:${config.server.port}/health`);
    });

    // Setup graceful shutdown
    setupGracefulShutdown();

  } catch (error) {
    serviceLogger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Setup graceful shutdown
function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    serviceLogger.info(`Received ${signal}, shutting down gracefully...`);
    
    try {
      // Shutdown services in reverse order
      await filecoinService.initialize(); // No explicit shutdown method, but stop processing
      await contentAvailabilityService.shutdown();
      await distributedNodeService.shutdown();
      
      serviceLogger.info('All services shut down successfully');
      process.exit(0);
    } catch (error) {
      serviceLogger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle different shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  serviceLogger.error('Unhandled Promise Rejection:', err);
  // Don't crash in production, but log error
  if (config.server.environment === 'development') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  serviceLogger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the server
startServer();

export default app;