import axios from 'axios';
import { providers } from 'ethers';
import { verifyTokenOwnership } from '../utils/blockchainDataUtils';

export interface Transaction {
  id: string;
  contentId: string;
  contentTitle: string;
  thumbnailUrl: string;
  transactionType: 'purchase' | 'sale' | 'lend' | 'borrow' | 'return';
  transactionDate: string;
  transactionValue: number;
  platform: string;
  tokenId?: string;
  contractAddress?: string;
  blockchain?: string;
  blockchainTxHash?: string;
  counterpartyAddress?: string;
  counterpartyName?: string;
}

export interface OwnershipChange {
  contentId: string;
  contentTitle: string;
  tokenId: string;
  contractAddress: string;
  previousOwnerAddress: string;
  newOwnerAddress: string;
  changeDate: string;
  platform?: string;
  transactionHash?: string;
  salePrice?: number;
}

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Sample data for development testing
const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    contentId: 'content-1',
    contentTitle: 'The Silent Echo',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1',
    transactionType: 'purchase',
    transactionDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    transactionValue: 250,
    platform: 'Wylloh',
    tokenId: '1234',
    contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
    blockchain: 'Ethereum',
    blockchainTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  },
  {
    id: 'tx-2',
    contentId: 'content-2',
    contentTitle: 'Digital Horizons',
    thumbnailUrl: 'https://images.unsplash.com/photo-1605106702734-205df224ecce',
    transactionType: 'sale',
    transactionDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    transactionValue: 320,
    platform: 'OpenSea',
    tokenId: '5678',
    contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
    blockchain: 'Ethereum',
    blockchainTxHash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    counterpartyAddress: '0x9876543210abcdef9876543210abcdef98765432',
    counterpartyName: 'collector.eth',
  },
  {
    id: 'tx-3',
    contentId: 'content-3',
    contentTitle: 'Nature\'s Symphony',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
    transactionType: 'lend',
    transactionDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    transactionValue: 10,
    platform: 'Wylloh',
    counterpartyAddress: '0x5678901234abcdef5678901234abcdef56789012',
    counterpartyName: 'friend@example.com',
  },
];

class TransactionService {
  /**
   * Get all transactions for the current user
   * @returns List of user transactions
   */
  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/transactions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      
      // Return empty array instead of sample data for production readiness
      return [];
    }
  }
  
  /**
   * Get transaction history for a specific content item
   * @param contentId Content ID to get transactions for
   * @returns List of transactions for the content
   */
  async getContentTransactions(contentId: string): Promise<Transaction[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/content/${contentId}/transactions`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching transactions for content ${contentId}:`, error);
      
      // Return empty array instead of sample data for production readiness
      return [];
    }
  }
  
  /**
   * Record a new transaction
   * @param transaction Transaction data to record
   * @returns The recorded transaction with server-generated ID
   */
  async recordTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/transactions`, transaction);
      return response.data;
    } catch (error) {
      console.error('Error recording transaction:', error);
      throw error;
    }
  }
  
  /**
   * Verify ownership of a token against the blockchain
   * @param contentId Content ID to verify
   * @param walletAddress Wallet address to check ownership against
   * @param provider Ethers.js provider for blockchain interaction
   * @returns Object with ownership status and verification details
   */
  async verifyContentOwnership(
    contentId: string,
    walletAddress: string,
    tokenId: string,
    contractAddress: string,
    tokenStandard: string,
    blockchain: string,
    provider: providers.Provider
  ): Promise<{ owned: boolean; verificationTimestamp: string }> {
    try {
      // Removed development mock verification - always use real blockchain verification
      
      // Get chain ID based on blockchain name
      let chainId = 1; // Default to Ethereum
      switch(blockchain.toLowerCase()) {
        case 'polygon':
          chainId = 137;
          break;
        case 'binance smart chain':
        case 'bsc':
          chainId = 56;
          break;
        // Add other chains as needed
      }
      
      // Verify ownership using blockchain utilities
      const isOwned = await verifyTokenOwnership(
        contractAddress,
        tokenId,
        walletAddress,
        tokenStandard,
        chainId,
        provider
      );
      
      // In a real implementation, we would also record this verification in the database
      return {
        owned: isOwned,
        verificationTimestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error verifying ownership for content ${contentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Detect ownership changes based on blockchain data
   * @param userAddress Current user's wallet address
   * @param contentItems Array of content items to check
   * @param provider Ethers.js provider for blockchain interaction
   * @returns Array of detected ownership changes
   */
  async detectOwnershipChanges(
    userAddress: string,
    contentItems: Array<{
      contentId: string;
      contentTitle: string;
      tokenId: string;
      contractAddress: string;
      tokenStandard: string;
      blockchain: string;
    }>,
    provider: providers.Provider
  ): Promise<OwnershipChange[]> {
    const changes: OwnershipChange[] = [];
    
    // Process each content item in parallel
    const changePromises = contentItems.map(async (item) => {
      try {
        // Get chain ID based on blockchain name
        let chainId = 1; // Default to Ethereum
        switch(item.blockchain.toLowerCase()) {
          case 'polygon':
            chainId = 137;
            break;
          case 'binance smart chain':
          case 'bsc':
            chainId = 56;
            break;
          // Add other chains as needed
        }
        
        // Verify current ownership
        const isStillOwned = await verifyTokenOwnership(
          item.contractAddress,
          item.tokenId,
          userAddress,
          item.tokenStandard,
          chainId,
          provider
        );
        
        // If no longer owned, record an ownership change
        if (!isStillOwned) {
          // In a real implementation, we would query transaction history
          // from the blockchain to get details of the transfer
          changes.push({
            contentId: item.contentId,
            contentTitle: item.contentTitle,
            tokenId: item.tokenId,
            contractAddress: item.contractAddress,
            previousOwnerAddress: userAddress,
            newOwnerAddress: 'unknown', // Would be determined from blockchain data
            changeDate: new Date().toISOString(),
            // These fields would be populated from actual blockchain data
            platform: 'unknown',
            transactionHash: '',
            salePrice: 0,
          });
        }
      } catch (error) {
        console.error(`Error checking ownership change for ${item.contentId}:`, error);
      }
    });
    
    // Wait for all promises to resolve
    await Promise.all(changePromises);
    
    return changes;
  }
  
  /**
   * Update the database with detected ownership changes
   * @param changes Array of ownership changes to record
   * @returns Success status
   */
  async recordOwnershipChanges(changes: OwnershipChange[]): Promise<{ success: boolean }> {
    if (changes.length === 0) {
      return { success: true };
    }
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ownership-changes`, changes);
      return response.data;
    } catch (error) {
      console.error('Error recording ownership changes:', error);
      throw error;
    }
  }
}

export const transactionService = new TransactionService();
export default transactionService; 