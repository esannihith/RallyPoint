import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useNavigationStore } from '@/stores/navigationStore';
import { RoutesLocationInputs } from '@/components/routes/RoutesLocationInputs';
import { RouteCard } from './RouteCard';
import { TravelModeSelector } from './TravelModeSelector';
import { RoutePolyline } from './RoutePolyline';
import {
  getDirections,
  getRoutesBounds,
  generateGoogleMapsLink,
  ProcessedRoute,
  TRAVEL_MODES,
} from '@/services/directionsService';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';

interface RouteSelectionScreenProps {
  initialMode?: string;
}

export function RouteSelectionScreen({ initialMode }: RouteSelectionScreenProps = {}) {
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [routes, setRoutes] = useState<ProcessedRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedTravelMode, setSelectedTravelMode] = useState(initialMode || 'driving');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    fromLocation,
    toLocation,
    swapLocations,
  } = useNavigationStore();

  useAndroidBackHandler({
    onBackPress: () => {
      router.back();
      return true;
    }
  });

  const fetchRoutes = useCallback(async () => {
    if (!fromLocation || !toLocation) return;

    setIsLoading(true);
    setError(null);

    try {
      if (typeof fromLocation.latitude !== 'number' || typeof fromLocation.longitude !== 'number' || typeof toLocation.latitude !== 'number' || typeof toLocation.longitude !== 'number') {
        throw new Error('Invalid coordinates');
      }
      const origin = {
        latitude: fromLocation.latitude,
        longitude: fromLocation.longitude,
      };

      const destination = {
        latitude: toLocation.latitude,
        longitude: toLocation.longitude,
      };

      const fetchedRoutes = await getDirections(origin, destination, selectedTravelMode);
      setRoutes(fetchedRoutes);
      if (fetchedRoutes.length > 0) {
        setSelectedRouteId(fetchedRoutes[0].id);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch routes');
      Alert.alert('Error', 'Failed to fetch routes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [fromLocation, toLocation, selectedTravelMode]);

  useEffect(() => {
    if (
      fromLocation &&
      toLocation &&
      fromLocation?.latitude &&
      fromLocation?.longitude &&
      toLocation?.latitude &&
      toLocation?.longitude
    ) {
      // console.log('LOG: RouteSelectionScreen: fromLocation, toLocation, selectedTravelMode changed');
      fetchRoutes();
    }
  }, [fromLocation, toLocation, selectedTravelMode, fetchRoutes]);

  const animateMapSafely = useCallback((region: Region) => {
    if (mapRef.current) {
      mapRef.current?.animateToRegion(region, 1000);
    }
  }, []);

  useEffect(() => {
    if (routes.length > 0 && mapRef.current) {
      const bounds = getRoutesBounds(routes);
      if (bounds) {
        setTimeout(() => {
          animateMapSafely(bounds);
        }, 500);
      }
    }
  }, [routes, animateMapSafely]);

  const handleInputPress = (inputType: 'from' | 'to') => {
    router.push({ pathname: '/search', params: { mode: 'directions', inputType } });
  };

  const handleSwap = () => {
    swapLocations();
  };

  const handleRouteSelect = useCallback((routeId: string) => {
    setSelectedRouteId(routeId);
    setRoutes((prevRoutes) =>
      prevRoutes.map((route) => ({ ...route, isSelected: route.id === routeId }))
    );
  }, []);

  const handleStartNavigation = () => {
    if (!fromLocation || !toLocation || typeof fromLocation.latitude !== 'number' || typeof fromLocation.longitude !== 'number' || typeof toLocation.latitude !== 'number' || typeof toLocation.longitude !== 'number') {
      Alert.alert('Error', 'Please select both origin and destination');
      return;
    }

    const origin = {
      latitude: fromLocation.latitude,
      longitude: fromLocation.longitude,
    };

    const destination = {
      latitude: toLocation.latitude,
      longitude: toLocation.longitude,
    };

    const googleMapsUrl = generateGoogleMapsLink(origin, destination, selectedTravelMode);

    Linking.openURL(googleMapsUrl).catch(() => {
      Alert.alert('Error', 'Could not open Google Maps');
    });
  };

  const snapPoints = useMemo(() => ['23%', '70%'], []);

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
        loadingEnabled
        loadingIndicatorColor="#8B5CF6"
      >
        {routes.map((route) => (
          <RoutePolyline
            key={route.id}
            route={route}
            onPress={() => handleRouteSelect(route.id)}
          />
        ))}

        {fromLocation && typeof fromLocation.latitude === 'number' && typeof fromLocation.longitude === 'number' && (
          <Marker
            coordinate={{
              latitude: fromLocation.latitude,
              longitude: fromLocation.longitude,
            }}
            title="Origin"
            description={fromLocation.name || 'Starting point'}
          />
        )}
        {toLocation && typeof toLocation.latitude === 'number' && typeof toLocation.longitude === 'number' && (
          <Marker
            coordinate={{
              latitude: toLocation.latitude,
              longitude: toLocation.longitude,
            }}
            title="Destination"
            description={toLocation.name || 'Ending point'}
          />
        )}
      </MapView>

      <View style={styles.routeInputsOverlay}>
        <RoutesLocationInputs
          from={fromLocation && typeof fromLocation.latitude === 'number' && typeof fromLocation.longitude === 'number' ? { name: fromLocation.name, latitude: fromLocation.latitude, longitude: fromLocation.longitude } : null}
          to={toLocation && typeof toLocation.latitude === 'number' && typeof toLocation.longitude === 'number' ? { name: toLocation.name, latitude: toLocation.latitude, longitude: toLocation.longitude } : null}
          onFromPress={() => handleInputPress('from')}
          onToPress={() => handleInputPress('to')}
          onSwap={handleSwap}
        />
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetScrollView
          style={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
        >
          <TravelModeSelector
            modes={TRAVEL_MODES}
            selectedMode={selectedTravelMode}
            onModeSelect={setSelectedTravelMode}
          />

          {routes.map((route) => {
            const isSelected = route.id === selectedRouteId;
            return (
              <RouteCard
                key={route.id}
                route={route}
                isSelected={isSelected}
                onSelect={() => handleRouteSelect(route.id)}
                onStartNavigation={handleStartNavigation}
                isLoading={isLoading}
                travelMode={selectedTravelMode}
              />
            );
          })}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {routes.length === 0 && !isLoading && !error && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Select origin and destination to see routes
              </Text>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  routeInputsOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  handleIndicator: {
    backgroundColor: '#E0E0E0',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  bottomSheetContent: { flex: 1, paddingHorizontal: 20 },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: { fontSize: 14, color: '#DC2626' },
  emptyContainer: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  bottomPadding: { height: 32 },
});