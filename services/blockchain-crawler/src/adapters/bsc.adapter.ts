import { Contract } from 'ethers';
import { BaseChainAdapter } from './base.adapter';
import { TokenEvent, ListingEvent, PurchaseEvent } from '../interfaces/chain.adapter';
import { logger } from '../utils/logger';

export class BscAdapter extends BaseChainAdapter {
  public async processTransferEvent(event: any): Promise<TokenEvent> {
    try {
      return {
        tokenId: event.args.tokenId.toString(),
        from: event.args.from,
        to: event.args.to,
        amount: 1, // BEP-721 transfers are always amount 1
        tokenAddress: event.address,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: (await this.provider.getBlock(event.blockNumber))?.timestamp || 0,
      };
    } catch (error) {
      logger.error('Error processing BSC transfer event:', error);
      throw error;
    }
  }

  public async processListingEvent(event: any): Promise<ListingEvent> {
    try {
      return {
        tokenId: event.args.tokenId.toString(),
        seller: event.args.seller,
        price: event.args.price.toString(),
        quantity: event.args.quantity.toNumber(),
        tokenAddress: event.address,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: (await this.provider.getBlock(event.blockNumber))?.timestamp || 0,
      };
    } catch (error) {
      logger.error('Error processing BSC listing event:', error);
      throw error;
    }
  }

  public async processPurchaseEvent(event: any): Promise<PurchaseEvent> {
    try {
      return {
        tokenId: event.args.tokenId.toString(),
        buyer: event.args.buyer,
        seller: event.args.seller,
        quantity: event.args.quantity.toNumber(),
        tokenAddress: event.address,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: (await this.provider.getBlock(event.blockNumber))?.timestamp || 0,
      };
    } catch (error) {
      logger.error('Error processing BSC purchase event:', error);
      throw error;
    }
  }

  public async getTokenMetadata(tokenAddress: string, tokenId: string): Promise<Record<string, any>> {
    try {
      const contract = new Contract(tokenAddress, [
        'function tokenURI(uint256 tokenId) view returns (string)',
        'function name() view returns (string)',
        'function symbol() view returns (string)',
      ], this.provider);

      const [tokenURI, name, symbol] = await Promise.all([
        contract.tokenURI(tokenId),
        contract.name(),
        contract.symbol(),
      ]);

      // If tokenURI is IPFS URI, return it as is
      if (tokenURI.startsWith('ipfs://')) {
        return {
          tokenURI,
          name,
          symbol,
          tokenId,
          contractAddress: tokenAddress,
          chain: 'bsc',
        };
      }

      // If tokenURI is HTTP(S) URI, fetch metadata
      if (tokenURI.startsWith('http')) {
        try {
          const response = await fetch(tokenURI);
          const metadata = await response.json();
          return {
            ...metadata,
            name,
            symbol,
            tokenId,
            contractAddress: tokenAddress,
            chain: 'bsc',
          };
        } catch (error) {
          logger.error('Error fetching token metadata from HTTP URI:', error);
          return {
            tokenURI,
            name,
            symbol,
            tokenId,
            contractAddress: tokenAddress,
            chain: 'bsc',
          };
        }
      }

      // If tokenURI is base64 encoded
      if (tokenURI.startsWith('data:application/json;base64,')) {
        try {
          const base64Data = tokenURI.split(',')[1];
          const decodedData = Buffer.from(base64Data, 'base64').toString();
          const metadata = JSON.parse(decodedData);
          return {
            ...metadata,
            name,
            symbol,
            tokenId,
            contractAddress: tokenAddress,
            chain: 'bsc',
          };
        } catch (error) {
          logger.error('Error parsing base64 encoded metadata:', error);
          return {
            tokenURI,
            name,
            symbol,
            tokenId,
            contractAddress: tokenAddress,
            chain: 'bsc',
          };
        }
      }

      // Return basic metadata if URI format is unknown
      return {
        tokenURI,
        name,
        symbol,
        tokenId,
        contractAddress: tokenAddress,
        chain: 'bsc',
      };
    } catch (error) {
      logger.error('Error getting BSC token metadata:', error);
      throw error;
    }
  }
} 