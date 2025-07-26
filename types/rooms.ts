export interface Room {
  id: string;
  name: string;
  destination: string;
  destinationCoords?: {
    latitude: number;
    longitude: number;
  };
  createdBy: string;
  createdByName: string;
  members: RoomMember[];
  maxMembers: number;
  isActive: boolean;
  isPrivate: boolean;
  joinCode?: string;
  status?: string;
  userRole?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomMember {
  id: string;
  userId: string;
  userName: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  lastSeen: Date;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
}

export interface CreateRoomRequest {
  name: string;
  description?: string;
  destination: string;
  destinationCoords?: {
    latitude: number;
    longitude: number;
  };
  maxMembers: number | string;
  isPrivate: boolean;
}

export interface JoinRoomRequest {
  roomId?: string;
  joinCode?: string;
}

export interface RoomStore {
  rooms: Room[];
  activeRoom: Room | null;
  currentRoomLocations: import('@/types/socket').LocationData[];
  chatMessages: import('@/types/socket').ChatMessage[];
  unreadCount: number;
  isChatOpen: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadRooms: () => Promise<void>;
  createRoom: (roomData: CreateRoomRequest) => Promise<Room>;
  joinRoom: (request: JoinRoomRequest) => Promise<Room>;
  leaveRoom: (roomId: string) => Promise<void>;
  updateRoom: (roomId: string, updates: Partial<Room>) => Promise<Room>;
  deleteRoom: (roomId: string) => Promise<void>;
  setActiveRoom: (room: Room | null) => void;
  clearError: () => void;
  
  // Getters
  getUserRooms: () => Room[];
  getActiveRoom: () => Room | null;
  getRecentRooms: () => Room[];

  // Real-time location methods
  updateUserLocation: (locationData: import('@/types/socket').LocationData) => void;
  removeUserLocation: (userId: string) => void;
  clearRoomLocations: () => void;
  getCurrentRoomLocations: () => import('@/types/socket').LocationData[];

  // Chat methods
  addChatMessage: (message: import('@/types/socket').ChatMessage) => void;
  setChatMessages: (messages: import('@/types/socket').ChatMessage[]) => void;
  clearChatMessages: () => void;
  getChatMessages: () => import('@/types/socket').ChatMessage[];
  resetUnreadCount: () => void;
  setChatOpen: (open: boolean) => void;
}

export interface DestinationLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}