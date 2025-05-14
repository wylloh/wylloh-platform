import axios from 'axios';
import { createHash } from 'crypto';
import NodeCache from 'node-cache';

// Cache for gateway performance metrics
const gatewayCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 minutes TTL

// List of public gateways to use
const PUBLIC_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.fleek.co/ipfs/',
  'https://gateway.ipfs.io/ipfs/',
  'https://ipfs.infura.io/ipfs/',
  'https://ipfs.runfission.com/ipfs/'
];

// Custom gateways (from env variables)
const CUSTOM_GATEWAYS = process.env.IPFS_CUSTOM_GATEWAYS 
  ? process.env.IPFS_CUSTOM_GATEWAYS.split(',') 
  : [];

// All available gateways
const ALL_GATEWAYS = [...PUBLIC_GATEWAYS, ...CUSTOM_GATEWAYS];

// Gateway performance stats
interface GatewayStats {
  url: string;
  latency: number;
  lastCheck: number;
  successRate: number;
  available: boolean;
  consecutiveFailures: number;
}

// Gateway selection strategy
type GatewayStrategy = 'fastest' | 'random' | 'round-robin' | 'weighted';

// Options for gateway URL generation
interface GatewayOptions {
  strategy?: GatewayStrategy;
  preferredGateways?: string[];
  avoidGateways?: string[];
  timeout?: number;
}

// Initialize gateway stats
const initializeGatewayStats = (): Map<string, GatewayStats> => {
  const stats = new Map<string, GatewayStats>();
  
  for (const gateway of ALL_GATEWAYS) {
    stats.set(gateway, {
      url: gateway,
      latency: Infinity,
      lastCheck: 0,
      successRate: 0,
      available: true,
      consecutiveFailures: 0
    });
  }
  
  return stats;
};

// Gateway stats
let gatewayStats = initializeGatewayStats();

// Last used gateway index for round-robin
let lastUsedGatewayIndex = 0;

/**
 * Probes a gateway to check availability and latency
 * @param gatewayUrl Gateway URL to probe
 * @param timeout Timeout in milliseconds
 */
