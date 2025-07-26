import { create } from 'zustand';
import { NavigationState, NavigationRoute, NavigationProgress, NavigationLocation } from '@/types';
import { calculateDistance } from '@/services/mapboxService';

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
      progress: {
        distanceRemaining: route.distance,
        durationRemaining: route.duration,
        distanceTraveled: 0,
        fractionTraveled: 0,
        currentStepIndex: 0,
        currentStep: route.steps[0] || null,
        nextStep: route.steps[1] || null,
        upcomingStep: route.steps[2] || null,
      },
    });
  },

  toggleMute: () =>
    set(state => ({ isMuted: !state.isMuted })),

  pauseNavigation: () => {
    set({ isPaused: true });
  },

  resumeNavigation: () => {
    set({ isPaused: false });
  },

  stopNavigation: () => {
    set({
      isNavigating: false,
      isPaused: false,
      route: null,
      progress: null,
      currentLocation: null,
    });
  },

  updateLocation: (location) => {
    const state = get();
    set({ currentLocation: location });
    
    // Calculate navigation progress if we're actively navigating
    if (state.isNavigating && state.route && state.progress && location) {
      const { latitude, longitude } = location;
      const currentStep = state.progress.currentStep;
      
      if (currentStep) {
        // Calculate distance to next maneuver
        const maneuverLocation = currentStep.maneuver.location;
        const distanceToManeuver = calculateDistance(
          latitude,
          longitude,
          maneuverLocation[1], // lat
          maneuverLocation[0]  // lng
        );

        // Check if we should advance to next step (within 20 meters of maneuver)
        let newProgress = { ...state.progress };
        
        if (distanceToManeuver < 20 && state.progress.currentStepIndex < state.route.steps.length - 1) {
          const newStepIndex = state.progress.currentStepIndex + 1;
          newProgress = {
            ...state.progress,
            currentStepIndex: newStepIndex,
            distanceTraveled: state.progress.distanceTraveled + currentStep.distance,
            fractionTraveled: (state.progress.distanceTraveled + currentStep.distance) / state.route.distance,
            currentStep: state.route.steps[newStepIndex] || null,
            nextStep: state.route.steps[newStepIndex + 1] || null,
            upcomingStep: state.route.steps[newStepIndex + 2] || null,
          };
        }

        // Update remaining distance and duration
        const totalDistanceRemaining = state.route.steps
          .slice(newProgress.currentStepIndex)
          .reduce((sum, step) => sum + step.distance, 0) - distanceToManeuver;
        
        const totalDurationRemaining = state.route.steps
          .slice(newProgress.currentStepIndex)
          .reduce((sum, step) => sum + step.duration, 0);

        newProgress = {
          ...newProgress,
          distanceRemaining: Math.max(0, totalDistanceRemaining),
          durationRemaining: Math.max(0, totalDurationRemaining),
        };

        set({ progress: newProgress });
      }
    }
  },

  updateProgress: (progress) => {
    const { route } = get();
    if (!route) return;

    const updatedProgress = {
      ...progress,
      currentStep: route.steps[progress.currentStepIndex] || null,
      nextStep: route.steps[progress.currentStepIndex + 1] || null,
      upcomingStep: route.steps[progress.currentStepIndex + 2] || null,
    };

    set({ progress: updatedProgress });
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
      isPaused: false,
      route: null,
      progress: null,
      currentLocation: null, // Also clear current location
      isMuted: false, // Reset mute state
    });
  },

  // Reset all navigation state to initial values
  resetNavigation: () => {
    set({
      isNavigating: false,
      isPaused: false,
      route: null,
      progress: null,
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