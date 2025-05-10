import { ethers } from 'ethers';
import { blockchainService } from './blockchain.service';
import * as encryptionUtils from '../utils/encryption';
import { AccessLevel, EncryptedAccessRight } from '../utils/encryption';

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
 * Interface for access rights storage
 */
interface AccessRightsRecord {
  contentId: string;
  userId: string;
  accessLevel: AccessLevel;
  expiresAt?: number;
  issuedAt: number;
  issuedBy: string;
}

/**
 * Key management service for content encryption/decryption
 * Handles secure storage and retrieval of content keys through blockchain
 */
class KeyManagementService {
  // Cache of decrypted content keys to avoid repeated decryption
  private keyCache: Map<string, { key: string, timestamp: number, accessLevel: AccessLevel }> = new Map();
  
  // Cache of user access rights to avoid repeated lookups
  private accessRightsCache: Map<string, { rights: AccessRightsRecord, timestamp: number }> = new Map();
  
  // Current key version (for rotation support)
  private currentKeyVersion: number = 1;
  
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
      const encryptedContentKey = await encryptionUtils.encryptContentKeyForUser(
        contentId,
        contentKey, 
        'contract',  // Contract is treated as a user
        contractAddress, // Using contract address as encryption key (just for demo)
        AccessLevel.FULL_CONTROL
      );
      
      // 3. Store the encrypted key
      // In production: contentContract.storeEncryptedKey(encryptedKey);
      // For demo, we'll use localStorage
      const keyRecord: ContentKeyRecord = {
        contentId,
        encryptedKey: encryptedContentKey.encryptedKey,
        keyVersion: this.currentKeyVersion,
        timestamp: Date.now()
      };
      
      localStorage.setItem(`content_key:${contentId}`, JSON.stringify(keyRecord));
      console.log(`Stored encrypted key for content ${contentId}`);
      
      // 4. Grant full access to the creator
      await this.grantAccess(contentId, walletAddress, walletAddress, AccessLevel.FULL_CONTROL);
      
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
      
      // 1. Check access rights
      const accessRights = await this.getUserAccessRights(contentId, walletAddress);
      
      if (!accessRights || accessRights.accessLevel === AccessLevel.NONE) {
        console.warn(`User ${walletAddress} has no access rights for content ${contentId}`);
        
        // As a fallback, check token ownership for backward compatibility
        const ownsToken = await this.verifyContentOwnership(contentId, walletAddress);
        if (!ownsToken) {
          console.warn('User does not own this content');
          return null;
        }
      }
      
