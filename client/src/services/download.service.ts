import axios from 'axios';
import { API_BASE_URL } from '../config';
import * as encryptionUtils from '../utils/encryption';
import { keyManagementService } from './keyManagement.service';
import { cdnService } from './cdn.service';

/**
 * Service for downloading and decrypting content
 */
class DownloadService {
  /**
   * Download a file from IPFS by CID with comprehensive fallback mechanisms
   * 
   * @param cid IPFS Content Identifier
   * @returns Promise with the file blob
   */
  private async downloadFile(cid: string): Promise<Blob> {
    console.log(`🎬 Starting download for CID: ${cid}`);
    
    // Pre-flight checks
    if (!cid || cid.length < 10) {
      throw new Error('Invalid CID provided');
    }
    
    try {
      // Primary attempt: CDN service with optimized URL
      try {
        const optimizedUrl = cdnService.getOptimizedUrl(cid);
        console.log(`📡 Primary attempt: CDN URL: ${optimizedUrl}`);
        
        const response = await axios.get(optimizedUrl, {
          responseType: 'blob',
          timeout: 30000, // 30 second timeout
          headers: {
            'Cache-Control': 'max-age=3600'
          }
        });
        
        if (response.data.size === 0) {
          throw new Error('Empty file received from CDN');
        }
        
        console.log(`✅ CDN download successful: ${(response.data.size / 1024 / 1024).toFixed(2)} MB`);
        return response.data;
      } catch (cdnError) {
        console.warn(`⚠️ CDN download failed: ${cdnError}`);
        
        // Fallback #1: API endpoint
        try {
          console.log(`📡 Fallback #1: API endpoint`);
          const response = await axios.get(`${API_BASE_URL}/api/ipfs/${cid}`, {
            responseType: 'blob',
            timeout: 45000 // Longer timeout for API
          });
          
          if (response.data.size === 0) {
            throw new Error('Empty file received from API');
          }
          
          console.log(`✅ API download successful: ${(response.data.size / 1024 / 1024).toFixed(2)} MB`);
          return response.data;
        } catch (apiError) {
          console.warn(`⚠️ API download failed: ${apiError}`);
          
          // Fallback #2: Direct IPFS gateways
          const publicGateways = [
            'https://ipfs.io/ipfs',
            'https://cloudflare-ipfs.com/ipfs',
            'https://gateway.pinata.cloud/ipfs',
            'https://ipfs.dweb.link/ipfs',
            'https://ipfs.infura.io/ipfs'
          ];
          
          for (let i = 0; i < publicGateways.length; i++) {
            try {
              const gatewayUrl = `${publicGateways[i]}/${cid}`;
              console.log(`📡 Fallback #${i + 2}: ${publicGateways[i]}`);
              
              const response = await axios.get(gatewayUrl, {
                responseType: 'blob',
                timeout: 20000, // Shorter timeout for public gateways
                headers: {
                  'User-Agent': 'Wylloh-Platform/1.0'
                }
              });
              
              if (response.data.size === 0) {
                throw new Error('Empty file received');
              }
              
              console.log(`✅ Gateway download successful: ${(response.data.size / 1024 / 1024).toFixed(2)} MB`);
              return response.data;
            } catch (gatewayError) {
              console.warn(`⚠️ Gateway ${publicGateways[i]} failed: ${gatewayError}`);
              
              // Continue to next gateway
              if (i === publicGateways.length - 1) {
                console.error('❌ All IPFS gateways failed');
              }
            }
          }
        }
      }
      
      throw new Error('All download methods exhausted');
    } catch (error) {
      console.error(`❌ Critical error downloading CID ${cid}:`, error);
      throw new Error(`Failed to download content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Download and decrypt content
   * Only works if user owns the corresponding token
   * 
   * @param cid IPFS Content Identifier
   * @param walletAddress User's wallet address
   * @returns Promise with decrypted file or null if unauthorized
   */
  async getDecryptedContent(cid: string, walletAddress: string): Promise<File | null> {
    try {
      console.log(`DownloadService: Attempting to download and decrypt content: ${cid} for wallet ${walletAddress}`);
      
      // Step 1: Get the decryption key (this includes ownership verification)
      let contentKey = null;
      let retries = 3;
      
      while (retries > 0 && !contentKey) {
        console.log(`DownloadService: Attempting to get content key (attempts left: ${retries})`);
        contentKey = await keyManagementService.getContentKey(cid, walletAddress);
        
        if (!contentKey && retries > 1) {
          console.log(`DownloadService: Key retrieval failed, retrying in 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        retries--;
      }
      
      if (!contentKey) {
        console.warn('DownloadService: Failed to get content key - user likely not authorized');
        return null;
      }
      
      console.log('DownloadService: Successfully retrieved content key');
      
      // Step 2: Download the encrypted file
      console.log(`DownloadService: Downloading encrypted content from IPFS: ${cid}`);
      const encryptedBlob = await this.downloadFile(cid);
      
      // Step 3: Decrypt the file
      console.log('DownloadService: Decrypting content...');
      const decryptedFile = await encryptionUtils.decryptFile(encryptedBlob, contentKey);
      
      console.log(`DownloadService: Successfully decrypted content: ${decryptedFile.name}`);
      return decryptedFile;
    } catch (error) {
      console.error('Error getting decrypted content:', error);
      return null;
    }
  }
  
