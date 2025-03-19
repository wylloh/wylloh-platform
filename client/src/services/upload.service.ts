import axios from 'axios';
import { API_BASE_URL } from '../config';
import * as encryptionUtils from '../utils/encryption';
import { keyManagementService } from './keyManagement.service';
import { contentService } from './content.service';

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

  async uploadContent(file: File, metadata: any): Promise<{
    contentId: string;
    encryptedContentCid: string;
    encryptionKey: string;
  }> {
    try {
      console.log('Starting upload process...');
      
      // Generate a symmetric encryption key
      const encryptionKey = encryptionUtils.generateContentKey();
      console.log('Encryption key generated');
      
      // Encrypt the file
      const encryptResult = await encryptionUtils.encryptFile(file, encryptionKey);
      const encryptedFile = encryptResult.encryptedFile;
      console.log('File encrypted successfully');
      
      // Upload the encrypted file to IPFS through our API
      const formData = new FormData();
      formData.append('file', encryptedFile);
      
      const uploadResponse = await axios.post<{cid: string}>(
        `${API_BASE_URL}/api/ipfs/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      const encryptedContentCid = uploadResponse.data.cid;
      console.log('Encrypted file uploaded to IPFS:', encryptedContentCid);
      
      // Set default rights thresholds if not provided
      const rightsThresholds = metadata.rightsThresholds || [
        { quantity: 1, type: "Personal Use" },
        { quantity: 10, type: "Small Venue" },
        { quantity: 50, type: "Commercial Use" },
        { quantity: 100, type: "Broadcast Rights" }
      ];
      
      // Check if we have tokenization data in the metadata
      const shouldTokenize = metadata.tokenization?.enabled;
      const tokenizationSettings = metadata.tokenization;
      
      // Set tokenization data
      let tokenized = false;
      let price = undefined;
      let available = undefined;
      let totalSupply = undefined;
      
      // If tokenization is enabled during upload, set the appropriate fields
      if (shouldTokenize && tokenizationSettings) {
        console.log('Tokenization enabled during upload:', tokenizationSettings);
        tokenized = true;
        price = parseFloat(tokenizationSettings.price || 0.01);
        available = parseInt(tokenizationSettings.initialSupply || 1000);
        totalSupply = parseInt(tokenizationSettings.initialSupply || 1000);
      }
      
      // Create content metadata
      const contentMetadata = {
        ...metadata,
        encryptedContentCid,
        contentType: file.type,
        fileSize: file.size,
        originalFilename: file.name,
        uploadDate: new Date().toISOString(),
        status: 'active', // Ensure content is active by default
        visibility: 'public', // Ensure content is public by default
        rightsThresholds: rightsThresholds, // Ensure rights thresholds are included
        encryptionKey: encryptionKey // Save encryption key for secure access
      };
      
      // Upload metadata to content service
      const contentResponse = await contentService.createContent({
        title: metadata.title || file.name,
        description: metadata.description || '',
        contentType: file.type.split('/')[0] || 'video',
        mainFileCid: encryptedContentCid,
        metadata: {
          ...contentMetadata,
          shouldTokenize: shouldTokenize,
          tokenizationSettings: shouldTokenize ? tokenizationSettings : undefined
        },
        status: 'active', // Ensure content is active by default
        visibility: 'public', // Ensure content is public by default
        rightsThresholds: rightsThresholds, // Include rights thresholds at top level too
        tokenized: tokenized, // Set if content is tokenized
        price: price, // Set token price if tokenized
        available: available, // Set available supply if tokenized
        totalSupply: totalSupply, // Set total supply if tokenized
        tokenId: tokenized ? `token-${new Date().getTime()}` : undefined // Generate a mock token ID for demo
      });
      
      console.log('Content created in service:', contentResponse);
      
      // If tokenization was enabled during upload, record it in blockchain service or similar
      if (tokenized && metadata.walletAddress) {
        try {
          console.log('Recording tokenization in blockchain/storage service');
          // In a production app, we would call blockchain service to record the tokenization
          // For demo purposes, just log it
          localStorage.setItem(
            `tokenized_content_${contentResponse.id}`, 
            JSON.stringify({
              contentId: contentResponse.id,
              tokenized: true,
              price: price,
              supply: totalSupply,
              available: available,
              rightsThresholds: rightsThresholds,
              timestamp: new Date().toISOString()
            })
          );
        } catch (tokenizationError) {
          console.error('Error recording tokenization:', tokenizationError);
          // Continue despite tokenization recording error
        }
      }
      
      return {
        contentId: contentResponse.id,
        encryptedContentCid,
        encryptionKey: encryptionKey
      };
    } catch (error) {
      console.error('Error uploading content:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const uploadService = new UploadService(); 