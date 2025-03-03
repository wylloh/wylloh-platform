/**
 * Utility functions for working with IPFS in the frontend
 */

// Default gateway URLs
const DEFAULT_PUBLIC_GATEWAY = 'https://ipfs.io/ipfs';
const DEFAULT_PROJECT_GATEWAY = '/api/ipfs'; // Our API's IPFS gateway

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
  return `${DEFAULT_PROJECT_GATEWAY}/stream/${cid}`;
};

/**
 * Normalize an IPFS CID to a consistent format
 * @param cid The CID to normalize
 * @returns Normalized CID
 */
export const normalizeCid = (cid: string): string => {
  return cid.trim().replace(/^ipfs:\/\//, '');
};