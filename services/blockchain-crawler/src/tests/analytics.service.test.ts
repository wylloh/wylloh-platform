import { AnalyticsService } from '../services/analytics.service';
import { DatabaseService } from '../services/database.service';
import { ITransaction } from '../models/transaction.model';
import { IWalletActivity } from '../models/wallet-activity.model';

// Mock the database service
jest.mock('../services/database.service');
jest.mock('../utils/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}));

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDatabaseService = new DatabaseService() as jest.Mocked<DatabaseService>;
    analyticsService = new AnalyticsService(mockDatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWalletTransactionAnalytics', () => {
    const mockWalletAddress = '0x1234567890123456789012345678901234567890';
    
    const mockTransactions: Partial<ITransaction>[] = [
      {
        transactionHash: '0xabc123',
        chain: 'ethereum',
        status: 'confirmed',
        timestamp: Date.now() - 86400000, // 1 day ago
        gasUsed: '21000',
        from: mockWalletAddress,
        to: '0x9876543210987654321098765432109876543210'
      },
      {
        transactionHash: '0xdef456',
        chain: 'polygon',
        status: 'failed',
        timestamp: Date.now() - 172800000, // 2 days ago
        gasUsed: '50000',
        from: '0x9876543210987654321098765432109876543210',
        to: mockWalletAddress
      },
      {
        transactionHash: '0xghi789',
        chain: 'ethereum',
        status: 'pending',
        timestamp: Date.now() - 3600000, // 1 hour ago
        gasUsed: '30000',
        from: mockWalletAddress,
        to: '0x1111111111111111111111111111111111111111'
      }
    ];

    beforeEach(() => {
      mockDatabaseService.getWalletTransactions.mockResolvedValue(mockTransactions as ITransaction[]);
    });

    it('should return correct transaction analytics for a wallet', async () => {
      const result = await analyticsService.getWalletTransactionAnalytics(mockWalletAddress);

      expect(result.summary.totalTransactions).toBe(3);
      expect(result.summary.successfulTransactions).toBe(1);
      expect(result.summary.failedTransactions).toBe(1);
      expect(result.summary.pendingTransactions).toBe(1);
      expect(result.summary.successRate).toBeCloseTo(33.33, 2);
      expect(result.summary.totalGasUsed).toBe(101000);
      expect(result.summary.averageGasUsed).toBeCloseTo(33666.67, 2);
    });

    it('should group transactions by chain correctly', async () => {
      const result = await analyticsService.getWalletTransactionAnalytics(mockWalletAddress);

      expect(result.breakdown.byChain).toEqual({
        ethereum: 2,
        polygon: 1
      });
    });

    it('should handle different time ranges', async () => {
      await analyticsService.getWalletTransactionAnalytics(mockWalletAddress, { timeRange: 'week' });

      expect(mockDatabaseService.getWalletTransactions).toHaveBeenCalledWith(
        mockWalletAddress,
        expect.objectContaining({
          startTime: expect.any(Number),
          endTime: expect.any(Number),
          limit: 1000
        })
      );
    });

    it('should handle custom time range', async () => {
      const startTime = Date.now() - 86400000;
      const endTime = Date.now();

      await analyticsService.getWalletTransactionAnalytics(mockWalletAddress, { 
        startTime, 
        endTime 
      });

      expect(mockDatabaseService.getWalletTransactions).toHaveBeenCalledWith(
        mockWalletAddress,
        expect.objectContaining({
          startTime,
          endTime,
          limit: 1000
        })
      );
    });

    it('should handle empty transaction list', async () => {
      mockDatabaseService.getWalletTransactions.mockResolvedValue([]);

      const result = await analyticsService.getWalletTransactionAnalytics(mockWalletAddress);

      expect(result.summary.totalTransactions).toBe(0);
      expect(result.summary.successRate).toBe(0);
      expect(result.summary.averageGasUsed).toBe(0);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockDatabaseService.getWalletTransactions.mockRejectedValue(error);

      await expect(
        analyticsService.getWalletTransactionAnalytics(mockWalletAddress)
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('getWalletTokenAnalytics', () => {
    const mockWalletAddress = '0x1234567890123456789012345678901234567890';
    
    const mockActivities: Partial<IWalletActivity>[] = [
      {
        walletAddress: mockWalletAddress,
        activityType: 'send',
        timestamp: Date.now() - 86400000,
        tokenAddress: '0xtoken1',
        tokenId: '1',
        transactionHash: '0xabc123',
        chain: 'ethereum'
      },
      {
        walletAddress: mockWalletAddress,
        activityType: 'receive',
        timestamp: Date.now() - 172800000,
        tokenAddress: '0xtoken1',
        tokenId: '1',
        transactionHash: '0xdef456',
        chain: 'ethereum'
      },
      {
        walletAddress: mockWalletAddress,
        activityType: 'mint',
        timestamp: Date.now() - 3600000,
        tokenAddress: '0xtoken2',
        tokenId: '2',
        transactionHash: '0xghi789',
        chain: 'polygon'
      }
    ];

    beforeEach(() => {
      mockDatabaseService.getWalletActivityHistory.mockResolvedValue(mockActivities as IWalletActivity[]);
    });

    it('should return correct token analytics for a wallet', async () => {
      const result = await analyticsService.getWalletTokenAnalytics(mockWalletAddress);

      expect(result.summary.uniqueTokens).toBe(2);
      expect(result.summary.totalTokenActivities).toBe(3);
      expect(result.summary.mostActiveToken).toEqual({
        tokenAddress: '0xtoken1',
        tokenId: '1',
        totalTransfers: 2
      });
    });

    it('should group activities by token correctly', async () => {
      const result = await analyticsService.getWalletTokenAnalytics(mockWalletAddress);

      expect(result.tokens).toHaveLength(2);
      expect(result.tokens[0]).toEqual(
        expect.objectContaining({
          tokenAddress: '0xtoken1',
          tokenId: '1',
          totalTransfers: 2
        })
      );
    });

    it('should handle empty activity list', async () => {
      mockDatabaseService.getWalletActivityHistory.mockResolvedValue([]);

      const result = await analyticsService.getWalletTokenAnalytics(mockWalletAddress);

      expect(result.summary.uniqueTokens).toBe(0);
      expect(result.summary.totalTokenActivities).toBe(0);
      expect(result.summary.mostActiveToken).toBeNull();
    });
  });

  describe('getUserActivityAnalytics', () => {
    it('should return placeholder user activity analytics', async () => {
      const userId = 'user123';
      const result = await analyticsService.getUserActivityAnalytics(userId);

      expect(result.summary.totalWallets).toBe(0);
      expect(result.summary.totalTransactions).toBe(0);
      expect(result.summary.totalTokens).toBe(0);
      expect(result.timeRange.range).toBe('month');
    });
  });

  describe('getPlatformAnalytics', () => {
    it('should return placeholder platform analytics', async () => {
      const result = await analyticsService.getPlatformAnalytics();

      expect(result.summary.totalTransactions).toBe(0);
      expect(result.summary.totalWallets).toBe(0);
      expect(result.summary.totalTokens).toBe(0);
      expect(result.timeRange.range).toBe('month');
    });

    it('should handle custom time range', async () => {
      const startTime = Date.now() - 86400000;
      const endTime = Date.now();

      const result = await analyticsService.getPlatformAnalytics({ 
        startTime, 
        endTime,
        timeRange: 'day'
      });

      expect(result.timeRange.startTime).toBe(startTime);
      expect(result.timeRange.endTime).toBe(endTime);
      expect(result.timeRange.range).toBe('day');
    });
  });
}); 