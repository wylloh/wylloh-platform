import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { verifiedFetch } from '@helia/verified-fetch';
import * as webRTC from '@libp2p/webrtc-star';
import { createLibp2p } from 'libp2p';
import { bootstrap } from '@libp2p/bootstrap';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { identify } from '@libp2p/identify';
import { webSockets } from '@libp2p/websockets';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { mdns } from '@libp2p/mdns';
import { kadDHT } from '@libp2p/kad-dht';
import { MemoryBlockstore } from 'blockstore-core';
import { MemoryDatastore } from 'datastore-core';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { cdnService } from './cdn.service';

// Configuration options for the user node
export interface UserNodeConfig {
  maxStorage: number; // Maximum storage in MB to contribute
  maxBandwidth: number; // Maximum bandwidth in Mbps to contribute
  allowSeeding: boolean; // Whether to allow seeding content to other users
  enableWebRTC: boolean; // Whether to enable WebRTC connections
  autoStart: boolean; // Whether to start the node automatically
  enableMetrics: boolean; // Whether to collect and report metrics
}

// Default configuration
const DEFAULT_CONFIG: UserNodeConfig = {
  maxStorage: 100, // 100 MB by default
  maxBandwidth: 1, // 1 Mbps by default
  allowSeeding: true,
  enableWebRTC: true,
  autoStart: false,
  enableMetrics: true
};

// Metrics data structure
export interface NodeMetrics {
  uptime: number; // Total uptime in seconds
  bytesUploaded: number; // Total bytes uploaded
  bytesDownloaded: number; // Total bytes downloaded
  contentServed: number; // Number of content requests served
  peersConnected: number; // Number of peers connected
  lastUpdated: number; // Timestamp of last update
}

// Content sharing statistics
interface ContentStats {
  cid: string;
  size: number;
  serveCount: number;
  lastServed: number;
}

// Event interfaces for libp2p events
interface PeerConnectEvent {
  detail: {
    remotePeer: {
      toString: () => string;
    };
  };
}

interface PeerDisconnectEvent {
  detail: {
    remotePeer: {
      toString: () => string;
    };
  };
}

/**
 * Service for managing a browser-based IPFS node that contributes to the Wylloh network
 */
class UserNodeService {
  private helia: any; // Helia instance
  private fs: any; // UnixFS interface
  private libp2p: any; // Libp2p instance
  private blockstore: MemoryBlockstore;
  private datastore: MemoryDatastore;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;
  private config: UserNodeConfig = DEFAULT_CONFIG;
  private metrics: NodeMetrics = {
    uptime: 0,
    bytesUploaded: 0,
    bytesDownloaded: 0,
    contentServed: 0,
    peersConnected: 0,
    lastUpdated: Date.now()
  };
  private contentStats: Map<string, ContentStats> = new Map();
  private startTime: number = 0;
  private metricsInterval: any;
  private verifiedFetchInstance: any;

  // Bootstrap nodes to connect to
  private bootstrapNodes = [
    '/dns4/bootstrap.libp2p.io/tcp/443/wss/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
    '/dns4/bootstrap.libp2p.io/tcp/443/wss/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
    '/dns4/bootstrap.libp2p.io/tcp/443/wss/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp'
  ];

  constructor() {
    // Create blockstore and datastore for content
    this.blockstore = new MemoryBlockstore();
    this.datastore = new MemoryDatastore();

    // Try to load saved configuration from localStorage
    this.loadConfig();
  }

