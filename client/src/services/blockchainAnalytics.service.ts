import { ethers } from 'ethers';
import { API_BASE_URL } from '../config';
import { blockchainService } from './blockchain.service';
import axios from 'axios';

// Define interfaces for the analytics data
export interface TokenDistribution {
  smallHolders: number; // 1-5 tokens (personal viewers)
  mediumHolders: number; // 6-50 tokens (small exhibitors)
  largeHolders: number; // 51+ tokens (large exhibitors/studios)
  totalHolders: number;
  healthScore: number; // 0-100 score based on distribution balance
}

export interface TokenVelocity {
  averageHoldingPeriod: number; // in days
  transferRate: number; // transfers per day
  dailyActiveHolders: number;
  velocityScore: number; // 0-100 score based on optimal velocity
}

export interface TokenHolderCategory {
  personalViewers: number; // percentage
  smallExhibitors: number; // percentage
  largeExhibitors: number; // percentage
  speculators: number; // percentage (identified by short holding periods)
}

export interface TokenPerformanceMetrics {
  tokenId: string;
  contentId: string;
  distribution: TokenDistribution;
  velocity: TokenVelocity;
  holderCategories: TokenHolderCategory;
  primarySales: number;
  secondarySales: number;
  averagePrice: number;
  priceChange: {
    day: number; // percentage
    week: number;
    month: number;
    quarter: number;
    year: number;
  };
  liquidityScore: number; // 0-100 based on market depth and trading volume
}

export interface TokenPerformanceHistory {
  date: string;
  primarySales: number;
  secondarySales: number;
  averagePrice: number;
  smallHolders: number;
  mediumHolders: number;
  largeHolders: number;
  uniqueHolders: number;
  transferCount: number;
}

export interface TokenEconomicsMetrics {
  contentId: string;
  tokenId: string;
  primaryMarketVolume: number;
  secondaryMarketVolume: number;
  royaltyRevenue: number;
  priceHistory: {
    date: string;
    price: number;
    volume: number;
  }[];
  marketDepth: {
    price: number;
    buyVolume: number;
    sellVolume: number;
  }[];
  tokenUtilization: number; // percentage of tokens being actively used vs. held
}

export interface WalletProfile {
  category: 'personal_viewer' | 'small_exhibitor' | 'large_exhibitor' | 'speculator';
  averageHoldingPeriod: number;
  diversification: number; // 0-100 score based on variety of tokens held
  activityLevel: number; // 0-100 score based on transaction frequency
}

export interface ContentHolderDistribution {
  contentId: string;
  tokenId: string;
  holderDistribution: {
    walletAddress: string;
    tokenCount: number;
    category: WalletProfile['category'];
    acquisitionDate: string;
  }[];
}

class BlockchainAnalyticsService {
  private readonly baseUrl = `${API_BASE_URL}/analytics`;
  
  /**
   * Get token performance metrics for a specific content item
   */
  async getTokenPerformanceMetrics(contentId: string, period: string = 'month'): Promise<TokenPerformanceMetrics> {
    try {
      const response = await axios.get(`${this.baseUrl}/token-performance/${contentId}?period=${period}`);
      return response.data;
    } catch (error) {
      console.warn('API unavailable for token performance metrics, generating sample data', error);
      return this.generateSampleTokenPerformanceMetrics(contentId);
    }
  }
  
