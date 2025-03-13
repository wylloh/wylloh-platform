/**
 * Utility functions for IPFS gateway management
 */

// Default gateway URLs
const DEFAULT_PUBLIC_GATEWAY = 'https://ipfs.io/ipfs';
const DEFAULT_PROJECT_GATEWAY = 'https://gateway.wylloh.com/ipfs';
const FALLBACK_GATEWAYS = [
  'https://ipfs.io/ipfs',
  'https://gateway.pinata.cloud/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://dweb.link/ipfs'
];

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
 * Get a stream URL for a content CID
 * @param cid The content CID
 * @returns Streaming URL
 */
export const getStreamUrl = (cid: string): string => {
  return `${DEFAULT_PROJECT_GATEWAY}/stream/${cid}`;
};

/**
 * Get fallback gateways for a CID
 * @param cid The IPFS Content Identifier
 * @returns Array of gateway URLs for this content
 */
export const getFallbackGatewayUrls = (cid: string): string[] => {
  return FALLBACK_GATEWAYS.map(gateway => getIpfsUrl(cid, gateway));
};

/**
 * Attempts to find a working gateway for the given CID
 * @param cid The IPFS Content Identifier
 * @returns Promise resolving to a working gateway URL or the default if none work
 */
export const findWorkingGateway = async (cid: string): Promise<string> => {
  try {
    const gateways = [DEFAULT_PROJECT_GATEWAY, ...FALLBACK_GATEWAYS];
    
    // Create an AbortController with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    // Test project gateway first, then try fallbacks
    for (const gateway of gateways) {
      const url = getIpfsUrl(cid, gateway);
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: controller.signal
        });
        
        if (response.ok) {
          clearTimeout(timeoutId);
          return gateway;
        }
      } catch (error) {
        // Continue to next gateway
        continue;
      }
    }
    
    // Clear the timeout if we've gone through all gateways
    clearTimeout(timeoutId);
    
    // If all gateways fail, return the default
    return DEFAULT_PROJECT_GATEWAY;
  } catch (error) {
    console.error('Error finding working gateway:', error);
    return DEFAULT_PROJECT_GATEWAY;
  }
};

/**
 * Gateway health check object
 */
export interface GatewayHealth {
  gateway: string;
  isHealthy: boolean;
  responseTime: number;
  lastChecked: Date;
} 