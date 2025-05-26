import Hls from 'hls.js';
import * as dashjs from 'dashjs';
import { cdnService } from './cdn.service';
import { storageService } from './storage.service';

// Try importing Shaka Player with a fallback for TypeScript
let shaka: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  shaka = require('shaka-player');
  // Initialize Shaka Player if available
  if (shaka && shaka.polyfill && typeof shaka.polyfill.installAll === 'function') {
    shaka.polyfill.installAll();
  }
} catch (error) {
  console.warn('Shaka Player not available, some streaming features may be limited', error);
  shaka = null;
}

/**
 * Stream quality levels
 */
export enum StreamQuality {
  AUTO = 'auto',
  LOW = 'low',     // 480p or lower
  MEDIUM = 'medium', // 720p
  HIGH = 'high',    // 1080p
  ULTRA = 'ultra'   // 4K
}

/**
 * Stream format types
 */
export enum StreamFormat {
  HLS = 'hls',
  DASH = 'dash',
  MP4 = 'mp4',
  WEBM = 'webm',
  IPFS_GATEWAY = 'ipfs-gateway' // Direct IPFS gateway link (fallback)
}

/**
 * Stream analytics data
 */
export interface StreamAnalytics {
  startTime: number;         // Time taken to start playback (ms)
  bufferingEvents: number;   // Count of buffering events
  bufferingDuration: number; // Total buffering time (ms)
  bitrateChanges: number;    // Count of bitrate changes
  averageBitrate: number;    // Average bitrate (kbps)
  playerType: string;        // Player type used (hls.js, dash.js, shaka, native)
  errors: Array<{            // Errors during playback
    time: number;
    message: string;
  }>;
  qualitySwitches: number;   // Number of quality switches
  lastQuality: string;       // Last quality level
}

/**
 * Stream options
 */
export interface StreamOptions {
  preferredQuality?: StreamQuality;
  preferredFormat?: StreamFormat;
  enableP2P?: boolean;
  startPosition?: number;
  lowLatency?: boolean;
  drmOptions?: any;
}

/**
 * Video stream metadata
 */
export interface StreamMetadata {
  duration: number;
  width: number;
  height: number;
  availableQualities: StreamQuality[];
  availableFormats: StreamFormat[];
  isProtected: boolean;
  isLive: boolean;
}

/**
 * Service for adaptive streaming video content
 */
class AdaptiveStreamingService {
  private players: Map<string, any> = new Map();
  private analytics: Map<string, StreamAnalytics> = new Map();
  private videoElements: Map<string, HTMLVideoElement> = new Map();
  private activeFormat: Map<string, StreamFormat> = new Map();
  private initialized: boolean = false;
  
  constructor() {
    this.initialize();
  }
  
  /**
   * Initialize the streaming service
   */
  private initialize(): void {
    if (this.initialized) return;
    
    // Check browser support
    if (Hls.isSupported()) {
      console.log('AdaptiveStreamingService: HLS.js is supported');
    } else {
      console.warn('AdaptiveStreamingService: HLS.js is not supported in this browser');
    }
    
    try {
      // Check Shaka support
      shaka.Player.isBrowserSupported();
      console.log('AdaptiveStreamingService: Shaka Player is supported');
    } catch (error) {
      console.warn('AdaptiveStreamingService: Shaka Player is not supported in this browser');
    }

    // Check DASH.js support (generally based on MSE support)
    if (dashjs.supportsMediaSource()) {
      console.log('AdaptiveStreamingService: DASH.js is supported');
    } else {
      console.warn('AdaptiveStreamingService: DASH.js is not supported in this browser');
    }
    
    this.initialized = true;
  }
  
  /**
   * Get the URL for the appropriate streaming format
   * 
   * @param cid Content CID
   * @param format Stream format
   * @returns Stream URL
   */
  private getStreamUrl(cid: string, format: StreamFormat): string {
    if (!cid) return '';
    
    switch (format) {
      case StreamFormat.HLS:
        return `${cdnService.getEdgeServerUrl()}/hls/${cid}/master.m3u8`;
      case StreamFormat.DASH:
        return `${cdnService.getEdgeServerUrl()}/dash/${cid}/manifest.mpd`;
      case StreamFormat.MP4:
        return `${cdnService.getEdgeServerUrl()}/mp4/${cid}/index.mp4`;
      case StreamFormat.WEBM:
        return `${cdnService.getEdgeServerUrl()}/webm/${cid}/index.webm`;
      case StreamFormat.IPFS_GATEWAY:
      default:
        // Fallback to direct gateway
        return cdnService.getStreamingUrl(cid);
    }
  }
  
