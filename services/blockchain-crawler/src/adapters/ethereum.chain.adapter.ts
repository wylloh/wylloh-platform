import { BaseChainAdapter } from './base.chain.adapter';
import { ChainConfig } from '../interfaces/chain.adapter';
import { logger } from '../utils/logger';

export class EthereumChainAdapter extends BaseChainAdapter {
  constructor(config: ChainConfig) {
    super({
      ...config,
      chainId: '1', // Ethereum mainnet
    });
  }

  // Override getTokenMetadata to handle OpenSea metadata format
  public async getTokenMetadata(tokenAddress: string, tokenId: string): Promise<Record<string, any>> {
    try {
      const metadata = await super.getTokenMetadata(tokenAddress, tokenId);

      // Handle OpenSea-style metadata
      if (metadata.attributes && Array.isArray(metadata.attributes)) {
        metadata.attributes = metadata.attributes.map((attr: any) => ({
          trait_type: attr.trait_type,
          value: attr.value,
          display_type: attr.display_type,
        }));
      }

      return metadata;
    } catch (error) {
      logger.error(`Error getting Ethereum token metadata for ${tokenId} at ${tokenAddress}:`, error);
      throw error;
    }
  }

  // Add Ethereum-specific methods here if needed
  public async getGasPrice(): Promise<bigint> {
    try {
      return await this.provider.getFeeData().then(data => data.gasPrice || 0n);
    } catch (error) {
      logger.error('Error getting Ethereum gas price:', error);
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

      // Estimate based on transaction count and current gas price
      const avgGasPerTx = 50000n; // Conservative estimate
      const totalGas = avgGasPerTx * BigInt(block.transactions.length);
      
      return totalGas * gasPrice;
    } catch (error) {
      logger.error(`Error estimating processing cost for block ${blockNumber}:`, error);
      throw error;
    }
  }
} 