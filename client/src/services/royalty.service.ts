import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface RoyaltyRecipient {
  address: string;
  sharePercentage: number; // Basis points (10000 = 100%)
  name?: string;
  role?: string;
}

export interface RoyaltyDistribution {
  tokenContract: string;
  tokenId: string;
  amount: string;
  timestamp: number;
  transactionHash: string;
  recipients: {
    address: string;
    amount: string;
    sharePercentage: number;
  }[];
}

export interface RoyaltyBalance {
  address: string;
  balance: string;
  balanceETH: string;
  lastUpdated: number;
}

export interface RoyaltyAnalytics {
  totalDistributed: string;
  totalWithdrawn: string;
  pendingBalance: string;
  distributionCount: number;
  recipientCount: number;
  averageDistribution: string;
  topRecipients: {
    address: string;
    totalEarned: string;
    sharePercentage: number;
  }[];
}

export interface RoyaltyApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class RoyaltyService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api/royalty`;
  }

  /**
   * Add a royalty recipient for a token
   */
  async addRoyaltyRecipient(
    tokenContract: string,
    tokenId: string,
    recipient: RoyaltyRecipient,
    signerPrivateKey: string
  ): Promise<{ transactionHash: string; success: boolean }> {
    const response = await axios.post<RoyaltyApiResponse<{ transactionHash: string; success: boolean }>>(
      `${this.baseURL}/recipients`,
      {
        tokenContract,
        tokenId,
        recipient,
        signerPrivateKey
      }
    );
    return response.data.data;
  }

  /**
   * Update a royalty recipient's share
   */
  async updateRoyaltyRecipient(
    tokenContract: string,
    tokenId: string,
    recipientIndex: number,
    sharePercentage: number,
    signerPrivateKey: string
  ): Promise<{ transactionHash: string; success: boolean }> {
    const response = await axios.put<RoyaltyApiResponse<{ transactionHash: string; success: boolean }>>(
      `${this.baseURL}/recipients/${recipientIndex}`,
      {
        tokenContract,
        tokenId,
        sharePercentage,
        signerPrivateKey
      }
    );
    return response.data.data;
  }

  /**
   * Remove a royalty recipient
   */
  async removeRoyaltyRecipient(
    tokenContract: string,
    tokenId: string,
    recipientIndex: number,
    signerPrivateKey: string
  ): Promise<{ transactionHash: string; success: boolean }> {
    const response = await axios.delete<RoyaltyApiResponse<{ transactionHash: string; success: boolean }>>(
      `${this.baseURL}/recipients/${recipientIndex}`,
      {
        data: {
          tokenContract,
          tokenId,
          signerPrivateKey
        }
      }
    );
    return response.data.data;
  }

  /**
   * Batch update multiple recipients
   */
  async batchUpdateRecipients(
    tokenContract: string,
    tokenId: string,
    recipients: RoyaltyRecipient[],
    signerPrivateKey: string
  ): Promise<{ transactionHash: string; success: boolean }> {
    const response = await axios.put<RoyaltyApiResponse<{ transactionHash: string; success: boolean }>>(
      `${this.baseURL}/recipients/batch`,
      {
        tokenContract,
        tokenId,
        recipients,
        signerPrivateKey
      }
    );
    return response.data.data;
  }

  /**
   * Distribute royalties for a token sale
   */
  async distributeRoyalties(
    tokenContract: string,
    tokenId: string,
    amount: string,
    signerPrivateKey: string
  ): Promise<{ transactionHash: string; success: boolean }> {
    const response = await axios.post<RoyaltyApiResponse<{ transactionHash: string; success: boolean }>>(
      `${this.baseURL}/distribute`,
      {
        tokenContract,
        tokenId,
        amount,
        signerPrivateKey
      }
    );
    return response.data.data;
  }

  /**
   * Withdraw accumulated royalties
   */
  async withdrawRoyalties(
    signerPrivateKey: string
  ): Promise<{ transactionHash: string; amount: string; success: boolean }> {
    const response = await axios.post<RoyaltyApiResponse<{ transactionHash: string; amount: string; success: boolean }>>(
      `${this.baseURL}/withdraw`,
      {
        signerPrivateKey
      }
    );
    return response.data.data;
  }

  /**
   * Get royalty recipients for a token
   */
  async getRoyaltyRecipients(
    tokenContract: string,
    tokenId: string
  ): Promise<{
    tokenContract: string;
    tokenId: string;
    recipients: RoyaltyRecipient[];
    totalRecipients: number;
    totalShares: number;
  }> {
    const response = await axios.get<RoyaltyApiResponse<{
      tokenContract: string;
      tokenId: string;
      recipients: RoyaltyRecipient[];
      totalRecipients: number;
      totalShares: number;
    }>>(
      `${this.baseURL}/recipients/${tokenContract}/${tokenId}`
    );
    return response.data.data;
  }

  /**
   * Get total royalty shares for a token
   */
  async getTotalRoyaltyShares(
    tokenContract: string,
    tokenId: string
  ): Promise<{
    tokenContract: string;
    tokenId: string;
    totalShares: number;
    totalPercentage: string;
    remainingShares: number;
    remainingPercentage: string;
  }> {
    const response = await axios.get<RoyaltyApiResponse<{
      tokenContract: string;
      tokenId: string;
      totalShares: number;
      totalPercentage: string;
      remainingShares: number;
      remainingPercentage: string;
    }>>(
      `${this.baseURL}/shares/${tokenContract}/${tokenId}`
    );
    return response.data.data;
  }

  /**
   * Get balance for a recipient
   */
  async getRecipientBalance(address: string): Promise<RoyaltyBalance> {
    const response = await axios.get<RoyaltyApiResponse<RoyaltyBalance>>(
      `${this.baseURL}/balance/${address}`
    );
    return response.data.data;
  }

  /**
   * Get royalty distribution history for a token
   */
  async getDistributionHistory(
    tokenContract: string,
    tokenId: string,
    fromBlock?: number
  ): Promise<{
    tokenContract: string;
    tokenId: string;
    distributions: RoyaltyDistribution[];
    summary: {
      totalDistributions: number;
      totalAmount: string;
      totalAmountETH: string;
      uniqueRecipients: number;
      latestDistribution: number | null;
      oldestDistribution: number | null;
    };
  }> {
    const params = fromBlock ? { fromBlock } : {};
    const response = await axios.get<RoyaltyApiResponse<{
      tokenContract: string;
      tokenId: string;
      distributions: RoyaltyDistribution[];
      summary: {
        totalDistributions: number;
        totalAmount: string;
        totalAmountETH: string;
        uniqueRecipients: number;
        latestDistribution: number | null;
        oldestDistribution: number | null;
      };
    }>>(
      `${this.baseURL}/history/${tokenContract}/${tokenId}`,
      { params }
    );
    return response.data.data;
  }

  /**
   * Get royalty analytics for a recipient
   */
  async getRecipientAnalytics(address: string): Promise<{
    address: string;
    analytics: RoyaltyAnalytics;
    generatedAt: string;
  }> {
    const response = await axios.get<RoyaltyApiResponse<{
      address: string;
      analytics: RoyaltyAnalytics;
      generatedAt: string;
    }>>(
      `${this.baseURL}/analytics/recipient/${address}`
    );
    return response.data.data;
  }

  /**
   * Get royalty analytics for a token
   */
  async getTokenAnalytics(
    tokenContract: string,
    tokenId: string
  ): Promise<{
    tokenContract: string;
    tokenId: string;
    analytics: RoyaltyAnalytics;
    generatedAt: string;
  }> {
    const response = await axios.get<RoyaltyApiResponse<{
      tokenContract: string;
      tokenId: string;
      analytics: RoyaltyAnalytics;
      generatedAt: string;
    }>>(
      `${this.baseURL}/analytics/token/${tokenContract}/${tokenId}`
    );
    return response.data.data;
  }

  /**
   * Get royalty system overview
   */
  async getRoyaltyOverview(): Promise<any> {
    const response = await axios.get<RoyaltyApiResponse<any>>(
      `${this.baseURL}/overview`
    );
    return response.data.data;
  }

  /**
   * Health check for royalty service
   */
  async getRoyaltyHealth(): Promise<{
    status: string;
    contractAddress: string;
    timestamp: string;
    version: string;
  }> {
    const response = await axios.get<RoyaltyApiResponse<{
      status: string;
      contractAddress: string;
      timestamp: string;
      version: string;
    }>>(
      `${this.baseURL}/health`
    );
    return response.data.data;
  }

  /**
   * Utility function to convert basis points to percentage
   */
  static basisPointsToPercentage(basisPoints: number): number {
    return basisPoints / 100;
  }

  /**
   * Utility function to convert percentage to basis points
   */
  static percentageToBasisPoints(percentage: number): number {
    return Math.round(percentage * 100);
  }

  /**
   * Validate Ethereum address format
   */
  static isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Format ETH amount for display
   */
  static formatETH(amount: string, decimals: number = 4): string {
    const num = parseFloat(amount);
    if (num === 0) return '0 ETH';
    if (num < 0.0001) return '< 0.0001 ETH';
    return `${num.toFixed(decimals)} ETH`;
  }
}

export default RoyaltyService; 