  /**
   * Initialize the user node
   * @param config Optional configuration options
   */
  async initialize(config?: Partial<UserNodeConfig>): Promise<boolean> {
    try {
      // Update configuration if provided
      if (config) {
        this.config = { ...this.config, ...config };
        this.saveConfig();
      }

      console.log('Initializing user node with config:', this.config);

      // Check if browser supports required features
      if (!this.checkBrowserSupport()) {
        console.error('Browser does not support required features for IPFS node');
        return false;
      }

      // Create libp2p instance
      this.libp2p = await this.createLibp2pNode();

      // Create Helia instance
      this.helia = await createHelia({
        libp2p: this.libp2p,
        blockstore: this.blockstore,
        datastore: this.datastore
      });

      // Create UnixFS interface for file operations
      this.fs = unixfs(this.helia);

      // Create verified fetch instance for retrieving content
      this.verifiedFetchInstance = verifiedFetch(this.helia);

      // Setup event listeners
      this.setupEventListeners();

      // Mark as initialized
      this.isInitialized = true;
      console.log('User node initialized successfully');

      // Set up metrics collection if enabled
      if (this.config.enableMetrics) {
        this.setupMetricsCollection();
      }

      // Start node if autoStart is enabled
      if (this.config.autoStart) {
        await this.startNode();
      }

      return true;
    } catch (error) {
      console.error('Error initializing user node:', error);
      return false;
    }
  }

  /**
   * Create and configure the libp2p node
   */
  private async createLibp2pNode() {
    try {
      const transportConfig = [
        webSockets()
      ];

      // Add WebRTC transport if enabled
      if (this.config.enableWebRTC) {
        transportConfig.push(webRTC.webRTCStar());
      }

      // Create and return libp2p node
      return await createLibp2p({
        addresses: {
          listen: [
            '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
            '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
          ]
        },
        transports: transportConfig,
        connectionEncryption: [noise()],
        streamMuxers: [yamux()],
        peerDiscovery: [
          bootstrap({
            list: this.bootstrapNodes
          }),
          mdns({
            interval: 20e3
          })
        ],
        services: {
          identify: identify(),
          pubsub: gossipsub(),
          dht: kadDHT({
            clientMode: false,
            pingTimeout: 10000,
            pingConcurrency: 10
          })
        }
      });
    } catch (error) {
      console.error('Error creating libp2p node:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners for the node
   */
  private setupEventListeners() {
    if (!this.libp2p) return;

    // Connection events
    this.libp2p.addEventListener('peer:connect', (evt: PeerConnectEvent) => {
      const peerId = evt.detail.remotePeer.toString();
      console.log(`Connected to peer: ${peerId}`);
      this.metrics.peersConnected++;
    });

    this.libp2p.addEventListener('peer:disconnect', (evt: PeerDisconnectEvent) => {
      const peerId = evt.detail.remotePeer.toString();
      console.log(`Disconnected from peer: ${peerId}`);
      if (this.metrics.peersConnected > 0) {
        this.metrics.peersConnected--;
      }
    });

    // Content request events (will implement in a more detailed way)
    // For now, we'll track through our content access methods
  }

  /**
   * Set up metrics collection
   */
  private setupMetricsCollection() {
    // Update metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      if (this.isRunning) {
        // Update uptime
        this.metrics.uptime = Math.floor((Date.now() - this.startTime) / 1000);
        this.metrics.lastUpdated = Date.now();
        
        // Save metrics to localStorage
        this.saveMetrics();
        
        // Report metrics to server if in production mode
        if (process.env.NODE_ENV === 'production') {
          this.reportMetrics();
        }
      }
    }, 30000);
  }

