import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useNavigationStore } from '@/stores/navigationStore';
import { getNavigationRoute, calculateDistance } from '@/services/mapboxService';
import { NavigationInstructions } from './NavigationInstructions';
import { NavigationMap } from './NavigationMap';
import { NavigationControls } from './NavigationControls';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';
import { LoadingSpinner } from '@/components/ui';

export function NavigationScreen() {
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  
  const {
    isNavigating,
    route,
    progress,
    currentLocation,
    startNavigation,
    stopNavigation,
    clearNavigation,
    updateLocation,
    updateProgress,
  } = useNavigationStore();

  const cleanup = useCallback(() => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  }, []);

  const handleStopNavigation = useCallback(() => {
    cleanup();
    clearNavigation(); // Clear all navigation state including directions
    router.replace('/(tabs)/home');
  }, [cleanup, clearNavigation]);

  const startLocationTracking = useCallback(async () => {
    try {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        (location) => {
          const { latitude, longitude, heading, speed } = location.coords;
          
          updateLocation({
            latitude,
            longitude,
            bearing: heading || 0,
            speed: speed || 0,
          });
        }
      );
    } catch (error) {
      console.error('Location tracking error:', error);
    }
  }, [updateLocation]);

  const updateNavigationProgress = useCallback(() => {
    if (!currentLocation || !route || !progress) return;

    const { latitude, longitude } = currentLocation;
    const currentStep = progress.currentStep;
    
    if (!currentStep) return;

    const maneuverLocation = currentStep.maneuver.location;
    const distanceToManeuver = calculateDistance(
      latitude,
      longitude,
      maneuverLocation[1],
      maneuverLocation[0]
    );

    if (distanceToManeuver < 20 && progress.currentStepIndex < route.steps.length - 1) {
      const newStepIndex = progress.currentStepIndex + 1;
      const newProgress = {
        ...progress,
        currentStepIndex: newStepIndex,
        distanceTraveled: progress.distanceTraveled + currentStep.distance,
        fractionTraveled: (progress.distanceTraveled + currentStep.distance) / route.distance,
      };
      
      updateProgress(newProgress);
    }

    const totalDistanceRemaining = route.steps
      .slice(progress.currentStepIndex)
      .reduce((sum, step) => sum + step.distance, 0) - distanceToManeuver;
    
    const totalDurationRemaining = route.steps
      .slice(progress.currentStepIndex)
      .reduce((sum, step) => sum + step.duration, 0);

    updateProgress({
      ...progress,
      distanceRemaining: Math.max(0, totalDistanceRemaining),
      durationRemaining: Math.max(0, totalDurationRemaining),
    });
  }, [currentLocation, route, progress, updateProgress]);

  const initializeNavigation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const originLat = parseFloat(params.originLat as string);
      const originLng = parseFloat(params.originLng as string);
      const destLat = parseFloat(params.destLat as string);
      const destLng = parseFloat(params.destLng as string);
      const travelMode = (params.travelMode as string) || 'driving';

      if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
        throw new Error('Invalid route coordinates');
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission is required for navigation');
      }

      const navigationRoute = await getNavigationRoute(
        { latitude: originLat, longitude: originLng },
        { latitude: destLat, longitude: destLng },
        travelMode as 'driving' | 'walking' | 'cycling'
      );

      if (!navigationRoute) {
        throw new Error('Could not find a route');
      }

      await startLocationTracking();
      startNavigation(navigationRoute);

    } catch (error) {
      console.error('Navigation initialization error:', error);
      if (error instanceof Error) {
        setError(error.message || 'Failed to initialize navigation');
      } else {
        setError('Failed to initialize navigation');
      }
    } finally {
      setIsLoading(false);
    }
  }, [params.originLat, params.originLng, params.destLat, params.destLng, params.travelMode, startLocationTracking, startNavigation]);

  // Android back handler
  useAndroidBackHandler({
    onBackPress: () => {
      handleStopNavigation();
      return true;
    }
  });

  useEffect(() => {
    initializeNavigation();
    return () => {
      cleanup();
    };
  }, [initializeNavigation, cleanup]);

  useEffect(() => {
    if (isNavigating && currentLocation && route) {
      updateNavigationProgress();
    }
  }, [isNavigating, currentLocation, route, updateNavigationProgress]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner text="Initializing navigation..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.replace('/(tabs)/home')}
            activeOpacity={0.8}
          >
            <Text style={styles.errorButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Navigation Map */}
      <NavigationMap />
      
      {/* Navigation Instructions - Top overlay */}
      <View style={styles.instructionsContainer}>
        <NavigationInstructions />
      </View>
      
      {/* Navigation Controls - Bottom overlay */}
      <View style={styles.controlsContainer}>
        <NavigationControls onStop={handleStopNavigation} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  instructionsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});