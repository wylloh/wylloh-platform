import mongoose from 'mongoose';
import { createLogger } from '../utils/logger';
import { Transaction, ITransaction } from '../models/transaction.model';
import { WalletActivity, IWalletActivity } from '../models/wallet-activity.model';
import { Token, IToken } from '../models/token.model';
import { Listing, IListing } from '../models/listing.model';

/**
 * Database service for managing MongoDB operations
 */
export class DatabaseService {
  private readonly logger = createLogger('database-service');
  private _isConnected = false;
  private connectionPromise: Promise<typeof mongoose> | null = null;

  /**
   * Get connection status
   */
  public get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Initialize the database connection
   */
  public async initialize(uri: string): Promise<void> {
    if (this._isConnected) {
      this.logger.info('MongoDB connection already established');
      return;
    }

    try {
      this.logger.info('Connecting to MongoDB...');

      // Reuse connection promise if already in progress
      if (!this.connectionPromise) {
        this.connectionPromise = mongoose.connect(uri, {
          // Connection options
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
      }

      await this.connectionPromise;
      this._isConnected = true;
      this.logger.info('Connected to MongoDB successfully');
    } catch (error) {
      this.logger.error(`MongoDB connection error: ${error.message}`);
      this.connectionPromise = null;
      throw error;
    }
  }

  /**
   * Store transaction data
   */
  public async storeTransaction(transactionData: Partial<ITransaction>): Promise<ITransaction> {
    try {
      // Check if transaction exists (by hash and chain)
      const existingTransaction = await Transaction.findOne({
        transactionHash: transactionData.transactionHash,
        chain: transactionData.chain
      });

      if (existingTransaction) {
        // Update existing transaction
        Object.assign(existingTransaction, transactionData);
        await existingTransaction.save();
        this.logger.info(`Updated transaction ${transactionData.transactionHash}`);
        return existingTransaction;
      } else {
        // Create new transaction
        const transaction = new Transaction(transactionData);
        await transaction.save();
        this.logger.info(`Stored new transaction ${transactionData.transactionHash}`);
        return transaction;
      }
    } catch (error) {
      this.logger.error(`Error storing transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * Store wallet activity
   */
  public async storeWalletActivity(activityData: Partial<IWalletActivity>): Promise<IWalletActivity> {
    try {
      // Check for duplicate activity (by wallet, transaction hash, and chain)
      const existingActivity = await WalletActivity.findOne({
        walletAddress: activityData.walletAddress,
        transactionHash: activityData.transactionHash,
        chain: activityData.chain
      });

      if (existingActivity) {
        // Update existing activity
        Object.assign(existingActivity, activityData);
        await existingActivity.save();
        this.logger.info(`Updated wallet activity for ${activityData.walletAddress}`);
        return existingActivity;
      } else {
        // Create new activity
        const activity = new WalletActivity(activityData);
        await activity.save();
        this.logger.info(`Stored new wallet activity for ${activityData.walletAddress}`);
        return activity;
      }
    } catch (error) {
      this.logger.error(`Error storing wallet activity: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get transactions for a wallet
   */
  public async getWalletTransactions(
    walletAddress: string,
    options: {
      limit?: number;
      offset?: number;
      startTime?: number;
      endTime?: number;
      chain?: string;
      status?: string;
    } = {}
  ): Promise<ITransaction[]> {
    try {
      const {
        limit = 20,
        offset = 0,
        startTime,
        endTime,
        chain,
        status
      } = options;

      const query: any = {
        $or: [
          { from: walletAddress },
          { to: walletAddress }
        ]
      };

      // Add optional filters
      if (startTime) query.timestamp = { $gte: startTime };
      if (endTime) query.timestamp = { ...query.timestamp, $lte: endTime };
      if (chain) query.chain = chain;
      if (status) query.status = status;

      const transactions = await Transaction.find(query)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit);

      return transactions;
    } catch (error) {
      this.logger.error(`Error getting wallet transactions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get wallet activity history
   */
  public async getWalletActivityHistory(
    walletAddress: string,
    options: {
      limit?: number;
      offset?: number;
      startTime?: number;
      endTime?: number;
      chain?: string;
      activityType?: string;
    } = {}
  ): Promise<IWalletActivity[]> {
    try {
      const {
        limit = 20,
        offset = 0,
        startTime,
        endTime,
        chain,
        activityType
      } = options;

      const query: any = { walletAddress };

      // Add optional filters
      if (startTime) query.timestamp = { $gte: startTime };
      if (endTime) query.timestamp = { ...query.timestamp, $lte: endTime };
      if (chain) query.chain = chain;
      if (activityType) query.activityType = activityType;

      const activities = await WalletActivity.find(query)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit);

      return activities;
    } catch (error) {
      this.logger.error(`Error getting wallet activity history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get token transactions
   */
  public async getTokenTransactions(
    tokenAddress: string,
    tokenId?: string,
    options: {
      limit?: number;
      offset?: number;
      startTime?: number;
      endTime?: number;
      chain?: string;
    } = {}
  ): Promise<ITransaction[]> {
    try {
      const {
        limit = 20,
        offset = 0,
        startTime,
        endTime,
        chain
      } = options;

      const query: any = { tokenAddress };
      
      // Add optional filters
      if (tokenId) query.tokenId = tokenId;
      if (startTime) query.timestamp = { $gte: startTime };
      if (endTime) query.timestamp = { ...query.timestamp, $lte: endTime };
      if (chain) query.chain = chain;

      const transactions = await Transaction.find(query)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit);

      return transactions;
    } catch (error) {
      this.logger.error(`Error getting token transactions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get pending transactions for processing
   */
  public async getPendingTransactions(
    limit = 20,
    maxAttempts = 3
  ): Promise<ITransaction[]> {
    try {
      const transactions = await Transaction.find({
        processingStatus: { $in: ['new', 'retrying'] },
        processingAttempts: { $lt: maxAttempts }
      })
        .sort({ timestamp: 1 })
        .limit(limit);

      return transactions;
    } catch (error) {
      this.logger.error(`Error getting pending transactions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update token data
   */
  public async updateToken(tokenData: Partial<IToken>): Promise<IToken> {
    try {
      const { tokenId, tokenAddress, chainId } = tokenData;
      
      if (!tokenId || !tokenAddress || !chainId) {
        throw new Error('Token ID, address, and chain ID are required');
      }

      // Check if token exists
      const existingToken = await Token.findOne({
        tokenId,
        tokenAddress,
        chainId
      });

      if (existingToken) {
        // Update existing token
        Object.assign(existingToken, tokenData);
        await existingToken.save();
        this.logger.info(`Updated token ${tokenId} on ${chainId}`);
        return existingToken;
      } else {
        // Create new token
        const token = new Token(tokenData);
        await token.save();
        this.logger.info(`Created new token ${tokenId} on ${chainId}`);
        return token;
      }
    } catch (error) {
      this.logger.error(`Error updating token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  public async close(): Promise<void> {
    if (this._isConnected) {
      try {
        await mongoose.disconnect();
        this._isConnected = false;
        this.connectionPromise = null;
        this.logger.info('MongoDB connection closed');
      } catch (error) {
        this.logger.error(`Error closing MongoDB connection: ${error.message}`);
        throw error;
      }
    }
  }
} 