const probeGateway = async (gatewayUrl: string, timeout = 5000): Promise<{ available: boolean; latency: number }> => {
  try {
    // Use a well-known CID for testing (IPFS logo)
    const testCid = 'QmTkzDwWqPbnAh5YiV5VwcTLnGdwSNsNTn2aDxdXBFca7D';
    const startTime = Date.now();
    
    await axios.head(`${gatewayUrl}${testCid}`, {
      timeout,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const latency = Date.now() - startTime;
    return { available: true, latency };
  } catch (error) {
    return { available: false, latency: Infinity };
  }
};

/**
 * Updates the stats for a gateway
 * @param gateway Gateway URL
 * @param available Whether the gateway is available
 * @param latency Latency in milliseconds
 */
const updateGatewayStats = (gateway: string, available: boolean, latency: number): void => {
  const stats = gatewayStats.get(gateway);
  
  if (!stats) return;
  
  if (available) {
    stats.latency = (stats.latency === Infinity) ? latency : (stats.latency * 0.7 + latency * 0.3); // Weighted average
    stats.available = true;
    stats.consecutiveFailures = 0;
    stats.successRate = stats.successRate * 0.9 + 0.1; // Increase success rate
  } else {
    stats.consecutiveFailures += 1;
    stats.successRate = stats.successRate * 0.9; // Decrease success rate
    
    // Mark as unavailable after 3 consecutive failures
    if (stats.consecutiveFailures >= 3) {
      stats.available = false;
    }
  }
  
  stats.lastCheck = Date.now();
  gatewayStats.set(gateway, stats);
};

/**
 * Probes all gateways to update their stats
 */
export const probeAllGateways = async (): Promise<void> => {
  const probes = ALL_GATEWAYS.map(async (gateway) => {
    const { available, latency } = await probeGateway(gateway);
    updateGatewayStats(gateway, available, latency);
  });
  
  await Promise.all(probes);
  console.log('All gateways probed and stats updated');
};

/**
 * Gets the best gateway based on the specified strategy
 * @param strategy Gateway selection strategy
 * @param preferredGateways List of preferred gateways to prioritize
 * @param avoidGateways List of gateways to avoid
 */
const getBestGateway = (
  strategy: GatewayStrategy = 'fastest',
  preferredGateways: string[] = [],
  avoidGateways: string[] = []
): string => {
  // Filter available gateways
  let availableGateways = Array.from(gatewayStats.entries())
    .filter(([url, stats]) => stats.available && !avoidGateways.includes(url))
    .map(([url, stats]) => ({ 
      url, 
      latency: stats.latency,
      lastCheck: stats.lastCheck,
      successRate: stats.successRate,
      available: stats.available,
      consecutiveFailures: stats.consecutiveFailures
    }));
  
  // If no gateways are available, reset and use all
  if (availableGateways.length === 0) {
    availableGateways = ALL_GATEWAYS
      .filter(url => !avoidGateways.includes(url))
      .map(url => ({ url, latency: Infinity, lastCheck: 0, successRate: 0, available: true, consecutiveFailures: 0 }));
  }
  
  // Prioritize preferred gateways
  const prioritizedGateways = [
    ...availableGateways.filter(g => preferredGateways.includes(g.url)),
    ...availableGateways.filter(g => !preferredGateways.includes(g.url))
  ];
  
  switch (strategy) {
    case 'fastest':
      // Sort by latency (lowest first)
      return prioritizedGateways.sort((a, b) => a.latency - b.latency)[0].url;
    
    case 'random':
      return prioritizedGateways[Math.floor(Math.random() * prioritizedGateways.length)].url;
    
    case 'round-robin':
      lastUsedGatewayIndex = (lastUsedGatewayIndex + 1) % prioritizedGateways.length;
      return prioritizedGateways[lastUsedGatewayIndex].url;
    
    case 'weighted':
      // Weight by success rate / latency
      const totalWeight = prioritizedGateways.reduce((sum, gateway) => {
        const weight = gateway.successRate > 0 ? gateway.successRate / (gateway.latency || 1) : 0.001;
        return sum + weight;
      }, 0);
      
      let random = Math.random() * totalWeight;
      for (const gateway of prioritizedGateways) {
        const weight = gateway.successRate > 0 ? gateway.successRate / (gateway.latency || 1) : 0.001;
        random -= weight;
        if (random <= 0) {
          return gateway.url;
        }
      }
      
      return prioritizedGateways[0].url;
    
    default:
      return prioritizedGateways[0].url;
  }
};

/**
 * Gets a gateway URL for a CID
 * @param cid Content identifier
 * @param options Gateway options
 */
export const getGatewayUrl = (cid: string, options: GatewayOptions = {}): string => {
  const {
    strategy = 'fastest',
    preferredGateways = [],
    avoidGateways = [],
    timeout = 30000
  } = options;
  
  // Use cached result if available
  const cacheKey = `gateway:${cid}:${strategy}:${preferredGateways.join(',')}:${avoidGateways.join(',')}`;
  const cachedGateway = gatewayCache.get<string>(cacheKey);
  
  if (cachedGateway) {
    return `${cachedGateway}${cid}?ts=${Date.now()}`;
  }
  
  // Select the best gateway
  const gateway = getBestGateway(strategy, preferredGateways, avoidGateways);
  
  // Cache the result
  gatewayCache.set(cacheKey, gateway);
  
  return `${gateway}${cid}?ts=${Date.now()}`;
};

/**
 * Gets multiple gateway URLs for a CID for fallback purposes
 * @param cid Content identifier
 * @param count Number of gateways to return
 * @param options Gateway options
 */
export const getFallbackGateways = (cid: string, count = 3, options: GatewayOptions = {}): string[] => {
  const {
    preferredGateways = [],
    avoidGateways = [],
    timeout = 30000
  } = options;
  
  // Filter available gateways
  let availableGateways = Array.from(gatewayStats.entries())
    .filter(([url, stats]) => stats.available && !avoidGateways.includes(url))
    .map(([url, stats]) => ({ 
      url, 
      latency: stats.latency,
      lastCheck: stats.lastCheck,
      successRate: stats.successRate,
      available: stats.available,
      consecutiveFailures: stats.consecutiveFailures
    }));
  
  // If no gateways are available, reset and use all
  if (availableGateways.length === 0) {
    availableGateways = ALL_GATEWAYS
      .filter(url => !avoidGateways.includes(url))
      .map(url => ({ url, latency: Infinity, lastCheck: 0, successRate: 0, available: true, consecutiveFailures: 0 }));
  }
  
  // Prioritize preferred gateways
  const prioritizedGateways = [
    ...availableGateways.filter(g => preferredGateways.includes(g.url)),
    ...availableGateways.filter(g => !preferredGateways.includes(g.url))
  ];
  
  // Sort by latency
  const sortedGateways = prioritizedGateways.sort((a, b) => a.latency - b.latency);
  
  // Take specified number of gateways
  const selectedGateways = sortedGateways.slice(0, count);
  
  // Generate URLs
  return selectedGateways.map(gateway => `${gateway.url}${cid}?ts=${Date.now()}`);
};

/**
 * Initialize the gateway service
 */
export const initGatewayService = async (): Promise<void> => {
  // Probe all gateways on startup
  await probeAllGateways();
  
  // Schedule periodic probing (every 5 minutes)
  setInterval(() => {
    probeAllGateways().catch(error => {
      console.error('Error probing gateways:', error);
    });
  }, 5 * 60 * 1000);
};

/**
 * Gets stats for all gateways
 */
export const getGatewayStats = (): Map<string, GatewayStats> => {
  return new Map(gatewayStats);
};

/**
 * Gets list of all active gateways
 */
export const getActiveGateways = (): string[] => {
  return Array.from(gatewayStats.entries())
    .filter(([_, stats]) => stats.available)
    .map(([url, _]) => url);
};

/**
 * Checks a specific gateway
 * @param gatewayUrl Gateway URL to check
 */
export const checkGateway = async (gatewayUrl: string): Promise<GatewayStats | null> => {
  if (!gatewayStats.has(gatewayUrl)) {
    return null;
  }
  
  const { available, latency } = await probeGateway(gatewayUrl);
  updateGatewayStats(gatewayUrl, available, latency);
  
  return gatewayStats.get(gatewayUrl) || null;
};

/**
 * Adds a custom gateway
 * @param gatewayUrl Gateway URL to add
 */
export const addCustomGateway = async (gatewayUrl: string): Promise<boolean> => {
  if (ALL_GATEWAYS.includes(gatewayUrl)) {
    return false; // Already exists
  }
  
  // Check if gateway works
  const { available, latency } = await probeGateway(gatewayUrl);
  
  if (!available) {
    return false; // Gateway doesn't work
  }
  
  // Add to lists
  ALL_GATEWAYS.push(gatewayUrl);
  CUSTOM_GATEWAYS.push(gatewayUrl);
  
  // Initialize stats
  gatewayStats.set(gatewayUrl, {
    url: gatewayUrl,
    latency,
    lastCheck: Date.now(),
    successRate: 1.0, // Start with perfect success rate
    available: true,
    consecutiveFailures: 0
  });
  
  return true;
};

/**
 * Makes a request to fetch content from IPFS via the best gateway
 * @param cid Content identifier
 * @param options Gateway options
 */
export const fetchFromGateway = async (cid: string, options: GatewayOptions = {}): Promise<Buffer> => {
  const { timeout = 30000 } = options;
  
  // Get primary and fallback gateways
  const primaryGateway = getGatewayUrl(cid, options);
  const fallbackGateways = getFallbackGateways(cid, 3, options).filter(url => url !== primaryGateway);
  
  // Try primary gateway first
  try {
    const response = await axios.get(primaryGateway, {
      timeout,
      responseType: 'arraybuffer'
    });
    
    // Update stats for successful request
    const gatewayUrl = primaryGateway.substring(0, primaryGateway.indexOf('/ipfs/') + 6);
    updateGatewayStats(gatewayUrl, true, response.headers['x-response-time'] ? 
      parseInt(response.headers['x-response-time']) : 
      0);
    
    return Buffer.from(response.data);
  } catch (error) {
    // Update stats for failed request
    const gatewayUrl = primaryGateway.substring(0, primaryGateway.indexOf('/ipfs/') + 6);
    updateGatewayStats(gatewayUrl, false, Infinity);
    
    // Try fallback gateways
    for (const fallbackUrl of fallbackGateways) {
      try {
        const response = await axios.get(fallbackUrl, {
          timeout,
          responseType: 'arraybuffer'
        });
        
        // Update stats for successful request
        const gatewayUrl = fallbackUrl.substring(0, fallbackUrl.indexOf('/ipfs/') + 6);
        updateGatewayStats(gatewayUrl, true, response.headers['x-response-time'] ? 
          parseInt(response.headers['x-response-time']) : 
          0);
        
        return Buffer.from(response.data);
      } catch (fallbackError) {
        // Update stats for failed request
        const gatewayUrl = fallbackUrl.substring(0, fallbackUrl.indexOf('/ipfs/') + 6);
        updateGatewayStats(gatewayUrl, false, Infinity);
      }
    }
    
    // All gateways failed
    throw new Error(`Failed to fetch content from any gateway: ${cid}`);
  }
}; 