import { create } from 'zustand';
import { RoomStore, Room, CreateRoomRequest, JoinRoomRequest } from '@/types/rooms';
import { apiService } from '@/services/apiService';
import { socketService } from '@/services/socketService';
import { LocationData, ChatMessage } from '@/types/socket';

export const useRoomStore = create<RoomStore>((set, get) => ({
  rooms: [],
  activeRoom: null,
  currentRoomLocations: [],
  chatMessages: [],
  unreadCount: 0,
  isChatOpen: false,
  isLoading: false,
  isChatHistoryLoading: false,
  error: null,

  setChatHistoryLoading: (loading: boolean) => {
    set({ isChatHistoryLoading: loading });
  },

  loadRooms: async () => {
    const currentState = get();
    if (currentState.isLoading) {
      return; // Prevent multiple simultaneous requests
    }
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getUserRooms();
      const convertedRooms = response.rooms.map(room => ({
        id: room.id,
        name: room.name,
        destination: room.destinationName,
        destinationCoords: room.destinationLat && room.destinationLng ? {
          latitude: parseFloat(room.destinationLat.toString()),
          longitude: parseFloat(room.destinationLng.toString()),
        } : undefined,
        createdBy: room.createdBy,
        createdByName: room.createdBy,
        members: [],
        maxMembers: room.maxMembers,
        isActive: room.status === 'active',
        isPrivate: true,
        joinCode: room.roomCode,
        userRole: room.userRole,
        status: room.status,
        createdAt: new Date(room.createdAt),
        updatedAt: new Date(room.updatedAt),
      }));
      const activeRoom = convertedRooms.find(room =>
        room.status === 'active' && (room.userRole === 'owner' || room.userRole === 'member')
      ) || null;
      set({
        rooms: convertedRooms,
        activeRoom,
        isLoading: false
      });
      // Setup socket connection for active room if it exists
      if (activeRoom) {
        get().setChatHistoryLoading(true);
        await _handleActiveRoomSocketConnection(activeRoom);
        // Wait for socket connection before requesting chat history
        if (!socketService.isConnected) {
          await new Promise((resolve) => {
            const onConnect = () => {
              socketService?.offConnect(onConnect);
              resolve(true);
            };
            socketService?.onConnect(onConnect);
          });
        }
        socketService.requestChatHistory(activeRoom.id);
      }
    } catch (error) {
      console.error('Load rooms error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load rooms';
      set({
        error: errorMessage,
        isLoading: false
      });
      get().setChatHistoryLoading(false);
    }
  },

  createRoom: async (roomData: CreateRoomRequest) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiService.createRoom({
        name: roomData.name,
        destinationName: roomData.destination,
        destinationLat: roomData.destinationCoords?.latitude || 0,
        destinationLng: roomData.destinationCoords?.longitude || 0,
        maxMembers: typeof roomData.maxMembers === 'string' ? parseInt(roomData.maxMembers, 10) : roomData.maxMembers,
        expiresIn: 24, // Default 24 hours
      });

      const newRoom: Room = {
        id: response.room.id,
        name: response.room.name,
        destination: response.room.destinationName,
        destinationCoords: response.room.destinationLat && response.room.destinationLng ? {
          latitude: parseFloat(response.room.destinationLat.toString()),
          longitude: parseFloat(response.room.destinationLng.toString()),
        } : undefined,
        createdBy: 'current-user', // Will be updated when we get user info
        createdByName: 'You',
        members: [], // Will be populated when we join the room
        maxMembers: response.room.maxMembers,
        isActive: true,
        isPrivate: true,
        joinCode: response.room.roomCode,
        createdAt: new Date(response.room.createdAt),
        updatedAt: new Date(response.room.updatedAt),
      };

      const { rooms } = get();
      set({
        rooms: [newRoom, ...rooms],
        activeRoom: newRoom,
        isLoading: false
      });

      // Setup socket connection for the new active room
      await _handleActiveRoomSocketConnection(newRoom);

      // Request chat history for the new room
      if (socketService.isConnected) {
        socketService.requestChatHistory(newRoom.id);
      }

      return newRoom;

    } catch (error) {
      console.error('Create room error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
      set({
        error: errorMessage,
        isLoading: false
      });
      throw error;
    }
  },

  joinRoom: async (request: JoinRoomRequest) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiService.joinRoom(request.joinCode!);

      const joinedRoom: Room = {
        id: response.room.id,
        name: response.room.name,
        destination: response.room.destinationName,
        destinationCoords: response.room.destinationLat && response.room.destinationLng ? {
          latitude: parseFloat(response.room.destinationLat.toString()),
          longitude: parseFloat(response.room.destinationLng.toString()),
        } : undefined,
        createdBy: response.room.createdBy,
        createdByName: response.room.createdBy,
        members: [], // Will be populated when we get room details
        maxMembers: response.room.maxMembers,
        isActive: true,
        isPrivate: true,
        joinCode: response.room.roomCode,
        createdAt: new Date(response.room.createdAt),
        updatedAt: new Date(response.room.updatedAt),
      };

      const { rooms } = get();
      const updatedRooms = [joinedRoom, ...rooms.filter(r => r.id !== joinedRoom.id)];

      set({
        rooms: updatedRooms,
        activeRoom: joinedRoom,
        isLoading: false
      });

      // Setup socket connection for the joined active room
      await _handleActiveRoomSocketConnection(joinedRoom);

      // Request chat history for the joined room
      if (socketService.isConnected) {
        socketService.requestChatHistory(joinedRoom.id);
      }

      return joinedRoom;

    } catch (error) {
      console.error('Join room error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
      set({
        error: errorMessage,
        isLoading: false
      });
      throw error;
    }
  },

  leaveRoom: async (roomId: string) => {
    set({ isLoading: true, error: null });

    try {
      await apiService.leaveRoom(roomId);

      const { rooms, activeRoom } = get();
      const updatedRooms = rooms.map(room =>
        room.id === roomId ? { ...room, isActive: false } : room
      );

      let newActiveRoom = activeRoom;
      if (activeRoom?.id === roomId) {
        newActiveRoom = null;
      }

      set({
        rooms: updatedRooms,
        activeRoom: newActiveRoom,
        currentRoomLocations: [],
        isLoading: false
      });

      // Leave room via socket and clean up listeners
      socketService.leaveRoom(roomId);

      // Clean up all socket listeners
      socketService.offRoomLocations();
      socketService.offUserOffline();
      socketService.offNewMessage();
      socketService.offChatHistory();

    } catch (error) {
      console.error('Leave room error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave room';
      set({
        error: errorMessage,
        isLoading: false
      });
      throw error;
    }
  },

  updateRoom: async (roomId: string, updates: Partial<Room>) => {
    // This would be implemented when we have an update room API endpoint
    throw new Error('Update room not implemented yet');
  },

  deleteRoom: async (roomId: string) => {
    // Same as leave room for now
    return get().leaveRoom(roomId);
  },

  setActiveRoom: (room: Room | null) => {
    set({ activeRoom: room });
  },

  clearError: () => {
    set({ error: null });
  },

  getUserRooms: () => {
    return get().rooms;
  },

  getActiveRoom: () => {
    return get().activeRoom;
  },

  getRecentRooms: () => {
    const { rooms } = get();
    return rooms
      .filter(room => !room.isActive)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);
  },

  // Enhanced real-time location methods
  updateUserLocation: (locationData: LocationData) => {
    const { currentRoomLocations } = get();

    // console.log('RoomStore: Updating user location:', locationData);

    // Find existing location and update or add new one
    const existingIndex = currentRoomLocations.findIndex(
      loc => loc.userId === locationData.userId
    );

    let updatedLocations;
    if (existingIndex >= 0) {
      // Update existing location with smooth transition
      updatedLocations = [...currentRoomLocations];
      updatedLocations[existingIndex] = {
        ...locationData,
        timestamp: locationData.timestamp || new Date().toISOString(),
        isLive: true,
      };
      // console.log('RoomStore: Updated existing location for user:', locationData.userId);
    } else {
      // Add new location
      updatedLocations = [...currentRoomLocations, {
        ...locationData,
        timestamp: locationData.timestamp || new Date().toISOString(),
        isLive: true
      }];
      // console.log('RoomStore: Added new location for user:', locationData.userId);
    }

    // console.log('RoomStore: Total locations after update:', updatedLocations.length);
    set({ currentRoomLocations: updatedLocations });
  },

  removeUserLocation: (userId: string) => {
    const { currentRoomLocations } = get();
    const updatedLocations = currentRoomLocations.filter(
      loc => loc.userId !== userId
    );

    set({ currentRoomLocations: updatedLocations });
  },

  clearRoomLocations: () => {
    set({ currentRoomLocations: [] });

    // Clean up all socket listeners
    socketService.offRoomLocations();
    socketService.offUserOffline();
    socketService.offNewMessage();
    socketService.offChatHistory();
  },

  getCurrentRoomLocations: () => {
    return get().currentRoomLocations;
  },

  // Chat methods

  addChatMessage: (message: ChatMessage) => {
    const { chatMessages, isChatOpen, unreadCount } = get();

    // Check if this is an update to an existing optimistic message
    if (message.clientTempId) {
      const existingIndex = chatMessages.findIndex(
        msg => msg.clientTempId === message.clientTempId
      );

      if (existingIndex !== -1) {
        // Update existing optimistic message with server confirmation
        const updatedMessages = [...chatMessages];
        updatedMessages[existingIndex] = {
          ...updatedMessages[existingIndex],
          id: message.id,
          timestamp: message.timestamp,
          status: 'sent',
        };

        set({
          chatMessages: updatedMessages,
          // Don't increment unread count for message updates
        });
        return;
      }
    }

    // Add new message (either from server or optimistic)
    set({
      chatMessages: [...chatMessages, message],
      unreadCount: isChatOpen ? 0 : unreadCount + 1,
    });
  },

  resetUnreadCount: () => {
    set({ unreadCount: 0 });
  },

  setChatOpen: (open: boolean) => {
    set({ isChatOpen: open, unreadCount: open ? 0 : get().unreadCount });
  },

  setChatMessages: (messages: ChatMessage[]) => {
    set({ chatMessages: messages });
  },

  clearChatMessages: () => {
    set({ chatMessages: [] });
  },

  getChatMessages: () => {
    return get().chatMessages;
  },
}));

