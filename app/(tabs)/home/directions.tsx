import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  ArrowUpDown, 
  Car, 
  Bike, 
  Bus, 
  PersonStanding 
} from 'lucide-react-native';
import { useNavigationStore } from '@/stores/navigationStore';
import { useLocationStore } from '@/stores/locationStore';
import { DirectionsLocationInput } from '@/components/directions';
import { PlacesList } from '@/components/search';
import { getSavedPlaces, getRecentSearches } from '@/services/storageService';
import { SavedPlace, NavigationLocation } from '@/types';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';


export default function DirectionsScreen() {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [recentSearches, setRecentSearches] = useState<SavedPlace[]>([]);
  const [activeInput, setActiveInput] = useState<'from' | 'to' | null>(null);
  const [selectedMode, setSelectedMode] = useState<'driving' | 'bicycling' | 'transit' | 'walking'>('driving');
  const insets = useSafeAreaInsets();
  
  const {
    fromLocation,
    toLocation,
    setFromLocation,
    setToLocation,
    swapLocations,
    clearNavigation,
    canGetDirections,
  } = useNavigationStore();

  const { currentLocation } = useLocationStore();

  const initializeUserLocation = useCallback(() => {
    if (currentLocation && !fromLocation) {
      const userLocationData: NavigationLocation = {
        id: 'current_location',
        name: 'Your location',
        address: 'Current location',
        latitude: currentLocation.latitude ?? 0,
        longitude: currentLocation.longitude ?? 0,
      };
      setFromLocation(userLocationData);
    }
  }, [currentLocation, fromLocation, setFromLocation]);

  // Android back handler
  useAndroidBackHandler({
    onBackPress: () => {
      handleBack();
      return true; // Prevent default back behavior
    }
  });

  useEffect(() => {
    loadStoredData();
    initializeUserLocation();
  }, [initializeUserLocation]);

  // Auto-route to routes screen when both locations are selected
  useEffect(() => {
    // console.log('LOG: DirectionsScreen: useEffect running');
    // console.log('LOG: DirectionsScreen: canGetDirections() is', canGetDirections());
    if (canGetDirections() && fromLocation && toLocation) {
      // console.log('LOG: DirectionsScreen: Pushing /routes');
      // Small delay to allow UI to update before navigation
      const timer = setTimeout(() => {
        router.push('/(tabs)/home/routes');
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [fromLocation, toLocation, selectedMode, canGetDirections]);

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

  const handleBack = () => {
    // Clear navigation state when going back
    clearNavigation();
    router.back();
  };

  const handleInputPress = (inputType: 'from' | 'to') => {
    setActiveInput(inputType);
    router.push({
      pathname: '/search',
      params: { mode: 'directions', inputType }
    });
  };

  const handlePlaceSelect = (place: SavedPlace) => {
    const navigationLocation: NavigationLocation = {
      id: place.id,
      name: place.name,
      address: place.address,
      latitude: place.latitude ?? 0,
      longitude: place.longitude ?? 0,
      placeId: place.placeId,
    };

    if (!fromLocation) {
      setFromLocation(navigationLocation);
    } else if (!toLocation) {
      setToLocation(navigationLocation);
    } else {
      // If both are filled, replace the last active input or 'to' by default
      if (activeInput === 'from') {
        setFromLocation(navigationLocation);
      } else {
        setToLocation(navigationLocation);
      }
    }
    setActiveInput(null);
  };

  const handleSwap = () => {
    swapLocations();
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Directions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 } // Add bottom safe area padding
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Route Input Section */}
        <View style={styles.routeSection}>
          <View style={styles.routeInputs}>
            {/* From Input */}
            <DirectionsLocationInput
              type="from"
              location={fromLocation as NavigationLocation | null}
              onPress={() => handleInputPress('from')}
              placeholder="Your location"
            />

            {/* Swap Button */}
            <TouchableOpacity
              style={styles.swapButton}
              onPress={handleSwap}
              activeOpacity={0.7}
            >
              <ArrowUpDown size={20} color="#6B7280" />
            </TouchableOpacity>

            {/* To Input */}
            <DirectionsLocationInput
              type="to"
              location={toLocation as NavigationLocation | null}
              onPress={() => handleInputPress('to')}
              placeholder="Choose destination"
            />
          </View>

          {/* Transportation Mode Icons */}
          <View style={styles.transportModes}>
            <TouchableOpacity 
              style={[styles.transportMode, selectedMode === 'driving' && styles.activeTransportMode]}
              onPress={() => setSelectedMode('driving')}
            >
              <Car size={20} color={selectedMode === 'driving' ? "#8B5CF6" : "#6B7280"} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.transportMode, selectedMode === 'bicycling' && styles.activeTransportMode]}
              onPress={() => setSelectedMode('bicycling')}
            >
              <Bike size={20} color={selectedMode === 'bicycling' ? "#8B5CF6" : "#6B7280"} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.transportMode, selectedMode === 'transit' && styles.activeTransportMode]}
              onPress={() => setSelectedMode('transit')}
            >
              <Bus size={20} color={selectedMode === 'transit' ? "#8B5CF6" : "#6B7280"} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.transportMode, selectedMode === 'walking' && styles.activeTransportMode]}
              onPress={() => setSelectedMode('walking')}
            >
              <PersonStanding size={20} color={selectedMode === 'walking' ? "#8B5CF6" : "#6B7280"} />
            </TouchableOpacity>
          </View>

          {/* Auto-routing indicator */}
          {canGetDirections() && (
            <View style={styles.autoRoutingIndicator}>
              <View style={styles.loadingDot} />
              <Text style={styles.autoRoutingText}>Finding routes...</Text>
            </View>
          )}
        </View>

        {/* Saved Places List */}
        <PlacesList
          savedPlaces={savedPlaces}
          recentSearches={recentSearches}
          onPlaceSelect={handlePlaceSelect}
          showHeaders={false}
          showActionButtons={false}
          showMoreHistoryLink={recentSearches.length > 6}
          maxRecentPlaces={6}
          onViewMore={() => {
            // Default to 'to' if no active input specified
            const target = activeInput || (!toLocation ? 'to' : 'from');
            router.push({ 
              pathname: '/search',
              params: { mode: 'directions', inputType: target, view: 'history' } 
            });
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
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
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  routeSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#F9FAFB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  routeInputs: {
    position: 'relative',
    marginBottom: 8,
  },
  swapButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    zIndex: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  transportModes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  transportMode: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 40,
  },
  activeTransportMode: {
    backgroundColor: '#EEF2FF',
    borderColor: '#8B5CF6',
  },
  autoRoutingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginRight: 8,
  },
  autoRoutingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E40AF',
  },
});
