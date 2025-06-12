import type { Helia } from 'helia';
import type { UnixFS } from '@helia/unixfs';
import { CID } from 'multiformats/cid';
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
} from './gatewayService.js';

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

// Singleton Helia instances
let heliaNode: Helia;
let unixfsInstance: UnixFS;

// In-memory storage for upload jobs
const uploadJobs = new Map<string, UploadJob>();

// Track pinned content with timestamp
const pinnedContent = new Map<string, { timestamp: number, pinningServices: string[] }>();

/**
 * Initialize the IPFS service with Helia
 * @param helia Helia node instance
 * @param unixfs UnixFS instance
 */
export const initializeIPFSService = (helia: Helia, unixfs: UnixFS) => {
  console.log('Initializing IPFS service with Helia...');
  
  if (!helia || !unixfs) {
    throw new Error('Helia node and UnixFS instances are required');
  }
  
  heliaNode = helia;
  unixfsInstance = unixfs;
  
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
  
  console.log('IPFS service initialized with Helia successfully');
  return true;
};

// Available pinning services
const pinningServices: PinningService[] = [];

/**
 * Initialize external pinning services
 */
const initializePinningServices = () => {
  // Add local Helia node pinning service
  pinningServices.push({
    name: 'local-helia-node',
    pin: async (cid: string) => {
      try {
        // Helia pinning API - convert string to CID object
        await heliaNode.pins.add(CID.parse(cid));
        return true;
      } catch (error) {
        console.error('Error pinning to local Helia node:', error);
        return false;
      }
    },
    unpin: async (cid: string) => {
      try {
        // Helia pinning API - convert string to CID object
        await heliaNode.pins.rm(CID.parse(cid));
        return true;
      } catch (error) {
        console.error('Error unpinning from local Helia node:', error);
        return false;
      }
    },
    isAvailable: async () => {
      try {
        // Check if Helia node is available
        return heliaNode !== undefined && unixfsInstance !== undefined;
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
 * Upload a file to IPFS using Helia UnixFS
 * @param fileBuffer File data as buffer
 * @param encryptionKey Optional encryption key
 * @returns Promise resolving to IPFS CID
 */
export const uploadToIPFS = async (
  fileBuffer: Buffer,
  encryptionKey?: string
): Promise<FileUploadResult> => {
  try {
    if (!heliaNode || !unixfsInstance) {
      throw new Error('Helia node not initialized');
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

    // Upload to IPFS with retry mechanism using Helia UnixFS
    let cid: CID;
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        // Use Helia UnixFS API - addBytes for simple file upload
        cid = await unixfsInstance.addBytes(new Uint8Array(dataToUpload));
        
        // Pin the content automatically using Helia
        await heliaNode.pins.add(cid);
        
        break; // Success, exit retry loop
      } catch (err: any) {
        if (attempt === MAX_RETRY_ATTEMPTS) {
          throw err; // Re-throw if all attempts failed
        }
        console.warn(`Upload attempt ${attempt} failed, retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }

    // Make sure cid is defined
    if (!cid!) {
      throw new Error('Upload failed after multiple attempts');
    }

    const cidString = cid.toString();
    
    // Pin to external services
    pinToExternalServices(cidString);
    
    return {
      cid: cidString,
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
    if (service.name === 'local-helia-node') continue; // Skip local node, it's already pinned
    
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
    pinningServices: ['local-helia-node', ...successfulServices]
  });
  
  return results;
};

/**
 * Retrieve content from IPFS by CID using Helia
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
    // First try to get it from the local Helia node
    try {
      const chunks: Uint8Array[] = [];
      
      // Use Helia UnixFS to retrieve content
      if (heliaNode && unixfsInstance) {
        // Convert string CID to CID object and cat the content
        const cidObj = CID.parse(cid);
        for await (const chunk of unixfsInstance.cat(cidObj)) {
          chunks.push(chunk);
        }
        
        content = Buffer.concat(chunks);
      } else {
        // If Helia node is not available, use gateway
        throw new Error('Helia node not available');
      }
    } catch (err) {
      console.log(`Could not retrieve ${cid} from local Helia node, using gateway: ${err}`);
      
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
 * Create a metadata JSON file and upload to IPFS using Helia
 * @param metadata Metadata object
 * @returns Promise resolving to IPFS CID
 */
export const uploadMetadata = async (metadata: Record<string, any>): Promise<string> => {
  try {
    if (!heliaNode || !unixfsInstance) {
      throw new Error('Helia node not initialized');
    }

    // Convert metadata to JSON string and then to buffer
    const metadataBuffer = Buffer.from(JSON.stringify(metadata));
    
    // Upload to IPFS with retry mechanism using Helia UnixFS
    let cid: CID;
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        // Use Helia UnixFS API to add metadata
        cid = await unixfsInstance.addBytes(new Uint8Array(metadataBuffer));
        
        // Pin the metadata
        await heliaNode.pins.add(cid);
        
        break; // Success, exit retry loop
      } catch (err: any) {
        if (attempt === MAX_RETRY_ATTEMPTS) {
          throw err; // Re-throw if all attempts failed
        }
        console.warn(`Metadata upload attempt ${attempt} failed, retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }

    // Make sure cid is defined
    if (!cid!) {
      throw new Error('Metadata upload failed after multiple attempts');
    }

    const cidString = cid.toString();
    
    // Pin to external services
    await pinToExternalServices(cidString);
    
    return cidString;
  } catch (error: any) {
    console.error('Error uploading metadata to IPFS:', error);
    throw error;
  }
};

/**
 * Pin content to IPFS using Helia
 * @param cid Content CID to pin
 */
export const pinContent = async (cid: string): Promise<void> => {
  try {
    if (!heliaNode) {
      throw new Error('Helia node not initialized');
    }

    // Pin using Helia API
    await heliaNode.pins.add(CID.parse(cid));
    
    // Also pin to external services
    await pinToExternalServices(cid);
    
  } catch (error: any) {
    console.error('Error pinning content:', error);
    throw error;
  }
};

/**
 * Check if content exists in IPFS using Helia
 * @param cid Content CID to check
 * @returns True if content exists
 */
export const checkContentExists = async (cid: string): Promise<boolean> => {
  try {
    if (!heliaNode || !unixfsInstance) {
      return false;
    }

    // Try to stat the content using Helia UnixFS
    const cidObj = CID.parse(cid);
    await unixfsInstance.stat(cidObj);
    return true;
  } catch (error) {
    // If stat fails, content doesn't exist or is not accessible
    return false;
  }
};

/**
 * Get gateway URL for content
 * @param cid Content CID
 * @param options Additional options
 * @returns Gateway URL
 */
export const getGatewayUrl = (cid: string, options: any = {}): string => {
  return getOptimalGatewayUrl(cid, options);
};

/**
 * Get pinning information for content
 * @param cid Content CID
 * @returns Pinning information
 */
export const getPinningInfo = async (cid: string) => {
  const pinInfo = pinnedContent.get(cid);
  
  if (!pinInfo) {
    return {
      isPinned: false,
      pinningServices: [],
      timestamp: null
    };
  }
  
  return {
    isPinned: true,
    pinningServices: pinInfo.pinningServices,
    timestamp: new Date(pinInfo.timestamp)
  };
};

// Simplified chunk and upload job functions - keeping minimal functionality
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
    chunkPaths: [],
    totalSize,
    uploadStartTime: new Date(),
    status: 'in-progress'
  });
  return uploadId;
};

export const uploadChunk = async (
  uploadId: string,
  chunkIndex: number,
  chunkBuffer: Buffer
): Promise<ChunkUploadResult> => {
  const job = uploadJobs.get(uploadId);
  if (!job) {
    throw new Error('Upload job not found');
  }

  const tempFilePath = path.join(TEMP_DIR, `${uploadId}_chunk_${chunkIndex}`);
  fs.writeFileSync(tempFilePath, chunkBuffer);
  
  job.chunkPaths[chunkIndex] = tempFilePath;
  job.receivedChunks++;
  
  return {
    tempFilePath,
    size: chunkBuffer.length
  };
};

export const completeUpload = async (
  uploadId: string,
  encryptionKey?: string
): Promise<FileUploadResult> => {
  const job = uploadJobs.get(uploadId);
  if (!job) {
    throw new Error('Upload job not found');
  }

  // Combine all chunks
  const chunks = [];
  for (let i = 0; i < job.totalChunks; i++) {
    const chunkPath = job.chunkPaths[i];
    if (!chunkPath) {
      throw new Error(`Chunk ${i} missing`);
    }
    chunks.push(fs.readFileSync(chunkPath));
  }
  
  const combinedBuffer = Buffer.concat(chunks);
  
  // Upload to IPFS
  const result = await uploadToIPFS(combinedBuffer, encryptionKey);
  
  // Cleanup
  cleanupUploadJob(uploadId);
  
  job.status = 'completed';
  
  return result;
};

export const getUploadStatus = (uploadId: string) => {
  const job = uploadJobs.get(uploadId);
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    filename: job.filename,
    status: job.status,
    progress: job.receivedChunks / job.totalChunks,
    receivedChunks: job.receivedChunks,
    totalChunks: job.totalChunks,
    uploadStartTime: job.uploadStartTime,
    errorMessage: job.errorMessage
  };
};

const cleanupUploadJob = (uploadId: string) => {
  const job = uploadJobs.get(uploadId);
  if (!job) return;

  // Delete temporary files
  job.chunkPaths.forEach(chunkPath => {
    if (chunkPath && fs.existsSync(chunkPath)) {
      fs.unlinkSync(chunkPath);
    }
  });

  uploadJobs.delete(uploadId);
};

const cleanupTempFiles = () => {
  console.log('Cleaning up temporary files...');
  
  if (!fs.existsSync(TEMP_DIR)) {
    return;
  }
  
  const files = fs.readdirSync(TEMP_DIR);
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  files.forEach(file => {
    const filePath = path.join(TEMP_DIR, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtime.getTime() < oneHourAgo) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old temp file: ${file}`);
    }
  });
};