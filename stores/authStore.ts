import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStore, User } from '@/types/auth';
import { apiService } from '@/services/apiService';
import { socketService } from '@/services/socketService';

const STORAGE_KEYS = {
  TOKEN: '@wemaps_token',
  USER: '@wemaps_user',
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  signIn: async (name: string, password: string) => {
    set({ isLoading: true });
    
    try {
      const response = await apiService.signIn(name, password);
      
      // Store token and user data locally
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        isLoading: false 
      });

      // Connect to socket
      try {
        await socketService.connect(response.token);
      } catch (socketError) {
        console.warn('Socket connection failed:', socketError);
        // Don't fail the sign-in if socket connection fails
      }

    } catch (error) {
      set({ isLoading: false });
      
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('Network request failed')) {
          throw new Error('Unable to connect to server. Please check your internet connection and try again.');
        } else {
          throw error;
        }
      } else {
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  signUp: async (name: string, password: string) => {
    set({ isLoading: true });
    
    try {
      const response = await apiService.signUp(name, password);
      
      // Store token and user data locally
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        isLoading: false 
      });

      // Connect to socket
      try {
        await socketService.connect(response.token);
      } catch (socketError) {
        console.warn('Socket connection failed:', socketError);
        // Don't fail the sign-up if socket connection fails
      }

    } catch (error) {
      set({ isLoading: false });
      
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('Network request failed')) {
          throw new Error('Unable to connect to server. Please check your internet connection and try again.');
        } else {
          throw error;
        }
      } else {
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  signOut: async () => {
    try {
      // Disconnect socket
      socketService.disconnect();
      
      // Clear storage
      await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
      
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },

  loadUser: async () => {
    // Don't load if already loading or already authenticated
    const currentState = get();
    if (currentState.isLoading || currentState.isAuthenticated) {
      return;
    }
    
    set({ isLoading: true });
    
    try {
      const [token, userData] = await AsyncStorage.multiGet([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER,
      ]);

      const tokenValue = token[1];
      const userValue = userData[1];
      
      if (tokenValue && userValue) {
        const user: User = JSON.parse(userValue);
        
        // Verify token is still valid by making a request
        try {
          const response = await apiService.getMe();
          
          set({ 
            user: response.user, 
            isAuthenticated: true, 
            isLoading: false 
          });

          // Connect to socket
          try {
            await socketService.connect(tokenValue);
          } catch (socketError) {
            console.warn('Socket connection failed during load:', socketError);
          }
          
        } catch (apiError) {
          // Token is invalid, clear storage
          await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false 
          });
        }
      } else {
        set({ 
          user: null,
          isAuthenticated: false,
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Load user error:', error);
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },

  updateUser: async (data: { name?: string; email?: string }) => {
    try {
      const response = await apiService.updateMe(data);
      
      // Update stored user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      
      set({ user: response.user });
      
      return response.user;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },

  getToken: async () => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  },
}));

// Initialize the store by loading user on first import
useAuthStore.getState().loadUser();