import { Request, Response } from 'express';
import { WalletController } from '../api/wallet.controller';
import { CrawlerService } from '../services/crawler.service';
import { WalletRegistry } from '../models/wallet.registry';

// Mock dependencies
jest.mock('../services/crawler.service');
jest.mock('../models/wallet.registry');

// Mock express-validator
jest.mock('express-validator', () => ({
  body: jest.fn().mockImplementation(() => ({
    isString: jest.fn().mockReturnThis(),
    isLength: jest.fn().mockReturnThis(),
    notEmpty: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis()
  })),
  validationResult: jest.fn()
}));

// Import validate result mock
const { validationResult } = require('express-validator');

describe('WalletController', () => {
  let walletController: WalletController;
  let mockCrawlerService: jest.Mocked<CrawlerService>;
  let mockWalletRegistry: jest.Mocked<WalletRegistry>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock CrawlerService
    mockCrawlerService = {
      registerWallet: jest.fn(),
      deregisterWallet: jest.fn(),
      getHealthStatus: jest.fn()
    } as unknown as jest.Mocked<CrawlerService>;

    // Create mock WalletRegistry
    mockWalletRegistry = {
      getWalletsForUser: jest.fn(),
      getUserIdForWallet: jest.fn(),
      getLastSyncTimestamp: jest.fn(),
      updateLastSyncTimestamp: jest.fn()
    } as unknown as jest.Mocked<WalletRegistry>;

    // Setup mock response
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    mockResponse = {
      json: jsonSpy,
      status: statusSpy
    };

    // Create WalletController instance
    walletController = new WalletController(mockCrawlerService, mockWalletRegistry);

    // Default validation result (valid)
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
  });

  describe('getWalletsForUser', () => {
    it('should return wallets for a user', async () => {
      // Setup
      const userId = 'user1';
      const wallets = ['0x123', '0x456'];
      mockRequest = {
        params: { userId }
      };
      mockWalletRegistry.getWalletsForUser.mockResolvedValue(wallets);

      // Execute
      await (walletController as any).getWalletsForUser(mockRequest, mockResponse);

      // Assert
      expect(mockWalletRegistry.getWalletsForUser).toHaveBeenCalledWith(userId);
      expect(jsonSpy).toHaveBeenCalledWith({
        userId,
        wallets
      });
    });

    it('should handle errors', async () => {
      // Setup
      const userId = 'user1';
      const error = new Error('Failed to get wallets');
      mockRequest = {
        params: { userId }
      };
      mockWalletRegistry.getWalletsForUser.mockRejectedValue(error);

      // Execute
      await (walletController as any).getWalletsForUser(mockRequest, mockResponse);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Failed to get wallets for user',
        message: error.message
      });
    });
  });

  describe('registerWallet', () => {
    it('should register a wallet successfully', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      const userId = 'user1';
      mockRequest = {
        body: { walletAddress, userId }
      };

      // Execute
      await (walletController as any).registerWallet(mockRequest, mockResponse);

      // Assert
      expect(mockCrawlerService.registerWallet).toHaveBeenCalledWith(walletAddress, userId);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: `Wallet ${walletAddress} registered for monitoring`,
        walletAddress,
        userId
      });
    });

    it('should handle validation errors', async () => {
      // Setup
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Valid wallet address is required' }]
      });
      mockRequest = {
        body: { walletAddress: 'invalid', userId: '' }
      };

      // Execute
      await (walletController as any).registerWallet(mockRequest, mockResponse);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        errors: [{ msg: 'Valid wallet address is required' }]
      });
      expect(mockCrawlerService.registerWallet).not.toHaveBeenCalled();
    });

    it('should handle already registered wallet error', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      const userId = 'user1';
      mockRequest = {
        body: { walletAddress, userId }
      };
      const error = new Error('Wallet is already registered to another user');
      mockCrawlerService.registerWallet.mockRejectedValue(error);

      // Execute
      await (walletController as any).registerWallet(mockRequest, mockResponse);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(409);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Wallet already registered',
        message: error.message
      });
    });

    it('should handle general errors', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      const userId = 'user1';
      mockRequest = {
        body: { walletAddress, userId }
      };
      const error = new Error('General error');
      mockCrawlerService.registerWallet.mockRejectedValue(error);

      // Execute
      await (walletController as any).registerWallet(mockRequest, mockResponse);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Failed to register wallet',
        message: error.message
      });
    });
  });

  describe('deregisterWallet', () => {
    it('should deregister a wallet successfully', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      mockRequest = {
        body: { walletAddress }
      };

      // Execute
      await (walletController as any).deregisterWallet(mockRequest, mockResponse);

      // Assert
      expect(mockCrawlerService.deregisterWallet).toHaveBeenCalledWith(walletAddress);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: `Wallet ${walletAddress} deregistered from monitoring`,
        walletAddress
      });
    });

    it('should handle validation errors', async () => {
      // Setup
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Valid wallet address is required' }]
      });
      mockRequest = {
        body: { walletAddress: 'invalid' }
      };

      // Execute
      await (walletController as any).deregisterWallet(mockRequest, mockResponse);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        errors: [{ msg: 'Valid wallet address is required' }]
      });
      expect(mockCrawlerService.deregisterWallet).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      mockRequest = {
        body: { walletAddress }
      };
      const error = new Error('Failed to deregister wallet');
      mockCrawlerService.deregisterWallet.mockRejectedValue(error);

      // Execute
      await (walletController as any).deregisterWallet(mockRequest, mockResponse);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Failed to deregister wallet',
        message: error.message
      });
    });
  });

  describe('getWalletStatus', () => {
    it('should return wallet status', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      const userId = 'user1';
      const lastSyncTimestamp = Date.now();
      mockRequest = {
        params: { walletAddress }
      };
      mockWalletRegistry.getUserIdForWallet.mockResolvedValue(userId);
      mockWalletRegistry.getLastSyncTimestamp.mockResolvedValue(lastSyncTimestamp);

      // Execute
      await (walletController as any).getWalletStatus(mockRequest, mockResponse);

      // Assert
      expect(mockWalletRegistry.getUserIdForWallet).toHaveBeenCalledWith(walletAddress);
      expect(mockWalletRegistry.getLastSyncTimestamp).toHaveBeenCalledWith(walletAddress);
      expect(jsonSpy).toHaveBeenCalledWith({
        walletAddress,
        userId,
        isActive: true,
        lastSyncTimestamp,
        lastSyncTimeFormatted: new Date(lastSyncTimestamp).toISOString()
      });
    });

    it('should return 404 if wallet not found', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      mockRequest = {
        params: { walletAddress }
      };
      mockWalletRegistry.getUserIdForWallet.mockResolvedValue(null);

      // Execute
      await (walletController as any).getWalletStatus(mockRequest, mockResponse);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Wallet not found',
        message: `Wallet ${walletAddress} is not registered for monitoring`
      });
      expect(mockWalletRegistry.getLastSyncTimestamp).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      mockRequest = {
        params: { walletAddress }
      };
      const error = new Error('Failed to get wallet status');
      mockWalletRegistry.getUserIdForWallet.mockRejectedValue(error);

      // Execute
      await (walletController as any).getWalletStatus(mockRequest, mockResponse);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Failed to get wallet status',
        message: error.message
      });
    });
  });

  describe('syncWallet', () => {
    it('should sync a wallet successfully', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      const userId = 'user1';
      mockRequest = {
        params: { walletAddress }
      };
      mockWalletRegistry.getUserIdForWallet.mockResolvedValue(userId);
      
      // Execute
      await (walletController as any).syncWallet(mockRequest, mockResponse);

      // Assert
      expect(mockWalletRegistry.getUserIdForWallet).toHaveBeenCalledWith(walletAddress);
      expect(mockCrawlerService.registerWallet).toHaveBeenCalledWith(walletAddress, userId);
      expect(mockWalletRegistry.updateLastSyncTimestamp).toHaveBeenCalled();
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: `Wallet ${walletAddress} sync initiated`,
        walletAddress,
        userId
      }));
    });

    it('should return 404 if wallet not found', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      mockRequest = {
        params: { walletAddress }
      };
      mockWalletRegistry.getUserIdForWallet.mockResolvedValue(null);

      // Execute
      await (walletController as any).syncWallet(mockRequest, mockResponse);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Wallet not found',
        message: `Wallet ${walletAddress} is not registered for monitoring`
      });
      expect(mockCrawlerService.registerWallet).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Setup
      const walletAddress = '0x0123456789012345678901234567890123456789ab';
      mockRequest = {
        params: { walletAddress }
      };
      const error = new Error('Failed to sync wallet');
      mockWalletRegistry.getUserIdForWallet.mockRejectedValue(error);

      // Execute
      await (walletController as any).syncWallet(mockRequest, mockResponse);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Failed to sync wallet',
        message: error.message
      });
    });
  });

  describe('getHealthStatus', () => {
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
      mockRequest = {};
      mockCrawlerService.getHealthStatus.mockReturnValue(healthStatus);
      mockWalletRegistry.getAllActiveWallets.mockResolvedValue(activeWallets);

      // Execute
      await (walletController as any).getHealthStatus(mockRequest, mockResponse);

      // Assert
      expect(mockCrawlerService.getHealthStatus).toHaveBeenCalled();
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
        ...healthStatus,
        activeWalletCount: activeWallets.length
      }));
    });

    it('should handle errors', async () => {
      // Setup
      mockRequest = {};
      const error = new Error('Failed to get health status');
      mockCrawlerService.getHealthStatus.mockImplementation(() => {
        throw error;
      });

      // Execute
      await (walletController as any).getHealthStatus(mockRequest, mockResponse);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Failed to get health status',
        message: error.message
      });
    });
  });
}); 