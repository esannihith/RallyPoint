import { create } from 'zustand';
import { NavigationState, NavigationRoute, NavigationProgress, NavigationLocation } from '@/types';

export const useNavigationStore = create<NavigationState>((set, get) => ({
  isNavigating: false,
  isPaused: false,
  route: null,
  progress: null,
  currentLocation: null,
  isMuted: false,
  
  
  // Directions mode properties
  fromLocation: null,
  toLocation: null,
  isDirectionsMode: false,

  startNavigation: (route: NavigationRoute) => {
    set({
      isNavigating: true,
      isPaused: false,
      route,
    });
  },

  toggleMute: () =>
    set(state => ({ isMuted: !state.isMuted })),

  pauseNavigation: () => {
    set({ isPaused: true });
  },

  stopNavigation: () => {
    set({
      isNavigating: false,
      isPaused: false,
      route: null,
      currentLocation: null,
    });
  },

  updateLocation: (location) => {
    const state = get();
    set({ currentLocation: location });
    // Calculate navigation progress if we're actively navigating
  },

  updateProgress: (newProgress: NavigationProgress) => {
    set(state => ({
      progress: { ...state.progress, ...newProgress }
    }));
  },

  // Directions actions
  setFromLocation: (location: NavigationLocation | null) => {
    set({ fromLocation: location });
  },

  setToLocation: (location: NavigationLocation | null) => {
    set({ toLocation: location });
  },

  swapLocations: () => {
    const { fromLocation, toLocation } = get();
    set({
      fromLocation: toLocation,
      toLocation: fromLocation,
    });
  },

  clearNavigation: () => {
    set({
      fromLocation: null,
      toLocation: null,
      isDirectionsMode: false,
      isNavigating: false,
      route: null,
      currentLocation: null, // Also clear current location
      isMuted: false, // Reset mute state
    });
  },

  // Reset all navigation state to initial values
  resetNavigation: () => {
    set({
      isNavigating: false,
      route: null,
      currentLocation: null,
      isMuted: false,
      fromLocation: null,
      toLocation: null,
      isDirectionsMode: false,
    });
  },

  setDirectionsMode: (enabled: boolean) => {
    set({ isDirectionsMode: enabled });
  },

  canGetDirections: () => {
    const { fromLocation, toLocation } = get();
    return !!(fromLocation && toLocation);
  },

  getFromLocation: () => {
    return get().fromLocation;
  },

  getToLocation: () => {
    return get().toLocation;
  },

  getDirectionsMode: () => {
    return get().isDirectionsMode;
  },
}));