  /**
   * Create an object URL for streaming decrypted content
   * Only works if user owns the corresponding token
   * 
   * @param cid IPFS Content Identifier
   * @param walletAddress User's wallet address
   * @returns Promise with object URL for the decrypted content or null if unauthorized
   */
  async getContentStreamUrl(cid: string, walletAddress: string): Promise<string | null> {
    try {
      console.log(`DownloadService: Creating stream URL for content ${cid} and wallet ${walletAddress}`);
      
      // First try to get the cached stream URL if it exists
      const cachedStreamKey = `stream_${cid}_${walletAddress}`;
      const cachedStreamUrl = sessionStorage.getItem(cachedStreamKey);
      
      if (cachedStreamUrl) {
        console.log('DownloadService: Using cached stream URL');
        return cachedStreamUrl;
      }
      
      // Verify ownership before proceeding
      const ownershipVerified = await keyManagementService.verifyContentOwnership(cid, walletAddress);
      
      if (!ownershipVerified) {
        console.error('DownloadService: Ownership verification failed');
        return null;
      }
      
      // For content that requires decryption, we need to download and decrypt
      const decryptedFile = await this.getDecryptedContent(cid, walletAddress);
      if (!decryptedFile) {
        console.error('DownloadService: Failed to decrypt content');
        return null;
      }
      
      // Create object URL for streaming
      const objectUrl = URL.createObjectURL(decryptedFile);
      console.log(`DownloadService: Created stream URL: ${objectUrl}`);
      
      // Cache the stream URL in session storage for faster access next time
      try {
        sessionStorage.setItem(cachedStreamKey, objectUrl);
      } catch (storageError) {
        console.warn('Failed to cache stream URL:', storageError);
      }
      
      return objectUrl;
    } catch (error) {
      console.error('Error creating content stream URL:', error);
      return null;
    }
  }
  
  /**
   * Get optimized streaming URL for public (non-encrypted) content
   * 
   * @param cid IPFS Content Identifier
   * @returns Stream URL for the content
   */
  getPublicStreamUrl(cid: string): string {
    // For public content, we can use the CDN directly
    return cdnService.getStreamingUrl(cid);
  }
  
