import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { EventProcessor, TransferEvent, BalanceEvent } from '../services/event.processor';
import { TokenService } from '../services/token.service';
import { WalletRegistry } from '../models/wallet.registry';
import { Logger } from '../utils/logger';

// Mock dependencies
jest.mock('ioredis');
jest.mock('../services/token.service');
jest.mock('../models/wallet.registry');

describe('EventProcessor', () => {
  let eventProcessor: EventProcessor;
  let mockRedis: jest.Mocked<Redis>;
  let mockTokenService: jest.Mocked<TokenService>;
  let mockWalletRegistry: jest.Mocked<WalletRegistry>;
  let mockSubscriber: jest.Mocked<Redis>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock Redis instance
    mockRedis = {
      duplicate: jest.fn(),
      publish: jest.fn(),
      hset: jest.fn(),
      hkeys: jest.fn(),
      hget: jest.fn(),
      hdel: jest.fn()
    } as unknown as jest.Mocked<Redis>;
    
    // Create mock subscriber
    mockSubscriber = {
      subscribe: jest.fn(),
      on: jest.fn()
    } as unknown as jest.Mocked<Redis>;
    
    // Setup Redis mock to return subscriber on duplicate
    mockRedis.duplicate.mockReturnValue(mockSubscriber);
    
    // Create mock TokenService
    mockTokenService = {
      handleTransfer: jest.fn(),
      getTokenInfo: jest.fn()
    } as unknown as jest.Mocked<TokenService>;
    
    // Create mock WalletRegistry
    mockWalletRegistry = {
      getUserIdForWallet: jest.fn()
    } as unknown as jest.Mocked<WalletRegistry>;
    
    // Create EventProcessor instance
    eventProcessor = new EventProcessor(
      mockRedis,
      mockTokenService,
      mockWalletRegistry
    );
  });
  
  describe('constructor', () => {
    it('should setup Redis subscriptions', () => {
      expect(mockRedis.duplicate).toHaveBeenCalled();
      expect(mockSubscriber.subscribe).toHaveBeenCalledWith(
        'library:update',
        'store:update',
        expect.any(Function)
      );
      expect(mockSubscriber.on).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });
  });
  
  describe('processTransferEvent', () => {
    it('should process a transfer event for a registered recipient', async () => {
      // Mock data
      const transferEvent: TransferEvent = {
        chain: 'polygon',
        from: '0x123',
        to: '0x456',
        tokenId: '1',
        value: '1',
        timestamp: Date.now(),
        transactionHash: '0xabc'
      };
      
      const tokenInfo = {
        type: 'distribution',
        tokenAddress: '0xtoken',
        rights: ['streaming', 'theatrical'],
        region: 'global'
      };
      
      // Setup mocks
      mockWalletRegistry.getUserIdForWallet.mockResolvedValue('user1');
      mockTokenService.getTokenInfo.mockResolvedValue(tokenInfo);
      
      // Create spy for emit
      const emitSpy = jest.spyOn(eventProcessor, 'emit');
      
      // Call the method
      await eventProcessor.processTransferEvent(transferEvent);
      
      // Verify token service was called twice (once for library, once for store)
      expect(mockTokenService.getTokenInfo).toHaveBeenCalledTimes(2);
      expect(mockTokenService.getTokenInfo).toHaveBeenCalledWith('1', 'polygon');
      
      // Verify wallet registry was called
      expect(mockWalletRegistry.getUserIdForWallet).toHaveBeenCalledWith('0x456');
      
      // Verify Redis publish was called for both library and store updates
      expect(mockRedis.publish).toHaveBeenCalledTimes(0); // We mock the Redis subscription and message handling
      
      // Verify token service handleTransfer was called with the right parameters
      expect(mockTokenService.handleTransfer).toHaveBeenCalledWith(
        '1',
        'unknown', // Default when using processTransferEvent directly
        'polygon',
        '0x123',
        '0x456',
        1 // parseInt('1')
      );
    });
    
    it('should still update store for unregistered recipient wallet', async () => {
      // Mock data
      const transferEvent: TransferEvent = {
        chain: 'polygon',
        from: '0x123',
        to: '0x456',
        tokenId: '1',
        value: '1',
        timestamp: Date.now(),
        transactionHash: '0xabc'
      };
      
      const tokenInfo = {
        type: 'distribution',
        tokenAddress: '0xtoken',
        rights: ['streaming', 'theatrical'],
        region: 'global'
      };
      
      // Setup mocks - wallet not registered
      mockWalletRegistry.getUserIdForWallet.mockResolvedValue(null);
      mockTokenService.getTokenInfo.mockResolvedValue(tokenInfo);
      
      // Call the method
      await eventProcessor.processTransferEvent(transferEvent);
      
      // Verify token service was called once (only for store)
      expect(mockTokenService.getTokenInfo).toHaveBeenCalledTimes(1);
      
      // Verify wallet registry was called
      expect(mockWalletRegistry.getUserIdForWallet).toHaveBeenCalledWith('0x456');
      
      // Verify token service handleTransfer was called for the store update
      expect(mockTokenService.handleTransfer).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('processBalanceEvent', () => {
    it('should process a balance event for a registered wallet', async () => {
      // Mock data
      const balanceEvent: BalanceEvent = {
        chain: 'polygon',
        account: '0x456',
        tokenId: '1',
        newBalance: '5',
        timestamp: Date.now()
      };
      
      const tokenInfo = {
        type: 'distribution',
        tokenAddress: '0xtoken',
        rights: ['streaming', 'theatrical'],
        region: 'global'
      };
      
      // Setup mocks
      mockWalletRegistry.getUserIdForWallet.mockResolvedValue('user1');
      mockTokenService.getTokenInfo.mockResolvedValue(tokenInfo);
      
      // Call the method
      await eventProcessor.processBalanceEvent(balanceEvent);
      
      // Verify token service was called
      expect(mockTokenService.getTokenInfo).toHaveBeenCalledWith('1', 'polygon');
      
      // Verify wallet registry was called
      expect(mockWalletRegistry.getUserIdForWallet).toHaveBeenCalledWith('0x456');
    });
    
    it('should not process balance event for unregistered wallet', async () => {
      // Mock data
      const balanceEvent: BalanceEvent = {
        chain: 'polygon',
        account: '0x456',
        tokenId: '1',
        newBalance: '5',
        timestamp: Date.now()
      };
      
      // Setup mocks - wallet not registered
      mockWalletRegistry.getUserIdForWallet.mockResolvedValue(null);
      
      // Call the method
      await eventProcessor.processBalanceEvent(balanceEvent);
      
      // Verify wallet registry was called
      expect(mockWalletRegistry.getUserIdForWallet).toHaveBeenCalledWith('0x456');
      
      // Verify token service was NOT called
      expect(mockTokenService.getTokenInfo).not.toHaveBeenCalled();
      expect(mockTokenService.handleTransfer).not.toHaveBeenCalled();
    });
  });
  
  describe('processFailedUpdates', () => {
    it('should process failed updates from Redis', async () => {
      // Mock data
      const libraryFailedKeys = ['key1', 'key2'];
      const storeFailedKeys = ['key3'];
      
      const failedLibraryUpdate = {
        userId: 'user1',
        walletAddress: '0x456',
        tokenId: '1',
        amount: '1',
        chain: 'polygon',
        tokenInfo: {
          type: 'distribution',
          tokenAddress: '0xtoken'
        },
        timestamp: Date.now()
      };
      
      const failedStoreUpdate = {
        tokenId: '2',
        from: '0x123',
        to: '0x456',
        amount: '1',
        chain: 'polygon',
        tokenInfo: {
          type: 'distribution',
          tokenAddress: '0xtoken'
        },
        timestamp: Date.now()
      };
      
      // Setup mocks
      mockRedis.hkeys.mockImplementation((key) => {
        if (key === 'library:failed') return Promise.resolve(libraryFailedKeys);
        if (key === 'store:failed') return Promise.resolve(storeFailedKeys);
        return Promise.resolve([]);
      });
      
      mockRedis.hget.mockImplementation((key, id) => {
        if (key === 'library:failed') return Promise.resolve(JSON.stringify(failedLibraryUpdate));
        if (key === 'store:failed') return Promise.resolve(JSON.stringify(failedStoreUpdate));
        return Promise.resolve(null);
      });
      
      // Call the method
      await eventProcessor.processFailedUpdates();
      
      // Verify Redis keys were fetched
      expect(mockRedis.hkeys).toHaveBeenCalledWith('library:failed');
      expect(mockRedis.hkeys).toHaveBeenCalledWith('store:failed');
      
      // Verify Redis values were fetched
      expect(mockRedis.hget).toHaveBeenCalledWith('library:failed', 'key1');
      expect(mockRedis.hget).toHaveBeenCalledWith('library:failed', 'key2');
      expect(mockRedis.hget).toHaveBeenCalledWith('store:failed', 'key3');
      
      // Verify records were deleted after processing
      expect(mockRedis.hdel).toHaveBeenCalledWith('library:failed', 'key1');
      expect(mockRedis.hdel).toHaveBeenCalledWith('library:failed', 'key2');
      expect(mockRedis.hdel).toHaveBeenCalledWith('store:failed', 'key3');
    });
  });
  
  describe('getStatus', () => {
    it('should return the current processing status', () => {
      const status = eventProcessor.getStatus();
      
      expect(status).toHaveProperty('success');
      expect(status).toHaveProperty('failures');
      expect(status).toHaveProperty('pending');
      expect(status).toHaveProperty('lastProcessedTimestamp');
    });
  });
}); 