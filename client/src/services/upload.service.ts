import axios from 'axios';
import { API_BASE_URL } from '../config';
import * as encryptionUtils from '../utils/encryption';
import { keyManagementService } from './keyManagement.service';

/**
 * Service for handling content uploads with encryption
 */
class UploadService {
  /**
   * Upload a file to IPFS with encryption
   * 
   * @param file The file to upload
   * @param metadata Additional metadata about the content
   * @param walletAddress Owner's wallet address
   * @returns Promise with the IPFS CID and other details
   */
  async uploadEncryptedContent(
    file: File,
    metadata: any,
    walletAddress: string
  ): Promise<{ cid: string, encryptionKey: string }> {
    try {
      console.log(`Encrypting file ${file.name} before upload...`);
      
      // Step 1: Encrypt the file
      const { encryptedFile, contentKey } = await encryptionUtils.encryptFile(file);
      
      // Step 2: Upload encrypted file to IPFS
      const formData = new FormData();
      formData.append('file', encryptedFile);
      formData.append('metadata', JSON.stringify({
        ...metadata,
        encrypted: true,
        contentType: file.type,
        originalName: file.name,
        size: file.size
      }));
      
      // Perform the upload
      const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const { cid } = response.data;
      
      // Step 3: Store the encryption key securely
      await keyManagementService.storeContentKey(cid, contentKey, walletAddress);
      
      console.log(`File encrypted and uploaded. CID: ${cid}`);
      
      return {
        cid,
        encryptionKey: contentKey // Return key for developer use/debugging
      };
    } catch (error) {
      console.error('Error uploading encrypted content:', error);
      throw error;
    }
  }
  
  /**
   * Upload multiple files with encryption
   * 
   * @param files Array of files to upload
   * @param metadata Additional metadata
   * @param walletAddress Owner's wallet address
   * @returns Promise with array of results
   */
  async uploadMultipleEncrypted(
    files: File[],
    metadata: any,
    walletAddress: string
  ): Promise<Array<{ cid: string, encryptionKey: string, filename: string }>> {
    const results = [];
    
    for (const file of files) {
      const result = await this.uploadEncryptedContent(file, {
        ...metadata,
        filename: file.name
      }, walletAddress);
      
      results.push({
        ...result,
        filename: file.name
      });
    }
    
    return results;
  }
  
  /**
   * Upload media content for tokenization with encryption
   * 
   * @param mainFile Main content file
   * @param thumbnailFile Thumbnail image
   * @param previewFile Optional preview file
   * @param metadata Content metadata
   * @param walletAddress Owner's wallet address
   * @returns Object with CIDs for all uploaded files
   */
  async uploadMediaContent(
    mainFile: File,
    thumbnailFile: File,
    previewFile: File | null,
    metadata: any,
    walletAddress: string
  ): Promise<{
    mainFileCid: string,
    thumbnailCid: string,
    previewCid: string | null,
    encryptionKey: string
  }> {
    try {
      // Upload main content file with encryption
      const mainFileResult = await this.uploadEncryptedContent(
        mainFile,
        { ...metadata, contentType: 'main' },
        walletAddress
      );
      
      // Upload thumbnail (not encrypted - publicly viewable)
      const thumbnailFormData = new FormData();
      thumbnailFormData.append('file', thumbnailFile);
      thumbnailFormData.append('metadata', JSON.stringify({
        ...metadata,
        contentType: 'thumbnail',
        encrypted: false
      }));
      
      const thumbnailResponse = await axios.post(
        `${API_BASE_URL}/api/upload`,
        thumbnailFormData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      let previewCid = null;
      
      // Upload preview if provided (typically encrypted but with a lower resolution/quality)
      if (previewFile) {
        const previewResult = await this.uploadEncryptedContent(
          previewFile,
          { ...metadata, contentType: 'preview' },
          walletAddress
        );
        previewCid = previewResult.cid;
      }
      
      return {
        mainFileCid: mainFileResult.cid,
        thumbnailCid: thumbnailResponse.data.cid,
        previewCid,
        encryptionKey: mainFileResult.encryptionKey
      };
    } catch (error) {
      console.error('Error uploading media content:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const uploadService = new UploadService(); 