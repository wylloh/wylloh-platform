import { providers } from 'ethers';
import { verifyTokenOwnership } from '../utils/blockchainDataUtils';
import { transactionService, Transaction, OwnershipChange } from './transaction.service';
import { libraryService, LibraryItem } from './library.service';

// Types
export interface VerificationResult {
  contentId: string;
  contentTitle: string;
  isOwned: boolean;
  previouslyOwned: boolean;
  verificationTimestamp: string;
  tokenId?: string;
  contractAddress?: string;
  blockchain?: string;
  lastTransaction?: Transaction;
  ownershipChanged?: boolean;
  newOwnerAddress?: string;
}

export interface VerificationOptions {
  forceReverify?: boolean;
  notifyOnChanges?: boolean;
  includeHistory?: boolean;
}

class OwnershipVerificationService {
  private provider: providers.Provider | null = null;
  private lastVerification: Record<string, string> = {}; // contentId -> timestamp
  
  /**
   * Set the provider for blockchain interactions
   * @param provider Ethers.js provider
   */
  setProvider(provider: providers.Provider) {
    this.provider = provider;
  }
  
  /**
   * Verify ownership of a specific content item
   * @param contentId Content ID to verify
   * @param walletAddress User wallet address
   * @param options Verification options
   * @returns Verification result
   */
  async verifyContentOwnership(
    contentId: string,
    contentTitle: string,
    walletAddress: string,
    tokenId: string,
    contractAddress: string,
    tokenStandard: string,
    blockchain: string,
    options: VerificationOptions = {}
  ): Promise<VerificationResult> {
    try {
      // Skip verification if it was done recently and forceReverify is not set
      const now = new Date().toISOString();
      const lastVerificationTime = this.lastVerification[contentId];
      if (
        !options.forceReverify &&
        lastVerificationTime && 
        Date.now() - new Date(lastVerificationTime).getTime() < 30 * 60 * 1000 // 30 minutes
      ) {
        console.log(`Using cached verification for ${contentId}`);
        // Return cached result
        return {
          contentId,
          contentTitle,
          isOwned: true, // We assume it's still owned if we're not reverifying
          previouslyOwned: true,
          verificationTimestamp: lastVerificationTime,
          tokenId,
          contractAddress,
          blockchain
        };
      }
      
      if (!this.provider) {
        throw new Error("Blockchain provider not set");
      }
      
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
      
      // Verify current ownership on blockchain
      const isOwned = await verifyTokenOwnership(
        contractAddress,
        tokenId,
        walletAddress,
        tokenStandard,
        chainId,
        this.provider
      );
      
      // Update last verification time
      this.lastVerification[contentId] = now;
      
      // Get transaction history if needed
      let lastTransaction = undefined;
      let previouslyOwned = false;
      
      if (options.includeHistory) {
        const transactions = await transactionService.getContentTransactions(contentId);
        
        if (transactions.length > 0) {
          // Sort by date descending
          transactions.sort((a, b) => 
            new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
          );
          
          lastTransaction = transactions[0];
          
          // Check if user previously owned this content
          const purchaseTransactions = transactions.filter(tx => tx.transactionType === 'purchase');
          previouslyOwned = purchaseTransactions.length > 0;
        }
      }
      
      // Detect ownership change
      let ownershipChanged = false;
      let newOwnerAddress = undefined;
      
      if (options.includeHistory && lastTransaction && !isOwned && previouslyOwned) {
        // Detect external sale by checking chain ownership
        // Note: In a real implementation, we would query the blockchain for transfer events
        // to find the new owner address
        ownershipChanged = true;
        
        // For demo purposes, we simulate finding a new owner
        newOwnerAddress = `0x${Math.random().toString(16).substring(2, 42)}`;
        
        // Record the ownership change if we detected it for the first time
        if (options.notifyOnChanges) {
          const change: OwnershipChange = {
            contentId,
            contentTitle,
            tokenId,
            contractAddress,
            previousOwnerAddress: walletAddress,
            newOwnerAddress,
            changeDate: now,
            platform: 'External Marketplace',
            salePrice: Math.round(Math.random() * 1000) / 10, // Random price for demo
          };
          
          await transactionService.recordOwnershipChanges([change]);
        }
      }
      
      return {
        contentId,
        contentTitle,
        isOwned,
        previouslyOwned,
        verificationTimestamp: now,
        tokenId,
        contractAddress,
        blockchain,
        lastTransaction,
        ownershipChanged,
        newOwnerAddress
      };
    } catch (error) {
      console.error(`Error verifying ownership for content ${contentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Verify all library items against blockchain ownership
   * @param walletAddress User wallet address
   * @param options Verification options
   * @returns Array of verification results
   */
  async verifyLibraryContents(
    walletAddress: string,
    options: VerificationOptions = {}
  ): Promise<VerificationResult[]> {
    try {
      if (!this.provider) {
        throw new Error("Blockchain provider not set");
      }
      
      // Get all libraries for the user
      const libraries = await libraryService.getAllLibraries();
      
      // Collect all items from all libraries
      const allItems: Array<{
        contentId: string;
        contentTitle: string;
        tokenId?: string;
        contractAddress?: string;
        tokenStandard?: string;
        blockchain?: string;
      }> = [];
      
      for (const library of libraries) {
        const items = await libraryService.getLibraryItems(library._id);
        
        // In a real implementation, we would get token details from the content service
        // For demo purposes, we'll simulate some token data
        for (const item of items) {
          allItems.push({
            contentId: item.contentId,
            contentTitle: `Content ${item.contentId.substring(0, 8)}`,
            tokenId: `${Math.floor(Math.random() * 10000)}`,
            contractAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
            tokenStandard: Math.random() > 0.5 ? 'ERC-721' : 'ERC-1155',
            blockchain: ['Ethereum', 'Polygon', 'Binance Smart Chain'][Math.floor(Math.random() * 3)]
          });
        }
      }
      
      // Filter only items with token data (i.e., blockchain-based)
      const tokenItems = allItems.filter(item => item.tokenId && item.contractAddress);
      
      // Verify each item in parallel
      const verificationPromises = tokenItems.map(item => 
        this.verifyContentOwnership(
          item.contentId,
          item.contentTitle,
          walletAddress,
          item.tokenId || '',
          item.contractAddress || '',
          item.tokenStandard || 'ERC-721',
          item.blockchain || 'Ethereum',
          options
        )
      );
      
      return await Promise.all(verificationPromises);
    } catch (error) {
      console.error('Error verifying library contents:', error);
      throw error;
    }
  }
  
  /**
   * Process ownership verification results to update library status
   * @param results Verification results
   * @returns Summary of ownership changes
   */
  async processVerificationResults(
    results: VerificationResult[]
  ): Promise<{
    changedItems: number;
    stillOwnedItems: number;
    externalSales: number;
  }> {
    const changedItems: string[] = [];
    const stillOwnedItems: string[] = [];
    const externalSales: string[] = [];
    
    // Process each result
    for (const result of results) {
      if (result.ownershipChanged) {
        // Record ownership change
        externalSales.push(result.contentId);
        
        // Create a sale transaction
        const saleTransaction: Omit<Transaction, 'id'> = {
          contentId: result.contentId,
          contentTitle: result.contentTitle,
          thumbnailUrl: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}`,
          transactionType: 'sale',
          transactionDate: result.verificationTimestamp,
          transactionValue: Math.round(Math.random() * 1000) / 10, // Random price for demo
          platform: 'External Marketplace',
          tokenId: result.tokenId,
          contractAddress: result.contractAddress,
          blockchain: result.blockchain,
          counterpartyAddress: result.newOwnerAddress,
        };
        
        try {
          await transactionService.recordTransaction(saleTransaction);
          changedItems.push(result.contentId);
        } catch (error) {
          console.error(`Error recording sale transaction for ${result.contentId}:`, error);
        }
      }
      
      if (result.isOwned) {
        stillOwnedItems.push(result.contentId);
      }
    }
    