  /**
   * Get token performance history for a specific content item
   */
  async getTokenPerformanceHistory(contentId: string, period: string = 'month'): Promise<TokenPerformanceHistory[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/token-history/${contentId}?period=${period}`);
      return response.data;
    } catch (error) {
      console.warn('API unavailable for token history, generating sample data', error);
      return this.generateSampleTokenPerformanceHistory(contentId, period);
    }
  }
  
  /**
   * Get token economics metrics for a specific content item
   */
  async getTokenEconomicsMetrics(contentId: string, period: string = 'month'): Promise<TokenEconomicsMetrics> {
    try {
      const response = await axios.get(`${this.baseUrl}/token-economics/${contentId}?period=${period}`);
      return response.data;
    } catch (error) {
      console.warn('API unavailable for token economics, generating sample data', error);
      return this.generateSampleTokenEconomicsMetrics(contentId, period);
    }
  }
  
  /**
   * Get content holder distribution for a specific content item
   */
  async getContentHolderDistribution(contentId: string): Promise<ContentHolderDistribution> {
    try {
      const response = await axios.get(`${this.baseUrl}/holder-distribution/${contentId}`);
      return response.data;
    } catch (error) {
      console.warn('API unavailable for holder distribution, generating sample data', error);
      return this.generateSampleContentHolderDistribution(contentId);
    }
  }
  
  /**
   * Get wallet profiles for a specific content item's holders
   */
  async getWalletProfiles(contentId: string): Promise<Record<string, WalletProfile>> {
    try {
      const response = await axios.get(`${this.baseUrl}/wallet-profiles/${contentId}`);
      return response.data;
    } catch (error) {
      console.warn('API unavailable for wallet profiles, generating sample data', error);
      return this.generateSampleWalletProfiles(contentId);
    }
  }
  
  /**
   * Calculate token health score based on distribution and velocity
   */
  calculateTokenHealthScore(distribution: TokenDistribution, velocity: TokenVelocity): number {
    // A healthy token has a good balance of holder types and appropriate velocity
    
    // Calculate distribution score (0-50)
    // Ideal: 70% small holders, 20% medium holders, 10% large holders
    const totalHolders = distribution.smallHolders + distribution.mediumHolders + distribution.largeHolders;
    const smallHolderPercentage = distribution.smallHolders / totalHolders;
    const mediumHolderPercentage = distribution.mediumHolders / totalHolders;
    const largeHolderPercentage = distribution.largeHolders / totalHolders;
    
    // Calculate how close to ideal distribution we are
    const distributionScore = 50 - (
      Math.abs(smallHolderPercentage - 0.7) * 25 +
      Math.abs(mediumHolderPercentage - 0.2) * 15 +
      Math.abs(largeHolderPercentage - 0.1) * 10
    );
    
    // Calculate velocity score (0-50)
    // Ideal: Not too fast (speculation) or too slow (stagnation)
    const velocityScore = velocity.velocityScore / 2;
    
    // Combine scores
    return Math.max(0, Math.min(100, distributionScore + velocityScore));
  }
  
  // Sample data generation methods for development and testing
  private generateSampleTokenPerformanceMetrics(contentId: string): TokenPerformanceMetrics {
    const distribution: TokenDistribution = {
      smallHolders: Math.floor(Math.random() * 800) + 200, // 200-1000
      mediumHolders: Math.floor(Math.random() * 50) + 10, // 10-60
      largeHolders: Math.floor(Math.random() * 10) + 1, // 1-11
      totalHolders: 0, // Will be calculated
      healthScore: 0, // Will be calculated
    };
    
    distribution.totalHolders = distribution.smallHolders + distribution.mediumHolders + distribution.largeHolders;
    
    const velocity: TokenVelocity = {
      averageHoldingPeriod: Math.floor(Math.random() * 90) + 30, // 30-120 days
      transferRate: Math.random() * 20 + 5, // 5-25 transfers per day
      dailyActiveHolders: Math.floor(Math.random() * 50) + 10, // 10-60 active holders
      velocityScore: Math.floor(Math.random() * 100), // 0-100 score
    };
    
    const holderCategories: TokenHolderCategory = {
      personalViewers: Math.random() * 60 + 20, // 20-80%
      smallExhibitors: Math.random() * 30 + 10, // 10-40%
      largeExhibitors: Math.random() * 15 + 5, // 5-20%
      speculators: Math.random() * 20, // 0-20%
    };
    
    // Normalize to 100%
    const total = holderCategories.personalViewers + holderCategories.smallExhibitors + 
                 holderCategories.largeExhibitors + holderCategories.speculators;
    
    holderCategories.personalViewers = Math.round((holderCategories.personalViewers / total) * 100);
    holderCategories.smallExhibitors = Math.round((holderCategories.smallExhibitors / total) * 100);
    holderCategories.largeExhibitors = Math.round((holderCategories.largeExhibitors / total) * 100);
    holderCategories.speculators = 100 - holderCategories.personalViewers - 
                                  holderCategories.smallExhibitors - holderCategories.largeExhibitors;
    
    distribution.healthScore = this.calculateTokenHealthScore(distribution, velocity);
    
    return {
      tokenId: `0x${Math.random().toString(16).substring(2, 10)}`,
      contentId,
      distribution,
      velocity,
      holderCategories,
      primarySales: Math.floor(Math.random() * 1000) + 100,
      secondarySales: Math.floor(Math.random() * 500) + 50,
      averagePrice: Math.random() * 0.5 + 0.1, // 0.1-0.6 ETH
      priceChange: {
        day: (Math.random() * 10) - 5, // -5% to +5%
        week: (Math.random() * 20) - 10, // -10% to +10%
        month: (Math.random() * 40) - 15, // -15% to +25%
        quarter: (Math.random() * 60) - 20, // -20% to +40%
        year: (Math.random() * 100) - 30, // -30% to +70%
      },
      liquidityScore: Math.floor(Math.random() * 100), // 0-100
    };
  }
  
  private generateSampleTokenPerformanceHistory(contentId: string, period: string): TokenPerformanceHistory[] {
    const history: TokenPerformanceHistory[] = [];
    const days = period === 'day' ? 24 : // 24 hours
               period === 'week' ? 7 : 
               period === 'month' ? 30 :
               period === 'quarter' ? 90 : 
               period === 'year' ? 365 : 30;
    
    let primarySales = Math.floor(Math.random() * 100) + 50;
    let secondarySales = Math.floor(Math.random() * 50) + 10;
    let averagePrice = Math.random() * 0.5 + 0.1;
    let smallHolders = Math.floor(Math.random() * 500) + 100;
    let mediumHolders = Math.floor(Math.random() * 30) + 5;
    let largeHolders = Math.floor(Math.random() * 5) + 1;
    let transferCount = Math.floor(Math.random() * 20) + 5;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      // Add some randomness but maintain trends
      primarySales += Math.floor((Math.random() * 10) - 3);
      secondarySales += Math.floor((Math.random() * 5) - 2);
      averagePrice *= (1 + ((Math.random() * 0.04) - 0.02)); // -2% to +2% change
      smallHolders += Math.floor((Math.random() * 10) - 3);
      mediumHolders += Math.floor((Math.random() * 3) - 1);
      largeHolders += Math.random() < 0.1 ? (Math.random() < 0.5 ? 1 : -1) : 0; // 10% chance of change
      transferCount = Math.floor(Math.random() * 20) + 5;
      
      // Ensure values don't go negative
      primarySales = Math.max(0, primarySales);
      secondarySales = Math.max(0, secondarySales);
      averagePrice = Math.max(0.01, averagePrice);
      smallHolders = Math.max(0, smallHolders);
      mediumHolders = Math.max(0, mediumHolders);
      largeHolders = Math.max(1, largeHolders);
      
      history.push({
        date: date.toISOString(),
        primarySales,
        secondarySales,
        averagePrice,
        smallHolders,
        mediumHolders,
        largeHolders,
        uniqueHolders: smallHolders + mediumHolders + largeHolders,
        transferCount,
      });
    }
    
    return history;
  }
  
  private generateSampleTokenEconomicsMetrics(contentId: string, period: string): TokenEconomicsMetrics {
    const days = period === 'day' ? 24 : // 24 hours
               period === 'week' ? 7 : 
               period === 'month' ? 30 :
               period === 'quarter' ? 90 : 
               period === 'year' ? 365 : 30;
    
    const priceHistory = [];
    let price = Math.random() * 0.5 + 0.1; // 0.1-0.6 ETH
    let volume = Math.floor(Math.random() * 50) + 10;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      // Add some randomness but maintain trends
      price *= (1 + ((Math.random() * 0.04) - 0.02)); // -2% to +2% change
      volume = Math.floor(volume * (1 + ((Math.random() * 0.2) - 0.1))); // -10% to +10% change
      
      priceHistory.push({
        date: date.toISOString(),
        price,
        volume,
      });
    }
    
    const marketDepth = [];
    const basePrice = price;
    
    // Generate market depth data (order book simulation)
    for (let i = -10; i <= 10; i++) {
      if (i === 0) continue; // Skip the current price point
      
      const pricePoint = basePrice * (1 + (i * 0.01)); // +/- 1% increments
      const buyVolume = i < 0 ? Math.floor(Math.random() * 100) + 20 : 0; // Buy orders below current price
      const sellVolume = i > 0 ? Math.floor(Math.random() * 100) + 20 : 0; // Sell orders above current price
      
      marketDepth.push({
        price: pricePoint,
        buyVolume,
        sellVolume,
      });
    }
    
    return {
      contentId,
      tokenId: `0x${Math.random().toString(16).substring(2, 10)}`,
      primaryMarketVolume: Math.floor(Math.random() * 1000) + 200,
      secondaryMarketVolume: Math.floor(Math.random() * 500) + 100,
      royaltyRevenue: Math.random() * 10 + 1, // 1-11 ETH
      priceHistory,
      marketDepth,
      tokenUtilization: Math.random() * 80 + 10, // 10-90%
    };
  }
  
  private generateSampleContentHolderDistribution(contentId: string): ContentHolderDistribution {
    const holderDistribution = [];
    const holderCount = Math.floor(Math.random() * 50) + 20; // 20-70 holders
    
    const categories: WalletProfile['category'][] = [
      'personal_viewer', 
      'small_exhibitor', 
      'large_exhibitor', 
      'speculator'
    ];
    
    // Distribution weights
    const weights = {
      personal_viewer: 0.7,
      small_exhibitor: 0.2,
      large_exhibitor: 0.05,
      speculator: 0.05
    };
    
    for (let i = 0; i < holderCount; i++) {
      // Determine category based on weights
      const rand = Math.random();
      let category: WalletProfile['category'] = 'personal_viewer';
      let cumWeight = 0;
      
      for (const cat of categories) {
        cumWeight += weights[cat];
        if (rand <= cumWeight) {
          category = cat;
          break;
        }
      }
      
      // Determine token count based on category
      let tokenCount;
      switch (category) {
        case 'personal_viewer':
          tokenCount = Math.floor(Math.random() * 4) + 1; // 1-5 tokens
          break;
        case 'small_exhibitor':
          tokenCount = Math.floor(Math.random() * 45) + 6; // 6-50 tokens
          break;
        case 'large_exhibitor':
          tokenCount = Math.floor(Math.random() * 950) + 51; // 51-1000 tokens
          break;
        case 'speculator':
          tokenCount = Math.floor(Math.random() * 20) + 1; // 1-20 tokens
          break;
      }
      
      // Generate acquisition date (between 1-180 days ago)
      const acquisitionDate = new Date();
      acquisitionDate.setDate(acquisitionDate.getDate() - (Math.floor(Math.random() * 180) + 1));
      
      holderDistribution.push({
        walletAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        tokenCount,
        category,
        acquisitionDate: acquisitionDate.toISOString(),
      });
    }
    
    return {
      contentId,
      tokenId: `0x${Math.random().toString(16).substring(2, 10)}`,
      holderDistribution,
    };
  }
  
  private generateSampleWalletProfiles(contentId: string): Record<string, WalletProfile> {
    const profiles: Record<string, WalletProfile> = {};
    const walletCount = Math.floor(Math.random() * 50) + 20; // 20-70 wallets
    
    for (let i = 0; i < walletCount; i++) {
      const walletAddress = `0x${Math.random().toString(16).substring(2, 42)}`;
      
      // Randomly assign a category with weighted distribution
      const rand = Math.random();
      let category: WalletProfile['category'];
      
      if (rand < 0.7) {
        category = 'personal_viewer';
      } else if (rand < 0.9) {
        category = 'small_exhibitor';
      } else if (rand < 0.95) {
        category = 'large_exhibitor';
      } else {
        category = 'speculator';
      }
      
      profiles[walletAddress] = {
        category,
        averageHoldingPeriod: Math.floor(Math.random() * 180) + 1, // 1-180 days
        diversification: Math.floor(Math.random() * 100), // 0-100 score
        activityLevel: Math.floor(Math.random() * 100), // 0-100 score
      };
    }
    
    return profiles;
  }
}

export const blockchainAnalyticsService = new BlockchainAnalyticsService(); 