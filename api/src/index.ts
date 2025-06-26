// Node.js polyfills for browser APIs required by Helia/libp2p

// Crypto polyfill setup function
async function setupCryptoPolyfill() {
  if (typeof globalThis.crypto === 'undefined') {
    const crypto = await import('crypto');
    globalThis.crypto = crypto.webcrypto as any;
  }
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import { Request, Response, NextFunction } from 'express';
import { validateSecurityConfig } from './config/security';
import { createServer } from 'http';
import websocketService from './services/websocketService';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import contentRoutes from './routes/contentRoutes';
import tokenRoutes from './routes/tokenRoutes';
import storeRoutes from './routes/storeRoutes';
import featuredContentRoutes from './routes/featuredContent';
import libraryRoutes from './routes/library.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/authMiddleware';

// Create Express app
const app: express.Application = express();

// Set port
const PORT = process.env.PORT || process.env.API_PORT || 3001;

// Connect to MongoDB - Production ready configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/wylloh';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  });

// Enhanced Security Configuration
const isProduction = process.env.NODE_ENV === 'production';

// Enhanced Helmet configuration for comprehensive security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for Web3 compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://wylloh.com',
      'https://www.wylloh.com'
    ];
    
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count']
};

app.use(cors(corsOptions));

// Request size limits for security
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Limit URL-encoded payload size

// Apply other middleware
app.use(morgan('dev')); // Logging
app.use(compression() as any); // Compress responses - type fixed for CI/CD
app.use(bodyParser.json());

// Security headers middleware
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply routes (subdomain architecture - no /api prefix needed)
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/content', contentRoutes);
app.use('/tokens', tokenRoutes);
app.use('/store', storeRoutes);
app.use('/featured-content', featuredContentRoutes);
app.use('/libraries', libraryRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Wylloh API',
    version: '1.0.0',
    docs: '/docs'
  });
});

// Apply error handling middleware
app.use(errorHandler);

// Start server
async function startServer() {
  // Setup crypto polyfill first
  await setupCryptoPolyfill();
  
  // 🔒 SECURITY: Validate security configuration on startup
  try {
    validateSecurityConfig();
  } catch (error) {
    console.error('❌ Security configuration validation failed:', error);
    process.exit(1);
  }
  
  // Create HTTP server with WebSocket support
  const server = createServer(app);
  
  // Initialize WebSocket service
  websocketService.initializeWebSocket(server);
  
  server.listen(PORT, () => {
    console.log(`✅ API server running on port ${PORT}`);
    console.log(`🔒 Security mode: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`🔌 WebSocket service ready for real-time Pro status updates`);
  });
}

startServer().catch(console.error);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash in production, but log error
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

export default app;