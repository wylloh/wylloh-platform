import { IPFSHTTPClient } from 'ipfs-http-client';
import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { 
  getGatewayUrl as getOptimalGatewayUrl, 
  fetchFromGateway, 
  getFallbackGateways, 
  initGatewayService 
} from './gatewayService';

// Config constants
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // ms
const TEMP_DIR = process.env.TEMP_UPLOAD_DIR || path.join(__dirname, '../../temp');
const CHUNK_SIZE = parseInt(process.env.IPFS_CHUNK_SIZE || '262144', 10); // 256KB default
const PIN_TIMEOUT = parseInt(process.env.IPFS_PIN_TIMEOUT || '120000', 10); // 2 minutes default

// External pinning services configuration
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
const INFURA_IPFS_PROJECT_ID = process.env.INFURA_IPFS_PROJECT_ID;
const INFURA_IPFS_PROJECT_SECRET = process.env.INFURA_IPFS_PROJECT_SECRET;

// Types
interface FileUploadResult {
  cid: string;
  size: number;
  path: string;
}

interface ChunkUploadResult {
  tempFilePath: string;
  size: number;
}

interface UploadJob {
  id: string;
  filename: string;
  mimeType: string;
  totalChunks: number;
  receivedChunks: number;
  chunkPaths: string[];
  totalSize: number;
  uploadStartTime: Date;
  status: 'in-progress' | 'completed' | 'failed';
  errorMessage?: string;
}

// Pinning service interface
interface PinningService {
  name: string;
  pin: (cid: string) => Promise<boolean>;
  unpin: (cid: string) => Promise<boolean>;
  isAvailable: () => Promise<boolean>;
}

// Singleton IPFS client
let ipfsClient: IPFSHTTPClient;

// In-memory storage for upload jobs
const uploadJobs = new Map<string, UploadJob>();

// Track pinned content with timestamp
const pinnedContent = new Map<string, { timestamp: number, pinningServices: string[] }>();

/**
 * Initialize the IPFS service with a client
 * @param client IPFS HTTP client instance
 */
export const initializeIPFSService = (client: IPFSHTTPClient) => {
  console.log('Initializing IPFS service...');
  
  if (!client) {
    throw new Error('IPFS client is required');
  }
  
  ipfsClient = client;
  
  // Initialize pinning services
  initializePinningServices();
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  
  // Set up cleanup schedule (every hour)
  setInterval(cleanupTempFiles, 60 * 60 * 1000);

  // Initialize gateway service
  initGatewayService().catch(err => {
    console.error('Failed to initialize gateway service:', err);
  });
  
  console.log('IPFS service initialized');
  return true;
};

// Available pinning services
const pinningServices: PinningService[] = [];

/**
 * Initialize external pinning services
 */
const initializePinningServices = () => {
  // Add local node pinning service
  pinningServices.push({
    name: 'local-node',
    pin: async (cid: string) => {
      try {
        await ipfsClient.pin.add(cid, { timeout: PIN_TIMEOUT });
        return true;
      } catch (error) {
        console.error('Error pinning to local node:', error);
        return false;
      }
    },
    unpin: async (cid: string) => {
      try {
        await ipfsClient.pin.rm(cid);
        return true;
      } catch (error) {
        console.error('Error unpinning from local node:', error);
        return false;
      }
    },
    isAvailable: async () => {
      try {
        await ipfsClient.id();
        return true;
      } catch {
        return false;
      }
    }
  });
  
  // Add Pinata if credentials are provided
  if (PINATA_API_KEY && PINATA_API_SECRET) {
    pinningServices.push({
      name: 'pinata',
      pin: async (cid: string) => {
        try {
          const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinByHash',
            { hashToPin: cid },
            {
              headers: {
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_API_SECRET
              }
            }
          );
          return response.status === 200;
        } catch (error) {
          console.error('Error pinning to Pinata:', error);
          return false;
        }
      },
      unpin: async (cid: string) => {
        try {
          const response = await axios.delete(
            `https://api.pinata.cloud/pinning/unpin/${cid}`,
            {
              headers: {
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_API_SECRET
              }
            }
          );
          return response.status === 200;
        } catch (error) {
          console.error('Error unpinning from Pinata:', error);
          return false;
        }
      },
      isAvailable: async () => {
        try {
          const response = await axios.get(
            'https://api.pinata.cloud/data/testAuthentication',
            {
              headers: {
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_API_SECRET
              }
            }
          );
          return response.status === 200;
        } catch {
          return false;
        }
      }
    });
  }
  
  // Add Infura if credentials are provided
  if (INFURA_IPFS_PROJECT_ID && INFURA_IPFS_PROJECT_SECRET) {
    // Infura implementation would go here
    // Currently not implemented as it requires a different approach
  }
  
  console.log(`Initialized ${pinningServices.length} pinning services`);
};

