import { JsonRpcProvider, Block, TransactionResponse } from 'ethers';
import { ChainAdapter, ChainConfig, TokenEvent, ListingEvent, PurchaseEvent } from '../interfaces/chain.adapter';
import { logger } from '../utils/logger';

export abstract class BaseChainAdapter implements ChainAdapter {
  public readonly wyllohAbi: readonly string[] = [
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event TokenListed(uint256 indexed tokenId, address indexed seller, uint256 price, uint256 quantity)',
    'event TokenPurchased(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 quantity)',
    'function isWyllohVerified() external view returns (bool)',
    'function contentType() external view returns (string)',
    'function supportsInterface(bytes4 interfaceId) external view returns (bool)',
  ];

  constructor(
    public readonly provider: JsonRpcProvider,
    public readonly config: ChainConfig
  ) {}

  public async getLatestBlock(): Promise<number> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      return blockNumber;
    } catch (error) {
      logger.error(`Error getting latest block for chain ${this.config.chainId}:`, error);
      throw error;
    }
  }

  public async getBlock(blockNumber: number): Promise<Block | null> {
    try {
      const block = await this.provider.getBlock(blockNumber, true);
      return block;
    } catch (error) {
      logger.error(`Error getting block ${blockNumber} for chain ${this.config.chainId}:`, error);
      throw error;
    }
  }

  public async getTransaction(txHash: string): Promise<TransactionResponse | null> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      return tx;
    } catch (error) {
      logger.error(`Error getting transaction ${txHash} for chain ${this.config.chainId}:`, error);
      throw error;
    }
  }

  public async isConnected(): Promise<boolean> {
    try {
      const network = await this.provider.getNetwork();
      return network !== null;
    } catch (error) {
      logger.error(`Error checking connection for chain ${this.config.chainId}:`, error);
      return false;
    }
  }

  public async getChainStatus(): Promise<{ latestBlock: number; syncStatus: boolean; peerCount: number }> {
    try {
      const [latestBlock, peerCount] = await Promise.all([
        this.getLatestBlock(),
        this.provider.getNetwork().then(() => 1), // Simplified peer count for RPC providers
      ]);

      return {
        latestBlock,
        syncStatus: true, // Simplified sync status for RPC providers
        peerCount,
      };
    } catch (error) {
      logger.error(`Error getting chain status for ${this.config.chainId}:`, error);
      throw error;
    }
  }

  public async isContractAddress(address: string): Promise<boolean> {
    try {
      const code = await this.provider.getCode(address);
      return code !== '0x';
    } catch (error) {
      logger.error(`Error checking contract address ${address} on chain ${this.config.chainId}:`, error);
      return false;
    }
  }

  // These methods should be implemented by chain-specific adapters
  public abstract processTransferEvent(event: any): Promise<TokenEvent>;
  public abstract processListingEvent(event: any): Promise<ListingEvent>;
  public abstract processPurchaseEvent(event: any): Promise<PurchaseEvent>;
  public abstract getTokenMetadata(tokenAddress: string, tokenId: string): Promise<Record<string, any>>;
} 