    return {
      changedItems: changedItems.length,
      stillOwnedItems: stillOwnedItems.length,
      externalSales: externalSales.length
    };
  }
  
  /**
   * Schedule regular ownership verification
   * @param walletAddress User wallet address
   * @param intervalMinutes Interval between verifications in minutes
   * @returns Interval ID for stopping the verification
   */
  scheduleVerification(walletAddress: string, intervalMinutes: number = 60): number {
    // Run initial verification
    this.verifyLibraryContents(walletAddress, { notifyOnChanges: true, includeHistory: true })
      .then(results => this.processVerificationResults(results))
      .catch(error => console.error('Error in scheduled verification:', error));
    
    // Set up interval for regular verification
    return window.setInterval(() => {
      this.verifyLibraryContents(walletAddress, { notifyOnChanges: true, includeHistory: true })
        .then(results => this.processVerificationResults(results))
        .catch(error => console.error('Error in scheduled verification:', error));
    }, intervalMinutes * 60 * 1000);
  }
  
  /**
   * Stop scheduled verification
   * @param intervalId Interval ID from scheduleVerification
   */
  stopScheduledVerification(intervalId: number): void {
    clearInterval(intervalId);
  }
}

// Create and export singleton instance
export const ownershipVerificationService = new OwnershipVerificationService();
export default ownershipVerificationService; 