/**
 * Utility functions for working with IPFS in the frontend
 */

import { Buffer } from 'buffer';
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import type { Helia } from 'helia';
import type { UnixFS } from '@helia/unixfs';

// Default gateway URLs
const DEFAULT_PUBLIC_GATEWAY = 'https://ipfs.io/ipfs';
const DEFAULT_PROJECT_GATEWAY = '/api/ipfs'; // Our API's IPFS gateway

// Helia client for browser IPFS operations
let heliaInstance: Helia | null = null;
let unixfsInstance: UnixFS | null = null;

// Initialize Helia client (browser-compatible)
const initializeHelia = async (): Promise<{ helia: Helia; fs: UnixFS }> => {
  if (heliaInstance && unixfsInstance) {
    return { helia: heliaInstance, fs: unixfsInstance };
  }

  try {
    console.log('Initializing Helia client for browser...');
    
    // Create Helia instance with browser-compatible configuration
    heliaInstance = await createHelia({
      // Browser-specific configuration
      start: true,
    });
    
    unixfsInstance = unixfs(heliaInstance);
    
    console.log('Helia client initialized successfully');
    return { helia: heliaInstance, fs: unixfsInstance };
  } catch (error) {
    console.error('Failed to initialize Helia client:', error);
    throw error;
  }
};

// Check IPFS connection via our API endpoint
export const checkIpfsConnection = async () => {
  try {
    console.log('Checking IPFS connection via API...');
    const response = await fetch('/api/storage/health');
    const isHealthy = response.ok;
    console.log('IPFS connection check:', isHealthy ? 'successful' : 'failed');
    return isHealthy;
  } catch (error: any) {
    console.error('IPFS connection check failed:', error);
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
    console.log('Development mode: Using configured IPFS gateway for CID:', cid);
    // Use configured IPFS gateway
    return `${process.env.REACT_APP_IPFS_GATEWAY || '/api/ipfs'}/${normalizeCid(cid)}`;
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
    console.log('Development mode: Using configured IPFS gateway for streaming CID:', cid);
    // Use configured IPFS gateway for streaming in development mode
    return `${process.env.REACT_APP_IPFS_GATEWAY || '/api/ipfs'}/${normalizeCid(cid)}`;
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

// Upload a file to IPFS using Helia client (with API fallback)
export const uploadToIPFS = async (fileBuffer: Buffer) => {
  try {
    console.log('Starting IPFS upload via Helia client...');
    
    // Try Helia client first for direct P2P upload
    try {
      const { helia, fs } = await initializeHelia();
      
      // Convert Buffer to Uint8Array for Helia
      const uint8Array = new Uint8Array(fileBuffer);
      
      // Upload to IPFS using Helia
      const cid = await fs.addFile({
        path: 'uploaded-file',
        content: uint8Array,
      });
      
      const cidString = cid.toString();
      console.log('File uploaded successfully via Helia, CID:', cidString);
      
      // Optional: Pin the content to ensure persistence
      try {
        await helia.pins.add(cid);
        console.log('Content pinned successfully via Helia');
      } catch (pinError) {
        console.warn('Failed to pin content via Helia (non-critical):', pinError);
      }
      
      return {
        cid: cidString,
        size: fileBuffer.length,
        path: 'uploaded-file'
      };
    } catch (heliaError) {
      console.warn('Helia upload failed, falling back to API:', heliaError);
      
      // Fallback to API endpoint
      return await uploadToIPFSViaAPI(fileBuffer);
    }
  } catch (error: any) {
    console.error('Error uploading to IPFS:', error);
    throw new Error(error.message || 'Failed to upload to IPFS');
  }
};

// Fallback: Upload a file to IPFS via our API endpoint
const uploadToIPFSViaAPI = async (fileBuffer: Buffer) => {
  try {
    // Check connection first
    const isConnected = await checkIpfsConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to IPFS via API. Please check storage service.');
    }

    console.log('Starting IPFS upload via API fallback...');
    
    // Create FormData for file upload
    const formData = new FormData();
    const blob = new Blob([fileBuffer]);
    formData.append('file', blob);
    
    // Upload via our storage API
    const response = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result?.cid) {
      throw new Error('Upload failed - no CID returned');
    }

    console.log('Upload successful via API fallback, CID:', result.cid);

    return {
      cid: result.cid,
      size: fileBuffer.length,
      path: result.path || ''
    };
  } catch (error: any) {
    console.error('Error uploading to IPFS via API:', error);
    throw new Error(error.message || 'Failed to upload to IPFS');
  }
};