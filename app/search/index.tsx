import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, X } from 'lucide-react-native';
import { useLocationStore } from '@/stores/locationStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useCallbackStore } from '@/stores/callbackStore';
import { searchPlaces, getPlaceDetails } from '@/services/googleMapsService';
import { SearchResults, PlacesList } from '@/components/search';
import { AutocompletePrediction, SavedPlace, NavigationLocation } from '@/types';
import { 
  getSavedPlaces, 
  getRecentSearches, 
  addToRecentSearches,
  savePlaceToStorage,
  removeSavedPlace,
  clearRecentSearches
} from '@/services/storageService';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';
import * as Network from 'expo-network';
import InternetToast from '@/components/ui/InternetToast'

export default function SearchScreen() {
  const params = useLocalSearchParams();
  const isDirectionsMode = params.mode === 'directions';
  const isRoomDestinationMode = params.mode === 'room_destination';
  const inputType = params.inputType as 'from' | 'to' | undefined;
  const returnTo = params.returnTo as string | undefined;
  const callbackId = params.callbackId as string | undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [recentSearches, setRecentSearches] = useState<SavedPlace[]>([]);
  const [isLoadingPlaceDetails, setIsLoadingPlaceDetails] = useState(false);
  const [showNoInternet, setShowNoInternet] = useState(false);
  
  const { setSelectedPlace, setBottomSheetOpen } = useLocationStore();
  const { setFromLocation, setToLocation } = useNavigationStore();
  const { executeCallback } = useCallbackStore();

  // Android back handler
  useAndroidBackHandler({
    onBackPress: () => {
      handleBack();
      return true; // Prevent default back behavior
    }
  });

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [saved, recent] = await Promise.all([
        getSavedPlaces(),
        getRecentSearches()
      ]);
      setSavedPlaces(saved);
      setRecentSearches(recent);
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };

  // Debounced search function
  const debouncedSearch = React.useMemo(
    () => debounce(async (query: string) => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }
      // Check internet connectivity
      const netState = await Network.getNetworkStateAsync();
      if (!netState.isConnected) {
        setShowNoInternet(true);
        setIsLoading(false);
        setTimeout(() => setShowNoInternet(false), 2000);
        return;
      }
      try {
        const results = await searchPlaces(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setIsLoading(true);
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
      setIsLoading(false);
    }
  }, [searchQuery, debouncedSearch]);

  const handlePlaceSelect = async (prediction: AutocompletePrediction) => {
    // Check internet connectivity
    const netState = await Network.getNetworkStateAsync();
    if (!netState.isConnected) {
      setShowNoInternet(true);
      setTimeout(() => setShowNoInternet(false), 2000);
      return;
    }
    try {
      Keyboard.dismiss();
      
      // Get detailed place information
      const placeDetails = await getPlaceDetails(prediction.place_id);
      
      if (isDirectionsMode && inputType) {
        // Handle directions mode
        const navigationLocation: NavigationLocation = {
          id: prediction.place_id,
          name: prediction.structured_formatting.main_text,
          address: prediction.description,
          latitude: placeDetails?.geometry?.location.lat,
          longitude: placeDetails?.geometry?.location.lng,
          placeId: prediction.place_id,
        };

        if (inputType === 'from') {
          setFromLocation(navigationLocation);
        } else {
          setToLocation(navigationLocation);
        }

        // Add to recent searches
        const recentPlace: SavedPlace = {
          id: prediction.place_id,
          name: prediction.structured_formatting.main_text,
          address: prediction.description,
          type: 'recent',
          latitude: placeDetails?.geometry?.location.lat,
          longitude: placeDetails?.geometry?.location.lng,
          placeId: prediction.place_id,
          createdAt: Date.now(),
        };
        
        await addToRecentSearches(recentPlace);
        router.back();
      } else if (isRoomDestinationMode && callbackId) {
        // Handle room destination mode with callback
        if (placeDetails?.geometry?.location) {
          // Add to recent searches
          const recentPlace: SavedPlace = {
            id: prediction.place_id,
            name: prediction.structured_formatting.main_text,
            address: prediction.description,
            type: 'recent',
            latitude: placeDetails.geometry.location.lat,
            longitude: placeDetails.geometry.location.lng,
            placeId: prediction.place_id,
            createdAt: Date.now(),
          };
          
          await addToRecentSearches(recentPlace);
          
          // Create destination location object for callback
          const destinationLocation = {
            name: prediction.structured_formatting.main_text,
            address: prediction.description,
            latitude: placeDetails.geometry.location.lat,
            longitude: placeDetails.geometry.location.lng,
            placeId: prediction.place_id,
          };
          
          // Execute callback with selected place data
          executeCallback(callbackId, destinationLocation);
          router.back();
        } else {
          // Fallback without coordinates
          const destinationLocation = {
            name: prediction.structured_formatting.main_text,
            address: prediction.description,
            latitude: 0,
            longitude: 0,
            placeId: prediction.place_id,
          };
          
          executeCallback(callbackId, destinationLocation);
          router.back();
        }
      } else if (isRoomDestinationMode && returnTo) {
        // Fallback to URL params approach for backward compatibility
        if (placeDetails?.geometry?.location) {
          // Add to recent searches
          const recentPlace: SavedPlace = {
            id: prediction.place_id,
            name: prediction.structured_formatting.main_text,
            address: prediction.description,
            type: 'recent',
            latitude: placeDetails.geometry.location.lat,
            longitude: placeDetails.geometry.location.lng,
            placeId: prediction.place_id,
            createdAt: Date.now(),
          };
          
          await addToRecentSearches(recentPlace);
          
          // Navigate back to create room screen with place data
          router.push({
            pathname: '/room-flows/create',
            params: {
              placeName: prediction.structured_formatting.main_text,
              placeAddress: prediction.description,
              latitude: placeDetails.geometry.location.lat.toString(),
              longitude: placeDetails.geometry.location.lng.toString(),
              placeId: prediction.place_id,
            }
          });
        } else {
          // Fallback without coordinates
          router.push({
            pathname: '/room-flows/create',
            params: {
              placeName: prediction.structured_formatting.main_text,
              placeAddress: prediction.description,
              placeId: prediction.place_id,
            }
          });
        }
      } else {
        // Handle regular search mode
        if (placeDetails) {
          setSelectedPlace(placeDetails);
          setBottomSheetOpen(true);
          
          // Add to recent searches
          const recentPlace: SavedPlace = {
            id: prediction.place_id,
            name: prediction.structured_formatting.main_text,
            address: prediction.description,
            type: 'recent',
            latitude: placeDetails.geometry?.location.lat,
            longitude: placeDetails.geometry?.location.lng,
            placeId: prediction.place_id,
            createdAt: Date.now(),
          };
          
          await addToRecentSearches(recentPlace);
          await loadStoredData();
        } else {
          // Fallback: create a basic place object from prediction
          const basicPlace = {
            place_id: prediction.place_id,
            name: prediction.structured_formatting.main_text,
            formatted_address: prediction.description,
            geometry: undefined,
          };
          setSelectedPlace(basicPlace);
          setBottomSheetOpen(true);
          
          // Still add to recent searches
          const recentPlace: SavedPlace = {
            id: prediction.place_id,
            name: prediction.structured_formatting.main_text,
            address: prediction.description,
            type: 'recent',
            placeId: prediction.place_id,
            createdAt: Date.now(),
          };
          
          await addToRecentSearches(recentPlace);
          await loadStoredData();
        }
        
        router.back();
      }
    } catch (error) {
      console.error('Error selecting place:', error);
      router.back();
    }
  };

  const handleSavedPlaceSelect = async (place: SavedPlace) => {
    try {
      setIsLoadingPlaceDetails(true);
      
      // Fetch full place details using placeId or coordinates
      let placeDetails = null;
      
      if (place.placeId) {
        // Try to get fresh details from Google using placeId
        placeDetails = await getPlaceDetails(place.placeId);
      }
      
      if (isDirectionsMode && inputType) {
        // Handle directions mode
        const navigationLocation: NavigationLocation = {
          id: place.id,
          name: place.name,
          address: place.address,
          latitude: place.latitude || placeDetails?.geometry?.location.lat,
          longitude: place.longitude || placeDetails?.geometry?.location.lng,
          placeId: place.placeId,
        };

        if (inputType === 'from') {
          setFromLocation(navigationLocation);
        } else {
          setToLocation(navigationLocation);
        }

        router.back();
      } else if (isRoomDestinationMode && callbackId) {
        // Handle room destination mode with callback
        const latitude = place.latitude || placeDetails?.geometry?.location.lat;
        const longitude = place.longitude || placeDetails?.geometry?.location.lng;
        
        // Create destination location object for callback
        const destinationLocation = {
          name: place.name,
          address: place.address,
          latitude: latitude || 0,
          longitude: longitude || 0,
          placeId: place.placeId || place.id,
        };
        
        // Execute callback with selected place data
        executeCallback(callbackId, destinationLocation);
        router.back();
      } else if (isRoomDestinationMode && returnTo) {
        // Fallback to URL params approach for backward compatibility
        const latitude = place.latitude || placeDetails?.geometry?.location.lat;
        const longitude = place.longitude || placeDetails?.geometry?.location.lng;
        
        if (latitude && longitude) {
          // Navigate back to create room screen with place data
          router.push({
            pathname: '/room-flows/create',
            params: {
              placeName: place.name,
              placeAddress: place.address,
              latitude: latitude.toString(),
              longitude: longitude.toString(),
              placeId: place.placeId || place.id,
            }
          });
        } else {
          // Fallback without coordinates
          router.push({
            pathname: '/room-flows/create',
            params: {
              placeName: place.name,
              placeAddress: place.address,
              placeId: place.placeId || place.id,
            }
          });
        }
      } else {
        // Handle regular search mode
        if (placeDetails) {
          // Use fresh API data
          setSelectedPlace(placeDetails);
          setBottomSheetOpen(true);
        } else if (place.latitude && place.longitude) {
          // Use stored coordinates to create place data
          const placeData = {
            place_id: place.id,
            name: place.name,
            formatted_address: place.address,
            geometry: {
              location: {
                lat: place.latitude,
                lng: place.longitude,
              }
            },
          };
          
          setSelectedPlace(placeData);
          setBottomSheetOpen(true);
        } else {
          // Basic fallback
          const placeData = {
            place_id: place.id,
            name: place.name,
            formatted_address: place.address,
            geometry: undefined,
          };
          setSelectedPlace(placeData);
          setBottomSheetOpen(true);
        }
        
        // Add to recent searches if it's not already recent
        if (place.type !== 'recent') {
          const recentPlace: SavedPlace = {
            ...place,
            type: 'recent',
            createdAt: Date.now(),
          };
          await addToRecentSearches(recentPlace);
          await loadStoredData();
        }
        
        router.back();
      }
    } catch (error) {
      console.error('Error selecting saved place:', error);
      router.back();
    } finally {
      setIsLoadingPlaceDetails(false);
    }
  };

  const handleSavePlace = async (place: SavedPlace) => {
    try {
      const savedPlace: SavedPlace = {
        ...place,
        type: 'saved',
        createdAt: Date.now(),
      };
      
      await savePlaceToStorage(savedPlace);
      await loadStoredData();
    } catch (error) {
      console.error('Error saving place:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsLoading(false);
  };
  
  const handleRemoveSavedPlace = async (placeId: string) => {
    try {
      await removeSavedPlace(placeId);
      await loadStoredData();
    } catch (error) {
      console.error('Error removing saved place:', error);
    }
  };

  const handleClearRecentSearches = async () => {
    try {
      await clearRecentSearches();
      await loadStoredData();
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  const getPlaceholder = () => {
    if (isDirectionsMode) {
      return inputType === 'from' 
        ? 'Search for starting point' 
        : 'Search for destination';
    }
    return 'Search places in India';
  };

  return (
    <SafeAreaView style={styles.container}>
      {showNoInternet && <InternetToast />}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={getPlaceholder()}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="never"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSearch}
              activeOpacity={0.7}
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {searchQuery.trim().length > 0 ? (
          <SearchResults
            results={searchResults}
            isLoading={isLoading}
            onPlaceSelect={handlePlaceSelect}
            searchQuery={searchQuery}
          />
        ) : (
          <PlacesList
            savedPlaces={savedPlaces}
            recentSearches={recentSearches}
            onPlaceSelect={handleSavedPlaceSelect}
            onSavePlace={!isDirectionsMode ? handleSavePlace : undefined}
            onRemovePlace={handleRemoveSavedPlace}
            onClearRecentSearches={handleClearRecentSearches}
            onViewMore={() => router.push('/search/search-history')}
            showHeaders={true}
            showActionButtons={true}
            showMoreHistoryLink={true}
            maxSavedPlaces={-1}
            maxRecentPlaces={6}
            emptyStateTitle="No saved places yet"
            emptyStateDescription="Search for places and save your favorites for quick access"
          />
        )}
      </ScrollView>

      {/* Loading overlay for place details */}
      {isLoadingPlaceDetails && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading place details...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
});