// Helper function to handle active room socket connection
const _handleActiveRoomSocketConnection = async (activeRoom: Room) => {
  if (!activeRoom || !socketService.isConnected) {
    // Wait for socket connection if not connected
    if (!socketService.isConnected) {
      await new Promise((resolve) => {
        const onConnect = () => {
          socketService?.offConnect(onConnect);
          resolve(true);
        };
        socketService?.onConnect(onConnect);
      });
    }
  }

  if (!activeRoom) {
    return;
  }

  try {
    // Set loading state before requesting chat history
    useRoomStore.getState().setChatHistoryLoading(true);

    // Join the room via socket
    await socketService.joinRoom(activeRoom.id);

    // Set up real-time location listeners
    socketService.onRoomLocations((data) => {
      data.locations.forEach(locationData => {
        useRoomStore.getState().updateUserLocation(locationData);
      });
    });

    socketService.onUserOffline((data) => {
      useRoomStore.getState().removeUserLocation(data.userId);
    });

    // Set up chat listeners
    socketService.onNewMessage((message) => {
      useRoomStore.getState().addChatMessage(message);
    });

    socketService.onChatHistory((data) => {
      useRoomStore.getState().setChatMessages(data.messages);
      useRoomStore.getState().setChatHistoryLoading(false);
    });

    // Request chat history for the active room
    socketService.requestChatHistory(activeRoom.id);

  } catch (error) {
    console.warn('Failed to setup active room socket connection:', error);
    useRoomStore.getState().setChatHistoryLoading(false);
  }
};