  /**
   * Check if user can access content
   * This is a lightweight check without downloading the full content
   * 
   * @param cid IPFS Content Identifier
   * @param walletAddress User's wallet address
   * @returns Promise with boolean indicating if user can access content
   */
  async canAccessContent(cid: string, walletAddress: string): Promise<boolean> {
    try {
      console.log(`DownloadService: Checking content access for ${cid} and wallet ${walletAddress}`);
      
      // Verify through key management service
      const contentKey = await keyManagementService.getContentKey(cid, walletAddress);
      const hasAccess = !!contentKey;
      
      console.log(`DownloadService: Access check result: ${hasAccess}`);
      return hasAccess;
    } catch (error) {
      console.error('Error checking content access:', error);
      return false;
    }
  }
  
  /**
   * Download content to user's device
   * 
   * @param cid IPFS Content Identifier
   * @param walletAddress User's wallet address 
   * @param filename Optional filename for the download
   * @returns Promise with boolean indicating if download was successful
   */
  async downloadContentToDevice(cid: string, walletAddress: string, filename?: string): Promise<boolean> {
    try {
      console.log(`DownloadService: Downloading content to device: ${cid}`);
      
      // First check if user can access content
      const canAccess = await this.canAccessContent(cid, walletAddress);
      
      if (!canAccess) {
        console.error('DownloadService: User does not have access to this content');
        return false;
      }
      
      // Get decrypted content
      const decryptedFile = await this.getDecryptedContent(cid, walletAddress);
      
      if (!decryptedFile) {
        console.error('DownloadService: Failed to get decrypted content');
        return false;
      }
      
      // Create download link
      const downloadUrl = URL.createObjectURL(decryptedFile);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = filename || decryptedFile.name;
      
      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Cleanup
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadUrl);
      
      console.log('DownloadService: Download initiated successfully');
      return true;
    } catch (error) {
      console.error('Error downloading content to device:', error);
      return false;
    }
  }
  
  /**
   * Prefetch content for faster playback
   * 
   * @param cid IPFS Content Identifier
   * @param walletAddress User's wallet address
   */
  async prefetchContent(cid: string, walletAddress: string): Promise<void> {
    try {
      console.log(`DownloadService: Prefetching content: ${cid}`);
      
      // Check access first - don't prefetch if user can't access
      const canAccess = await this.canAccessContent(cid, walletAddress);
      if (!canAccess) {
        console.log('DownloadService: User cannot access content, skipping prefetch');
        return;
      }
      
      // Use the CDN service to prefetch
      await cdnService.prefetchContent(cid);
      
      console.log(`DownloadService: Prefetch initiated for ${cid}`);
    } catch (error) {
      console.warn(`DownloadService: Error prefetching content: ${error}`);
    }
  }
  
  /**
   * Comprehensive pre-flight check for content access and system readiness
   * 
   * @param cid IPFS Content Identifier
   * @param walletAddress User's wallet address
   * @returns Promise with detailed check results
   */
  async performPreFlightCheck(cid: string, walletAddress: string): Promise<{
    canAccess: boolean;
    keyAvailable: boolean;
    contentExists: boolean;
    estimatedSize: number;
    memoryAvailable: boolean;
    recommendations: string[];
    warnings: string[];
  }> {
    console.log(`🔍 Starting pre-flight check for CID: ${cid}`);
    
    const results = {
      canAccess: false,
      keyAvailable: false,
      contentExists: false,
      estimatedSize: 0,
      memoryAvailable: false,
      recommendations: [] as string[],
      warnings: [] as string[]
    };
    
    try {
      // Check 1: Key availability
      console.log('🔑 Checking content key availability...');
      const contentKey = await keyManagementService.getContentKey(cid, walletAddress);
      results.keyAvailable = !!contentKey;
      
      if (!results.keyAvailable) {
        results.warnings.push('Content key not available - user may not own this content');
        return results;
      }
      
      console.log('✅ Content key available');
      
      // Check 2: Content existence (HEAD request to avoid downloading)
      console.log('📡 Checking content existence...');
      try {
        const optimizedUrl = cdnService.getOptimizedUrl(cid);
        const headResponse = await axios.head(optimizedUrl, { timeout: 10000 });
        results.contentExists = true;
        results.estimatedSize = parseInt(headResponse.headers['content-length'] || '0');
        console.log(`✅ Content exists, size: ${(results.estimatedSize / 1024 / 1024).toFixed(2)} MB`);
      } catch (headError) {
        console.warn('⚠️ HEAD request failed, trying alternative check...');
        
        // Alternative: Try a small range request
        try {
          const response = await axios.get(cdnService.getOptimizedUrl(cid), {
            headers: { 'Range': 'bytes=0-1024' },
            responseType: 'blob',
            timeout: 5000
          });
          results.contentExists = true;
          console.log('✅ Content exists (confirmed via range request)');
        } catch (rangeError) {
          results.warnings.push('Content may not be available on IPFS network');
          return results;
        }
      }
      
      // Check 3: Memory availability
      console.log('💾 Checking memory availability...');
      const navigatorWithMemory = navigator as any;
      if (navigatorWithMemory.deviceMemory) {
        const deviceMemoryGB = navigatorWithMemory.deviceMemory;
        const estimatedMemoryNeeded = results.estimatedSize * 2.5; // Account for base64 overhead and processing
        const deviceMemoryBytes = deviceMemoryGB * 1024 * 1024 * 1024;
        
        results.memoryAvailable = estimatedMemoryNeeded < (deviceMemoryBytes * 0.5); // Use max 50% of device memory
        
        if (!results.memoryAvailable) {
          results.warnings.push(`Large file (${(results.estimatedSize / 1024 / 1024).toFixed(2)} MB) may cause memory issues on this device`);
          results.recommendations.push('Consider using a device with more memory for optimal performance');
        } else {
          console.log(`✅ Sufficient memory available (${deviceMemoryGB}GB device)`);
        }
      } else {
        // Fallback for browsers that don't support navigator.deviceMemory
        results.memoryAvailable = results.estimatedSize < 500 * 1024 * 1024; // Conservative 500MB limit
        if (!results.memoryAvailable) {
          results.warnings.push('Large file detected - memory usage may be high');
        }
      }
      
      // Check 4: Browser compatibility
      console.log('🌐 Checking browser compatibility...');
      if (!window.crypto.subtle) {
        results.warnings.push('Browser does not support Web Crypto API - decryption may fail');
        return results;
      }
      
      if (!window.indexedDB) {
        results.warnings.push('Browser does not support IndexedDB - caching may be limited');
      }
      
      // Check 5: Network speed estimation (simplified)
      console.log('🌐 Estimating network conditions...');
      const navigatorWithConnection = navigator as any;
      if (navigatorWithConnection.connection) {
        const connection = navigatorWithConnection.connection;
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          results.warnings.push('Slow network detected - download may take considerable time');
          results.recommendations.push('Consider downloading over WiFi for better experience');
        } else if (connection.effectiveType === '3g') {
          results.recommendations.push('Download may take several minutes over 3G');
        }
      }
      
      // Final assessment
      results.canAccess = results.keyAvailable && results.contentExists;
      
      if (results.canAccess) {
        console.log('✅ Pre-flight check passed - content ready for access');
        
        // Performance recommendations
        if (results.estimatedSize > 100 * 1024 * 1024) {
          results.recommendations.push('Large file detected - ensure stable internet connection');
        }
        
        if (results.estimatedSize > 1024 * 1024 * 1024) {
          results.recommendations.push('Very large file (>1GB) - consider downloading during off-peak hours');
        }
      } else {
        console.warn('⚠️ Pre-flight check failed');
      }
      
      return results;
    } catch (error) {
      console.error('❌ Pre-flight check error:', error);
      results.warnings.push(`Pre-flight check failed: ${error instanceof Error ? error.message : String(error)}`);
      return results;
    }
  }
}

// Export singleton instance
export const downloadService = new DownloadService(); 