/**
 * Create a new upload job for chunked upload
 * @param filename Original filename
 * @param mimeType File MIME type
 * @param totalChunks Total number of chunks expected
 * @param totalSize Total file size in bytes
 */
export const createUploadJob = (
  filename: string,
  mimeType: string,
  totalChunks: number,
  totalSize: number
): string => {
  const uploadId = uuidv4();
  
  uploadJobs.set(uploadId, {
    id: uploadId,
    filename,
    mimeType,
    totalChunks,
    receivedChunks: 0,
    chunkPaths: new Array(totalChunks).fill(''),
    totalSize,
    uploadStartTime: new Date(),
    status: 'in-progress'
  });
  
  console.log(`Created upload job ${uploadId} for ${filename}, expecting ${totalChunks} chunks`);
  return uploadId;
};

/**
 * Process an uploaded chunk for a specific upload job
 * @param uploadId Upload job ID
 * @param chunkIndex Index of the chunk (0-based)
 * @param chunkBuffer Chunk data as buffer
 */
export const uploadChunk = async (
  uploadId: string,
  chunkIndex: number,
  chunkBuffer: Buffer
): Promise<ChunkUploadResult> => {
  const job = uploadJobs.get(uploadId);
  if (!job) {
    throw new Error(`Upload job ${uploadId} not found`);
  }
  
  if (chunkIndex >= job.totalChunks) {
    throw new Error(`Chunk index ${chunkIndex} out of range (0-${job.totalChunks - 1})`);
  }
  
  try {
    // Save chunk to temporary file
    const chunkFilename = `${uploadId}_chunk_${chunkIndex}`;
    const chunkPath = path.join(TEMP_DIR, chunkFilename);
    
    fs.writeFileSync(chunkPath, chunkBuffer);
    
    // Update job state
    job.chunkPaths[chunkIndex] = chunkPath;
    job.receivedChunks++;
    
    console.log(`Received chunk ${chunkIndex} for upload ${uploadId} (${job.receivedChunks}/${job.totalChunks})`);
    
    return {
      tempFilePath: chunkPath,
      size: chunkBuffer.length
    };
  } catch (err: any) {
    console.error(`Error processing chunk ${chunkIndex} for upload ${uploadId}:`, err);
    job.status = 'failed';
    job.errorMessage = err.message;
    throw err;
  }
};

/**
 * Complete a chunked upload and process the final file
 * @param uploadId Upload job ID
 * @param encryptionKey Optional encryption key
 */
export const completeUpload = async (
  uploadId: string,
  encryptionKey?: string
): Promise<FileUploadResult> => {
  const job = uploadJobs.get(uploadId);
  if (!job) {
    throw new Error(`Upload job ${uploadId} not found`);
  }
  
  if (job.status === 'failed') {
    throw new Error(`Upload job ${uploadId} has failed: ${job.errorMessage}`);
  }
  
  if (job.receivedChunks !== job.totalChunks) {
    throw new Error(`Upload incomplete: received ${job.receivedChunks}/${job.totalChunks} chunks`);
  }
  
  try {
    // Combine chunks into a single file
    const finalFilePath = path.join(TEMP_DIR, `${uploadId}_complete`);
    const writeStream = fs.createWriteStream(finalFilePath);
    
    for (let i = 0; i < job.totalChunks; i++) {
      const chunkPath = job.chunkPaths[i];
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
    }
    
    writeStream.end();
    
    // Wait for the file to be fully written
    await new Promise<void>((resolve) => writeStream.on('finish', () => resolve()));
    
    // Read the complete file
    const fileBuffer = fs.readFileSync(finalFilePath);
    
    // Upload to IPFS
    const result = await uploadToIPFS(fileBuffer, encryptionKey);
    
    // Update job status
    job.status = 'completed';
    
    // Clean up temporary files
    cleanupUploadJob(uploadId);
    
    return result;
  } catch (err: any) {
    console.error(`Error completing upload ${uploadId}:`, err);
    job.status = 'failed';
    job.errorMessage = err.message;
    
    // Clean up on failure too
    cleanupUploadJob(uploadId);
    
    throw err;
  }
};

