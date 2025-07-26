export interface SocketEvents {
  // Client to Server
  'join-room': (data: { roomId: string }) => void;
  'location-update': (data: LocationUpdateData) => void;
  'leave-room': (data: { roomId: string }) => void;
  'send-message': (data: SendMessageData) => void;
  'request-chat-history': (data: { roomId: string }) => void;
  'ping': () => void;

  // Server to Client
  'joined-room': (data: { roomId: string; roomName: string }) => void;
  'user-joined': (data: { userId: string; userName: string }) => void;
  'user-left': (data: { userId: string; userName: string }) => void;
  'user-offline': (data: { userId: string; userName: string }) => void;
  'location-updated': (data: LocationData) => void;
  'location-confirmed': (data: { timestamp: string; latitude: number; longitude: number }) => void;
  'room-locations': (data: { locations: LocationData[] }) => void;
  'new-message': (data: ChatMessage) => void;
  'chat-history': (data: { messages: ChatMessage[] }) => void;
  'error': (data: { message: string }) => void;
  'pong': () => void;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

export interface SendMessageData {
  roomId: string;
  content: string;
}

export interface LocationUpdateData {
  roomId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  bearing?: number;
  heading?: number;
  altitude?: number;
  batteryLevel?: number;
  deviceModel?: string;
}

export interface LocationData {
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  bearing?: number;
  heading?: number;
  altitude?: number;
  batteryLevel?: number;
  deviceModel?: string;
  timestamp: string;
  isLive?: boolean;
}

export interface RoomState {
  id: string;
  roomCode: string;
  name: string;
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  maxMembers: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  members: RoomMember[];
  memberCount: number;
}

export interface RoomMember {
  id: string;
  userId: string;
  userName: string;
  nickname: string;
  role: 'owner' | 'admin' | 'member';
  status: string;
  joinedAt: string;
  lastSeen: string;
  joinOrder: number;
}