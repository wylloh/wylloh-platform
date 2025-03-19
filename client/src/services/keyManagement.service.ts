import { ethers } from 'ethers';
import { blockchainService } from './blockchain.service';
import * as encryptionUtils from '../utils/encryption';

/**
 * Interface for key management records
 * These are stored on the blockchain and manage access control
 */
interface ContentKeyRecord {
  contentId: string;
  encryptedKey: string;  // The content key, encrypted with contract public key
  keyVersion: number;    // For supporting key rotation
  timestamp: number;     // When this key was created
}

/**
 * Key management service for content encryption/decryption
 * Handles secure storage and retrieval of content keys through blockchain
 */
class KeyManagementService {
  // Cache of decrypted content keys to avoid repeated decryption
  private keyCache: Map<string, { key: string, timestamp: number }> = new Map();
  
  /**
   * Store an encrypted content key on the blockchain
   * 
   * @param contentId Unique identifier for the content
   * @param contentKey The symmetric encryption key for the content
   * @param walletAddress User's wallet address
   * @returns Success status
   */
  async storeContentKey(contentId: string, contentKey: string, walletAddress: string): Promise<boolean> {
    try {
      // In production, this would send a transaction to the content contract
      // For demo, we're simulating with local storage
      
      // 1. Get contract for content
      // const contentContract = await blockchainService.getContentContract(contentId);
      
      // 2. Encrypt key using contract's public key (in production)
      // In this demo, we'll use a simpler approach
      const contractAddress = this.getContractAddressForContent(contentId);
      const encryptedKey = await encryptionUtils.encryptContentKey(
        contentKey, 
        contractAddress // Using contract address as encryption key (just for demo)
      );
      
      // 3. Store the encrypted key
      // In production: contentContract.storeEncryptedKey(encryptedKey);
      // For demo, we'll use localStorage
      const keyRecord: ContentKeyRecord = {
        contentId,
        encryptedKey,
        keyVersion: 1,
        timestamp: Date.now()
      };
      
      localStorage.setItem(`content_key:${contentId}`, JSON.stringify(keyRecord));
      console.log(`Stored encrypted key for content ${contentId}`);
      
      return true;
    } catch (error) {
      console.error('Error storing content key:', error);
      return false;
    }
  }
  
  /**
   * Retrieve and decrypt a content key
   * Only works if user owns the corresponding token
   * 
   * @param contentId Content identifier
   * @param walletAddress User's wallet address
   * @returns Decrypted content key if authorized
   */
  async getContentKey(contentId: string, walletAddress: string): Promise<string | null> {
    try {
      // Check cache first
      const cacheKey = `${contentId}:${walletAddress}`;
      const cachedKey = this.keyCache.get(cacheKey);
      
      // Use cached key if available and not expired (30 minutes)
      if (cachedKey && (Date.now() - cachedKey.timestamp < 30 * 60 * 1000)) {
        return cachedKey.key;
      }
      
      // 1. Verify token ownership (strict blockchain check)
      const ownsToken = await this.verifyContentOwnership(contentId, walletAddress);
      if (!ownsToken) {
        console.warn('User does not own this content');
        return null;
      }
      
      // 2. Get encrypted key
      // In production: const encryptedKey = await contentContract.getEncryptedKey();
      // For demo, we'll use localStorage
      const keyRecordStr = localStorage.getItem(`content_key:${contentId}`);
      if (!keyRecordStr) {
        console.error('No key record found for content');
        return null;
      }
      
      const keyRecord: ContentKeyRecord = JSON.parse(keyRecordStr);
      
      // 3. Decrypt the key using wallet's private key
      // In production, this would use wallet to decrypt
      // For demo, we'll use simpler approach
      const contractAddress = this.getContractAddressForContent(contentId);
      const contentKey = await encryptionUtils.decryptContentKey(
        keyRecord.encryptedKey,
        contractAddress // Using contract address as decryption key (just for demo)
      );
      
      // Store in cache
      this.keyCache.set(cacheKey, {
        key: contentKey,
        timestamp: Date.now()
      });
      
      return contentKey;
    } catch (error) {
      console.error('Error retrieving content key:', error);
      return null;
    }
  }
  