/**
 * Clean up temporary files for an upload job
 * @param uploadId Upload job ID
 */
const cleanupUploadJob = (uploadId: string) => {
  const job = uploadJobs.get(uploadId);
  if (!job) return;
  
  // Delete chunk files
  for (const chunkPath of job.chunkPaths) {
    if (chunkPath && fs.existsSync(chunkPath)) {
      fs.unlinkSync(chunkPath);
    }
  }
  
  // Delete complete file if it exists
  const finalFilePath = path.join(TEMP_DIR, `${uploadId}_complete`);
  if (fs.existsSync(finalFilePath)) {
    fs.unlinkSync(finalFilePath);
  }
  
  // Keep job entry for a while for status queries, but will be cleaned up later
  setTimeout(() => {
    uploadJobs.delete(uploadId);
  }, 3600000); // 1 hour
  
  console.log(`Cleaned up temporary files for upload ${uploadId}`);
};

/**
 * Clean up old temporary files
 */
const cleanupTempFiles = () => {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stats = fs.statSync(filePath);
      
      // If file is older than 24 hours, delete it
      if (now - stats.mtimeMs > 24 * 3600 * 1000) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old temporary file: ${filePath}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up temporary files:', error);
  }
};

/**
 * Get upload job status
 * @param uploadId Upload job ID
 */