  /**
   * Start the IPFS node
   */
  async startNode(): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('Cannot start node: not initialized');
      return false;
    }

    if (this.isRunning) {
      console.log('Node is already running');
      return true;
    }

    try {
      console.log('Starting user node...');
      
      // Start the libp2p node if not already started
      if (!this.libp2p.isStarted()) {
        await this.libp2p.start();
      }

      // Record start time for uptime tracking
      this.startTime = Date.now();
      this.isRunning = true;

      // Register as a provider with CDN service
      this.registerWithCDN();

      console.log('User node started successfully');
      return true;
    } catch (error) {
      console.error('Error starting user node:', error);
      return false;
    }
  }

  /**
   * Stop the IPFS node
   */
  async stopNode(): Promise<boolean> {
    if (!this.isRunning) {
      console.log('Node is not running');
      return true;
    }

    try {
      console.log('Stopping user node...');
      
      // Unregister from CDN service
      if (this.libp2p?.peerId) {
        cdnService.unregisterUserNode(this.libp2p.peerId.toString());
      }
      
      // Stop the libp2p node
      if (this.libp2p.isStarted()) {
        await this.libp2p.stop();
      }

      // Update metrics before stopping
      this.metrics.uptime += Math.floor((Date.now() - this.startTime) / 1000);
      this.metrics.lastUpdated = Date.now();
      this.saveMetrics();

      // Clear metrics interval
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }

      this.isRunning = false;
      console.log('User node stopped successfully');
      return true;
    } catch (error) {
      console.error('Error stopping user node:', error);
      return false;
    }
  }

  /**
   * Store content in the node
   * @param cid Content Identifier
   * @param data Content data as Uint8Array or string
   */
  async storeContent(cid: string, data: Uint8Array | string): Promise<boolean> {
    if (!this.isInitialized || !this.isRunning) {
      console.error('Cannot store content: node not running');
      return false;
    }

    try {
      // Convert string to Uint8Array if needed
      const contentData = typeof data === 'string' 
        ? uint8ArrayFromString(data) 
        : data;
      
      // Store in the UnixFS
      await this.fs.addBytes(contentData, {
        onProgress: (evt: any) => {
          // Track download metrics
          this.metrics.bytesDownloaded += evt.size || 0;
        }
      });

      // Record content stats
      this.contentStats.set(cid, {
        cid,
        size: contentData.length,
        serveCount: 0,
        lastServed: 0
      });

      console.log(`Stored content with CID: ${cid}`);
      return true;
    } catch (error) {
      console.error(`Error storing content with CID ${cid}:`, error);
      return false;
    }
  }

  /**
   * Retrieve content from the network
   * @param cid Content Identifier
   * @returns Content as Uint8Array or null if not found
   */
  async retrieveContent(cid: string): Promise<Uint8Array | null> {
    if (!this.isInitialized) {
      console.error('Cannot retrieve content: node not initialized');
      return null;
    }

    try {
      // Try to retrieve using verifiedFetch
      const response = await this.verifiedFetchInstance(`ipfs://${cid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to retrieve content: ${response.statusText}`);
      }
      
      const data = await response.arrayBuffer();
      
      // Update metrics
      this.metrics.bytesDownloaded += data.byteLength;
      
      return new Uint8Array(data);
    } catch (error) {
      console.error(`Error retrieving content with CID ${cid}:`, error);
      return null;
    }
  }

  /**
   * Serve content to another peer
   * @param cid Content Identifier
   * @param peerId The peer requesting the content
   */
  async serveContent(cid: string, peerId: string): Promise<boolean> {
    if (!this.isInitialized || !this.isRunning) {
      return false;
    }

    try {
      const stats = this.contentStats.get(cid);
      if (stats) {
        // Update content stats
        stats.serveCount++;
        stats.lastServed = Date.now();
        this.contentStats.set(cid, stats);
        
        // Update metrics
        this.metrics.contentServed++;
        this.metrics.bytesUploaded += stats.size;
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error serving content ${cid} to peer ${peerId}:`, error);
      return false;
    }
  }

  /**
   * Register this node with the CDN service
   */
  private async registerWithCDN(): Promise<void> {
    try {
      // Get the node's peer ID
      const peerId = this.libp2p.peerId.toString();
      
      // Create local gateway URL for this node
      // Use WebRTC URL format for browser nodes
      const nodeGateway = this.config.enableWebRTC
        ? `/p2p-webrtc-star/p2p/${peerId}/ipfs`
        : `/p2p/${peerId}/ipfs`;
      
      // Register with CDN service
      cdnService.registerUserNode(peerId, nodeGateway);
      
      // Start tracking content for CDN
      this.startContentTracking();
      
      console.log(`Registered node gateway: ${nodeGateway}`);
    } catch (error) {
      console.error('Error registering with CDN:', error);
    }
  }
  
  /**
   * Start tracking content stored in this node for CDN integration
   */
  private startContentTracking(): void {
    // Initial report of available content
    this.reportAvailableContent();
    
    // Set up periodic content reporting every minute
    setInterval(() => {
      if (this.isRunning) {
        this.reportAvailableContent();
      }
    }, 60 * 1000);
  }
  
  /**
   * Report available content to CDN service
   */
  private async reportAvailableContent(): Promise<void> {
    try {
      // Get all content CIDs from contentStats map
      const availableCids = Array.from(this.contentStats.keys());
      
      // Report to CDN service
      cdnService.updateUserNodeContent(this.libp2p.peerId.toString(), availableCids);
    } catch (error) {
      console.error('Error reporting available content:', error);
    }
  }

  /**
   * Check if browser supports required features
   */
  private checkBrowserSupport(): boolean {
    // Check for WebRTC support
    const hasWebRTC = 'RTCPeerConnection' in window;
    
    // Check for Web Crypto API
    const hasWebCrypto = 'crypto' in window && 'subtle' in window.crypto;
    
    // Check for IndexedDB (for data persistence)
    const hasIndexedDB = 'indexedDB' in window;
    
    // Check for Service Worker API (optional but useful)
    const hasServiceWorker = 'serviceWorker' in navigator;
    
    // Log support status
    console.log('Browser support check:', { 
      WebRTC: hasWebRTC, 
      WebCrypto: hasWebCrypto, 
      IndexedDB: hasIndexedDB,
      ServiceWorker: hasServiceWorker
    });
    
    // For minimum requirements, we need WebRTC and WebCrypto
    return hasWebRTC && hasWebCrypto;
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('wylloh_user_node_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving user node config:', error);
    }
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem('wylloh_user_node_config');
      if (savedConfig) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.error('Error loading user node config:', error);
    }
  }

  /**
   * Save metrics to localStorage
   */
  private saveMetrics(): void {
    try {
      localStorage.setItem('wylloh_user_node_metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Error saving user node metrics:', error);
    }
  }

  /**
   * Report metrics to server
   */
  private async reportMetrics(): Promise<void> {
    try {
      // This would be implemented to send metrics to a server endpoint
      // For now, just log that we would report metrics
      console.log('Would report metrics to server:', this.metrics);
    } catch (error) {
      console.error('Error reporting metrics:', error);
    }
  }

  /**
   * Get current node metrics
   */
  getMetrics(): NodeMetrics {
    // If node is running, update uptime before returning
    if (this.isRunning) {
      this.metrics.uptime = Math.floor((Date.now() - this.startTime) / 1000);
      this.metrics.lastUpdated = Date.now();
    }
    
    return { ...this.metrics };
  }

  /**
   * Get node status
   */
  getStatus(): { initialized: boolean, running: boolean, peerId?: string } {
    return {
      initialized: this.isInitialized,
      running: this.isRunning,
      peerId: this.libp2p?.peerId.toString()
    };
  }

  /**
   * Update configuration
   * @param config New configuration options
   */
  updateConfig(config: Partial<UserNodeConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
    
    // Apply relevant config changes immediately
    if (this.metricsInterval && !this.config.enableMetrics) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    } else if (!this.metricsInterval && this.config.enableMetrics && this.isRunning) {
      this.setupMetricsCollection();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): UserNodeConfig {
    return { ...this.config };
  }

  /**
   * Get list of peers currently connected
   */
  async getConnectedPeers(): Promise<string[]> {
    if (!this.isInitialized || !this.isRunning) {
      return [];
    }
    
    try {
      const peers = this.libp2p.getPeers();
      return peers.map((peerId: any) => peerId.toString());
    } catch (error) {
      console.error('Error getting connected peers:', error);
      return [];
    }
  }
}

// Export singleton instance
export const userNodeService = new UserNodeService();
export default userNodeService; 