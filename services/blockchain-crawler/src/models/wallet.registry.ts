import Redis from 'ioredis';
import { Logger } from '../utils/logger';

export interface WalletRegistryData {
  userId: string;
  isActive: boolean;
  lastSyncTimestamp: number;
  chains: string[];
}

export class WalletRegistry {
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly WALLET_KEY_PREFIX = 'wallet:';
  private readonly USER_WALLETS_PREFIX = 'user:wallets:';

  constructor(redis: Redis, logger: Logger) {
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Register a wallet for a user
   */
  public async registerWallet(walletAddress: string, userId: string): Promise<void> {
    try {
      const walletKey = this.getWalletKey(walletAddress);
      const userWalletsKey = this.getUserWalletsKey(userId);

      // Check if wallet is already registered
      const existingData = await this.redis.hgetall(walletKey);
      if (existingData.userId && existingData.userId !== userId) {
        throw new Error(`Wallet ${walletAddress} is already registered to another user`);
      }

      // Register wallet
      await this.redis.hmset(walletKey, {
        userId,
        isActive: 'true',
        lastSyncTimestamp: Date.now(),
        chains: JSON.stringify(['ethereum', 'polygon', 'bsc'])
      });

      // Add to user's wallet list
      await this.redis.sadd(userWalletsKey, walletAddress);

      this.logger.info(`Registered wallet ${walletAddress} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error registering wallet: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user ID for a wallet
   */
  public async getUserIdForWallet(walletAddress: string): Promise<string | null> {
    try {
      const walletKey = this.getWalletKey(walletAddress);
      const data = await this.redis.hget(walletKey, 'userId');
      return data;
    } catch (error) {
      this.logger.error(`Error getting user ID for wallet: ${error.message}`);
      return null;
    }
  }

  /**
   * Get all wallets for a user
   */
  public async getWalletsForUser(userId: string): Promise<string[]> {
    try {
      const userWalletsKey = this.getUserWalletsKey(userId);
      return await this.redis.smembers(userWalletsKey);
    } catch (error) {
      this.logger.error(`Error getting wallets for user: ${error.message}`);
      return [];
    }
  }

  /**
   * Get all active wallets
   */
  public async getAllActiveWallets(): Promise<string[]> {
    try {
      const walletKeys = await this.redis.keys(`${this.WALLET_KEY_PREFIX}*`);
      const activeWallets: string[] = [];

      for (const key of walletKeys) {
        const data = await this.redis.hgetall(key);
        if (data.isActive === 'true') {
          activeWallets.push(key.replace(this.WALLET_KEY_PREFIX, ''));
        }
      }

      return activeWallets;
    } catch (error) {
      this.logger.error(`Error getting active wallets: ${error.message}`);
      return [];
    }
  }

  /**
   * Get wallets needing sync
   */
  public async getWalletsNeedingSync(threshold: number): Promise<string[]> {
    try {
      const walletKeys = await this.redis.keys(`${this.WALLET_KEY_PREFIX}*`);
      const outdatedWallets: string[] = [];
      const now = Date.now();

      for (const key of walletKeys) {
        const data = await this.redis.hgetall(key);
        if (
          data.isActive === 'true' &&
          now - parseInt(data.lastSyncTimestamp) > threshold
        ) {
          outdatedWallets.push(key.replace(this.WALLET_KEY_PREFIX, ''));
        }
      }

      return outdatedWallets;
    } catch (error) {
      this.logger.error(`Error getting wallets needing sync: ${error.message}`);
      return [];
    }
  }

  /**
   * Get the last sync timestamp for a wallet
   */
  public async getLastSyncTimestamp(walletAddress: string): Promise<number> {
    try {
      const timestamp = await this.redis.hget(this.getWalletKey(walletAddress), 'lastSyncTimestamp');
      return timestamp ? parseInt(timestamp) : 0;
    } catch (error) {
      this.logger.error(`Error getting last sync timestamp: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update last sync timestamp for a wallet
   */
  public async updateLastSyncTimestamp(walletAddress: string, timestamp: number): Promise<void> {
    try {
      const walletKey = this.getWalletKey(walletAddress);
      await this.redis.hset(walletKey, 'lastSyncTimestamp', timestamp.toString());
      this.logger.info(`Updated last sync timestamp for wallet ${walletAddress}`);
    } catch (error) {
      this.logger.error(`Error updating last sync timestamp: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deactivate a wallet
   */
  public async deactivateWallet(walletAddress: string): Promise<void> {
    try {
      const walletKey = this.getWalletKey(walletAddress);
      await this.redis.hset(walletKey, 'isActive', 'false');
      this.logger.info(`Deactivated wallet ${walletAddress}`);
    } catch (error) {
      this.logger.error(`Error deactivating wallet: ${error.message}`);
      throw error;
    }
  }

  private getWalletKey(walletAddress: string): string {
    return `${this.WALLET_KEY_PREFIX}${walletAddress.toLowerCase()}`;
  }

  private getUserWalletsKey(userId: string): string {
    return `${this.USER_WALLETS_PREFIX}${userId}`;
  }
} 