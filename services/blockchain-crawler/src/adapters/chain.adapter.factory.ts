import { JsonRpcProvider } from 'ethers';
import { ChainAdapter, ChainConfig } from '../interfaces/chain.adapter';
import { workerConfig } from '../../config/worker';
import { logger } from '../../utils/logger';

export class ChainAdapterFactory {
  private static instance: ChainAdapterFactory;
  private adapters: Map<string, ChainAdapter>;

  private constructor() {
    this.adapters = new Map();
  }

  public static getInstance(): ChainAdapterFactory {
    if (!ChainAdapterFactory.instance) {
      ChainAdapterFactory.instance = new ChainAdapterFactory();
    }
    return ChainAdapterFactory.instance;
  }

  public async getAdapter(chainId: string): Promise<ChainAdapter | null> {
    // Return existing adapter if available
    if (this.adapters.has(chainId)) {
      return this.adapters.get(chainId)!;
    }

    // Get chain configuration
    const chainConfig = this.getChainConfig(chainId);
    if (!chainConfig) {
      logger.error(`No configuration found for chain ${chainId}`);
      return null;
    }

    try {
      // Create new adapter
      const adapter = await this.createAdapter(chainConfig);
      this.adapters.set(chainId, adapter);
      return adapter;
    } catch (error) {
      logger.error(`Failed to create adapter for chain ${chainId}:`, error);
      return null;
    }
  }

  public async initializeAllAdapters(): Promise<void> {
    try {
      const chains = Object.keys(workerConfig.chains);
      const initPromises = chains.map(chainId => this.getAdapter(chainId));
      await Promise.all(initPromises);
      logger.info('All chain adapters initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize all chain adapters:', error);
      throw error;
    }
  }

  public getAllAdapters(): ChainAdapter[] {
    return Array.from(this.adapters.values());
  }

  private getChainConfig(chainId: string): ChainConfig | null {
    const chains = workerConfig.chains as Record<string, any>;
    if (!chains[chainId]) {
      return null;
    }

    return {
      rpcUrl: chains[chainId].rpcUrl,
      startBlock: chains[chainId].startBlock,
      confirmations: chains[chainId].confirmations,
      chainId
    };
  }

  private async createAdapter(config: ChainConfig): Promise<ChainAdapter> {
    // Create provider
    const provider = new JsonRpcProvider(config.rpcUrl);

    // Validate provider connection
    try {
      await provider.getNetwork();
    } catch (error) {
      logger.error(`Failed to connect to RPC for chain ${config.chainId}:`, error);
      throw error;
    }

    // Create and return chain-specific adapter
    switch (config.chainId) {
      case 'ethereum':
        const { EthereumChainAdapter } = await import('./ethereum.chain.adapter');
        return new EthereumChainAdapter(provider, config);
      case 'polygon':
        const { PolygonChainAdapter } = await import('./polygon.chain.adapter');
        return new PolygonChainAdapter(provider, config);
      case 'bsc':
        const { BSCChainAdapter } = await import('./bsc.chain.adapter');
        return new BSCChainAdapter(provider, config);
      default:
        throw new Error(`Unsupported chain: ${config.chainId}`);
    }
  }

  public async clearAdapter(chainId: string): Promise<void> {
    const adapter = this.adapters.get(chainId);
    if (adapter) {
      // Clean up adapter resources if needed
      this.adapters.delete(chainId);
    }
  }

  public async clearAllAdapters(): Promise<void> {
    for (const chainId of this.adapters.keys()) {
      await this.clearAdapter(chainId);
    }
  }
} 