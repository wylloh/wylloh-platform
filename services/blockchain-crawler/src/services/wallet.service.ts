import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { Contract } from 'web3-eth-contract';
import { ChainAdapterFactory } from '../adapters/chain.adapter.factory';
import { BaseChainAdapter } from '../adapters/base.chain.adapter';
import { WalletRegistry } from '../models/wallet.registry';
import { TokenService } from './token.service';
import { Logger } from '../utils/logger';

export class WalletMonitoringService extends EventEmitter {
  private chainAdapters: Map<string, BaseChainAdapter>;
  private wyllohContracts: Map<string, Contract>;
  private walletRegistry: WalletRegistry;
  private tokenService: TokenService;
  private redis: Redis;
  private logger: Logger;

  constructor(
    chainAdapterFactory: ChainAdapterFactory,
    walletRegistry: WalletRegistry,
    tokenService: TokenService,
    redis: Redis,
    logger: Logger
  ) {
    super();
    this.chainAdapters = new Map();
    this.wyllohContracts = new Map();
    this.walletRegistry = walletRegistry;
    this.tokenService = tokenService;
    this.redis = redis;
    this.logger = logger;

    // Initialize chain adapters
    this.initializeChainAdapters(chainAdapterFactory);
  }

  private async initializeChainAdapters(factory: ChainAdapterFactory) {
    const chains = ['ethereum', 'polygon', 'bsc'];
    for (const chain of chains) {
      const adapter = await factory.getAdapter(chain);
      this.chainAdapters.set(chain, adapter);
      
      // Initialize Wylloh contract for each chain
      const contract = await adapter.getWyllohContract();
      this.wyllohContracts.set(chain, contract);
    }
  }

  /**
   * Start monitoring a specific wallet
   */
  public async startWalletMonitoring(walletAddress: string, userId: string): Promise<void> {
    try {
      // Register wallet if not already registered
      await this.walletRegistry.registerWallet(walletAddress, userId);

      // Start monitoring on all chains
      for (const [chain, adapter] of this.chainAdapters) {
        await this.monitorWalletOnChain(walletAddress, chain, adapter);
      }

      this.logger.info(`Started monitoring wallet ${walletAddress} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error starting wallet monitoring: ${error.message}`);
      throw error;
    }
  }

  /**
   * Monitor wallet on a specific chain
   */
  private async monitorWalletOnChain(
    walletAddress: string,
    chain: string,
    adapter: BaseChainAdapter
  ): Promise<void> {
    const contract = this.wyllohContracts.get(chain);
    if (!contract) {
      throw new Error(`No Wylloh contract found for chain ${chain}`);
    }

    // Subscribe to Transfer events involving this wallet
    contract.events.Transfer({
      filter: {
        $or: [
          { from: walletAddress },
          { to: walletAddress }
        ]
      }
    })
    .on('data', async (event) => {
      await this.handleTransferEvent(event, walletAddress, chain);
    })
    .on('error', (error) => {
      this.logger.error(`Error in transfer event subscription: ${error.message}`);
    });

    // Monitor token balance changes
    contract.events.BalanceChanged({
      filter: { account: walletAddress }
    })
    .on('data', async (event) => {
      await this.handleBalanceEvent(event, walletAddress, chain);
    })
    .on('error', (error) => {
      this.logger.error(`Error in balance event subscription: ${error.message}`);
    });
  }

  /**
   * Handle transfer events
   */
  private async handleTransferEvent(event: any, walletAddress: string, chain: string): Promise<void> {
    try {
      const { from, to, tokenId, value } = event.returnValues;
      
      // Update Library if this wallet is receiving tokens
      if (to.toLowerCase() === walletAddress.toLowerCase()) {
        await this.updateUserLibrary(walletAddress, tokenId, value, chain);
      }

      // Update Store regardless of direction
      await this.updateGlobalStore(tokenId, from, to, value, chain);

      // Emit event for real-time updates
      this.emit('transfer', {
        chain,
        from,
        to,
        tokenId,
        value,
        timestamp: Date.now()
      });
    } catch (error) {
      this.logger.error(`Error handling transfer event: ${error.message}`);
    }
  }

  /**
   * Handle balance change events
   */
  private async handleBalanceEvent(event: any, walletAddress: string, chain: string): Promise<void> {
    try {
      const { account, tokenId, newBalance } = event.returnValues;
      
      // Update user's library
      await this.updateUserLibrary(account, tokenId, newBalance, chain);

      // Emit event for real-time updates
      this.emit('balanceChanged', {
        chain,
        account,
        tokenId,
        newBalance,
        timestamp: Date.now()
      });
    } catch (error) {
      this.logger.error(`Error handling balance event: ${error.message}`);
    }
  }

  /**
   * Update user's library with new token information
   */
  private async updateUserLibrary(
    walletAddress: string,
    tokenId: string,
    amount: string,
    chain: string
  ): Promise<void> {
    try {
      const userId = await this.walletRegistry.getUserIdForWallet(walletAddress);
      if (!userId) {
        this.logger.warn(`No user found for wallet ${walletAddress}`);
        return;
      }

      const tokenInfo = await this.tokenService.getTokenInfo(tokenId, chain);
      await this.redis.publish('library:update', JSON.stringify({
        userId,
        walletAddress,
        tokenId,
        amount,
        chain,
        tokenInfo
      }));
    } catch (error) {
      this.logger.error(`Error updating user library: ${error.message}`);
    }
  }

  /**
   * Update global store with token transfer information
   */
  private async updateGlobalStore(
    tokenId: string,
    from: string,
    to: string,
    amount: string,
    chain: string
  ): Promise<void> {
    try {
      const tokenInfo = await this.tokenService.getTokenInfo(tokenId, chain);
      await this.redis.publish('store:update', JSON.stringify({
        tokenId,
        from,
        to,
        amount,
        chain,
        tokenInfo,
        timestamp: Date.now()
      }));
    } catch (error) {
      this.logger.error(`Error updating global store: ${error.message}`);
    }
  }

  /**
   * Stop monitoring a specific wallet
   */
  public async stopWalletMonitoring(walletAddress: string): Promise<void> {
    try {
      // Unsubscribe from events for this wallet
      for (const [chain, contract] of this.wyllohContracts) {
        contract.events.Transfer().unsubscribe();
        contract.events.BalanceChanged().unsubscribe();
      }

      // Update wallet registry
      await this.walletRegistry.deactivateWallet(walletAddress);

      this.logger.info(`Stopped monitoring wallet ${walletAddress}`);
    } catch (error) {
      this.logger.error(`Error stopping wallet monitoring: ${error.message}`);
      throw error;
    }
  }
} 