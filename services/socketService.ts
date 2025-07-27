import { io, Socket } from 'socket.io-client';
import { SocketEvents, LocationUpdateData, LocationData, RoomState, ChatMessage, SendMessageData } from '@/types/socket';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private Api_url: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | number | null = null;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.token = token;
      this.Api_url = process.env.EXPO_PUBLIC_API_URL || null;
      this.socket = io(this.Api_url?.replace('/api', ''), {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        upgrade: true,
        rememberUpgrade: true,
      });

      this.socket.on('connect', () => {
        // console.log('Socket connected:', this.socket?.id);
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        // console.log('Socket disconnected:', reason);
        this.stopHeartbeat();
        
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          this.handleReconnect();
        }
      });

      this.setupEventListeners();
    });
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
    this.reconnectAttempts = 0;
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 25000); // Send ping every 25 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.token) {
      this.reconnectAttempts++;
      
      setTimeout(() => {
        // console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(this.token!).catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('error', (data) => {
      console.error('Socket error:', data);
    });

    this.socket.on('pong', () => {
      // Heartbeat response received
    });

    this.socket.on('location-confirmed', (data) => {
      // Location update confirmed by server
      // console.log('Location update confirmed:', data);
    });

    this.socket.on('room-locations', (data) => {
      // Received all current room locations
      // console.log('Received room locations:', data);
    });

    this.socket.on('user-offline', (data) => {
      // User went offline
      // console.log('User went offline:', data);
    });
  }

  // Room operations
  joinRoom(roomId: string): Promise<{ roomId: string; roomName: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Join room timeout'));
      }, 10000);

      this.socket.once('joined-room', (data) => {
        clearTimeout(timeout);
        resolve(data);
      });

      this.socket.once('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(error.message));
      });

      this.socket.emit('join-room', { roomId });
    });
  }

  leaveRoom(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave-room', { roomId });
    }
  }

  updateLocation(data: LocationUpdateData) {
    if (this.socket?.connected) {
      // console.log('SocketService: Sending location update:', data);
      this.socket.emit('location-update', data);
    } else {
      console.warn('Socket not connected, cannot send location update');
    }
  }

  // Chat operations
  sendMessage(roomId: string, content: string, clientTempId?: string) {
    if (this.socket?.connected) {
      const messageData: SendMessageData = { roomId, content, clientTempId };
      this.socket.emit('send-message', messageData);
    } else {
      console.warn('Socket not connected, cannot send message');
    }
  }

  requestChatHistory(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('request-chat-history', { roomId });
    } else {
      console.warn('Socket not connected, cannot request chat history');
    }
  }

  // Event listeners
  onUserJoined(callback: (data: { userId: string; userName: string }) => void) {
    this.socket?.on('user-joined', callback);
  }

  onUserLeft(callback: (data: { userId: string; userName: string }) => void) {
    this.socket?.on('user-left', callback);
  }

  onUserOffline(callback: (data: { userId: string; userName: string }) => void) {
    this.socket?.on('user-offline', callback);
  }

  onLocationUpdated(callback: (data: LocationData) => void) {
    if (this.socket) {
      this.socket.on('location-updated', (data) => {
        // console.log('SocketService: Received location update:', data);
        callback(data);
      });
    }
  }

  onRoomLocations(callback: (data: { locations: LocationData[] }) => void) {
    if (this.socket) {
      this.socket.on('room-locations', (data) => {
        // console.log('SocketService: Received room locations:', data);
        callback(data);
      });
    }
  }

  onLocationConfirmed(callback: (data: { timestamp: string; latitude: number; longitude: number }) => void) {
    this.socket?.on('location-confirmed', callback);
  }

  onError(callback: (data: { message: string }) => void) {
    this.socket?.on('error', callback);
  }

  onNewMessage(callback: (data: ChatMessage) => void) {
    this.socket?.on('new-message', callback);
  }

  onChatHistory(callback: (data: { messages: ChatMessage[] }) => void) {
    this.socket?.on('chat-history', callback);
  }

  // Remove listeners
  offUserJoined() {
    this.socket?.off('user-joined');
  }

  offUserLeft() {
    this.socket?.off('user-left');
  }

  offUserOffline() {
    this.socket?.off('user-offline');
  }

  offLocationUpdated() {
    this.socket?.off('location-updated');
  }

  offRoomLocations() {
    this.socket?.off('room-locations');
  }

  offLocationConfirmed() {
    this.socket?.off('location-confirmed');
  }

  offError() {
    this.socket?.off('error');
  }

  offNewMessage() {
    this.socket?.off('new-message');
  }

  offChatHistory() {
    this.socket?.off('chat-history');
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }

  // Get connection quality info
  getConnectionInfo() {
    if (!this.socket) return null;
    
    return {
      connected: this.socket.connected,
      id: this.socket.id,
      transport: this.socket.io.engine?.transport?.name,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export const socketService = new SocketService();
export default socketService;