import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Import routes
import userRoutes from './routes/userRoutes';
import contentRoutes from './routes/contentRoutes';
import tokenRoutes from './routes/tokenRoutes';
import marketplaceRoutes from './routes/marketplaceRoutes';
import featuredContentRoutes from './routes/featuredContent';
import libraryRoutes from './routes/library.routes';
import libraryAnalyticsRoutes from './routes/library-analytics.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/authMiddleware';

// Create Express app
const app = express();

// Set port
const PORT = process.env.API_PORT || 4000;

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wylloh';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  });

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply routes
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/featured-content', featuredContentRoutes);
app.use('/api/libraries', libraryRoutes);
app.use('/api/library-analytics', libraryAnalyticsRoutes);

// Apply error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
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