export const getUploadStatus = (uploadId: string) => {
  const job = uploadJobs.get(uploadId);
  if (!job) {
    throw new Error(`Upload job ${uploadId} not found`);
  }
  
  return {
    id: job.id,
    filename: job.filename,
    status: job.status,
    progress: job.totalChunks > 0 ? (job.receivedChunks / job.totalChunks) * 100 : 0,
    receivedChunks: job.receivedChunks,
    totalChunks: job.totalChunks,
    startTime: job.uploadStartTime,
    errorMessage: job.errorMessage
  };
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

    // Upload to IPFS with retry mechanism
    let added: any;
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        added = await ipfsClient.add({
          path,
          content: dataToUpload,
        }, {
          pin: true,
          wrapWithDirectory: true,
        });
        break; // Success, exit retry loop
      } catch (err: any) {
        if (attempt === MAX_RETRY_ATTEMPTS) {
          throw err; // Re-throw if all attempts failed
        }
        console.warn(`Upload attempt ${attempt} failed, retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }

    // Make sure added is defined
    if (!added) {
      throw new Error('Upload failed after multiple attempts');
    }

    // Return the last item which is the directory containing the file
    const lastItem = added.cid.toString();
    
    // Pin to external services
    pinToExternalServices(lastItem);
    
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
 * Pin content to all available external pinning services
 * @param cid Content CID to pin
 */
const pinToExternalServices = async (cid: string) => {
  console.log(`Pinning ${cid} to external services...`);
  
  const results = [];
  const successfulServices = [];
  
  for (const service of pinningServices) {
    if (service.name === 'local-node') continue; // Skip local node, it's already pinned
    
    try {
      const isAvailable = await service.isAvailable();
      if (!isAvailable) {
        console.warn(`Pinning service ${service.name} is not available, skipping`);
        continue;
      }
      
      const success = await service.pin(cid);
      results.push({ service: service.name, success });
      
      if (success) {
        successfulServices.push(service.name);
        console.log(`Successfully pinned ${cid} to ${service.name}`);
      } else {
        console.error(`Failed to pin ${cid} to ${service.name}`);
      }
    } catch (err: any) {
      console.error(`Error pinning ${cid} to ${service.name}:`, err);
      results.push({ service: service.name, success: false, error: err.message });
    }
  }
  
  // Track pinned content
  pinnedContent.set(cid, { 
    timestamp: Date.now(),
    pinningServices: ['local-node', ...successfulServices]
  });
  
  return results;
};

/**
 * Retrieve content from IPFS by CID
 * @param cid IPFS CID
 * @param encryptionKey Optional encryption key to decrypt the content
 * @returns Buffer containing the content
 */
export const retrieveFromIPFS = async (
  cid: string,
  encryptionKey?: string
): Promise<Buffer> => {
  if (!cid) {
    throw new Error('CID is required');
  }

  let content: Buffer;

  try {
    // First try to get it from the local IPFS node
    try {
      const chunks: Uint8Array[] = [];
      
      // Use the local IPFS node if available
      if (ipfsClient) {
        for await (const chunk of ipfsClient.cat(cid)) {
          chunks.push(chunk);
        }
        
        content = Buffer.concat(chunks);
      } else {
        // If local node is not available, use gateway
        throw new Error('Local IPFS node not available');
      }
    } catch (err) {
      console.log(`Could not retrieve ${cid} from local node, using gateway: ${err}`);
      
      // If local node fails, try using gateways with automatic fallback
      content = await fetchFromGateway(cid, {
        strategy: 'weighted',
        timeout: 30000
      });
    }

    // Decrypt if encryption key is provided
    if (encryptionKey) {
      try {
        const decrypted = CryptoJS.AES.decrypt(content.toString(), encryptionKey);
        content = Buffer.from(decrypted.toString(CryptoJS.enc.Utf8), 'utf-8');
      } catch (error: any) {
        throw new Error(`Failed to decrypt content: ${error.message}`);
      }
    }

    return content;
  } catch (error: any) {
    console.error(`Failed to retrieve content from IPFS: ${error.message}`);
    throw new Error(`Failed to retrieve content from IPFS: ${error.message}`);
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
    
    // Upload to IPFS with retry mechanism
    let added: any;
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        added = await ipfsClient.add(metadataBuffer, { pin: true });
        break; // Success, exit retry loop
      } catch (err: any) {
        if (attempt === MAX_RETRY_ATTEMPTS) {
          throw err; // Re-throw if all attempts failed
        }
        console.warn(`Metadata upload attempt ${attempt} failed, retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
    
    // Make sure added is defined
    if (!added) {
      throw new Error('Metadata upload failed after multiple attempts');
    }

    const cid = added.cid.toString();
    
    // Pin to external services
    pinToExternalServices(cid);
    
    return cid;
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

    // Pin to local node
    await ipfsClient.pin.add(cid, { timeout: PIN_TIMEOUT });
    
    // Pin to external services
    await pinToExternalServices(cid);
    
    console.log(`Successfully pinned ${cid} to all available services`);
  } catch (err: any) {
    console.error('Error pinning content:', err);
    throw err;
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
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        await ipfsClient.files.stat(`/ipfs/${cid}`);
        return true;
      } catch (err: any) {
        // If the error is because the content doesn't exist, return false
        if (err.message.includes('does not exist')) {
          return false;
        }
        
        // Other errors might be transient, retry
        if (attempt === MAX_RETRY_ATTEMPTS) {
          throw err;
        }
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
    
    return false;
  } catch (err: any) {
    // If the error is because the content doesn't exist, return false
    if (err.message.includes('does not exist')) {
      return false;
    }
    // Otherwise, rethrow the error
    throw err;
  }
};

/**
 * Gets a gateway URL for a CID
 * @param cid Content identifier
 * @param options Optional gateway options
 */
export const getGatewayUrl = (cid: string, options: any = {}): string => {
  return getOptimalGatewayUrl(cid, options);
};

/**
 * Get information about pinned content
 * @param cid IPFS CID
 * @returns Pinning information
 */
export const getPinningInfo = async (cid: string) => {
  try {
    if (!ipfsClient) {
      throw new Error('IPFS client not initialized');
    }
    
    // Check if pinned locally
    let isPinnedLocally = false;
    try {
      const pins = await ipfsClient.pin.ls({ paths: [cid] });
      for await (const pin of pins) {
        if (pin.cid.toString() === cid) {
          isPinnedLocally = true;
          break;
        }
      }
    } catch {
      isPinnedLocally = false;
    }
    
    // Get info from our records
    const pinnedInfo = pinnedContent.get(cid);
    
    return {
      cid,
      isPinnedLocally,
      pinningServices: pinnedInfo?.pinningServices || [],
      timestamp: pinnedInfo?.timestamp,
    };
  } catch (error) {
    console.error('Error getting pinning info:', error);
    throw error;
  }
};

// Export functions
export { ipfsClient };