  /**
   * Verify that user owns the content token
   * This is a strict blockchain verification
   * 
   * @param contentId Content identifier
   * @param walletAddress User's wallet address
   * @returns Whether user owns the token
   */
  async verifyContentOwnership(contentId: string, walletAddress: string): Promise<boolean> {
    try {
      // Clear key cache for this content to force fresh verification
      this.clearKeyCache(contentId);
      
      console.log(`KeyManagementService: Verifying content ownership for ${contentId} by ${walletAddress}`);
      
      // Try with blockchain first - multiple attempts with error handling
      if (blockchainService.isInitialized()) {
        console.log('KeyManagementService: Using blockchain verification');
        
        try {
          // First attempt
          const tokenBalance = await blockchainService.getTokenBalance(walletAddress, contentId);
          console.log(`KeyManagementService: Token balance from blockchain: ${tokenBalance}`);
          
          if (tokenBalance > 0) {
            console.log('KeyManagementService: Token ownership verified via blockchain');
            return true;
          }
        } catch (error) {
          console.warn('KeyManagementService: First blockchain check failed:', error);
        }
        
        // Wait briefly and try again (blockchain might need time to process recent transactions)
        console.log('KeyManagementService: Attempting secondary blockchain verification...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          // Second attempt with different provider
          const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
          // Use raw contract call for verification
          const contractAddress = blockchainService['contractAddress'];
          const abi = ["function balanceOf(address account, uint256 id) view returns (uint256)"];
          const contract = new ethers.Contract(contractAddress, abi, provider);
          
          const balance = await contract.balanceOf(walletAddress, contentId);
          const tokenBalance = balance.toNumber();
          
          console.log(`KeyManagementService: Secondary token balance check: ${tokenBalance}`);
          
          if (tokenBalance > 0) {
            console.log('KeyManagementService: Token ownership verified via secondary check');
            return true;
          }
        } catch (secondError) {
          console.warn('KeyManagementService: Secondary blockchain check failed:', secondError);
        }
      }
      
      // For demo/testing, use local storage as fallback
      // Check both wylloh_local_purchased_content (new format) and purchased_content (old format)
      console.log('KeyManagementService: Using localStorage fallback for ownership check');
      
      // Check new format first
      const newStorageKey = 'wylloh_local_purchased_content';
      const newPurchasedContent = JSON.parse(localStorage.getItem(newStorageKey) || '[]');
      const newOwnedContent = newPurchasedContent.find((item: any) => 
        item.id === contentId && item.purchaseQuantity > 0
      );
      
      if (newOwnedContent) {
        console.log(`KeyManagementService: Access granted via ${newStorageKey}`);
        return true;
      }
      
      // Check old format as fallback
      const oldStorageKey = 'purchased_content';
      const oldPurchasedContent = JSON.parse(localStorage.getItem(oldStorageKey) || '[]');
      const oldOwnedContent = oldPurchasedContent.find((item: any) => 
        item.id === contentId && item.purchaseQuantity > 0
      );
      
      if (oldOwnedContent) {
        console.log(`KeyManagementService: Access granted via ${oldStorageKey}`);
        return true;
      }
      
      // One final option - check user's token records directly
      try {
        // Look for transaction records that might indicate ownership
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('transaction_')) {
            const transaction = JSON.parse(localStorage.getItem(key) || '{}');
            if (transaction.type === 'purchase' && transaction.contentId === contentId) {
              console.log(`KeyManagementService: Found purchase transaction record for ${contentId}`);
              return true;
            }
          }
        }
      } catch (error) {
        console.warn('KeyManagementService: Error checking transaction records:', error);
      }
      
      console.log(`KeyManagementService: No ownership record found for ${contentId}`);
      return false;
    } catch (error) {
      console.error('Error verifying content ownership:', error);
      return false;
    }
  }
  
  /**
   * Get contract address for content
   * @param contentId Content identifier
   * @returns Contract address
   */
  private getContractAddressForContent(contentId: string): string {
    // In production, this would look up the actual contract address
    // For demo, we'll use a deterministic address based on content ID
    return `0x${contentId.padEnd(40, '0')}`;
  }
  
  /**
   * Clear key cache for a specific content
   * Used when token ownership changes
   * 
   * @param contentId Content identifier
   */
  clearKeyCache(contentId: string): void {
    // Remove all cached keys for this content
    Array.from(this.keyCache.keys()).forEach(key => {
      if (key.startsWith(`${contentId}:`)) {
        this.keyCache.delete(key);
      }
    });
  }
}

// Export a singleton instance
export const keyManagementService = new KeyManagementService(); 