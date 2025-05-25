import axios from 'axios';
import { API_BASE_URL } from '../config';

// Backend API interfaces matching our blockchain crawler service
export interface WalletTransactionAnalytics {
  summary: {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
    successRate: number;
    totalGasUsed: number;
    averageGasUsed: number;
  };
  breakdown: {
    byChain: Record<string, number>;
    byDay: Array<{
      date: string;
      count: number;
      successful: number;
      failed: number;
      gasUsed: number;
    }>;
  };
  timeRange: {
    startTime: number;
    endTime: number;
    range: string;
  };
}

export interface WalletTokenAnalytics {
  summary: {
    uniqueTokens: number;
    totalTokenActivities: number;
    mostActiveToken: {
      tokenAddress: string;
      tokenId: string;
      totalTransfers: number;
    } | null;
  };
  tokens: Array<{
    tokenAddress: string;
    tokenId: string;
    activities: any[];
    totalTransfers: number;
    lastActivity: number;
  }>;
  timeline: Array<{
    date: string;
    count: number;
    types: Record<string, number>;
  }>;
  timeRange: {
    startTime: number;
    endTime: number;
    range: string;
  };
}

export interface UserActivityAnalytics {
  summary: {
    totalWallets: number;
    totalTransactions: number;
    totalTokens: number;
    lastActivity: string | null;
  };
  activity: {
    byDay: any[];
    byChain: Record<string, number>;
    byType: Record<string, number>;
  };
  timeRange: {
    range: string;
  };
}

export interface PlatformAnalytics {
  summary: {
    totalTransactions: number;
    totalWallets: number;
    totalTokens: number;
    averageTransactionsPerWallet: number;
  };
  trends: {
    transactionVolume: any[];
    activeWallets: any[];
    tokenActivity: any[];
  };
  timeRange: {
    startTime: number;
    endTime: number;
    range: string;
  };
}

export interface AnalyticsHealthStatus {
  success: boolean;
  service: string;
  status: string;
  timestamp: string;
}

export type TimeRange = 'day' | 'week' | 'month' | 'year';

class WalletAnalyticsService {
  private readonly baseUrl = `${process.env.REACT_APP_BLOCKCHAIN_CRAWLER_URL || 'http://localhost:3001'}/api/analytics`;
  
  /**
   * Get transaction analytics for a specific wallet
   */
  async getWalletTransactionAnalytics(
    walletAddress: string, 
    options: {
      timeRange?: TimeRange;
      startTime?: number;
      endTime?: number;
    } = {}
  ): Promise<WalletTransactionAnalytics> {
    try {
      const params = new URLSearchParams();
      if (options.timeRange) params.append('timeRange', options.timeRange);
      if (options.startTime) params.append('startTime', options.startTime.toString());
      if (options.endTime) params.append('endTime', options.endTime.toString());

      const response = await axios.get(
        `${this.baseUrl}/wallet/${walletAddress}/transactions?${params.toString()}`
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to fetch transaction analytics');
      }
    } catch (error) {
      console.error('Error fetching wallet transaction analytics:', error);
      // Return sample data for development
      return this.generateSampleTransactionAnalytics(walletAddress, options.timeRange || 'month');
    }
  }

  /**
   * Get token analytics for a specific wallet
   */
  async getWalletTokenAnalytics(
    walletAddress: string,
    options: {
      timeRange?: TimeRange;
      startTime?: number;
      endTime?: number;
    } = {}
  ): Promise<WalletTokenAnalytics> {
    try {
      const params = new URLSearchParams();
      if (options.timeRange) params.append('timeRange', options.timeRange);
      if (options.startTime) params.append('startTime', options.startTime.toString());
      if (options.endTime) params.append('endTime', options.endTime.toString());

      const response = await axios.get(
        `${this.baseUrl}/wallet/${walletAddress}/tokens?${params.toString()}`
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to fetch token analytics');
      }
    } catch (error) {
      console.error('Error fetching wallet token analytics:', error);
      // Return sample data for development
      return this.generateSampleTokenAnalytics(walletAddress, options.timeRange || 'month');
    }
  }

