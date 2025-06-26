import { io, Socket } from 'socket.io-client';

interface WebSocketEvents {
  'user:status': (data: { proStatus: string; roles: string[]; walletAddress: string }) => void;
  'pro:status:update': (data: { proStatus: string; dateProApproved?: string; timestamp: string }) => void;
  'pro:verified': (data: { message: string; proStatus: string; timestamp: string }) => void;
  'user:update': (data: any) => void;
  'error': (data: { message: string }) => void;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private eventHandlers: Map<string, Function> = new Map();

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Determine server URL based on environment
        const API_BASE_URL = process.env.NODE_ENV === 'production' 
          ? 'https://api.wylloh.com'
          : 'http://localhost:3001';

        console.log('🔌 Connecting to WebSocket server:', API_BASE_URL);

        this.socket = io(API_BASE_URL, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true // Always create a new connection
        });

        this.socket.on('connect', () => {
          console.log('✅ WebSocket connected successfully');
          this.isConnected = true;
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('❌ WebSocket disconnected:', reason);
          this.isConnected = false;
        });

        // Set up event handlers
        this.setupEventHandlers();

      } catch (error) {
        console.error('❌ WebSocket connection failed:', error);
        reject(error);
      }
    });
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // User status updates
    this.socket.on('user:status', (data) => {
      console.log('📡 User status received:', data);
      this.emit('user:status', data);
    });

    // Pro status updates
    this.socket.on('pro:status:update', (data) => {
      console.log('🎯 Pro status update received:', data);
      this.emit('pro:status:update', data);
    });

    // Pro verification celebration
    this.socket.on('pro:verified', (data) => {
      console.log('🎉 Pro verification received:', data);
      this.emit('pro:verified', data);
    });

    // General user updates
    this.socket.on('user:update', (data) => {
      console.log('📡 User update received:', data);
      this.emit('user:update', data);
    });

    // Error handling
    this.socket.on('error', (data) => {
      console.error('❌ WebSocket error:', data);
      this.emit('error', data);
    });
  }

  on(event: string, handler: Function) {
    this.eventHandlers.set(event, handler);
  }

  off(event: string) {
    this.eventHandlers.delete(event);
  }

  private emit(event: string, data: any) {
    const handler = this.eventHandlers.get(event);
    if (handler) {
      try {
        handler(data);
      } catch (error) {
        console.error(`❌ Error in WebSocket event handler for ${event}:`, error);
      }
    }
  }

  // Request fresh Pro status check
  requestProStatusCheck() {
    if (this.socket && this.isConnected) {
      console.log('🔍 Requesting Pro status check...');
      this.socket.emit('pro:status:check');
    } else {
      console.warn('⚠️ WebSocket not connected, cannot request Pro status check');
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventHandlers.clear();
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService; 