  /**
   * Detect the best streaming format for the current browser
   * 
   * @returns The best supported stream format
   */
  private detectBestFormat(): StreamFormat {
    // Check browser support in preferred order
    if (Hls.isSupported()) {
      return StreamFormat.HLS;
    } else if (dashjs.supportsMediaSource()) {
      return StreamFormat.DASH;
    } else {
      // Fallback to direct MP4 streaming
      return StreamFormat.MP4;
    }
  }
  
  /**
   * Get default stream options
   * 
   * @returns Default stream options
   */
  private getDefaultOptions(): StreamOptions {
    return {
      preferredQuality: StreamQuality.AUTO,
      preferredFormat: this.detectBestFormat(),
      enableP2P: true,
      startPosition: 0,
      lowLatency: false
    };
  }
  
  /**
   * Setup a new streaming player
   * 
   * @param videoElement The video element to attach to
   * @param cid Content CID
   * @param options Stream options
   * @returns Unique player ID
   */
  public setupPlayer(
    videoElement: HTMLVideoElement,
    cid: string,
    options: StreamOptions = {}
  ): string {
    const playerId = `player_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const streamOptions = { ...this.getDefaultOptions(), ...options };
    const format = streamOptions.preferredFormat || this.detectBestFormat();
    const streamUrl = this.getStreamUrl(cid, format);
    
    console.log(`AdaptiveStreamingService: Setting up player for CID ${cid} with format ${format}`);
    console.log(`AdaptiveStreamingService: Stream URL: ${streamUrl}`);
    
    // Store video element reference
    this.videoElements.set(playerId, videoElement);
    this.activeFormat.set(playerId, format);
    
    // Initialize analytics
    this.analytics.set(playerId, {
      startTime: 0,
      bufferingEvents: 0,
      bufferingDuration: 0,
      bitrateChanges: 0,
      averageBitrate: 0,
      playerType: format,
      errors: [],
      qualitySwitches: 0,
      lastQuality: streamOptions.preferredQuality || StreamQuality.AUTO
    });
    
    // Setup player based on format
    try {
      switch (format) {
        case StreamFormat.HLS:
          this.setupHlsPlayer(playerId, videoElement, streamUrl, streamOptions);
          break;
        case StreamFormat.DASH:
          this.setupDashPlayer(playerId, videoElement, streamUrl, streamOptions);
          break;
        case StreamFormat.MP4:
        case StreamFormat.WEBM:
        case StreamFormat.IPFS_GATEWAY:
          this.setupNativePlayer(playerId, videoElement, streamUrl, streamOptions);
          break;
      }
    } catch (error) {
      console.error('Error setting up player:', error);
      // Log error in analytics
      const analytics = this.analytics.get(playerId);
      if (analytics) {
        analytics.errors.push({
          time: Date.now(),
          message: `Error setting up player: ${error}`
        });
      }
      
      // Try fallback to direct gateway
      this.setupNativePlayer(
        playerId, 
        videoElement, 
        cdnService.getStreamingUrl(cid),
        streamOptions
      );
    }
    
    return playerId;
  }
  
  /**
   * Setup HLS.js player
   * 
   * @param playerId Player ID
   * @param videoElement Video element
   * @param streamUrl Stream URL
   * @param options Stream options
   */
  private setupHlsPlayer(
    playerId: string,
    videoElement: HTMLVideoElement,
    streamUrl: string,
    options: StreamOptions
  ): void {
    const startTime = performance.now();
    
    // Create HLS player
    const hls = new Hls({
      capLevelToPlayerSize: true,
      maxBufferSize: 60 * 1000 * 1000, // 60 MB
      maxBufferLength: 30, // 30 seconds
      startLevel: this.qualityToLevel(options.preferredQuality, 'hls'),
      autoStartLoad: true,
      enableWorker: true,
      lowLatencyMode: options.lowLatency,
      xhrSetup: (xhr: XMLHttpRequest) => {
        // Add cache control headers
        xhr.setRequestHeader('Cache-Control', 'max-age=3600');
      }
    });
    
    // Attach to video element
    hls.attachMedia(videoElement);
    
    // Event listeners
    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      console.log('AdaptiveStreamingService: HLS media attached');
      hls.loadSource(streamUrl);
    });
    
    hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      console.log(`AdaptiveStreamingService: HLS manifest parsed, ${data.levels.length} quality levels`);
      
      // Update analytics
      const analytics = this.analytics.get(playerId);
      if (analytics) {
        analytics.startTime = performance.now() - startTime;
      }
      
      // Set quality if not AUTO
      if (options.preferredQuality !== StreamQuality.AUTO) {
        const level = this.qualityToLevel(options.preferredQuality, 'hls', data.levels.length - 1);
        hls.currentLevel = level;
      }
      
      // Start playback
      if (videoElement.autoplay) {
        videoElement.play().catch(error => {
          console.error('AdaptiveStreamingService: Error starting playback:', error);
        });
      }
    });
    
    // Monitor quality changes
    hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      const levels = hls.levels;
      const currentLevel = data.level;
      
      // Only log if we have level information
      if (levels && levels.length > 0 && currentLevel >= 0) {
        const height = levels[currentLevel]?.height || 0;
        const width = levels[currentLevel]?.width || 0;
        const bitrate = levels[currentLevel]?.bitrate || 0;
        
        console.log(`AdaptiveStreamingService: Quality changed to ${width}x${height} (${Math.round(bitrate/1000)} kbps)`);
        
        // Update analytics
        const analytics = this.analytics.get(playerId);
        if (analytics) {
          analytics.bitrateChanges++;
          analytics.lastQuality = this.levelToQuality(currentLevel, 'hls', levels.length - 1);
          analytics.qualitySwitches++;
        }
      }
    });
    
    // Error handling
    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('AdaptiveStreamingService: HLS error:', data);
      
      // Update analytics
      const analytics = this.analytics.get(playerId);
      if (analytics) {
        analytics.errors.push({
          time: Date.now(),
          message: `HLS error: ${data.type} - ${data.details}`
        });
      }
      
      // Try to recover
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log('AdaptiveStreamingService: Fatal network error... Trying to recover');
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log('AdaptiveStreamingService: Fatal media error... Trying to recover');
            hls.recoverMediaError();
            break;
          default:
            // Cannot recover, destroy and fall back to native player
            this.destroyPlayer(playerId);
            this.setupNativePlayer(playerId, videoElement, streamUrl, options);
            break;
        }
      }
    });
    
    // Store player instance
    this.players.set(playerId, hls);
    
    // Set initial metadata
    const analytics = this.analytics.get(playerId);
    if (analytics) {
      analytics.playerType = 'hls.js';
    }
  }
  
  /**
   * Setup DASH.js player
   * 
   * @param playerId Player ID
   * @param videoElement Video element
   * @param streamUrl Stream URL
   * @param options Stream options
   */
  private setupDashPlayer(
    playerId: string,
    videoElement: HTMLVideoElement,
    streamUrl: string,
    options: StreamOptions
  ): void {
    const startTime = performance.now();
    
    // Create DASH player
    const dash = dashjs.MediaPlayer().create();
    
    // Configure player
    dash.initialize(videoElement, streamUrl, videoElement.autoplay);
    dash.updateSettings({
      streaming: {
        abr: {
          autoSwitchBitrate: {
            video: options.preferredQuality === StreamQuality.AUTO
          }
        }
      }
    });
    
    // Set initial quality if not AUTO
    if (options.preferredQuality !== StreamQuality.AUTO) {
      dash.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
        const bitrateList = dash.getBitrateInfoListFor('video');
        if (bitrateList && bitrateList.length > 0) {
          const level = this.qualityToLevel(options.preferredQuality, 'dash', bitrateList.length - 1);
          dash.setQualityFor('video', level);
          dash.updateSettings({
            streaming: {
              abr: {
                autoSwitchBitrate: {
                  video: false
                }
              }
            }
          });
        }
      });
    }
    
    // Add event listeners
    dash.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED, (e: any) => {
      if (e.mediaType === 'video') {
        const bitrateList = dash.getBitrateInfoListFor('video');
        const currentLevel = e.newQuality;
        
        if (bitrateList && currentLevel >= 0 && currentLevel < bitrateList.length) {
          const bitrateInfo = bitrateList[currentLevel];
          console.log(`AdaptiveStreamingService: Quality changed to ${bitrateInfo.width}x${bitrateInfo.height} (${Math.round(bitrateInfo.bitrate/1000)} kbps)`);
          
          // Update analytics
          const analytics = this.analytics.get(playerId);
          if (analytics) {
            analytics.bitrateChanges++;
            analytics.lastQuality = this.levelToQuality(currentLevel, 'dash', bitrateList.length - 1);
            analytics.qualitySwitches++;
          }
        }
      }
    });
    
    dash.on(dashjs.MediaPlayer.events.PLAYBACK_WAITING, () => {
      // Update analytics
      const analytics = this.analytics.get(playerId);
      if (analytics) {
        analytics.bufferingEvents++;
      }
    });
    
    dash.on(dashjs.MediaPlayer.events.ERROR, (e: any) => {
      console.error('AdaptiveStreamingService: DASH error:', e);
      
      // Update analytics
      const analytics = this.analytics.get(playerId);
      if (analytics) {
        analytics.errors.push({
          time: Date.now(),
          message: `DASH error: ${e.error?.code || 'unknown'}`
        });
      }
    });
    
    // Store player instance
    this.players.set(playerId, dash);
    
    // Set initial metadata
    const analytics = this.analytics.get(playerId);
    if (analytics) {
      analytics.playerType = 'dash.js';
      analytics.startTime = performance.now() - startTime;
    }
  }
  
  /**
   * Setup native HTML5 player
   * 
   * @param playerId Player ID
   * @param videoElement Video element
   * @param streamUrl Stream URL
   * @param options Stream options
   */
  private setupNativePlayer(
    playerId: string,
    videoElement: HTMLVideoElement,
    streamUrl: string,
    options: StreamOptions
  ): void {
    const startTime = performance.now();
    
    // Set source
    videoElement.src = streamUrl;
    
    // Set initial position if provided
    if (options.startPosition && options.startPosition > 0) {
      videoElement.currentTime = options.startPosition;
    }
    
    // Event listeners
    const onBuffering = () => {
      const analytics = this.analytics.get(playerId);
      if (analytics) {
        analytics.bufferingEvents++;
      }
    };
    
    const onError = (e: any) => {
      console.error('AdaptiveStreamingService: Native player error:', e);
      
      // Update analytics
      const analytics = this.analytics.get(playerId);
      if (analytics) {
        analytics.errors.push({
          time: Date.now(),
          message: `Native player error: ${videoElement.error?.code || 'unknown'}`
        });
      }
      
      // Try fallback if this is the first error
      if (analytics && analytics.errors.length === 1) {
        console.log('AdaptiveStreamingService: Trying fallback to direct gateway');
        
        // Try a different gateway as fallback
        videoElement.src = cdnService.getFallbackGatewayUrl(streamUrl);
        videoElement.load();
        videoElement.play().catch(error => {
          console.error('AdaptiveStreamingService: Error starting playback with fallback:', error);
        });
      }
    };
    
    // Add event listeners
    videoElement.addEventListener('waiting', onBuffering);
    videoElement.addEventListener('error', onError);
    
    // Store player instance (use empty object for native player)
    this.players.set(playerId, {
      type: 'native',
      destroy: () => {
        videoElement.removeEventListener('waiting', onBuffering);
        videoElement.removeEventListener('error', onError);
        videoElement.removeAttribute('src');
        videoElement.load();
      }
    });
    
    // Load content
    videoElement.load();
    
    // Start playback if autoplay
    if (videoElement.autoplay) {
      videoElement.play().catch(error => {
        console.error('AdaptiveStreamingService: Error starting native playback:', error);
      });
    }
    
    // Set initial metadata
    const analytics = this.analytics.get(playerId);
    if (analytics) {
      analytics.playerType = 'native';
      analytics.startTime = performance.now() - startTime;
    }
  }
  
  /**
   * Set the quality level for a player
   * 
   * @param playerId Player ID
   * @param quality Stream quality
   */
  public setQuality(playerId: string, quality: StreamQuality): void {
    const player = this.players.get(playerId);
    const format = this.activeFormat.get(playerId);
    
    if (!player || !format) {
      console.error(`AdaptiveStreamingService: Player ${playerId} not found`);
      return;
    }
    
    console.log(`AdaptiveStreamingService: Setting quality to ${quality}`);
    
    switch (format) {
      case StreamFormat.HLS:
        if (player instanceof Hls) {
          if (quality === StreamQuality.AUTO) {
            player.currentLevel = -1; // Auto
          } else {
            // Find appropriate level
            const maxLevel = player.levels.length - 1;
            const level = this.qualityToLevel(quality, 'hls', maxLevel);
            player.currentLevel = level;
          }
        }
        break;
        
      case StreamFormat.DASH:
        if (player.setQualityFor) {
          const bitrateList = player.getBitrateInfoListFor('video');
          if (bitrateList && bitrateList.length > 0) {
            if (quality === StreamQuality.AUTO) {
              player.updateSettings({
                streaming: {
                  abr: {
                    autoSwitchBitrate: {
                      video: true
                    }
                  }
                }
              });
            } else {
              const level = this.qualityToLevel(quality, 'dash', bitrateList.length - 1);
              player.setQualityFor('video', level);
              player.updateSettings({
                streaming: {
                  abr: {
                    autoSwitchBitrate: {
                      video: false
                    }
                  }
                }
              });
            }
          }
        }
        break;
        
      // For native player, we can't change quality directly
      default:
        console.log('AdaptiveStreamingService: Quality selection not supported for this player type');
        break;
    }
    
    // Update analytics
    const analytics = this.analytics.get(playerId);
    if (analytics) {
      analytics.lastQuality = quality;
      analytics.qualitySwitches++;
    }
  }
  
  /**
   * Convert quality setting to player-specific level
   * 
   * @param quality Quality setting
   * @param playerType Player type (hls, dash)
   * @param maxLevel Maximum level available
   * @returns Level index
   */
  private qualityToLevel(
    quality?: StreamQuality,
    playerType: string = 'hls',
    maxLevel: number = 4
  ): number {
    if (!quality || quality === StreamQuality.AUTO) {
      return -1; // Auto
    }
    
    // For simplicity, map quality to levels based on percentage of max
    switch (quality) {
      case StreamQuality.LOW:
        return 0; // Lowest level
      case StreamQuality.MEDIUM:
        return Math.floor(maxLevel * 0.33); // ~33% of max
      case StreamQuality.HIGH:
        return Math.floor(maxLevel * 0.66); // ~66% of max
      case StreamQuality.ULTRA:
        return maxLevel; // Highest level
      default:
        return -1; // Auto
    }
  }
  
  /**
   * Convert player level to quality setting
   * 
   * @param level Player level
   * @param playerType Player type (hls, dash)
   * @param maxLevel Maximum level available
   * @returns Quality setting
   */
  private levelToQuality(
    level: number,
    playerType: string = 'hls',
    maxLevel: number = 4
  ): StreamQuality {
    if (level === -1) {
      return StreamQuality.AUTO;
    }
    
    // Convert level to percentage of max
    const percentage = level / maxLevel;
    
    if (percentage < 0.25) {
      return StreamQuality.LOW;
    } else if (percentage < 0.5) {
      return StreamQuality.MEDIUM;
    } else if (percentage < 0.75) {
      return StreamQuality.HIGH;
    } else {
      return StreamQuality.ULTRA;
    }
  }
  
  /**
   * Get stream analytics
   * 
   * @param playerId Player ID
   * @returns Stream analytics
   */
  public getAnalytics(playerId: string): StreamAnalytics | null {
    return this.analytics.get(playerId) || null;
  }
  
  /**
   * Destroy player and clean up resources
   * 
   * @param playerId Player ID
   */
  public destroyPlayer(playerId: string): void {
    const player = this.players.get(playerId);
    const videoElement = this.videoElements.get(playerId);
    
    if (player) {
      // Different cleanup based on player type
      if (player instanceof Hls) {
        player.destroy();
      } else if (player.destroy) {
        player.destroy();
      }
      
      // Clean up video element
      if (videoElement) {
        videoElement.removeAttribute('src');
        videoElement.load();
      }
      
      // Remove from maps
      this.players.delete(playerId);
      this.videoElements.delete(playerId);
      this.activeFormat.delete(playerId);
      
      console.log(`AdaptiveStreamingService: Player ${playerId} destroyed`);
    }
  }
}

export const adaptiveStreamingService = new AdaptiveStreamingService(); 