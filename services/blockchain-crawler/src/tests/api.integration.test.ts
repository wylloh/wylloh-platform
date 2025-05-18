import request from 'supertest';
import express from 'express';
import { WalletController } from '../api/wallet.controller';
import { CrawlerService } from '../services/crawler.service';
import { WalletRegistry } from '../models/wallet.registry';
import { DatabaseService } from '../services/database.service';
import { TokenService } from '../services/token.service';
import { ChainAdapterFactory } from '../adapters/chain.adapter.factory';

// Mock dependencies
jest.mock('../services/crawler.service');
jest.mock('../models/wallet.registry');
jest.mock('../services/database.service');
jest.mock('../services/token.service');
jest.mock('../adapters/chain.adapter.factory');

// Mock Redis
jest.mock('ioredis');

describe('API Integration Tests', () => {
  let app: express.Application;
  let mockCrawlerService: jest.Mocked<CrawlerService>;
  let mockWalletRegistry: jest.Mocked<WalletRegistry>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup express app
    app = express();
    app.use(express.json());
    
    // Mock dependencies
    mockWalletRegistry = {
      getWalletsForUser: jest.fn(),
      getUserIdForWallet: jest.fn(),
      getLastSyncTimestamp: jest.fn(),
      updateLastSyncTimestamp: jest.fn(),
      getAllActiveWallets: jest.fn()
    } as unknown as jest.Mocked<WalletRegistry>;
    
    mockCrawlerService = {
      registerWallet: jest.fn(),
      deregisterWallet: jest.fn(),
      getHealthStatus: jest.fn()
    } as unknown as jest.Mocked<CrawlerService>;
    
    // Create and setup wallet controller
    const walletController = new WalletController(mockCrawlerService, mockWalletRegistry);
    app.use('/api/wallet', walletController.getRouter());
  });
  
  describe('GET /api/wallet/user/:userId/wallets', () => {
    it('should return wallets for a user', async () => {
      // Setup
      const userId = 'user1';
      const wallets = ['0x123', '0x456'];
      mockWalletRegistry.getWalletsForUser.mockResolvedValue(wallets);
      
      // Execute & Assert
      const response = await request(app)
        .get(`/api/wallet/user/${userId}/wallets`)
        .expect(200);
      
      expect(response.body).toEqual({
        userId,
        wallets
      });
      expect(mockWalletRegistry.getWalletsForUser).toHaveBeenCalledWith(userId);
    });
    
    it('should return 500 if service throws error', async () => {
      // Setup
      const userId = 'user1';
      mockWalletRegistry.getWalletsForUser.mockRejectedValue(new Error('Database error'));
      
      // Execute & Assert
      const response = await request(app)
        .get(`/api/wallet/user/${userId}/wallets`)
        .expect(500);
      
      expect(response.body.error).toBe('Failed to get wallets for user');
    });
  });
  
  describe('POST /api/wallet/register', () => {
    it('should register a wallet successfully', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      const userId = 'user1';
      mockCrawlerService.registerWallet.mockResolvedValue();
      
      // Execute & Assert
      const response = await request(app)
        .post('/api/wallet/register')
        .send({ walletAddress, userId })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.walletAddress).toBe(walletAddress);
      expect(response.body.userId).toBe(userId);
      expect(mockCrawlerService.registerWallet).toHaveBeenCalledWith(walletAddress, userId);
    });
    
    it('should return 400 for invalid wallet address', async () => {
      // Setup
      const walletAddress = 'invalid';
      const userId = 'user1';
      
      // Execute & Assert
      const response = await request(app)
        .post('/api/wallet/register')
        .send({ walletAddress, userId })
        .expect(400);
      
      expect(response.body.errors).toBeDefined();
      expect(mockCrawlerService.registerWallet).not.toHaveBeenCalled();
    });
    
    it('should return 409 if wallet already registered', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      const userId = 'user1';
      mockCrawlerService.registerWallet.mockRejectedValue(
        new Error('Wallet is already registered to another user')
      );
      
      // Execute & Assert
      const response = await request(app)
        .post('/api/wallet/register')
        .send({ walletAddress, userId })
        .expect(409);
      
      expect(response.body.error).toBe('Wallet already registered');
    });
  });
  
  describe('POST /api/wallet/deregister', () => {
    it('should deregister a wallet successfully', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      mockCrawlerService.deregisterWallet.mockResolvedValue();
      
      // Execute & Assert
      const response = await request(app)
        .post('/api/wallet/deregister')
        .send({ walletAddress })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.walletAddress).toBe(walletAddress);
      expect(mockCrawlerService.deregisterWallet).toHaveBeenCalledWith(walletAddress);
    });
    
    it('should return 400 for invalid wallet address', async () => {
      // Setup
      const walletAddress = 'invalid';
      
      // Execute & Assert
      const response = await request(app)
        .post('/api/wallet/deregister')
        .send({ walletAddress })
        .expect(400);
      
      expect(response.body.errors).toBeDefined();
      expect(mockCrawlerService.deregisterWallet).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/wallet/status/:walletAddress', () => {
    it('should return wallet status', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      const userId = 'user1';
      const lastSyncTimestamp = Date.now();
      mockWalletRegistry.getUserIdForWallet.mockResolvedValue(userId);
      mockWalletRegistry.getLastSyncTimestamp.mockResolvedValue(lastSyncTimestamp);
      
      // Execute & Assert
      const response = await request(app)
        .get(`/api/wallet/status/${walletAddress}`)
        .expect(200);
      
      expect(response.body.walletAddress).toBe(walletAddress);
      expect(response.body.userId).toBe(userId);
      expect(response.body.lastSyncTimestamp).toBe(lastSyncTimestamp);
      expect(mockWalletRegistry.getUserIdForWallet).toHaveBeenCalledWith(walletAddress);
    });
    
    it('should return 404 if wallet not found', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      mockWalletRegistry.getUserIdForWallet.mockResolvedValue(null);
      
      // Execute & Assert
      const response = await request(app)
        .get(`/api/wallet/status/${walletAddress}`)
        .expect(404);
      
      expect(response.body.error).toBe('Wallet not found');
    });
  });
  
  describe('POST /api/wallet/sync/:walletAddress', () => {
    it('should sync a wallet successfully', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      const userId = 'user1';
      mockWalletRegistry.getUserIdForWallet.mockResolvedValue(userId);
      mockCrawlerService.registerWallet.mockResolvedValue();
      mockWalletRegistry.updateLastSyncTimestamp.mockResolvedValue();
      
      // Execute & Assert
      const response = await request(app)
        .post(`/api/wallet/sync/${walletAddress}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.walletAddress).toBe(walletAddress);
      expect(response.body.userId).toBe(userId);
      expect(mockCrawlerService.registerWallet).toHaveBeenCalledWith(walletAddress, userId);
      expect(mockWalletRegistry.updateLastSyncTimestamp).toHaveBeenCalled();
    });
    
    it('should return 404 if wallet not found', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      mockWalletRegistry.getUserIdForWallet.mockResolvedValue(null);
      
      // Execute & Assert
      const response = await request(app)
        .post(`/api/wallet/sync/${walletAddress}`)
        .expect(404);
      
      expect(response.body.error).toBe('Wallet not found');
      expect(mockCrawlerService.registerWallet).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/wallet/health', () => {
    it('should return health status', async () => {
      // Setup
      const healthStatus = {
        status: 'healthy',
        activeWallets: 2,
        eventProcessing: {
          success: 10,
          failures: 0,
          pending: 0,
          lastProcessedTimestamp: Date.now()
        },
        lastSyncTime: new Date().toISOString(),
        dbConnection: 'connected'
      };
      const activeWallets = ['0x123', '0x456'];
      mockCrawlerService.getHealthStatus.mockReturnValue(healthStatus);
      mockWalletRegistry.getAllActiveWallets.mockResolvedValue(activeWallets);
      
      // Execute & Assert
      const response = await request(app)
        .get('/api/wallet/health')
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
      expect(mockCrawlerService.getHealthStatus).toHaveBeenCalled();
    });
  });
}); 