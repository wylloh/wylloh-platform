import { ethers } from 'ethers';
import { createError } from '../middleware/errorHandler';

// Import the RoyaltyDistributor ABI (you'll need to add this)
const ROYALTY_DISTRIBUTOR_ABI = [
  // Add recipient
  "function addRoyaltyRecipient(address tokenContract, uint256 tokenId, address recipient, uint256 sharePercentage) external",
  
  // Update recipient
  "function updateRoyaltyRecipient(address tokenContract, uint256 tokenId, uint256 index, uint256 sharePercentage) external",
  
  // Remove recipient
  "function removeRoyaltyRecipient(address tokenContract, uint256 tokenId, uint256 index) external",
  
  // Distribute royalties
  "function distributeRoyalties(address tokenContract, uint256 tokenId) external payable",
  
  // Withdraw funds
  "function withdraw() external",
  
  // View functions
  "function getBalance(address recipient) external view returns (uint256)",
  "function getRoyaltyRecipients(address tokenContract, uint256 tokenId) external view returns (address[] memory recipients, uint256[] memory shares)",
  "function getTotalRoyaltyShares(address tokenContract, uint256 tokenId) external view returns (uint256)",
  
  // Batch operations
  "function batchUpdateRecipients(address tokenContract, uint256 tokenId, address[] calldata recipients, uint256[] calldata shares) external",
  
  // Events
  "event RoyaltyDistributed(address indexed tokenContract, uint256 indexed tokenId, uint256 amount)",
  "event RecipientAdded(address indexed tokenContract, uint256 indexed tokenId, address recipient, uint256 share)",
  "event RecipientRemoved(address indexed tokenContract, uint256 indexed tokenId, address recipient)",
  "event RecipientUpdated(address indexed tokenContract, uint256 indexed tokenId, address recipient, uint256 share)",
  "event FundsWithdrawn(address indexed recipient, uint256 amount)"
];

interface RoyaltyRecipient {
  address: string;
  sharePercentage: number; // Basis points (10000 = 100%)
  name?: string;
  role?: string;
}

interface RoyaltyDistribution {
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

interface RoyaltyBalance {
  address: string;
  balance: string;
  balanceETH: string;
  lastUpdated: number;
}

interface RoyaltyAnalytics {
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

class RoyaltyService {
  private provider: ethers.providers.JsonRpcProvider;
  private royaltyDistributorContract: ethers.Contract;
  private contractAddress: string;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL || 'https://polygon-rpc.com'
    );
    
    this.contractAddress = process.env.ROYALTY_DISTRIBUTOR_ADDRESS || '';
    if (!this.contractAddress) {
      throw new Error('ROYALTY_DISTRIBUTOR_ADDRESS environment variable is required');
    }

