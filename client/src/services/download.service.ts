import axios from 'axios';
import { API_BASE_URL } from '../config';
import * as encryptionUtils from '../utils/encryption';
import { keyManagementService } from './keyManagement.service';

/**
 * Service for downloading and decrypting content
 */
class DownloadService {
  /**
   * Download a file from IPFS by CID
   * 
   * @param cid IPFS Content Identifier
   * @returns Promise with the file blob
   */
  private async downloadFile(cid: string): Promise<Blob> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ipfs/${cid}`, {
        responseType: 'blob'
      });
      
      return response.data;
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
      
      // Verify ownership before proceeding
      const ownershipVerified = await keyManagementService.verifyContentOwnership(cid, walletAddress);
      
      if (!ownershipVerified) {
        console.error('DownloadService: Ownership verification failed');
        return null;
      }
      
      const decryptedFile = await this.getDecryptedContent(cid, walletAddress);
      if (!decryptedFile) {
        console.error('DownloadService: Failed to decrypt content');
        return null;
      }
      
      // Create object URL for streaming
      const objectUrl = URL.createObjectURL(decryptedFile);
      console.log(`DownloadService: Created stream URL: ${objectUrl}`);
      return objectUrl;
    } catch (error) {
      console.error('Error creating content stream URL:', error);
      return null;
    }
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
}

// Export singleton instance
export const downloadService = new DownloadService(); 