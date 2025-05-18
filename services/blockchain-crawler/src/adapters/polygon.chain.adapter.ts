import { BaseChainAdapter } from './base.chain.adapter';
import { ChainConfig } from '../interfaces/chain.adapter';
import { logger } from '../utils/logger';

export class PolygonChainAdapter extends BaseChainAdapter {
  constructor(config: ChainConfig) {
    super({
      ...config,
      chainId: '137', // Polygon mainnet
    });
  }

  // Override getTokenMetadata to handle Polygon-specific metadata services
  public async getTokenMetadata(tokenAddress: string, tokenId: string): Promise<Record<string, any>> {
    try {
      const metadata = await super.getTokenMetadata(tokenAddress, tokenId);

      // Add Polygon-specific metadata handling
      if (metadata.properties) {
        metadata.attributes = Object.entries(metadata.properties).map(([key, value]) => ({
          trait_type: key,
          value: value,
        }));
      }

      return metadata;
    } catch (error) {
      logger.error(`Error getting Polygon token metadata for ${tokenId} at ${tokenAddress}:`, error);
      throw error;
    }
  }

  // Add Polygon-specific methods
  public async getGasPrice(): Promise<bigint> {
    try {
      const [standard, maxPriority] = await Promise.all([
        this.provider.getFeeData().then(data => data.gasPrice || BigInt(30000000000)), // 30 gwei default
        this.provider.send('eth_maxPriorityFeePerGas', []),
      ]);

      const maxPriorityFee = BigInt(maxPriority || '0x2540BE400'); // 10 gwei default
      return standard + maxPriorityFee;
    } catch (error) {
      logger.error('Error getting Polygon gas price:', error);
      throw error;
    }
  }

  public async estimateProcessingCost(blockNumber: number): Promise<bigint> {
    try {
      const [block, gasPrice] = await Promise.all([
        this.getBlock(blockNumber),
        this.getGasPrice(),
      ]);

      if (!block) throw new Error(`Block ${blockNumber} not found`);

      // Polygon typically has more transactions per block
      const avgGasPerTx = BigInt(80000); // Higher estimate for Polygon
      const totalGas = avgGasPerTx * BigInt(block.transactions.length);
      
      return totalGas * gasPrice;
    } catch (error) {
      logger.error(`Error estimating processing cost for block ${blockNumber}:`, error);
      throw error;
    }
  }

  // Add method to check if we're synced with the network
  public async isSynced(): Promise<boolean> {
    try {
      const latestBlock = await this.getLatestBlock();
      const networkBlock = parseInt(
        await this.provider.send('eth_blockNumber', []),
        16
      );

      // Consider synced if we're within 10 blocks
      return Math.abs(networkBlock - latestBlock) <= 10;
    } catch (error) {
      logger.error('Error checking Polygon sync status:', error);
      return false;
    }
  }
} 