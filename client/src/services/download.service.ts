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
      console.log(`Attempting to download and decrypt content: ${cid}`);
      
      // Step 1: Get the decryption key (this includes ownership verification)
      const contentKey = await keyManagementService.getContentKey(cid, walletAddress);
      if (!contentKey) {
        console.warn('Failed to get content key - user likely not authorized');
        return null;
      }
      
      // Step 2: Download the encrypted file
      const encryptedBlob = await this.downloadFile(cid);
      
      // Step 3: Decrypt the file
      const decryptedFile = await encryptionUtils.decryptFile(encryptedBlob, contentKey);
      
      console.log(`Successfully decrypted content: ${decryptedFile.name}`);
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
      const decryptedFile = await this.getDecryptedContent(cid, walletAddress);
      if (!decryptedFile) {
        return null;
      }
      
      // Create object URL for streaming
      const objectUrl = URL.createObjectURL(decryptedFile);
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
      // Just check if we can get the content key
      const contentKey = await keyManagementService.getContentKey(cid, walletAddress);
      return !!contentKey;
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
   * @param filename Optional filename to use for download
   * @returns Promise indicating download success
   */
  async downloadContentToDevice(
    cid: string, 
    walletAddress: string,
    filename?: string
  ): Promise<boolean> {
    try {
      const decryptedFile = await this.getDecryptedContent(cid, walletAddress);
      if (!decryptedFile) {
        return false;
      }
      
      // Create download link
      const url = URL.createObjectURL(decryptedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || decryptedFile.name;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Error downloading content to device:', error);
      return false;
    }
  }
}

// Export singleton instance
export const downloadService = new DownloadService(); 