import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TabNavigationStore {
  // Track last active route within rooms tab
  lastRoomsRoute: string;
  
  // Track navigation history within rooms tab specifically
  roomsNavigationHistory: string[];
  
  // Track if user explicitly navigated back from room-map to index
  userExplicitlyReturnedToIndex: boolean;
  
  // Actions
  setLastRoomsRoute: (route: string) => void;
  pushRoomsHistory: (route: string) => void;
  popRoomsHistory: () => string | null;
  clearRoomsHistory: () => void;
  getPreferredRoomsRoute: () => string;
  setUserExplicitlyReturnedToIndex: (value: boolean) => void;
  resetRoomsNavigation: () => void;
}

export const useTabNavigationStore = create<TabNavigationStore>()(
  persist(
    (set, get) => ({
      lastRoomsRoute: '/(tabs)/rooms',
      roomsNavigationHistory: [],
      userExplicitlyReturnedToIndex: false,
      
      setLastRoomsRoute: (route: string) => {
        set({ lastRoomsRoute: route });
      },
      
      pushRoomsHistory: (route: string) => {
        set(state => ({
          roomsNavigationHistory: [...state.roomsNavigationHistory, route]
        }));
      },
      
      popRoomsHistory: () => {
        const state = get();
        if (state.roomsNavigationHistory.length === 0) return null;
        
        const history = [...state.roomsNavigationHistory];
        const lastRoute = history.pop();
        
        set({ roomsNavigationHistory: history });
        return lastRoute || null;
      },
      
      clearRoomsHistory: () => {
        set({ roomsNavigationHistory: [] });
      },
      
      getPreferredRoomsRoute: () => {
        const state = get();
        
        // If user explicitly returned to index, prefer index
        if (state.userExplicitlyReturnedToIndex) {
          return '/(tabs)/rooms';
        }
        
        // Otherwise, return the last active route
        return state.lastRoomsRoute;
      },
      
      setUserExplicitlyReturnedToIndex: (value: boolean) => {
        set({ userExplicitlyReturnedToIndex: value });
      },
      
      resetRoomsNavigation: () => {
        set({
          lastRoomsRoute: '/(tabs)/rooms',
          roomsNavigationHistory: [],
          userExplicitlyReturnedToIndex: false,
        });
      },
    }),
    {
      name: 'tab-navigation-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastRoomsRoute: state.lastRoomsRoute,
        userExplicitlyReturnedToIndex: state.userExplicitlyReturnedToIndex,
      }),
    }
  )
);
