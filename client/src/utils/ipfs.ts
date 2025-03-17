/**
 * Utility functions for working with IPFS in the frontend
 */

import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';

// Default gateway URLs
const DEFAULT_PUBLIC_GATEWAY = 'https://ipfs.io/ipfs';
const DEFAULT_PROJECT_GATEWAY = '/api/ipfs'; // Our API's IPFS gateway

// Create IPFS client for local node
const createIpfsClient = () => {
  try {
    console.log('Creating IPFS client...');
    const client = create({
      host: '127.0.0.1',
      port: 5001,
      protocol: 'http',
      apiPath: '/api/v0',
      headers: {
        'User-Agent': 'Wylloh-Platform',
      }
    });
    console.log('IPFS client created successfully');
    return client;
  } catch (error) {
    console.error('Failed to create IPFS client:', error);
    throw error;
  }
};

const ipfsClient = createIpfsClient();

// Add a function to check IPFS connection with better error handling
export const checkIpfsConnection = async () => {
  try {
    console.log('Checking IPFS connection...');
    const id = await ipfsClient.id();
    console.log('IPFS connection successful:', id);
    return true;
  } catch (error: any) {
    console.error('IPFS connection check failed:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return false;
  }
};

/**
 * Get an IPFS URL for a CID using the specified gateway
 * @param cid The IPFS Content Identifier
 * @param gateway The gateway URL (without trailing slash), e.g., 'https://ipfs.io/ipfs'
 * @returns Full IPFS URL
 */
export const getIpfsUrl = (cid: string, gateway: string = DEFAULT_PUBLIC_GATEWAY): string => {
  if (!cid) return '';
  
  // Remove 'ipfs://' prefix if present
  const cleanCid = cid.replace(/^ipfs:\/\//, '');
  
  // Construct and return the URL
  return `${gateway}/${cleanCid}`;
};

/**
 * Get an IPFS URL using our project's gateway
 * @param cid The IPFS Content Identifier
 * @returns Full IPFS URL through our gateway
 */
export const getProjectIpfsUrl = (cid: string): string => {
  // In demo mode, we want to prioritize the local IPFS gateway for better demo experience
  const isDemoMode = true; // Always true for demo purposes
  
  if (isDemoMode) {
    console.log('Demo mode: Using local IPFS gateway for CID:', cid);
    // First try the local gateway
    return `http://localhost:8080/ipfs/${normalizeCid(cid)}`;
  }
  
  return getIpfsUrl(cid, DEFAULT_PROJECT_GATEWAY);
};

/**
 * Extract CID from an IPFS URL
 * @param url IPFS URL
 * @returns The extracted CID or null if not found
 */
export const extractCidFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Handle ipfs:// protocol
  if (url.startsWith('ipfs://')) {
    return url.substring(7);
  }
  
  // Handle HTTP gateway URLs
  const ipfsGatewayRegex = /ipfs\/([a-zA-Z0-9]+)/;
  const match = url.match(ipfsGatewayRegex);
  
  return match ? match[1] : null;
};

/**
 * Check if a string is a valid IPFS CID
 * @param cid The string to check
 * @returns Boolean indicating if it's a valid CID
 */
export const isValidCid = (cid: string): boolean => {
  if (!cid) return false;
  
  // Simple validity check - a more robust check would use the CID library
  const cidRegex = /^[a-zA-Z0-9]{46,59}$/;
  return cidRegex.test(cid);
};

/**
 * Generate a thumbnail URL for content
 * @param cid The content CID
 * @param thumbnailCid Optional thumbnail CID
 * @returns URL to use for thumbnail
 */
export const getThumbnailUrl = (cid: string, thumbnailCid?: string): string => {
  // If a specific thumbnail CID is provided, use it
  if (thumbnailCid) {
    return getProjectIpfsUrl(thumbnailCid);
  }
  
  // If no thumbnail, return generic placeholder based on CID
  // This ensures the same content always gets the same placeholder
  const hash = cid.substring(0, 8);
  const seed = parseInt(hash, 16) % 100;
  
  return `https://picsum.photos/seed/${seed}/400/300`;
};

/**
 * Get a stream URL for a content CID
 * @param cid The content CID
 * @returns Streaming URL
 */
export const getStreamUrl = (cid: string): string => {
  if (!cid) return '';
  
  // In demo mode, we want to prioritize the local IPFS gateway for better demo experience
  const isDemoMode = true; // Always true for demo purposes
  
  if (isDemoMode) {
    console.log('Demo mode: Using local IPFS gateway for streaming CID:', cid);
    // Use local gateway for streaming in demo mode
    return `http://localhost:8080/ipfs/${normalizeCid(cid)}`;
  }
  
  // For reliable streaming in production, use a public gateway
  return `https://cloudflare-ipfs.com/ipfs/${normalizeCid(cid)}`;
};

/**
 * Normalize an IPFS CID to a consistent format
 * @param cid The CID to normalize
 * @returns Normalized CID
 */
export const normalizeCid = (cid: string): string => {
  return cid.trim().replace(/^ipfs:\/\//, '');
};

// Upload a file to IPFS with chunked upload for large files
export const uploadToIPFS = async (fileBuffer: Buffer) => {
  try {
    // Check connection first
    const isConnected = await checkIpfsConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to IPFS node. Please ensure IPFS daemon is running.');
    }

    console.log('Starting IPFS upload...');
    
    // Upload to IPFS with chunked upload
    const added = await ipfsClient.add(
      {
        content: fileBuffer,
      },
      {
        pin: true,
        chunker: 'size-262144', // 256KB chunks
        rawLeaves: true,
        wrapWithDirectory: false,
        progress: (prog) => console.log(`Upload progress: ${prog} bytes`)
      }
    );
    
    if (!added?.cid) {
      throw new Error('Upload failed - no CID returned');
    }

    console.log('Upload successful, CID:', added.cid.toString());

    return {
      cid: added.cid.toString(),
      size: fileBuffer.length,
      path: added.path || ''
    };
  } catch (error: any) {
    console.error('Error uploading to IPFS:', error);
    throw new Error(error.message || 'Failed to upload to IPFS');
  }
};