import Redis from 'ioredis';
import { WalletRegistry } from '../models/wallet.registry';
import { Logger } from '../utils/logger';

// Mock Redis
jest.mock('ioredis');

describe('WalletRegistry', () => {
  let walletRegistry: WalletRegistry;
  let mockRedis: jest.Mocked<Redis>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock Redis instance with required methods
    mockRedis = {
      hgetall: jest.fn(),
      hmset: jest.fn(),
      sadd: jest.fn(),
      smembers: jest.fn(),
      keys: jest.fn(),
      hget: jest.fn(),
      hset: jest.fn(),
      on: jest.fn(),
      connect: jest.fn()
    } as unknown as jest.Mocked<Redis>;

    // Create mock Logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as jest.Mocked<Logger>;

    // Create WalletRegistry instance
    walletRegistry = new WalletRegistry(mockRedis, mockLogger);
  });

  describe('registerWallet', () => {
    it('should register a new wallet successfully', async () => {
      const walletAddress = '0x123';
      const userId = 'user1';

      // Mock Redis responses
      mockRedis.hgetall.mockResolvedValue({});
      mockRedis.hmset.mockResolvedValue('OK');
      mockRedis.sadd.mockResolvedValue(1);

      await walletRegistry.registerWallet(walletAddress, userId);

      // Verify Redis calls
      expect(mockRedis.hgetall).toHaveBeenCalledWith('wallet:0x123');
      expect(mockRedis.hmset).toHaveBeenCalledWith(
        'wallet:0x123',
        expect.objectContaining({
          userId,
          isActive: 'true',
          chains: JSON.stringify(['ethereum', 'polygon', 'bsc'])
        })
      );
      expect(mockRedis.sadd).toHaveBeenCalledWith('user:wallets:user1', walletAddress);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should throw error if wallet is already registered to another user', async () => {
      const walletAddress = '0x123';
      const userId = 'user1';

      // Mock Redis response for existing wallet
      mockRedis.hgetall.mockResolvedValue({ userId: 'user2' });

      await expect(walletRegistry.registerWallet(walletAddress, userId))
        .rejects
        .toThrow('Wallet 0x123 is already registered to another user');

      expect(mockRedis.hmset).not.toHaveBeenCalled();
      expect(mockRedis.sadd).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getUserIdForWallet', () => {
    it('should return userId for registered wallet', async () => {
      const walletAddress = '0x123';
      const userId = 'user1';

      mockRedis.hget.mockResolvedValue(userId);

      const result = await walletRegistry.getUserIdForWallet(walletAddress);

      expect(result).toBe(userId);
      expect(mockRedis.hget).toHaveBeenCalledWith('wallet:0x123', 'userId');
    });

    it('should return null for unregistered wallet', async () => {
      const walletAddress = '0x123';

      mockRedis.hget.mockResolvedValue(null);

      const result = await walletRegistry.getUserIdForWallet(walletAddress);

      expect(result).toBeNull();
      expect(mockRedis.hget).toHaveBeenCalledWith('wallet:0x123', 'userId');
    });
  });

  describe('getWalletsForUser', () => {
    it('should return all wallets for a user', async () => {
      const userId = 'user1';
      const wallets = ['0x123', '0x456'];

      mockRedis.smembers.mockResolvedValue(wallets);

      const result = await walletRegistry.getWalletsForUser(userId);

      expect(result).toEqual(wallets);
      expect(mockRedis.smembers).toHaveBeenCalledWith('user:wallets:user1');
    });

    it('should return empty array if user has no wallets', async () => {
      const userId = 'user1';

      mockRedis.smembers.mockResolvedValue([]);

      const result = await walletRegistry.getWalletsForUser(userId);

      expect(result).toEqual([]);
      expect(mockRedis.smembers).toHaveBeenCalledWith('user:wallets:user1');
    });
  });

  describe('getAllActiveWallets', () => {
    it('should return all active wallets', async () => {
      const walletKeys = ['wallet:0x123', 'wallet:0x456', 'wallet:0x789'];
      const walletData = {
        '0x123': { isActive: 'true' },
        '0x456': { isActive: 'false' },
        '0x789': { isActive: 'true' }
      };

      mockRedis.keys.mockResolvedValue(walletKeys);
      mockRedis.hgetall.mockImplementation(async (key) => {
        const address = key.replace('wallet:', '');
        return walletData[address];
      });

      const result = await walletRegistry.getAllActiveWallets();

      expect(result).toEqual(['0x123', '0x789']);
      expect(mockRedis.keys).toHaveBeenCalledWith('wallet:*');
      expect(mockRedis.hgetall).toHaveBeenCalledTimes(3);
    });
  });

  describe('getWalletsNeedingSync', () => {
    it('should return wallets needing sync', async () => {
      const now = Date.now();
      const threshold = 1000 * 60 * 15; // 15 minutes
      const walletKeys = ['wallet:0x123', 'wallet:0x456'];
      const walletData = {
        '0x123': { isActive: 'true', lastSyncTimestamp: now - threshold - 1000 },
        '0x456': { isActive: 'true', lastSyncTimestamp: now }
      };

      mockRedis.keys.mockResolvedValue(walletKeys);
      mockRedis.hgetall.mockImplementation(async (key) => {
        const address = key.replace('wallet:', '');
        return walletData[address];
      });

      const result = await walletRegistry.getWalletsNeedingSync(threshold);

      expect(result).toEqual(['0x123']);
      expect(mockRedis.keys).toHaveBeenCalledWith('wallet:*');
      expect(mockRedis.hgetall).toHaveBeenCalledTimes(2);
    });
  });

  describe('deactivateWallet', () => {
    it('should deactivate a wallet', async () => {
      const walletAddress = '0x123';

      mockRedis.hset.mockResolvedValue(1);

      await walletRegistry.deactivateWallet(walletAddress);

      expect(mockRedis.hset).toHaveBeenCalledWith('wallet:0x123', 'isActive', 'false');
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should handle errors when deactivating wallet', async () => {
      const walletAddress = '0x123';
      const error = new Error('Redis error');

      mockRedis.hset.mockRejectedValue(error);

      await expect(walletRegistry.deactivateWallet(walletAddress))
        .rejects
        .toThrow('Redis error');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
}); 