  /**
   * Get user activity analytics
   */
  async getUserActivityAnalytics(
    userId: string,
    options: {
      timeRange?: TimeRange;
      startTime?: number;
      endTime?: number;
    } = {}
  ): Promise<UserActivityAnalytics> {
    try {
      const params = new URLSearchParams();
      if (options.timeRange) params.append('timeRange', options.timeRange);
      if (options.startTime) params.append('startTime', options.startTime.toString());
      if (options.endTime) params.append('endTime', options.endTime.toString());

      const response = await axios.get(
        `${this.baseUrl}/user/${userId}/activity?${params.toString()}`
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to fetch user activity analytics');
      }
    } catch (error) {
      console.error('Error fetching user activity analytics:', error);
      // Return sample data for development
      return this.generateSampleUserActivityAnalytics(userId, options.timeRange || 'month');
    }
  }

  /**
   * Get platform-wide analytics
   */
  async getPlatformAnalytics(
    options: {
      timeRange?: TimeRange;
      startTime?: number;
      endTime?: number;
    } = {}
  ): Promise<PlatformAnalytics> {
    try {
      const params = new URLSearchParams();
      if (options.timeRange) params.append('timeRange', options.timeRange);
      if (options.startTime) params.append('startTime', options.startTime.toString());
      if (options.endTime) params.append('endTime', options.endTime.toString());

      const response = await axios.get(
        `${this.baseUrl}/platform?${params.toString()}`
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to fetch platform analytics');
      }
    } catch (error) {
      console.error('Error fetching platform analytics:', error);
      // Return sample data for development
      return this.generateSamplePlatformAnalytics(options.timeRange || 'month');
    }
  }

