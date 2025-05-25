import { DatabaseService } from './database.service';
import { createLogger } from '../utils/logger';
import { ITransaction } from '../models/transaction.model';
import { IWalletActivity } from '../models/wallet-activity.model';

/**
 * Analytics service for generating insights from blockchain data
 */
export class AnalyticsService {
  private readonly logger = createLogger('analytics-service');
  private readonly databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  /**
   * Get transaction analytics for a wallet
   */
  public async getWalletTransactionAnalytics(
    walletAddress: string,
    options: {
      timeRange?: 'day' | 'week' | 'month' | 'year';
      startTime?: number;
      endTime?: number;
    } = {}
  ) {
    try {
      const { timeRange = 'month', startTime, endTime } = options;
      
      // Calculate time range if not provided
      let calculatedStartTime = startTime;
      let calculatedEndTime = endTime || Date.now();
      
      if (!calculatedStartTime) {
        const now = new Date();
        switch (timeRange) {
          case 'day':
            calculatedStartTime = now.getTime() - (24 * 60 * 60 * 1000);
            break;
          case 'week':
            calculatedStartTime = now.getTime() - (7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            calculatedStartTime = now.getTime() - (30 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            calculatedStartTime = now.getTime() - (365 * 24 * 60 * 60 * 1000);
            break;
        }
      }

      // Get transactions
      const transactions = await this.databaseService.getWalletTransactions(walletAddress, {
        startTime: calculatedStartTime,
        endTime: calculatedEndTime,
        limit: 1000 // Get more for analytics
      });

      // Calculate analytics
      const totalTransactions = transactions.length;
      const successfulTransactions = transactions.filter(tx => tx.status === 'confirmed').length;
      const failedTransactions = transactions.filter(tx => tx.status === 'failed').length;
      const pendingTransactions = transactions.filter(tx => tx.status === 'pending').length;

      // Group by chain
      const transactionsByChain = transactions.reduce((acc, tx) => {
        acc[tx.chain] = (acc[tx.chain] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by day for time series
      const transactionsByDay = this.groupTransactionsByDay(transactions);

      // Calculate gas usage
      const totalGasUsed = transactions.reduce((sum, tx) => {
        const gasUsed = tx.gasUsed ? parseInt(tx.gasUsed, 10) : 0;
        return sum + gasUsed;
      }, 0);
      const averageGasUsed = totalTransactions > 0 ? totalGasUsed / totalTransactions : 0;

      return {
        summary: {
          totalTransactions,
          successfulTransactions,
          failedTransactions,
          pendingTransactions,
          successRate: totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0,
          totalGasUsed,
          averageGasUsed
        },
        breakdown: {
          byChain: transactionsByChain,
          byDay: transactionsByDay
        },
        timeRange: {
          startTime: calculatedStartTime,
          endTime: calculatedEndTime,
          range: timeRange
        }
      };
    } catch (error) {
      this.logger.error(`Error getting wallet transaction analytics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get token ownership analytics for a wallet
   */
  public async getWalletTokenAnalytics(
    walletAddress: string,
    options: {
      timeRange?: 'day' | 'week' | 'month' | 'year';
      startTime?: number;
      endTime?: number;
    } = {}
  ) {
    try {
      const { timeRange = 'month', startTime, endTime } = options;
      
      // Calculate time range
      let calculatedStartTime = startTime;
      let calculatedEndTime = endTime || Date.now();
      
      if (!calculatedStartTime) {
        const now = new Date();
        switch (timeRange) {
          case 'day':
            calculatedStartTime = now.getTime() - (24 * 60 * 60 * 1000);
            break;
          case 'week':
            calculatedStartTime = now.getTime() - (7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            calculatedStartTime = now.getTime() - (30 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            calculatedStartTime = now.getTime() - (365 * 24 * 60 * 60 * 1000);
            break;
        }
      }

      // Get wallet activities (token transfers, mints, etc.)
      const activities = await this.databaseService.getWalletActivityHistory(walletAddress, {
        startTime: calculatedStartTime,
        endTime: calculatedEndTime,
        limit: 1000
      });

      // Analyze token activities
      const tokenActivities = activities.filter(activity => 
        activity.activityType === 'send' || 
        activity.activityType === 'receive' ||
        activity.activityType === 'mint' ||
        activity.activityType === 'burn'
      );

      // Group by token
      const tokensByAddress = tokenActivities.reduce((acc, activity) => {
        const tokenKey = `${activity.tokenAddress}-${activity.tokenId || 'native'}`;
        if (!acc[tokenKey]) {
          acc[tokenKey] = {
            tokenAddress: activity.tokenAddress,
            tokenId: activity.tokenId,
            activities: [],
            totalTransfers: 0,
            lastActivity: 0
          };
        }
        acc[tokenKey].activities.push(activity);
        acc[tokenKey].totalTransfers++;
        acc[tokenKey].lastActivity = Math.max(acc[tokenKey].lastActivity, activity.timestamp);
        return acc;
      }, {} as Record<string, any>);

      // Calculate token metrics
      const uniqueTokens = Object.keys(tokensByAddress).length;
      const totalTokenActivities = tokenActivities.length;
      const mostActiveToken = Object.values(tokensByAddress).reduce((max: any, token: any) => 
        token.totalTransfers > (max?.totalTransfers || 0) ? token : max, null);

      // Group activities by day
      const activitiesByDay = this.groupActivitiesByDay(tokenActivities);

      return {
        summary: {
          uniqueTokens,
          totalTokenActivities,
          mostActiveToken: mostActiveToken ? {
            tokenAddress: mostActiveToken.tokenAddress,
            tokenId: mostActiveToken.tokenId,
            totalTransfers: mostActiveToken.totalTransfers
          } : null
        },
        tokens: Object.values(tokensByAddress),
        timeline: activitiesByDay,
        timeRange: {
          startTime: calculatedStartTime,
          endTime: calculatedEndTime,
          range: timeRange
        }
      };
    } catch (error) {
      this.logger.error(`Error getting wallet token analytics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user activity monitoring data
   */
  public async getUserActivityAnalytics(
    userId: string,
    options: {
      timeRange?: 'day' | 'week' | 'month' | 'year';
      startTime?: number;
      endTime?: number;
    } = {}
  ) {
    try {
      // This would require getting all wallets for a user first
      // For now, we'll return a placeholder structure
      const { timeRange = 'month' } = options;
      
      return {
        summary: {
          totalWallets: 0,
          totalTransactions: 0,
          totalTokens: 0,
          lastActivity: null
        },
        activity: {
          byDay: [],
          byChain: {},
          byType: {}
        },
        timeRange: {
          range: timeRange
        }
      };
    } catch (error) {
      this.logger.error(`Error getting user activity analytics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get platform-wide analytics
   */
  public async getPlatformAnalytics(
    options: {
      timeRange?: 'day' | 'week' | 'month' | 'year';
      startTime?: number;
      endTime?: number;
    } = {}
  ) {
    try {
      const { timeRange = 'month', startTime, endTime } = options;
      
      // Calculate time range
      let calculatedStartTime = startTime;
      let calculatedEndTime = endTime || Date.now();
      
      if (!calculatedStartTime) {
        const now = new Date();
        switch (timeRange) {
          case 'day':
            calculatedStartTime = now.getTime() - (24 * 60 * 60 * 1000);
            break;
          case 'week':
            calculatedStartTime = now.getTime() - (7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            calculatedStartTime = now.getTime() - (30 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            calculatedStartTime = now.getTime() - (365 * 24 * 60 * 60 * 1000);
            break;
        }
      }

      // This would require aggregating data across all wallets
      // For now, return a basic structure
      return {
        summary: {
          totalTransactions: 0,
          totalWallets: 0,
          totalTokens: 0,
          averageTransactionsPerWallet: 0
        },
        trends: {
          transactionVolume: [],
          activeWallets: [],
          tokenActivity: []
        },
        timeRange: {
          startTime: calculatedStartTime,
          endTime: calculatedEndTime,
          range: timeRange
        }
      };
    } catch (error) {
      this.logger.error(`Error getting platform analytics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Group transactions by day for time series analysis
   */
  private groupTransactionsByDay(transactions: ITransaction[]) {
    const grouped = transactions.reduce((acc, tx) => {
      const date = new Date(tx.timestamp).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          successful: 0,
          failed: 0,
          gasUsed: 0
        };
      }
      acc[date].count++;
      if (tx.status === 'confirmed') acc[date].successful++;
      if (tx.status === 'failed') acc[date].failed++;
      const gasUsed = tx.gasUsed ? parseInt(tx.gasUsed, 10) : 0;
      acc[date].gasUsed += gasUsed;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }

  /**
   * Group activities by day for time series analysis
   */
  private groupActivitiesByDay(activities: IWalletActivity[]) {
    const grouped = activities.reduce((acc, activity) => {
      const date = new Date(activity.timestamp).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          types: {}
        };
      }
      acc[date].count++;
      acc[date].types[activity.activityType] = (acc[date].types[activity.activityType] || 0) + 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }
} 