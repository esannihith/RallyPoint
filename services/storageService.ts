import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedPlace } from '@/types';

const STORAGE_KEYS = {
  SAVED_PLACES: '@wemaps_saved_places',
  RECENT_SEARCHES: '@wemaps_recent_searches',
  USER_LOCATION: '@wemaps_user_location',
} as const;

export interface StoredLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

/**
 * Save a place to saved places
 */
export const savePlaceToStorage = async (place: SavedPlace): Promise<void> => {
  try {
    const existingPlaces = await getSavedPlaces();
    const updatedPlaces = [
      place,
      ...existingPlaces.filter(p => p.id !== place.id)
    ].slice(0, 20); // Keep only 20 saved places
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.SAVED_PLACES, 
      JSON.stringify(updatedPlaces)
    );
  } catch (error) {
    console.error('Error saving place:', error);
  }
};

/**
 * Get saved places from storage
 */
export const getSavedPlaces = async (): Promise<SavedPlace[]> => {
  try {
    const places = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_PLACES);
    return places ? JSON.parse(places) : [];
  } catch (error) {
    console.error('Error getting saved places:', error);
    return [];
  }
};

/**
 * Remove a saved place
 */
export const removeSavedPlace = async (placeId: string): Promise<void> => {
  try {
    const existingPlaces = await getSavedPlaces();
    const updatedPlaces = existingPlaces.filter(p => p.id !== placeId);
    await AsyncStorage.setItem(
      STORAGE_KEYS.SAVED_PLACES, 
      JSON.stringify(updatedPlaces)
    );
  } catch (error) {
    console.error('Error removing saved place:', error);
  }
};

/**
 * Add to recent searches
 */
export const addToRecentSearches = async (place: SavedPlace): Promise<void> => {
  try {
    const existingSearches = await getRecentSearches();
    const updatedSearches = [
      { ...place, type: 'recent' as const },
      ...existingSearches.filter(p => p.id !== place.id)
    ].slice(0, 10); // Keep only 10 recent searches
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.RECENT_SEARCHES, 
      JSON.stringify(updatedSearches)
    );
  } catch (error) {
    console.error('Error adding to recent searches:', error);
  }
};

/**
 * Get recent searches from storage
 */
export const getRecentSearches = async (): Promise<SavedPlace[]> => {
  try {
    const searches = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
    return searches ? JSON.parse(searches) : [];
  } catch (error) {
    console.error('Error getting recent searches:', error);
    return [];
  }
};

/**
 * Clear recent searches
 */
export const clearRecentSearches = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
  } catch (error) {
    console.error('Error clearing recent searches:', error);
  }
};

/**
 * Save user's last known location
 */
export const saveUserLocation = async (location: { latitude: number; longitude: number }): Promise<void> => {
  try {
    const locationData: StoredLocation = {
      ...location,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_LOCATION, 
      JSON.stringify(locationData)
    );
  } catch (error) {
    console.error('Error saving user location:', error);
  }
};

/**
 * Get user's last known location
 */
export const getUserLocation = async (): Promise<StoredLocation | null> => {
  try {
    const location = await AsyncStorage.getItem(STORAGE_KEYS.USER_LOCATION);
    if (location) {
      const parsed = JSON.parse(location);
      // Return location if it's less than 24 hours old
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting user location:', error);
    return null;
  }
};

/**
 * Clear all stored data
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.SAVED_PLACES,
      STORAGE_KEYS.RECENT_SEARCHES,
      STORAGE_KEYS.USER_LOCATION,
    ]);
  } catch (error) {
    console.error('Error clearing all data:', error);
  }
};