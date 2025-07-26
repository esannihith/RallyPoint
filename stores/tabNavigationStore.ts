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
  popRoomsHistory: () => string | undefined; // Corrected return type
  clearRoomsHistory: () => void;
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
        set((state) => ({
          roomsNavigationHistory: [...state.roomsNavigationHistory, route],
        }));
      },

      // Refined for better immutability and clarity
      popRoomsHistory: () => {
        const history = get().roomsNavigationHistory;
        if (history.length === 0) return undefined;

        const lastRoute = history[history.length - 1];
        set({ roomsNavigationHistory: history.slice(0, -1) }); // Use slice for immutability
        return lastRoute;
      },

      clearRoomsHistory: () => {
        set({ roomsNavigationHistory: [] });
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
      // This part is well-designed, only persisting what's necessary
      partialize: (state) => ({
        lastRoomsRoute: state.lastRoomsRoute,
        userExplicitlyReturnedToIndex: state.userExplicitlyReturnedToIndex,
      }),
    }
  )
);