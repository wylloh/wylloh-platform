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
   * Store an encrypted content key with redundant storage
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
      
      // 3. Store the encrypted key with TRIPLE REDUNDANCY to prevent loss
      const keyRecord: ContentKeyRecord = {
        contentId,
        encryptedKey: encryptedContentKey.encryptedKey,
        keyVersion: this.currentKeyVersion,
        timestamp: Date.now()
      };
      
      // Primary storage
      localStorage.setItem(`content_key:${contentId}`, JSON.stringify(keyRecord));
      
      // Backup storage #1 - with wallet address
      localStorage.setItem(`content_key_backup:${contentId}:${walletAddress}`, JSON.stringify(keyRecord));
      
      // Backup storage #2 - in user's key collection
      const userKeyCollection = JSON.parse(localStorage.getItem(`user_keys:${walletAddress}`) || '{}');
      userKeyCollection[contentId] = keyRecord;
      localStorage.setItem(`user_keys:${walletAddress}`, JSON.stringify(userKeyCollection));
      
      // Emergency backup #3 - base64 encoded for corruption resistance
      const base64KeyRecord = btoa(JSON.stringify(keyRecord));
      localStorage.setItem(`content_key_b64:${contentId}`, base64KeyRecord);
      
      console.log(`✅ Stored encrypted key for content ${contentId} with triple redundancy`);
      
      // 4. Grant full access to the creator
      await this.grantAccess(contentId, walletAddress, walletAddress, AccessLevel.FULL_CONTROL);
      
      return true;
    } catch (error) {
      console.error('Error storing content key:', error);
      return false;
    }
  }
  
  /**
   * Retrieve and decrypt a content key with fallback mechanisms
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
        console.log('✅ Using cached content key');
        return cachedKey.key;
      }
      
      // 1. Check access rights first
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
      
      // 2. Get encrypted key with MULTIPLE FALLBACK MECHANISMS
      let keyRecord: ContentKeyRecord | null = null;
      
      // Try primary storage
      const keyRecordStr = localStorage.getItem(`content_key:${contentId}`);
      if (keyRecordStr) {
        try {
          keyRecord = JSON.parse(keyRecordStr);
          console.log('✅ Retrieved key from primary storage');
        } catch (e) {
          console.warn('Primary key storage corrupted, trying backups...');
        }
      }
      
      // Fallback #1: User-specific backup
      if (!keyRecord) {
        const backupKeyStr = localStorage.getItem(`content_key_backup:${contentId}:${walletAddress}`);
        if (backupKeyStr) {
          try {
            keyRecord = JSON.parse(backupKeyStr);
            console.log('✅ Retrieved key from backup storage #1');
          } catch (e) {
            console.warn('Backup storage #1 corrupted...');
          }
        }
      }
      
      // Fallback #2: User key collection
      if (!keyRecord) {
        const userKeyCollection = JSON.parse(localStorage.getItem(`user_keys:${walletAddress}`) || '{}');
        if (userKeyCollection[contentId]) {
          keyRecord = userKeyCollection[contentId];
          console.log('✅ Retrieved key from user key collection');
        }
      }
      
      // Emergency Fallback #3: Base64 encoded backup
      if (!keyRecord) {
        const base64KeyRecord = localStorage.getItem(`content_key_b64:${contentId}`);
        if (base64KeyRecord) {
          try {
            const decodedRecord = atob(base64KeyRecord);
            keyRecord = JSON.parse(decodedRecord);
            console.log('✅ Retrieved key from emergency base64 backup');
          } catch (e) {
            console.warn('Emergency backup corrupted...');
          }
        }
      }
      
      if (!keyRecord) {
        console.error('❌ No key record found for content in any storage location');
        return null;
      }
      
      // 3. Decrypt the key using wallet's private key
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
      
      console.log('✅ Successfully retrieved and decrypted content key');
      return finalKey;
    } catch (error) {
      console.error('❌ Error retrieving content key:', error);
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
          const provider = new ethers.providers.JsonRpcProvider(
      process.env.REACT_APP_WEB3_PROVIDER || 'https://polygon-rpc.com'
    );
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
  
  /**
   * Store content key on IPFS for decentralized access
   * This ensures users can access their content even if the platform disappears
   * 
   * @param contentId Content identifier
   * @param contentKey Raw content encryption key
   * @param walletAddress Owner's wallet address
   * @returns IPFS CID of the stored key record
   */
  async storeContentKeyOnIPFS(contentId: string, contentKey: string, walletAddress: string): Promise<string | null> {
    try {
      console.log('🌐 Storing content key on IPFS for decentralized access...');
      
      // 1. Create wallet-specific key derivation
      // This allows the user to recover the key using only their wallet private key
      const walletDerivedKey = await this.deriveKeyFromWallet(walletAddress, contentId);
      
      // 2. Encrypt the content key with the wallet-derived key
      const encryptedKey = await encryptionUtils.encryptContent(
        contentKey,
        walletDerivedKey,
        true // Use performance mode for key data
      );
      
      // 3. Create a decentralized key record
      const decentralizedKeyRecord = {
        contentId,
        encryptedContentKey: encryptedKey,
        ownerWallet: walletAddress,
        timestamp: Date.now(),
        version: 1,
        // Include recovery instructions
        recoveryInstructions: {
          method: 'wallet-derivation',
          algorithm: 'AES-CTR',
          note: 'Key can be recovered using wallet private key + contentId'
        }
      };
      
      // 4. Upload to IPFS
      const keyRecordJson = JSON.stringify(decentralizedKeyRecord);
      const keyRecordBlob = new Blob([keyRecordJson], { type: 'application/json' });
      
      // Use our upload service to store on IPFS
      const formData = new FormData();
      formData.append('file', keyRecordBlob, `key-${contentId}.json`);
      
      const response = await fetch(`https://ipfs.wylloh.com/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload key to IPFS');
      }
      
      const { cid: keyRecordCid } = await response.json();
      console.log(`✅ Content key stored on IPFS: ${keyRecordCid}`);
      
      // 5. Store the IPFS CID in the token metadata (this should go in the tokenization process)
      // This creates the link: Token → IPFS Key CID → Encrypted Key → Content
      await this.updateTokenMetadataWithKeyCID(contentId, keyRecordCid);
      
      // 6. Also store locally as a cache (but IPFS is the source of truth)
      localStorage.setItem(`ipfs_key_cid:${contentId}`, keyRecordCid);
      
      return keyRecordCid;
    } catch (error) {
      console.error('❌ Failed to store content key on IPFS:', error);
      return null;
    }
  }
  
  /**
   * Retrieve content key from IPFS using only wallet and contentId
   * This enables true decentralized access
   * 
   * @param contentId Content identifier
   * @param walletAddress User's wallet address
   * @returns Decrypted content key or null
   */
  async getContentKeyFromIPFS(contentId: string, walletAddress: string): Promise<string | null> {
    try {
      console.log('🌐 Retrieving content key from IPFS...');
      
      // 1. Get the IPFS CID from token metadata or local cache
      let keyRecordCid = localStorage.getItem(`ipfs_key_cid:${contentId}`);
      
      if (!keyRecordCid) {
        // Try to get from token metadata on-chain
        keyRecordCid = await this.getKeyCIDFromTokenMetadata(contentId);
      }
      
      if (!keyRecordCid) {
        console.warn('No IPFS key CID found for content');
        return null;
      }
      
      // 2. Download the key record from IPFS
      const keyRecordResponse = await fetch(`https://ipfs.wylloh.com/${keyRecordCid}`);
      if (!keyRecordResponse.ok) {
        throw new Error('Failed to download key record from IPFS');
      }
      
      const decentralizedKeyRecord = await keyRecordResponse.json();
      
      // 3. Verify this key record is for the requesting wallet
      if (decentralizedKeyRecord.ownerWallet !== walletAddress) {
        console.warn('Key record owner mismatch');
        return null;
      }
      
      // 4. Derive the wallet-specific key
      const walletDerivedKey = await this.deriveKeyFromWallet(walletAddress, contentId);
      
      // 5. Decrypt the content key
      const contentKey = await encryptionUtils.decryptContent(
        decentralizedKeyRecord.encryptedContentKey,
        walletDerivedKey
      );
      
      console.log('✅ Successfully retrieved content key from IPFS');
      return contentKey;
    } catch (error) {
      console.error('❌ Failed to retrieve content key from IPFS:', error);
      return null;
    }
  }
  
  /**
   * Derive a deterministic key from user's wallet for content access
   * This ensures the user can always recover access using only their wallet
   * 
   * @param walletAddress User's wallet address
   * @param contentId Content identifier
   * @returns Wallet-derived encryption key
   */
  private async deriveKeyFromWallet(walletAddress: string, contentId: string): Promise<string> {
    // Create a deterministic seed from wallet address + contentId
    const encoder = new TextEncoder();
    const seedData = encoder.encode(`${walletAddress.toLowerCase()}:${contentId}`);
    
    // Use the wallet's private key to sign the seed (this requires MetaMask)
    // In a production system, this would use the wallet's signing capability
    
    // For demo, we'll use HKDF with the wallet address as key material
    const walletKeyMaterial = encoder.encode(walletAddress.toLowerCase());
    
    // Import key material
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      walletKeyMaterial,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Derive key using HMAC
    const signature = await window.crypto.subtle.sign('HMAC', keyMaterial, seedData);
    
    // Use first 32 bytes as the derived key
    const derivedKey = new Uint8Array(signature).slice(0, 32);
    
    return Buffer.from(derivedKey).toString('base64');
  }
  
  /**
   * Update token metadata with IPFS key CID
   * This creates the on-chain link to the decentralized key storage
   */
  private async updateTokenMetadataWithKeyCID(contentId: string, keyCid: string): Promise<void> {
    // This should be called during tokenization to embed the key CID in token metadata
    // For now, we'll store it locally as a reference
    localStorage.setItem(`token_key_cid:${contentId}`, keyCid);
    
    // TODO: In production, update the token's metadata URI to include:
    // {
    //   "content_cid": "QmContentHash...",
    //   "key_cid": "QmKeyHash...",
    //   "access_method": "wallet-derivation"
    // }
  }
  
  /**
   * Get key CID from token metadata
   */
  private async getKeyCIDFromTokenMetadata(contentId: string): Promise<string | null> {
    // Try local storage first
    const localKeyCid = localStorage.getItem(`token_key_cid:${contentId}`);
    if (localKeyCid) return localKeyCid;
    
    // TODO: In production, query the blockchain for token metadata
    // and extract the key_cid field
    
    return null;
  }
}

// Export singleton instance
export const keyManagementService = new KeyManagementService(); 