    this.royaltyDistributorContract = new ethers.Contract(
      this.contractAddress,
      ROYALTY_DISTRIBUTOR_ABI,
      this.provider
    );
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
    try {
      const wallet = new ethers.Wallet(signerPrivateKey, this.provider);
      const contract = this.royaltyDistributorContract.connect(wallet);

      // Validate share percentage (must be in basis points, max 10000)
      if (recipient.sharePercentage <= 0 || recipient.sharePercentage > 10000) {
        throw createError('Share percentage must be between 1 and 10000 basis points', 400);
      }

      // Check if adding this recipient would exceed 100%
      const currentTotal = await this.getTotalRoyaltyShares(tokenContract, tokenId);
      if (currentTotal + recipient.sharePercentage > 10000) {
        throw createError('Total royalty shares would exceed 100%', 400);
      }

      const tx = await contract.addRoyaltyRecipient(
        tokenContract,
        tokenId,
        recipient.address,
        recipient.sharePercentage
      );

      await tx.wait();

      return {
        transactionHash: tx.hash,
        success: true
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to add royalty recipient: ${error.message}`, 500);
      }
      throw createError('Failed to add royalty recipient: Unknown error', 500);
    }
  }

  /**
   * Update a royalty recipient's share
   */
  async updateRoyaltyRecipient(
    tokenContract: string,
    tokenId: string,
    recipientIndex: number,
    newSharePercentage: number,
    signerPrivateKey: string
  ): Promise<{ transactionHash: string; success: boolean }> {
    try {
      const wallet = new ethers.Wallet(signerPrivateKey, this.provider);
      const contract = this.royaltyDistributorContract.connect(wallet);

      // Validate share percentage
      if (newSharePercentage <= 0 || newSharePercentage > 10000) {
        throw createError('Share percentage must be between 1 and 10000 basis points', 400);
      }

      const tx = await contract.updateRoyaltyRecipient(
        tokenContract,
        tokenId,
        recipientIndex,
        newSharePercentage
      );

      await tx.wait();

      return {
        transactionHash: tx.hash,
        success: true
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to update royalty recipient: ${error.message}`, 500);
      }
      throw createError('Failed to update royalty recipient: Unknown error', 500);
    }
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
    try {
      const wallet = new ethers.Wallet(signerPrivateKey, this.provider);
      const contract = this.royaltyDistributorContract.connect(wallet);

      const tx = await contract.removeRoyaltyRecipient(
        tokenContract,
        tokenId,
        recipientIndex
      );

      await tx.wait();

      return {
        transactionHash: tx.hash,
        success: true
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to remove royalty recipient: ${error.message}`, 500);
      }
      throw createError('Failed to remove royalty recipient: Unknown error', 500);
    }
  }

  /**
   * Batch update multiple recipients at once
   */
  async batchUpdateRecipients(
    tokenContract: string,
    tokenId: string,
    recipients: RoyaltyRecipient[],
    signerPrivateKey: string
  ): Promise<{ transactionHash: string; success: boolean }> {
    try {
      const wallet = new ethers.Wallet(signerPrivateKey, this.provider);
      const contract = this.royaltyDistributorContract.connect(wallet);

      // Validate total shares don't exceed 100%
      const totalShares = recipients.reduce((sum, recipient) => sum + recipient.sharePercentage, 0);
      if (totalShares > 10000) {
        throw createError('Total royalty shares exceed 100%', 400);
      }

      const addresses = recipients.map(r => r.address);
      const shares = recipients.map(r => r.sharePercentage);

      const tx = await contract.batchUpdateRecipients(
        tokenContract,
        tokenId,
        addresses,
        shares
      );

      await tx.wait();

      return {
        transactionHash: tx.hash,
        success: true
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to batch update recipients: ${error.message}`, 500);
      }
      throw createError('Failed to batch update recipients: Unknown error', 500);
    }
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
    try {
      const wallet = new ethers.Wallet(signerPrivateKey, this.provider);
      const contract = this.royaltyDistributorContract.connect(wallet);

      const tx = await contract.distributeRoyalties(
        tokenContract,
        tokenId,
        {
          value: ethers.utils.parseEther(amount)
        }
      );

      await tx.wait();

      return {
        transactionHash: tx.hash,
        success: true
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to distribute royalties: ${error.message}`, 500);
      }
      throw createError('Failed to distribute royalties: Unknown error', 500);
    }
  }

  /**
   * Withdraw accumulated royalties for a recipient
   */
  async withdrawRoyalties(
    signerPrivateKey: string
  ): Promise<{ transactionHash: string; amount: string; success: boolean }> {
    try {
      const wallet = new ethers.Wallet(signerPrivateKey, this.provider);
      const contract = this.royaltyDistributorContract.connect(wallet);

      // Check balance before withdrawal
      const balance = await contract.getBalance(wallet.address);
      if (balance.isZero()) {
        throw createError('No funds available for withdrawal', 400);
      }

      const tx = await contract.withdraw();
      await tx.wait();

      return {
        transactionHash: tx.hash,
        amount: ethers.utils.formatEther(balance),
        success: true
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to withdraw royalties: ${error.message}`, 500);
      }
      throw createError('Failed to withdraw royalties: Unknown error', 500);
    }
  }

  /**
   * Get royalty recipients for a token
   */
  async getRoyaltyRecipients(
    tokenContract: string,
    tokenId: string
  ): Promise<RoyaltyRecipient[]> {
    try {
      const [addresses, shares] = await this.royaltyDistributorContract.getRoyaltyRecipients(
        tokenContract,
        tokenId
      );

      return addresses.map((address: string, index: number) => ({
        address,
        sharePercentage: shares[index].toNumber()
      }));
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to get royalty recipients: ${error.message}`, 500);
      }
      throw createError('Failed to get royalty recipients: Unknown error', 500);
    }
  }

  /**
   * Get total royalty shares for a token
   */
  async getTotalRoyaltyShares(
    tokenContract: string,
    tokenId: string
  ): Promise<number> {
    try {
      const totalShares = await this.royaltyDistributorContract.getTotalRoyaltyShares(
        tokenContract,
        tokenId
      );
      return totalShares.toNumber();
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to get total royalty shares: ${error.message}`, 500);
      }
      throw createError('Failed to get total royalty shares: Unknown error', 500);
    }
  }

  /**
   * Get balance for a recipient
   */
  async getRecipientBalance(recipientAddress: string): Promise<RoyaltyBalance> {
    try {
      const balance = await this.royaltyDistributorContract.getBalance(recipientAddress);
      const balanceETH = ethers.utils.formatEther(balance);

      return {
        address: recipientAddress,
        balance: balance.toString(),
        balanceETH,
        lastUpdated: Date.now()
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to get recipient balance: ${error.message}`, 500);
      }
      throw createError('Failed to get recipient balance: Unknown error', 500);
    }
  }

  /**
   * Get royalty distribution history for a token
   */
  async getDistributionHistory(
    tokenContract: string,
    tokenId: string,
    fromBlock: number = 0
  ): Promise<RoyaltyDistribution[]> {
    try {
      const filter = this.royaltyDistributorContract.filters.RoyaltyDistributed(
        tokenContract,
        tokenId
      );

      const events = await this.royaltyDistributorContract.queryFilter(
        filter,
        fromBlock
      );

      const distributions: RoyaltyDistribution[] = [];

      for (const event of events) {
        if (event.args) {
          const block = await event.getBlock();
          const recipients = await this.getRoyaltyRecipients(tokenContract, tokenId);
          
          // Calculate individual recipient amounts
          const totalAmount = event.args.amount;
          const recipientAmounts = recipients.map(recipient => ({
            address: recipient.address,
            amount: totalAmount.mul(recipient.sharePercentage).div(10000).toString(),
            sharePercentage: recipient.sharePercentage
          }));

          distributions.push({
            tokenContract: event.args.tokenContract,
            tokenId: event.args.tokenId.toString(),
            amount: totalAmount.toString(),
            timestamp: block.timestamp,
            transactionHash: event.transactionHash,
            recipients: recipientAmounts
          });
        }
      }

      return distributions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to get distribution history: ${error.message}`, 500);
      }
      throw createError('Failed to get distribution history: Unknown error', 500);
    }
  }

  /**
   * Get royalty analytics for a recipient
   */
  async getRecipientAnalytics(recipientAddress: string): Promise<RoyaltyAnalytics> {
    try {
      // Get all withdrawal events for this recipient
      const withdrawalFilter = this.royaltyDistributorContract.filters.FundsWithdrawn(recipientAddress);
      const withdrawalEvents = await this.royaltyDistributorContract.queryFilter(withdrawalFilter);

      // Get all distribution events (we'll need to filter by recipient participation)
      const distributionFilter = this.royaltyDistributorContract.filters.RoyaltyDistributed();
      const distributionEvents = await this.royaltyDistributorContract.queryFilter(distributionFilter);

      let totalDistributed = ethers.BigNumber.from(0);
      let totalWithdrawn = ethers.BigNumber.from(0);
      let distributionCount = 0;

      // Calculate total withdrawn
      for (const event of withdrawalEvents) {
        if (event.args) {
          totalWithdrawn = totalWithdrawn.add(event.args.amount);
        }
      }

      // Calculate total distributed to this recipient
      for (const event of distributionEvents) {
        if (event.args) {
          const recipients = await this.getRoyaltyRecipients(
            event.args.tokenContract,
            event.args.tokenId
          );
          
          const recipient = recipients.find(r => r.address.toLowerCase() === recipientAddress.toLowerCase());
          if (recipient) {
            const recipientAmount = event.args.amount.mul(recipient.sharePercentage).div(10000);
            totalDistributed = totalDistributed.add(recipientAmount);
            distributionCount++;
          }
        }
      }

      // Get current pending balance
      const currentBalance = await this.getRecipientBalance(recipientAddress);

      const averageDistribution = distributionCount > 0 
        ? totalDistributed.div(distributionCount) 
        : ethers.BigNumber.from(0);

      return {
        totalDistributed: ethers.utils.formatEther(totalDistributed),
        totalWithdrawn: ethers.utils.formatEther(totalWithdrawn),
        pendingBalance: currentBalance.balanceETH,
        distributionCount,
        recipientCount: 1, // This recipient
        averageDistribution: ethers.utils.formatEther(averageDistribution),
        topRecipients: [{
          address: recipientAddress,
          totalEarned: ethers.utils.formatEther(totalDistributed),
          sharePercentage: 0 // Would need to calculate average across all tokens
        }]
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to get recipient analytics: ${error.message}`, 500);
      }
      throw createError('Failed to get recipient analytics: Unknown error', 500);
    }
  }

  /**
   * Get royalty analytics for a token
   */
  async getTokenAnalytics(
    tokenContract: string,
    tokenId: string
  ): Promise<RoyaltyAnalytics> {
    try {
      const distributions = await this.getDistributionHistory(tokenContract, tokenId);
      const recipients = await this.getRoyaltyRecipients(tokenContract, tokenId);

      let totalDistributed = ethers.BigNumber.from(0);
      const recipientTotals = new Map<string, ethers.BigNumber>();

      // Calculate totals
      for (const distribution of distributions) {
        totalDistributed = totalDistributed.add(distribution.amount);
        
        for (const recipient of distribution.recipients) {
          const current = recipientTotals.get(recipient.address) || ethers.BigNumber.from(0);
          recipientTotals.set(recipient.address, current.add(recipient.amount));
        }
      }

      // Create top recipients list
      const topRecipients = Array.from(recipientTotals.entries())
        .map(([address, total]) => {
          const recipient = recipients.find(r => r.address === address);
          return {
            address,
            totalEarned: ethers.utils.formatEther(total),
            sharePercentage: recipient?.sharePercentage || 0
          };
        })
        .sort((a, b) => parseFloat(b.totalEarned) - parseFloat(a.totalEarned))
        .slice(0, 10);

      const averageDistribution = distributions.length > 0 
        ? totalDistributed.div(distributions.length) 
        : ethers.BigNumber.from(0);

      return {
        totalDistributed: ethers.utils.formatEther(totalDistributed),
        totalWithdrawn: '0', // Would need to track this separately
        pendingBalance: '0', // Would need to calculate current pending amounts
        distributionCount: distributions.length,
        recipientCount: recipients.length,
        averageDistribution: ethers.utils.formatEther(averageDistribution),
        topRecipients
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError(`Failed to get token analytics: ${error.message}`, 500);
      }
      throw createError('Failed to get token analytics: Unknown error', 500);
    }
  }
}

export default RoyaltyService;
export type { RoyaltyRecipient, RoyaltyDistribution, RoyaltyBalance, RoyaltyAnalytics }; 