import { BaseChainAdapter } from './base.chain.adapter';
import { ChainConfig } from '../interfaces/chain.adapter';
import { logger } from '../utils/logger';

export class BSCChainAdapter extends BaseChainAdapter {
  constructor(config: ChainConfig) {
    super({
      ...config,
      chainId: '56', // BSC mainnet
    });
  }

  // Override getTokenMetadata to handle BSC-specific metadata services
  public async getTokenMetadata(tokenAddress: string, tokenId: string): Promise<Record<string, any>> {
    try {
      const metadata = await super.getTokenMetadata(tokenAddress, tokenId);

      // Add BSC-specific metadata handling
      if (metadata.attributes && !Array.isArray(metadata.attributes)) {
        // Some BSC tokens store attributes as an object
        metadata.attributes = Object.entries(metadata.attributes).map(([key, value]) => ({
          trait_type: key,
          value: value,
        }));
      }

      return metadata;
    } catch (error) {
      logger.error(`Error getting BSC token metadata for ${tokenId} at ${tokenAddress}:`, error);
      throw error;
    }
  }

  // Add BSC-specific methods
  public async getGasPrice(): Promise<bigint> {
    try {
      // BSC has a more stable gas price, but we still fetch it
      const gasPrice = await this.provider.getFeeData().then(data => data.gasPrice || BigInt(5000000000)); // 5 gwei default
      return gasPrice;
    } catch (error) {
      logger.error('Error getting BSC gas price:', error);
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

      // BSC has high TPS but lower gas costs
      const avgGasPerTx = BigInt(60000); // Lower estimate for BSC
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

      // BSC produces blocks every 3 seconds, so we allow for a larger gap
      return Math.abs(networkBlock - latestBlock) <= 20;
    } catch (error) {
      logger.error('Error checking BSC sync status:', error);
      return false;
    }
  }

  // Add method to check if we're connected to a BSC node
  public async verifyBSCNode(): Promise<boolean> {
    try {
      const network = await this.provider.getNetwork();
      return network.chainId === 56n;
    } catch (error) {
      logger.error('Error verifying BSC node:', error);
      return false;
    }
  }
} 