      // If access has expired, deny access
      if (accessRights?.expiresAt && accessRights.expiresAt < Date.now()) {
        console.warn(`Access rights for ${walletAddress} to content ${contentId} have expired`);
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
      
      // 4. If the key version has changed, derive the correct key
      let finalKey = contentKey;
      if (keyRecord.keyVersion !== 1) {
        finalKey = await encryptionUtils.deriveKeyForVersion(contentKey, keyRecord.keyVersion);
      }
      
      // Store in cache with access level
      this.keyCache.set(cacheKey, {
        key: finalKey,
        timestamp: Date.now(),
        accessLevel: accessRights?.accessLevel || AccessLevel.VIEW
      });
      
      return finalKey;
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
            // If ownership is verified, automatically grant full access rights
            await this.grantAccess(contentId, walletAddress, walletAddress, AccessLevel.FULL_CONTROL);
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
            // If ownership is verified, automatically grant full access rights
            await this.grantAccess(contentId, walletAddress, walletAddress, AccessLevel.FULL_CONTROL);
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
        // If ownership is verified, automatically grant full access rights
        await this.grantAccess(contentId, walletAddress, walletAddress, AccessLevel.FULL_CONTROL);
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
        // If ownership is verified, automatically grant full access rights
        await this.grantAccess(contentId, walletAddress, walletAddress, AccessLevel.FULL_CONTROL);
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
              // If ownership is verified, automatically grant full access rights
              await this.grantAccess(contentId, walletAddress, walletAddress, AccessLevel.FULL_CONTROL);
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
   * @param contentId Content identifier
   */
  clearKeyCache(contentId: string): void {
    // Remove all cache entries for this content
    for (const key of Array.from(this.keyCache.keys())) {
      if (key.startsWith(`${contentId}:`)) {
        this.keyCache.delete(key);
      }
    }
    
    // Also clear access rights cache
    for (const key of Array.from(this.accessRightsCache.keys())) {
      if (key.startsWith(`${contentId}:`)) {
        this.accessRightsCache.delete(key);
      }
    }
  }
  
  /**
   * Grant access rights to a user for specific content
   * 
   * @param contentId Content identifier
   * @param issuerAddress Address of the user granting access
   * @param recipientAddress Address of the user receiving access
   * @param accessLevel Access level to grant
   * @param expiresAt Optional expiration timestamp
   * @returns Success status
   */
  async grantAccess(
    contentId: string,
    issuerAddress: string,
    recipientAddress: string,
    accessLevel: AccessLevel,
    expiresAt?: number
  ): Promise<boolean> {
    try {
      // 1. Verify that issuer has right to grant access
      // Skip this check if issuer is granting to themselves (needed for initialization)
      if (issuerAddress !== recipientAddress) {
        const issuerRights = await this.getUserAccessRights(contentId, issuerAddress);
        
        if (!issuerRights || issuerRights.accessLevel < AccessLevel.FULL_CONTROL) {
          console.warn(`User ${issuerAddress} does not have rights to grant access to ${contentId}`);
          return false;
        }
      }
      
      // 2. Create access rights record
      const accessRights: AccessRightsRecord = {
        contentId,
        userId: recipientAddress,
        accessLevel,
        expiresAt,
        issuedAt: Date.now(),
        issuedBy: issuerAddress
      };
      
      // 3. Store access rights
      // In production, this would be stored on the blockchain
      // For demo, we'll use localStorage
      const accessRightsKey = `access_rights:${contentId}:${recipientAddress}`;
      localStorage.setItem(accessRightsKey, JSON.stringify(accessRights));
      
      // 4. Update cache
      this.accessRightsCache.set(`${contentId}:${recipientAddress}`, {
        rights: accessRights,
        timestamp: Date.now()
      });
      
      console.log(`Granted ${AccessLevel[accessLevel]} access to ${recipientAddress} for content ${contentId}`);
      return true;
    } catch (error) {
      console.error('Error granting access rights:', error);
      return false;
    }
  }
  
  /**
   * Revoke access rights from a user
   * 
   * @param contentId Content identifier
   * @param issuerAddress Address of the user revoking access
   * @param targetAddress Address of the user losing access
   * @returns Success status
   */
  async revokeAccess(
    contentId: string,
    issuerAddress: string,
    targetAddress: string
  ): Promise<boolean> {
    try {
      // 1. Verify that issuer has right to revoke access
      const issuerRights = await this.getUserAccessRights(contentId, issuerAddress);
      
      if (!issuerRights || issuerRights.accessLevel < AccessLevel.FULL_CONTROL) {
        console.warn(`User ${issuerAddress} does not have rights to revoke access to ${contentId}`);
        return false;
      }
      
      // 2. Remove access rights
      const accessRightsKey = `access_rights:${contentId}:${targetAddress}`;
      localStorage.removeItem(accessRightsKey);
      
      // 3. Update cache
      this.accessRightsCache.delete(`${contentId}:${targetAddress}`);
      this.keyCache.delete(`${contentId}:${targetAddress}`);
      
      console.log(`Revoked access from ${targetAddress} for content ${contentId}`);
      return true;
    } catch (error) {
      console.error('Error revoking access rights:', error);
      return false;
    }
  }
  
  /**
   * Get user's access rights for specific content
   * 
   * @param contentId Content identifier
   * @param userAddress User's wallet address
   * @returns Access rights or null if none found
   */
  async getUserAccessRights(
    contentId: string,
    userAddress: string
  ): Promise<AccessRightsRecord | null> {
    try {
      // 1. Check cache first
      const cacheKey = `${contentId}:${userAddress}`;
      const cachedRights = this.accessRightsCache.get(cacheKey);
      
      // Use cached rights if available and not expired (5 minutes)
      if (cachedRights && (Date.now() - cachedRights.timestamp < 5 * 60 * 1000)) {
        return cachedRights.rights;
      }
      
      // 2. Get access rights from storage
      // In production, this would be retrieved from the blockchain
      // For demo, we'll use localStorage
      const accessRightsKey = `access_rights:${contentId}:${userAddress}`;
      const accessRightsJson = localStorage.getItem(accessRightsKey);
      
      if (!accessRightsJson) {
        return null;
      }
      
      // 3. Parse access rights
      const accessRights: AccessRightsRecord = JSON.parse(accessRightsJson);
      
      // 4. Update cache
      this.accessRightsCache.set(cacheKey, {
        rights: accessRights,
        timestamp: Date.now()
      });
      
      return accessRights;
    } catch (error) {
      console.error('Error getting user access rights:', error);
      return null;
    }
  }
  
  /**
   * Get all users with access to specific content
   * 
   * @param contentId Content identifier
   * @returns Array of access rights records
   */
  async getContentAccessRights(contentId: string): Promise<AccessRightsRecord[]> {
    const accessRights: AccessRightsRecord[] = [];
    
    // In production, this would be retrieved from the blockchain
    // For demo, we'll scan localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`access_rights:${contentId}:`)) {
          const rightsJson = localStorage.getItem(key);
          if (rightsJson) {
            try {
              const rights: AccessRightsRecord = JSON.parse(rightsJson);
              accessRights.push(rights);
            } catch (error) {
              console.warn(`Error parsing access rights for key ${key}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error scanning access rights:', error);
    }
    
    return accessRights;
  }
  
  /**
   * Rotate content key to a new version
   * This allows revoking access from all users without re-encrypting the content
   * 
   * @param contentId Content identifier
   * @param issuerAddress Address of the user rotating the key
   * @returns Success status
   */
  async rotateContentKey(contentId: string, issuerAddress: string): Promise<boolean> {
    try {
      // 1. Verify that issuer has right to rotate key
      const issuerRights = await this.getUserAccessRights(contentId, issuerAddress);
      
      if (!issuerRights || issuerRights.accessLevel < AccessLevel.FULL_CONTROL) {
        console.warn(`User ${issuerAddress} does not have rights to rotate key for ${contentId}`);
        return false;
      }
      
      // 2. Get existing key record
      const keyRecordKey = `content_key:${contentId}`;
      const keyRecordJson = localStorage.getItem(keyRecordKey);
      
      if (!keyRecordJson) {
        console.error(`No key record found for content ${contentId}`);
        return false;
      }
      
      const keyRecord: ContentKeyRecord = JSON.parse(keyRecordJson);
      
      // 3. Increment key version
      const newVersion = keyRecord.keyVersion + 1;
      
      // 4. Update key record
      const updatedRecord: ContentKeyRecord = {
        ...keyRecord,
        keyVersion: newVersion,
        timestamp: Date.now()
      };
      
      localStorage.setItem(keyRecordKey, JSON.stringify(updatedRecord));
      
      // 5. Clear all key caches for this content
      this.clearKeyCache(contentId);
      
      console.log(`Rotated key for content ${contentId} to version ${newVersion}`);
      return true;
    } catch (error) {
      console.error('Error rotating content key:', error);
      return false;
    }
  }
  
  /**
   * Check if user has specific access level for content
   * 
   * @param contentId Content identifier
   * @param userAddress User's wallet address
   * @param requiredLevel Required access level
   * @returns Whether user has required access level
   */
  async hasAccessLevel(
    contentId: string,
    userAddress: string,
    requiredLevel: AccessLevel
  ): Promise<boolean> {
    try {
      // Get user's access rights
      const accessRights = await this.getUserAccessRights(contentId, userAddress);
      
      // Check if user has sufficient access level
      if (!accessRights || accessRights.accessLevel < requiredLevel) {
        // As a fallback, check token ownership for backward compatibility
        if (requiredLevel <= AccessLevel.VIEW) {
          const ownsToken = await this.verifyContentOwnership(contentId, userAddress);
          return ownsToken;
        }
        return false;
      }
      
      // Check if access has expired
      if (accessRights.expiresAt && accessRights.expiresAt < Date.now()) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking access level:', error);
      return false;
    }
  }
}

// Export singleton instance
export const keyManagementService = new KeyManagementService(); 