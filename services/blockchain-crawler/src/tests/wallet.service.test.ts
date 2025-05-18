import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { Contract } from 'web3-eth-contract';
import { WalletMonitoringService } from '../services/wallet.service';
import { WalletRegistry } from '../models/wallet.registry';
import { TokenService } from '../services/token.service';
import { ChainAdapterFactory } from '../adapters/chain.adapter.factory';
import { BaseChainAdapter } from '../adapters/base.chain.adapter';
import { Logger } from '../utils/logger';

// Mock dependencies
jest.mock('ioredis');
jest.mock('../models/wallet.registry');
jest.mock('../services/token.service');
jest.mock('../adapters/chain.adapter.factory');

describe('WalletMonitoringService', () => {
  let walletMonitor: WalletMonitoringService;
  let mockRedis: jest.Mocked<Redis>;
  let mockWalletRegistry: jest.Mocked<WalletRegistry>;
  let mockTokenService: jest.Mocked<TokenService>;
  let mockChainAdapterFactory: jest.Mocked<ChainAdapterFactory>;
  let mockLogger: jest.Mocked<Logger>;
  let mockContract: jest.Mocked<Contract>;
  let mockChainAdapter: jest.Mocked<BaseChainAdapter>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instances with required methods
    mockRedis = {
      publish: jest.fn(),
      on: jest.fn(),
      connect: jest.fn(),
      hgetall: jest.fn(),
      hmset: jest.fn(),
      sadd: jest.fn(),
      smembers: jest.fn(),
      keys: jest.fn(),
      hget: jest.fn(),
      hset: jest.fn()
    } as unknown as jest.Mocked<Redis>;

    mockWalletRegistry = {
      registerWallet: jest.fn(),
      deactivateWallet: jest.fn(),
      getUserIdForWallet: jest.fn()
    } as unknown as jest.Mocked<WalletRegistry>;

    mockTokenService = {
      getTokenInfo: jest.fn()
    } as unknown as jest.Mocked<TokenService>;

    // Mock Chain Adapter Factory using singleton pattern
    mockChainAdapterFactory = {
      getAdapter: jest.fn(),
      getInstance: jest.fn()
    } as unknown as jest.Mocked<ChainAdapterFactory>;
    (ChainAdapterFactory as jest.Mocked<typeof ChainAdapterFactory>).getInstance = jest.fn().mockReturnValue(mockChainAdapterFactory);

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as jest.Mocked<Logger>;

    // Mock Contract
    mockContract = {
      events: {
        Transfer: jest.fn().mockReturnValue({
          on: jest.fn().mockReturnThis()
        }),
        BalanceChanged: jest.fn().mockReturnValue({
          on: jest.fn().mockReturnThis()
        }),
        unsubscribe: jest.fn()
      }
    } as unknown as jest.Mocked<Contract>;

    // Mock Chain Adapter
    mockChainAdapter = {
      getWyllohContract: jest.fn().mockResolvedValue(mockContract)
    } as unknown as jest.Mocked<BaseChainAdapter>;

    // Setup Chain Adapter Factory
    mockChainAdapterFactory.getAdapter = jest.fn().mockResolvedValue(mockChainAdapter);

    // Create WalletMonitoringService instance
    walletMonitor = new WalletMonitoringService(
      mockChainAdapterFactory,
      mockWalletRegistry,
      mockTokenService,
      mockRedis,
      mockLogger
    );
  });

  describe('startWalletMonitoring', () => {
    it('should start monitoring a wallet successfully', async () => {
      const walletAddress = '0x123';
      const userId = 'user1';

      await walletMonitor.startWalletMonitoring(walletAddress, userId);

      // Verify wallet registration
      expect(mockWalletRegistry.registerWallet).toHaveBeenCalledWith(walletAddress, userId);

      // Verify chain adapter initialization
      expect(mockChainAdapterFactory.getAdapter).toHaveBeenCalledTimes(3); // ethereum, polygon, bsc

      // Verify event subscriptions
      const chains = ['ethereum', 'polygon', 'bsc'];
      chains.forEach(() => {
        expect(mockContract.events.Transfer).toHaveBeenCalledWith({
          filter: {
            $or: [
              { from: walletAddress },
              { to: walletAddress }
            ]
          }
        });
        expect(mockContract.events.BalanceChanged).toHaveBeenCalledWith({
          filter: { account: walletAddress }
        });
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Started monitoring wallet ${walletAddress}`)
      );
    });

    it('should handle errors when starting wallet monitoring', async () => {
      const walletAddress = '0x123';
      const userId = 'user1';
      const error = new Error('Registration failed');

      mockWalletRegistry.registerWallet.mockRejectedValue(error);

      await expect(walletMonitor.startWalletMonitoring(walletAddress, userId))
        .rejects
        .toThrow('Registration failed');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('handleTransferEvent', () => {
    it('should process distribution rights token transfer correctly', async () => {
      const event = {
        returnValues: {
          from: '0x123',
          to: '0x456',
          tokenId: '1',
          value: '1'
        }
      };
      const walletAddress = '0x456';
      const chain = 'polygon';

      // Mock token info for a distribution rights token
      const tokenInfo = {
        type: 'distribution',
        rights: ['streaming', 'theatrical'],
        region: 'global'
      };
      mockTokenService.getTokenInfo.mockResolvedValue(tokenInfo);

      // Create spy for emit
      const emitSpy = jest.spyOn(walletMonitor, 'emit');

      // Call private method using any type assertion
      await (walletMonitor as any).handleTransferEvent(event, walletAddress, chain);

      // Verify user library update
      expect(mockRedis.publish).toHaveBeenCalledWith(
        'library:update',
        expect.stringContaining('"tokenId":"1"')
      );

      // Verify global store update
      expect(mockRedis.publish).toHaveBeenCalledWith(
        'store:update',
        expect.stringContaining('"tokenId":"1"')
      );

      // Verify event emission
      expect(emitSpy).toHaveBeenCalledWith('transfer', expect.objectContaining({
        chain,
        from: '0x123',
        to: '0x456',
        tokenId: '1',
        value: '1'
      }));
    });
  });

  describe('stopWalletMonitoring', () => {
    it('should stop monitoring a wallet successfully', async () => {
      const walletAddress = '0x123';

      await walletMonitor.stopWalletMonitoring(walletAddress);

      // Verify event unsubscriptions
      expect(mockContract.events.Transfer().unsubscribe).toHaveBeenCalled();
      expect(mockContract.events.BalanceChanged().unsubscribe).toHaveBeenCalled();

      // Verify wallet deactivation
      expect(mockWalletRegistry.deactivateWallet).toHaveBeenCalledWith(walletAddress);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Stopped monitoring wallet ${walletAddress}`)
      );
    });

    it('should handle errors when stopping wallet monitoring', async () => {
      const walletAddress = '0x123';
      const error = new Error('Deactivation failed');

      mockWalletRegistry.deactivateWallet.mockRejectedValue(error);

      await expect(walletMonitor.stopWalletMonitoring(walletAddress))
        .rejects
        .toThrow('Deactivation failed');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
}); 