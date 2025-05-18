import { Token, IToken } from '../models/token.model';
import { Listing, IListing } from '../models/listing.model';
import { logger } from '../utils/logger';

interface TokenWithBalance extends Omit<IToken, keyof Document> {
  balance: number;
}

export class TokenService {
  /**
   * Updates token ownership after a transfer
   */
  public async handleTransfer(
    tokenId: string,
    tokenAddress: string,
    chainId: string,
    from: string,
    to: string,
    amount: number
  ): Promise<void> {
    try {
      // Find or create token
      let token = await Token.findOne({
        tokenId,
        tokenAddress,
        chainId,
      });

      if (!token) {
        token = new Token({
          tokenId,
          tokenAddress,
          chainId,
          owners: [],
          totalSupply: 0,
        });
      }

      // Update from address balance
      if (from !== '0x0000000000000000000000000000000000000000') {
        const fromOwner = token.owners.find(owner => owner.address.toLowerCase() === from.toLowerCase());
        if (fromOwner) {
          fromOwner.balance -= amount;
          if (fromOwner.balance <= 0) {
            token.owners = token.owners.filter(owner => owner.address.toLowerCase() !== from.toLowerCase());
          }
        }
      } else {
        // Minting new tokens
        token.totalSupply += amount;
      }

      // Update to address balance
      if (to !== '0x0000000000000000000000000000000000000000') {
        let toOwner = token.owners.find(owner => owner.address.toLowerCase() === to.toLowerCase());
        if (toOwner) {
          toOwner.balance += amount;
        } else {
          token.owners.push({
            address: to,
            balance: amount,
          });
        }
      } else {
        // Burning tokens
        token.totalSupply -= amount;
      }

      await token.save();
      logger.info(`Updated token ${tokenId} ownership: ${from} -> ${to} (${amount})`);
    } catch (error) {
      logger.error(`Error updating token ownership:`, error);
      throw error;
    }
  }

  /**
   * Creates or updates a token listing
   */
  public async handleListing(
    tokenId: string,
    tokenAddress: string,
    chainId: string,
    seller: string,
    price: string,
    quantity: number,
    transactionHash: string
  ): Promise<void> {
    try {
      // Verify token ownership
      const token = await Token.findOne({
        tokenId,
        tokenAddress,
        chainId,
      });

      if (!token) {
        throw new Error(`Token ${tokenId} not found`);
      }

      const ownerBalance = token.owners.find(owner => owner.address.toLowerCase() === seller.toLowerCase())?.balance || 0;
      if (ownerBalance < quantity) {
        throw new Error(`Seller ${seller} does not have enough tokens to list`);
      }

      // Create listing
      const listing = new Listing({
        tokenId,
        tokenAddress,
        chainId,
        seller,
        price,
        quantity,
        availableQuantity: quantity,
        status: 'active',
        transactionHash,
      });

      await listing.save();
      logger.info(`Created listing for token ${tokenId} by ${seller}`);
    } catch (error) {
      logger.error(`Error creating token listing:`, error);
      throw error;
    }
  }

  /**
   * Handles a token purchase
   */
  public async handlePurchase(
    tokenId: string,
    tokenAddress: string,
    chainId: string,
    buyer: string,
    seller: string,
    quantity: number,
    transactionHash: string
  ): Promise<void> {
    try {
      // Find active listing
      const listing = await Listing.findOne({
        tokenId,
        tokenAddress,
        chainId,
        seller,
        status: 'active',
      });

      if (!listing) {
        throw new Error(`No active listing found for token ${tokenId} from seller ${seller}`);
      }

      if (listing.availableQuantity < quantity) {
        throw new Error(`Not enough tokens available in listing`);
      }

      // Update listing
      listing.availableQuantity -= quantity;
      if (listing.availableQuantity === 0) {
        listing.status = 'sold';
      }
      await listing.save();

      // Update token ownership
      await this.handleTransfer(
        tokenId,
        tokenAddress,
        chainId,
        seller,
        buyer,
        quantity
      );

      logger.info(`Processed purchase of ${quantity} tokens ${tokenId} by ${buyer} from ${seller}`);
    } catch (error) {
      logger.error(`Error processing token purchase:`, error);
      throw error;
    }
  }

  /**
   * Gets a user's token library
   */
  public async getUserLibrary(address: string): Promise<TokenWithBalance[]> {
    try {
      const tokens = await Token.find({
        'owners.address': address.toLowerCase(),
      });

      return tokens.map(token => {
        const { _id, __v, ...tokenData } = token.toObject();
        return {
          ...tokenData,
          balance: token.owners.find(owner => owner.address.toLowerCase() === address.toLowerCase())?.balance || 0,
        };
      });
    } catch (error) {
      logger.error(`Error fetching user library:`, error);
      throw error;
    }
  }

  /**
   * Gets active marketplace listings
   */
  public async getActiveListings(chainId?: string): Promise<IListing[]> {
    try {
      const query: any = { status: 'active' };
      if (chainId) {
        query.chainId = chainId;
      }

      return await Listing.find(query).sort({ createdAt: -1 });
    } catch (error) {
      logger.error(`Error fetching active listings:`, error);
      throw error;
    }
  }
} 