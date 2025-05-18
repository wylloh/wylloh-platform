import { JsonRpcProvider, Block, TransactionResponse, Contract } from 'ethers';
import { ChainAdapter, ChainConfig, TokenEvent, ListingEvent, PurchaseEvent } from '../interfaces/chain.adapter';
import { logger } from '../utils/logger';

export abstract class BaseChainAdapter implements ChainAdapter {
  public readonly provider: JsonRpcProvider;
  protected readonly wyllohAbi = [
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event TokenListed(address indexed seller, uint256 indexed tokenId, uint256 price, uint256 quantity)',
    'event TokenPurchased(address indexed buyer, address indexed seller, uint256 indexed tokenId, uint256 quantity)',
    'function tokenURI(uint256 tokenId) view returns (string)',
  ];

  constructor(public readonly config: ChainConfig) {
    this.provider = new JsonRpcProvider(config.rpcUrl);
  }

  public async getLatestBlock(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      logger.error(`Error getting latest block for chain ${this.config.chainId}:`, error);
      throw error;
    }
  }

  public async getBlock(blockNumber: number): Promise<Block | null> {
    try {
      return await this.provider.getBlock(blockNumber);
    } catch (error) {
      logger.error(`Error getting block ${blockNumber} for chain ${this.config.chainId}:`, error);
      throw error;
    }
  }

  public async getTransaction(txHash: string): Promise<TransactionResponse | null> {
    try {
      return await this.provider.getTransaction(txHash);
    } catch (error) {
      logger.error(`Error getting transaction ${txHash} for chain ${this.config.chainId}:`, error);
      throw error;
    }
  }

  public async processTransferEvent(event: any): Promise<TokenEvent> {
    try {
      const block = await this.getBlock(event.blockNumber);
      if (!block) throw new Error(`Block ${event.blockNumber} not found`);

      return {
        tokenId: event.args.tokenId.toString(),
        from: event.args.from,
        to: event.args.to,
        amount: 1, // ERC-721 transfer
        tokenAddress: event.address,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: block.timestamp,
      };
    } catch (error) {
      logger.error(`Error processing transfer event:`, error);
      throw error;
    }
  }

  public async processListingEvent(event: any): Promise<ListingEvent> {
    try {
      const block = await this.getBlock(event.blockNumber);
      if (!block) throw new Error(`Block ${event.blockNumber} not found`);

      return {
        tokenId: event.args.tokenId.toString(),
        seller: event.args.seller,
        price: event.args.price.toString(),
        quantity: event.args.quantity.toNumber(),
        tokenAddress: event.address,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: block.timestamp,
      };
    } catch (error) {
      logger.error(`Error processing listing event:`, error);
      throw error;
    }
  }

  public async processPurchaseEvent(event: any): Promise<PurchaseEvent> {
    try {
      const block = await this.getBlock(event.blockNumber);
      if (!block) throw new Error(`Block ${event.blockNumber} not found`);

      return {
        tokenId: event.args.tokenId.toString(),
        buyer: event.args.buyer,
        seller: event.args.seller,
        quantity: event.args.quantity.toNumber(),
        tokenAddress: event.address,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: block.timestamp,
      };
    } catch (error) {
      logger.error(`Error processing purchase event:`, error);
      throw error;
    }
  }

  public async isContractAddress(address: string): Promise<boolean> {
    try {
      const code = await this.provider.getCode(address);
      return code !== '0x';
    } catch (error) {
      logger.error(`Error checking if address ${address} is a contract:`, error);
      throw error;
    }
  }

  public async getTokenMetadata(tokenAddress: string, tokenId: string): Promise<Record<string, any>> {
    try {
      const contract = new Contract(tokenAddress, this.wyllohAbi, this.provider);
      const uri = await contract.tokenURI(tokenId);
      
      // Handle both HTTP and IPFS URIs
      const url = uri.startsWith('ipfs://') 
        ? `https://ipfs.io/ipfs/${uri.slice(7)}`
        : uri;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch metadata from ${url}`);
      
      return await response.json();
    } catch (error) {
      logger.error(`Error getting metadata for token ${tokenId} at ${tokenAddress}:`, error);
      throw error;
    }
  }

  public async isConnected(): Promise<boolean> {
    try {
      await this.provider.getNetwork();
      return true;
    } catch {
      return false;
    }
  }

  public async getChainStatus(): Promise<{ latestBlock: number; syncStatus: boolean; peerCount: number; }> {
    try {
      const [latestBlock, network] = await Promise.all([
        this.getLatestBlock(),
        this.provider.getNetwork(),
      ]);

      // Note: peerCount is not directly available in ethers.js v6
      // We'll need to make a raw RPC call
      const peerCount = parseInt(
        (await this.provider.send('net_peerCount', [])) || '0',
        16
      );

      return {
        latestBlock,
        syncStatus: true, // We might want to compare with a known reference point
        peerCount,
      };
    } catch (error) {
      logger.error(`Error getting chain status for ${this.config.chainId}:`, error);
      throw error;
    }
  }
} 