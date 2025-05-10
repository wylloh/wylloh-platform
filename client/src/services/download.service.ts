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
   * Download a file from IPFS by CID with CDN optimization
   * 
   * @param cid IPFS Content Identifier
   * @returns Promise with the file blob
   */
  private async downloadFile(cid: string): Promise<Blob> {
    try {
      // Get the optimized URL from the CDN service
      const optimizedUrl = cdnService.getOptimizedUrl(cid);
      
      // Try the optimized CDN path first
      try {
        console.log(`DownloadService: Downloading from optimized CDN URL: ${optimizedUrl}`);
        const response = await axios.get(optimizedUrl, {
          responseType: 'blob',
          headers: {
            'Cache-Control': 'max-age=3600' // Enable caching
          }
        });
        return response.data;
      } catch (cdnError) {
        console.warn(`DownloadService: CDN download failed, falling back to API: ${cdnError}`);
        
        // Fallback to API if CDN fails
        const response = await axios.get(`${API_BASE_URL}/api/ipfs/${cid}`, {
          responseType: 'blob'
        });
        return response.data;
      }
    } catch (error) {
      console.error(`Error downloading file with CID ${cid}:`, error);
      throw error;
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
}

// Export singleton instance
export const downloadService = new DownloadService(); 