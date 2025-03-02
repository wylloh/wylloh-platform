import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { create as createIPFS } from 'ipfs-http-client';

// Load environment variables
dotenv.config();

// Import routes
import contentRoutes from './routes/contentRoutes';
import ipfsRoutes from './routes/ipfsRoutes';
import encryptionRoutes from './routes/encryptionRoutes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/authMiddleware';

// Import services
import { initializeIPFSService } from './ipfs/ipfsService';

// Create Express app
const app = express();

// Set port
const PORT = process.env.STORAGE_PORT || 4001;

// Configure IPFS
const IPFS_API_URL = process.env.IPFS_API_URL || 'http://localhost:5001';
const ipfs = createIPFS({ url: IPFS_API_URL });

// Initialize IPFS service
initializeIPFSService(ipfs);

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Configure file upload limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply routes
app.use('/api/content', contentRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/encryption', encryptionRoutes);

// Apply error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Storage server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash in production, but log error
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

export default app;