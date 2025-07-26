import { create } from 'zustand';
import { LocationStore } from '@/types';

export const useLocationStore = create<LocationStore>((set, get) => ({
  currentLocation: null,
  selectedPlace: null,
  isBottomSheetOpen: false,
  isLocationLoading: false,
  
  setCurrentLocation: (location) => set({ currentLocation: location }),
  
  setSelectedPlace: (place) => {
    const currentPlace = get().selectedPlace;
    // Only update if the place actually changed
    if (JSON.stringify(place) !== JSON.stringify(currentPlace)) {
      set({ 
        selectedPlace: place,
        isBottomSheetOpen: !!place 
      });
    }
  },
  
  setBottomSheetOpen: (isOpen) => set({ isBottomSheetOpen: isOpen }),
  
  setLocationLoading: (isLoading) => set({ isLocationLoading: isLoading }),
  
  // Helper methods to get current state without causing re-renders
  getCurrentLocation: () => get().currentLocation,
  getSelectedPlace: () => get().selectedPlace,
  getLocationLoadingState: () => get().isLocationLoading,
}));