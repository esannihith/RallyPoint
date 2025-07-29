import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X /*, Bug*/ } from 'lucide-react-native';
import { router } from 'expo-router';
import { useLocationStore, useRoomStore } from '@/stores';
import { PlaceDetailsBottomSheet } from '@/components/map';
import { FloatingActionButtons } from '@/components/ui';
// import { ApiDebugScreen } from '@/components/debug/ApiDebugScreen';
import { saveUserLocation, getUserLocation } from '@/services/storageService';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';

// India's center coordinates
const INDIA_CENTER = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 15.0,
  longitudeDelta: 15.0,
};

// Helper function to check if two regions are significantly different
const isRegionDifferent = (region1: any, region2: any, threshold = 0.001) => {
  if (!region1 || !region2) return true;
  
  return (
    Math.abs(region1.latitude - region2.latitude) > threshold ||
    Math.abs(region1.longitude - region2.longitude) > threshold ||
    Math.abs(region1.latitudeDelta - region2.latitudeDelta) > threshold ||
    Math.abs(region1.longitudeDelta - region2.longitudeDelta) > threshold
  );
};

export default function HomeScreen() {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState(INDIA_CENTER);
  // const [showDebugScreen, setShowDebugScreen] = useState(false);
  const locationRequestInProgress = useRef(false);
  const lastAnimatedRegion = useRef<any>(null);
  const selectedPlaceRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  
  const { 
    setCurrentLocation, 
    selectedPlace, 
    setSelectedPlace,
    isLocationLoading,
    setLocationLoading,
    getSelectedPlace,
    setBottomSheetOpen,
    isBottomSheetOpen
  } = useLocationStore();

  const { setChatOpen, resetUnreadCount } = useRoomStore();

  // Android back handler
  useAndroidBackHandler({
    onBackPress: () => {
      if (isBottomSheetOpen) {
        // Close bottom sheet if open
        setSelectedPlace(null);
        setBottomSheetOpen(false);
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    }
  });

  useEffect(() => {
    const initLocation = async () => {
      try {
        // First try to get cached location
        const cachedLocation = await getUserLocation();
        if (cachedLocation) {
          const newRegion = {
            latitude: cachedLocation.latitude,
            longitude: cachedLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          
          setCurrentLocation({
            latitude: cachedLocation.latitude,
            longitude: cachedLocation.longitude,
          });
          
          // Only update if significantly different
          if (isRegionDifferent(newRegion, region)) {
            setRegion(newRegion);
            if (mapRef.current && isRegionDifferent(newRegion, lastAnimatedRegion.current)) {
              lastAnimatedRegion.current = newRegion;
              // Use setTimeout to break out of the render cycle
              setTimeout(() => {
                if (mapRef.current) {
                  mapRef.current.animateToRegion(newRegion, 1000);
                }
              }, 0);
            }
          }
          return;
        }

        // If no cached location, try to get current location
        if (!locationRequestInProgress.current && !isLocationLoading) {
          locationRequestInProgress.current = true;
          setLocationLoading(true);

          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                'Permission Denied',
                'Location permission is required to show your current location on the map.'
              );
              return;
            }

            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });

            const newLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };

            const newRegion = {
              ...newLocation,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };

            // Update store
            setCurrentLocation(newLocation);
            
            // Save to storage for future use
            await saveUserLocation(newLocation);

            // Only update map if region is significantly different
            if (isRegionDifferent(newRegion, region)) {
              setRegion(newRegion);
              if (mapRef.current && isRegionDifferent(newRegion, lastAnimatedRegion.current)) {
                lastAnimatedRegion.current = newRegion;
                // Use setTimeout to break out of the render cycle
                setTimeout(() => {
                  if (mapRef.current) {
                    mapRef.current.animateToRegion(newRegion, 1000);
                  }
                }, 0);
              }
            }

          } catch (locationError) {
            console.error('Error getting location:', locationError);
            Alert.alert('Error', 'Failed to get your current location. Please try again.');
          } finally {
            locationRequestInProgress.current = false;
            setLocationLoading(false);
          }
        }
      } catch (error) {
        console.error('Error initializing location:', error);
      }
    };
    
    initLocation();
    // Don't clear navigation state on mount - only on explicit user action
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safe animation function that runs outside React's render phase
  const animateMapSafely = useCallback((newRegion: Region) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  }, []);

  // Animate to selected place when it changes - with deep equality check
  useEffect(() => {
    const currentPlace = getSelectedPlace();
    
    // Check if selectedPlace actually changed
    if (JSON.stringify(currentPlace) === JSON.stringify(selectedPlaceRef.current)) {
      return; // No change, skip animation
    }
    
    selectedPlaceRef.current = currentPlace;
    
    if (currentPlace && currentPlace.geometry?.location && mapRef.current) {
      const newRegion = {
        latitude: currentPlace.geometry.location.lat,
        longitude: currentPlace.geometry.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      // Only animate if the region is significantly different
      if (isRegionDifferent(newRegion, lastAnimatedRegion.current)) {
        lastAnimatedRegion.current = newRegion;
        // Use setTimeout to break out of the render cycle
        setTimeout(() => {
          animateMapSafely(newRegion);
        }, 0);
      }
    }
  }, [selectedPlace, getSelectedPlace, animateMapSafely]);

  const getCurrentLocationSafely = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (locationRequestInProgress.current || isLocationLoading) {
      return;
    }

    locationRequestInProgress.current = true;
    setLocationLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to show your current location on the map.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      const newRegion = {
        ...newLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      // Update store
      setCurrentLocation(newLocation);
      
      // Save to storage for future use
      await saveUserLocation(newLocation);

      // Only update map if region is significantly different
      if (isRegionDifferent(newRegion, region)) {
        setRegion(newRegion);
        if (mapRef.current && isRegionDifferent(newRegion, lastAnimatedRegion.current)) {
          lastAnimatedRegion.current = newRegion;
          // Use setTimeout to break out of the render cycle
          setTimeout(() => {
            animateMapSafely(newRegion);
          }, 0);
        }
      }

    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
    } finally {
      locationRequestInProgress.current = false;
      setLocationLoading(false);
    }
  }, [isLocationLoading, setCurrentLocation, setLocationLoading, region, animateMapSafely]);

  const handleSearchPress = useCallback(() => {
    router.push('/search');
  }, []);

  const handleMyLocationPress = useCallback(() => {
    // Prevent multiple rapid taps
    if (locationRequestInProgress.current || isLocationLoading) {
      return;
    }
    getCurrentLocationSafely();
  }, [getCurrentLocationSafely, isLocationLoading]);

  const handleDirectionsPress = useCallback(() => {
    router.push('/(tabs)/home/directions');
  }, []);

  const handleChatPress = useCallback(() => {
    setChatOpen(true);
    resetUnreadCount();
  }, [setChatOpen, resetUnreadCount]);

  const handleClearSelectedPlace = useCallback(() => {
    setSelectedPlace(null);
    setBottomSheetOpen(false);
  }, [setSelectedPlace, setBottomSheetOpen]);

  const handleRegionChange = useCallback((newRegion: typeof region) => {
    // Only update if significantly different to prevent unnecessary re-renders
    if (isRegionDifferent(newRegion, region, 0.0001)) {
      setRegion(newRegion);
    }
  }, [region]);

  // Helper function to get display address
  const getDisplayAddress = (place: any) => {
    if (place.formatted_address) {
      return place.formatted_address;
    }
    if (place.vicinity) {
      return place.vicinity;
    }
    return place.name || 'Unknown location';
  };

  // Memoize the selected place to prevent unnecessary marker re-renders
  const selectedPlaceMarker = React.useMemo(() => {
    const place = getSelectedPlace();
    if (place && place.geometry?.location) {
      return (
        <Marker
          coordinate={{
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          }}
          title={place.name}
          description={place.formatted_address}
          pinColor="#FF5722"
        />
      );
    }
    return null;
  }, [getSelectedPlace, selectedPlace]);

  const currentPlace = getSelectedPlace();

  // Calculate dynamic bottom padding based on tab bar height and safe area
  const tabBarHeight = Platform.select({
    ios: 88,
    android: 68 + insets.bottom,
    default: 68,
  });

  const mapBottomPadding = tabBarHeight + 20; // Add extra padding for floating buttons

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
        userLocationPriority="high"
        userLocationUpdateInterval={5000}
        userLocationFastestInterval={2000}
        followsUserLocation={false}
        userLocationAnnotationTitle="Your Location"
        moveOnMarkerPress={false}
        loadingEnabled={true}
        loadingIndicatorColor="#1976D2"
        loadingBackgroundColor="#FFFFFF"
        mapPadding={{ 
          top: 0, 
          right: 0, 
          bottom: mapBottomPadding,
          left: 0 
        }}
      >
        {selectedPlaceMarker}
      </MapView>

      {/* Search Container - Fixed positioning */}
      <View style={[styles.overlayContainer, { paddingTop: insets.top }]} pointerEvents="box-none">
        <View style={styles.searchContainer}>
          {currentPlace ? (
            <View style={styles.selectedPlaceContainer}>
              <Text style={styles.selectedPlaceAddress} numberOfLines={1}>
                {getDisplayAddress(currentPlace)}
              </Text>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearSelectedPlace}
                activeOpacity={0.7}
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.searchBar}
              onPress={handleSearchPress}
              activeOpacity={0.8}
            >
              <Search size={20} color="#374151" style={styles.searchIcon} />
              <Text style={styles.searchPlaceholder}>Search places in India</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Floating Action Buttons */}
        <FloatingActionButtons
          showMyLocation={true}
          showDirections={true}
          onMyLocationPress={handleMyLocationPress}
          onDirectionsPress={handleDirectionsPress}
          isMyLocationLoading={isLocationLoading}
        />
      </View>

      {/* Place Details Bottom Sheet - only show when open and place selected */}
      {(isBottomSheetOpen && currentPlace) ? <PlaceDetailsBottomSheet /> : null}

      {/* Debug Screen Modal - Commented out for production
      <Modal
        visible={showDebugScreen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDebugScreen(false)}
      >
        <View style={styles.debugModal}>
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>API Debug</Text>
            <TouchableOpacity onPress={() => setShowDebugScreen(false)}>
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <ApiDebugScreen />
        </View>
      </Modal>
      */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 50,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#6B7280',
  },
  selectedPlaceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingLeft: 20,
    paddingRight: 8,
    height: 50,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedPlaceAddress: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginRight: 12,
  },
  clearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  map: {
    flex: 1,
  },
  /* Debug Modal Styles - Commented out for production
  debugModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  */
});
