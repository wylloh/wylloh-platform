// Node.js polyfills for browser APIs required by Helia/libp2p

// Crypto polyfill setup function
async function setupCryptoPolyfill() {
  if (typeof globalThis.crypto === 'undefined') {
    const crypto = await import('crypto');
    globalThis.crypto = crypto.webcrypto as any;
  }
}

if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type: string, options?: { detail?: any; bubbles?: boolean; cancelable?: boolean }) {
      super(type, options);
      this.detail = options?.detail;
    }
    detail: any;
  } as any;
}

// Node.js polyfill for Promise.withResolvers (added in Node.js v20.16.0)
if (typeof (Promise as any).withResolvers === 'undefined') {
  (Promise as any).withResolvers = function<T>() {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
  };
}

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';

// Import configuration and utilities
import { config, validateConfig } from './config/index.js';
import { logger, createServiceLogger } from './utils/logger.js';

// Import routes
import contentRoutes from './routes/contentRoutes.js';
import ipfsRoutes from './routes/ipfsRoutes.js';
import encryptionRoutes from './routes/encryptionRoutes.js';
import gatewayRoutes from './routes/gatewayRoutes.js';
import filecoinRoutes from './routes/filecoinRoutes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/authMiddleware.js';

// Import services
import { initializeIPFSService, distributedNodeService } from './ipfs/index.js';
import { contentAvailabilityService } from './services/contentAvailabilityService.js';
import { filecoinService } from './services/filecoin.service.js';

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

// Configure Helia IPFS - will be initialized async
let heliaNode: any;
let unixfsInstance: any;

async function initializeHelia() {
  heliaNode = await createHelia();
  unixfsInstance = unixfs(heliaNode);
  serviceLogger.info('Helia IPFS node initialized successfully');
}

// Initialize services
async function initializeServices(): Promise<void> {
  try {
    serviceLogger.info('Initializing storage services...');

    // Setup crypto polyfill first
    await setupCryptoPolyfill();

    // Initialize Helia IPFS first
    await initializeHelia();

    // Initialize IPFS service with Helia instances
    initializeIPFSService(heliaNode, unixfsInstance);
    serviceLogger.info('IPFS service initialized');

    // Initialize distributed node service
    await distributedNodeService.initialize();
    serviceLogger.info('Distributed node service initialized');

    // Initialize content availability service
    await contentAvailabilityService.initialize();
    serviceLogger.info('Content availability service initialized');

    // Initialize Filecoin service (temporarily disabled - roadmap feature)
    try {
      await filecoinService.initialize();
      serviceLogger.info('Filecoin service initialized');
    } catch (error) {
      serviceLogger.warn('Filecoin service initialization failed (expected for roadmap feature):', error);
      serviceLogger.info('Continuing without Filecoin - IPFS and core storage functionality available');
    }

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
app.get('/health', (req: Request, res: Response) => {
  const nodeHealth = distributedNodeService.getServiceHealth();
  const contentStats = contentAvailabilityService.getContentStats();
  
  // Safely get Filecoin deals with error handling
  let filecoinDeals: any[] = [];
  let filecoinStatus = 'unavailable';
  try {
    filecoinDeals = filecoinService.getAllDeals();
    filecoinStatus = 'ok';
  } catch (error) {
    serviceLogger.warn('Filecoin service unavailable in health check (roadmap feature):', error);
    filecoinStatus = 'disabled';
  }

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
        status: filecoinStatus,
        totalDeals: filecoinDeals.length,
        activeDeals: filecoinDeals.filter(d => d.status === 'active').length,
        pendingDeals: filecoinDeals.filter(d => d.status === 'pending').length
      }
    }
  });
});

// Detailed health endpoint
app.get('/health/detailed', (req: Request, res: Response) => {
  const nodeHealth = distributedNodeService.getServiceHealth();
  const nodeStats = distributedNodeService.getNodeHealthStats();
  const contentStats = contentAvailabilityService.getContentStats();
  const availabilityReport = contentAvailabilityService.getLatestReport();
  
  // Safely get Filecoin deals with error handling
  let filecoinDeals: any[] = [];
  try {
    filecoinDeals = filecoinService.getAllDeals();
  } catch (error) {
    serviceLogger.warn('Filecoin service unavailable in detailed health check (roadmap feature):', error);
  }

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