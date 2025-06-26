import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface WebSocketService {
  io: Server;
  initializeWebSocket: (server: HttpServer) => void;
  notifyProStatusChange: (userId: string, newStatus: string) => Promise<void>;
  notifyUserUpdate: (userId: string, updateData: any) => Promise<void>;
}

class WebSocketServiceImpl implements WebSocketService {
  public io!: Server;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  public initializeWebSocket(server: HttpServer): void {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://wylloh.com', 'https://www.wylloh.com']
          : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        credentials: true,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware for WebSocket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Fetch user data from database
        const user = await User.findById(decoded.id);
        if (!user) {
          return next(new Error('User not found'));
        }

        // Attach user to socket
        socket.data.user = user;
        next();
      } catch (error) {
        console.error('❌ WebSocket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Handle connections
    this.io.on('connection', (socket) => {
      const user = socket.data.user;
      console.log(`🔌 WebSocket connected: ${user.username} (${user.walletAddress})`);
      
      // Store user connection
      this.connectedUsers.set(user._id.toString(), socket.id);
      
      // Join user-specific room
      socket.join(`user:${user._id}`);
      
      // Send current user status
      socket.emit('user:status', {
        proStatus: user.proStatus,
        roles: user.roles,
        walletAddress: user.walletAddress
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`❌ WebSocket disconnected: ${user.username}`);
        this.connectedUsers.delete(user._id.toString());
      });

      // Handle Pro status check requests
      socket.on('pro:status:check', async () => {
        try {
          const freshUser = await User.findById(user._id);
          if (freshUser) {
            socket.emit('pro:status:update', {
              proStatus: freshUser.proStatus,
              dateProApproved: freshUser.dateProApproved,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('❌ Pro status check failed:', error);
          socket.emit('error', { message: 'Failed to check Pro status' });
        }
      });
    });

    console.log('✅ WebSocket service initialized');
  }

  public async notifyProStatusChange(userId: string, newStatus: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        console.error('❌ User not found for Pro status notification:', userId);
        return;
      }

      const updateData = {
        proStatus: newStatus,
        dateProApproved: newStatus === 'verified' ? new Date().toISOString() : undefined,
        timestamp: new Date().toISOString()
      };

      // Send to user's room
      this.io.to(`user:${userId}`).emit('pro:status:update', updateData);
      
      // Special notification for Pro verification
      if (newStatus === 'verified') {
        this.io.to(`user:${userId}`).emit('pro:verified', {
          message: 'Congratulations! Your Pro status has been verified.',
          proStatus: newStatus,
          timestamp: updateData.timestamp
        });
        
        console.log(`🎉 Pro status verified notification sent to ${user.username}`);
      }

      console.log(`📡 Pro status update sent to user ${user.username}: ${newStatus}`);
    } catch (error) {
      console.error('❌ Failed to notify Pro status change:', error);
    }
  }

  public async notifyUserUpdate(userId: string, updateData: any): Promise<void> {
    try {
      // Send general user update
      this.io.to(`user:${userId}`).emit('user:update', {
        ...updateData,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📡 User update notification sent to user ${userId}`);
    } catch (error) {
      console.error('❌ Failed to notify user update:', error);
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketServiceImpl();
export default websocketService; 