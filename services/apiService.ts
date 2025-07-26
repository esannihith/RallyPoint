import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  code?: string;
}

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@wemaps_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async signIn(name: string, password: string) {
    return this.makeRequest<{
      user: any;
      token: string;
      isNewUser: boolean;
    }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
    });
  }

  async signUp(name: string, password: string) {
    return this.makeRequest<{
      user: any;
      token: string;
    }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
    });
  }

  async getMe() {
    return this.makeRequest<{ user: any }>('/auth/me');
  }

  async updateMe(data: { name?: string; email?: string }) {
    return this.makeRequest<{ user: any }>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Room endpoints
  async createRoom(data: {
    name: string;
    destinationName: string;
    destinationLat: number;
    destinationLng: number;
    maxMembers?: number;
    expiresIn?: number;
  }) {
    return this.makeRequest<{ room: any }>('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinRoom(roomCode: string, nickname?: string) {
    return this.makeRequest<{
      room: any;
      member: any;
      isRejoining: boolean;
    }>('/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode, nickname }),
    });
  }

  async leaveRoom(roomId: string) {
    return this.makeRequest<{ message: string }>(`/rooms/${roomId}/leave`, {
      method: 'POST',
    });
  }

  async getRoomDetails(roomId: string) {
    return this.makeRequest<{ room: any }>(`/rooms/${roomId}`);
  }

  async getUserRooms() {
    return this.makeRequest<{ rooms: any[] }>('/rooms');
  }
}

export const apiService = new ApiService();
export default apiService;