  /**
   * Check analytics service health
   */
  async getAnalyticsHealth(): Promise<AnalyticsHealthStatus> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      console.error('Error checking analytics health:', error);
      return {
        success: false,
        service: 'analytics',
        status: 'unavailable',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get multiple wallet analytics for comparison
   */
  async getMultiWalletAnalytics(
    walletAddresses: string[],
    timeRange: TimeRange = 'month'
  ): Promise<Record<string, { transactions: WalletTransactionAnalytics; tokens: WalletTokenAnalytics }>> {
    const results: Record<string, any> = {};
    
    // Fetch analytics for each wallet in parallel
    const promises = walletAddresses.map(async (address) => {
      try {
        const [transactions, tokens] = await Promise.all([
          this.getWalletTransactionAnalytics(address, { timeRange }),
          this.getWalletTokenAnalytics(address, { timeRange })
        ]);
        
        results[address] = { transactions, tokens };
      } catch (error) {
        console.error(`Error fetching analytics for wallet ${address}:`, error);
        results[address] = {
          transactions: this.generateSampleTransactionAnalytics(address, timeRange),
          tokens: this.generateSampleTokenAnalytics(address, timeRange)
        };
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  // Sample data generation for development/fallback
  private generateSampleTransactionAnalytics(walletAddress: string, timeRange: string): WalletTransactionAnalytics {
    const totalTransactions = Math.floor(Math.random() * 100) + 20;
    const successfulTransactions = Math.floor(totalTransactions * (0.8 + Math.random() * 0.15));
    const failedTransactions = Math.floor(totalTransactions * (Math.random() * 0.1));
    const pendingTransactions = totalTransactions - successfulTransactions - failedTransactions;

    return {
      summary: {
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        pendingTransactions,
        successRate: (successfulTransactions / totalTransactions) * 100,
        totalGasUsed: Math.floor(Math.random() * 1000000) + 100000,
        averageGasUsed: Math.floor(Math.random() * 50000) + 21000
      },
      breakdown: {
        byChain: {
          ethereum: Math.floor(totalTransactions * 0.6),
          polygon: Math.floor(totalTransactions * 0.3),
          bsc: Math.floor(totalTransactions * 0.1)
        },
        byDay: this.generateDailyData(timeRange, totalTransactions)
      },
      timeRange: {
        startTime: Date.now() - this.getTimeRangeMs(timeRange),
        endTime: Date.now(),
        range: timeRange
      }
    };
  }

  private generateSampleTokenAnalytics(walletAddress: string, timeRange: string): WalletTokenAnalytics {
    const uniqueTokens = Math.floor(Math.random() * 20) + 5;
    const totalTokenActivities = Math.floor(Math.random() * 50) + 10;

    return {
      summary: {
        uniqueTokens,
        totalTokenActivities,
        mostActiveToken: {
          tokenAddress: '0x' + Math.random().toString(16).substr(2, 40),
          tokenId: Math.floor(Math.random() * 1000).toString(),
          totalTransfers: Math.floor(Math.random() * 20) + 5
        }
      },
      tokens: Array.from({ length: uniqueTokens }, (_, i) => ({
        tokenAddress: '0x' + Math.random().toString(16).substr(2, 40),
        tokenId: i.toString(),
        activities: [],
        totalTransfers: Math.floor(Math.random() * 10) + 1,
        lastActivity: Date.now() - Math.random() * 86400000 * 30
      })),
      timeline: this.generateTokenTimelineData(timeRange),
      timeRange: {
        startTime: Date.now() - this.getTimeRangeMs(timeRange),
        endTime: Date.now(),
        range: timeRange
      }
    };
  }

  private generateSampleUserActivityAnalytics(userId: string, timeRange: string): UserActivityAnalytics {
    return {
      summary: {
        totalWallets: Math.floor(Math.random() * 5) + 1,
        totalTransactions: Math.floor(Math.random() * 200) + 50,
        totalTokens: Math.floor(Math.random() * 30) + 10,
        lastActivity: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
      },
      activity: {
        byDay: [],
        byChain: {
          ethereum: Math.floor(Math.random() * 100) + 20,
          polygon: Math.floor(Math.random() * 80) + 15,
          bsc: Math.floor(Math.random() * 30) + 5
        },
        byType: {
          send: Math.floor(Math.random() * 50) + 10,
          receive: Math.floor(Math.random() * 40) + 8,
          mint: Math.floor(Math.random() * 20) + 3,
          burn: Math.floor(Math.random() * 5) + 1
        }
      },
      timeRange: {
        range: timeRange
      }
    };
  }

  private generateSamplePlatformAnalytics(timeRange: string): PlatformAnalytics {
    return {
      summary: {
        totalTransactions: Math.floor(Math.random() * 10000) + 5000,
        totalWallets: Math.floor(Math.random() * 1000) + 500,
        totalTokens: Math.floor(Math.random() * 500) + 200,
        averageTransactionsPerWallet: Math.floor(Math.random() * 20) + 5
      },
      trends: {
        transactionVolume: [],
        activeWallets: [],
        tokenActivity: []
      },
      timeRange: {
        startTime: Date.now() - this.getTimeRangeMs(timeRange),
        endTime: Date.now(),
        range: timeRange
      }
    };
  }

  private generateDailyData(timeRange: string, totalTransactions: number) {
    const days = this.getDaysInRange(timeRange);
    const dailyData = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      
      const dayTransactions = Math.floor(totalTransactions / days * (0.5 + Math.random()));
      const successful = Math.floor(dayTransactions * (0.8 + Math.random() * 0.15));
      const failed = dayTransactions - successful;
      
      dailyData.push({
        date: date.toISOString().split('T')[0],
        count: dayTransactions,
        successful,
        failed,
        gasUsed: dayTransactions * (21000 + Math.random() * 30000)
      });
    }
    
    return dailyData;
  }

  private generateTokenTimelineData(timeRange: string) {
    const days = this.getDaysInRange(timeRange);
    const timelineData = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      
      timelineData.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10) + 1,
        types: {
          send: Math.floor(Math.random() * 5) + 1,
          receive: Math.floor(Math.random() * 4) + 1,
          mint: Math.floor(Math.random() * 2),
          burn: Math.floor(Math.random() * 1)
        }
      });
    }
    
    return timelineData;
  }

  private getTimeRangeMs(timeRange: string): number {
    switch (timeRange) {
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      case 'month': return 30 * 24 * 60 * 60 * 1000;
      case 'year': return 365 * 24 * 60 * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000;
    }
  }

  private getDaysInRange(timeRange: string): number {
    switch (timeRange) {
      case 'day': return 1;
      case 'week': return 7;
      case 'month': return 30;
      case 'year': return 365;
      default: return 30;
    }
  }
}

// Export singleton instance
export const walletAnalyticsService = new WalletAnalyticsService();
export default walletAnalyticsService; 