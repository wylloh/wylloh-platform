import { IPFSHTTPClient } from 'ipfs-http-client';
import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

// Types
interface FileUploadResult {
  cid: string;
  size: number;
  path: string;
}

// Singleton IPFS client
let ipfsClient: IPFSHTTPClient;

/**
 * Initialize the IPFS service with a client
 * @param client IPFS HTTP client instance
 */
export const initializeIPFSService = (client: IPFSHTTPClient) => {
  ipfsClient = client;
};

/**
 * Upload a file to IPFS
 * @param fileBuffer File data as buffer
 * @param encryptionKey Optional encryption key
 * @returns Promise resolving to IPFS CID
 */
export const uploadToIPFS = async (
  fileBuffer: Buffer,
  encryptionKey?: string
): Promise<FileUploadResult> => {
  try {
    if (!ipfsClient) {
      throw new Error('IPFS client not initialized');
    }

    // Generate a unique path for the file
    const path = `wylloh/${uuidv4()}`;
    
    // Encrypt the file if an encryption key is provided
    let dataToUpload = fileBuffer;
    if (encryptionKey) {
      const encryptedData = CryptoJS.AES.encrypt(
        fileBuffer.toString('base64'),
        encryptionKey
      ).toString();
      dataToUpload = Buffer.from(encryptedData);
    }

    // Upload to IPFS
    const added = await ipfsClient.add({
      path,
      content: dataToUpload,
    }, {
      pin: true,
      wrapWithDirectory: true,
    });

    // Return the last item which is the directory containing the file
    const lastItem = added.cid.toString();
    
    return {
      cid: lastItem,
      size: dataToUpload.length,
      path,
    };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
};

/**
 * Retrieve a file from IPFS
 * @param cid IPFS CID of the file
 * @param encryptionKey Optional decryption key
 * @returns Promise resolving to file data as buffer
 */
export const retrieveFromIPFS = async (
  cid: string,
  encryptionKey?: string
): Promise<Buffer> => {
  try {
    if (!ipfsClient) {
      throw new Error('IPFS client not initialized');
    }

    // Get the file from IPFS
    const chunks = [];
    for await (const chunk of ipfsClient.cat(cid)) {
      chunks.push(chunk);
    }
    
    // Combine chunks
    const fileBuffer = Buffer.concat(chunks);

    // Decrypt the file if an encryption key was provided
    if (encryptionKey) {
      const decryptedData = CryptoJS.AES.decrypt(
        fileBuffer.toString(),
        encryptionKey
      );
      
      const decryptedBase64 = decryptedData.toString(CryptoJS.enc.Utf8);
      return Buffer.from(decryptedBase64, 'base64');
    }

    return fileBuffer;
  } catch (error) {
    console.error('Error retrieving from IPFS:', error);
    throw error;
  }
};

/**
 * Create a metadata JSON file and upload to IPFS
 * @param metadata Metadata object
 * @returns Promise resolving to IPFS CID
 */
export const uploadMetadata = async (metadata: Record<string, any>): Promise<string> => {
  try {
    if (!ipfsClient) {
      throw new Error('IPFS client not initialized');
    }

    // Convert metadata to JSON string and then to buffer
    const metadataBuffer = Buffer.from(JSON.stringify(metadata));
    
    // Upload to IPFS
    const added = await ipfsClient.add(metadataBuffer, { pin: true });
    
    return added.cid.toString();
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw error;
  }
};

/**
 * Pin a file to ensure it stays available
 * @param cid IPFS CID to pin
 * @returns Promise resolving when pin is complete
 */
export const pinContent = async (cid: string): Promise<void> => {
  try {
    if (!ipfsClient) {
      throw new Error('IPFS client not initialized');
    }

    await ipfsClient.pin.add(cid);
  } catch (error) {
    console.error('Error pinning content:', error);
    throw error;
  }
};

/**
 * Check if content exists on IPFS
 * @param cid IPFS CID to check
 * @returns Promise resolving to boolean indicating if content exists
 */
export const checkContentExists = async (cid: string): Promise<boolean> => {
  try {
    if (!ipfsClient) {
      throw new Error('IPFS client not initialized');
    }

    // Try to get the stat for the CID
    await ipfsClient.files.stat(`/ipfs/${cid}`);
    return true;
  } catch (error) {
    // If the error is because the content doesn't exist, return false
    if (error.message.includes('does not exist')) {
      return false;
    }
    // Otherwise, rethrow the error
    throw error;
  }
};

/**
 * Generate a gateway URL for an IPFS CID
 * @param cid IPFS CID
 * @returns Gateway URL for the content
 */
export const getGatewayUrl = (cid: string): string => {
  const gateway = process.env.IPFS_GATEWAY_URL || 'http://localhost:8080';
  return `${gateway}/ipfs/${cid}`;
};