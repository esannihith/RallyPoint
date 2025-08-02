import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Mapbox from '@rnmapbox/maps';
import { useNavigationStore } from '@/stores/navigationStore';
import { getNavigationRoute, calculateDistance } from '@/services/mapboxService';
import { NavigationInstructions } from '@/components/navigation/NavigationInstructions';
import { NavigationMap } from '@/components/navigation/NavigationMap';
import { NavigationControls } from '@/components/navigation/NavigationControls';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';
import { LoadingSpinner } from '@/components/ui';
import * as Location from 'expo-location';

// Set Mapbox access token
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');

export default function NavigationScreen() {
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navigationProgress, setNavigationProgress] = useState<any>(null);
  const [currentInstruction, setCurrentInstruction] = useState<any>(null); // This will be derived from progress
  const insets = useSafeAreaInsets();
  
  const {
    startNavigation,
    route, // Get the route from the store
    stopNavigation,
    clearNavigation,
    updateLocation,
  } = useNavigationStore();

  // Stable cleanup function
  const cleanup = useCallback(() => {
    // Cleanup will be handled by Mapbox SDK
  }, []);


  // Stable stop navigation handler
  const handleStopNavigation = useCallback(() => {
    cleanup();
    clearNavigation();
    router.replace('/(tabs)/home');
  }, [cleanup, clearNavigation]);

  // Android back handler
  useAndroidBackHandler({
    onBackPress: () => {
      handleStopNavigation();
      return true;
    }
  });

  const initializeNavigation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get route parameters
      const originLat = parseFloat(params.originLat as string);
      const originLng = parseFloat(params.originLng as string);
      const destLat = parseFloat(params.destLat as string);
      const destLng = parseFloat(params.destLng as string);
      const travelMode = (params.travelMode as string) || 'driving';

      if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
        throw new Error('Invalid route coordinates');
      }

      // Get navigation route from Mapbox
      const navigationRoute = await getNavigationRoute(
        { latitude: originLat, longitude: originLng },
        { latitude: destLat, longitude: destLng },
        travelMode as 'driving' | 'walking' | 'cycling'
      );

      if (!navigationRoute) {
        throw new Error('Could not find a route');
      }

      // Request location permission if not already granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission is required for navigation');
      }

      // Start navigation with the route
      startNavigation(navigationRoute);

      // Initialize progress state
      setNavigationProgress({
        distanceRemaining: navigationRoute.distance,
        durationRemaining: navigationRoute.duration,
        distanceTraveled: 0,
        fractionTraveled: 0,
        currentStepIndex: 0,
        currentStep: navigationRoute.steps[0] || null,
        nextStep: navigationRoute.steps[1] || null,
        upcomingStep: navigationRoute.steps[2] || null,
      });
      setCurrentInstruction(navigationRoute.steps[0]?.instruction || 'Start navigation');

    } catch (error) {
      console.error('Navigation initialization error:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize navigation');
    } finally {
      setIsLoading(false);
    }
  }, [params.originLat, params.originLng, params.destLat, params.destLng, params.travelMode, startNavigation, updateLocation]);

  useEffect(() => {
    initializeNavigation();
    return cleanup;
  }, [initializeNavigation, cleanup]);

  // Handle location updates from Mapbox and calculate progress
  const handleLocationUpdate = useCallback((location: any) => {
    if (location?.coords && route) {
      const { latitude, longitude, heading, speed } = location.coords;
      
      // Update global location in store
      updateLocation({
        latitude,
        longitude,
        bearing: heading || 0,
        speed: speed || 0,
      });

      // Calculate navigation progress
      const currentLat = latitude;
      const currentLng = longitude;

      let currentStepIndex = navigationProgress?.currentStepIndex || 0;
      let distanceTraveled = navigationProgress?.distanceTraveled || 0;

      // Simple logic to advance step: if user is close to current step's maneuver location
      const currentStep = route.steps[currentStepIndex];
      if (currentStep) {
        const maneuverLocation = currentStep.maneuver.location; // [lng, lat]
        const distanceToManeuver = calculateDistance(
          currentLat,
          currentLng,
          maneuverLocation[1], // lat
          maneuverLocation[0]  // lng
        );

        if (distanceToManeuver < 20 && currentStepIndex < route.steps.length - 1) { // Within 20 meters
          distanceTraveled += currentStep.distance;
          currentStepIndex++;
        }
      }

      // Recalculate remaining distance and duration from current step onwards
      let distanceRemaining = 0;
      let durationRemaining = 0;
      for (let i = currentStepIndex; i < route.steps.length; i++) {
        distanceRemaining += route.steps[i].distance;
        durationRemaining += route.steps[i].duration;
      }

      const newProgress = {
        distanceRemaining: Math.max(0, distanceRemaining),
        durationRemaining: Math.max(0, durationRemaining),
        distanceTraveled: distanceTraveled,
        fractionTraveled: route.distance > 0 ? distanceTraveled / route.distance : 0,
        currentStepIndex: currentStepIndex,
        currentStep: route.steps[currentStepIndex] || null,
        nextStep: route.steps[currentStepIndex + 1] || null,
        upcomingStep: route.steps[currentStepIndex + 2] || null,
      };

      setNavigationProgress(newProgress);
      setCurrentInstruction(newProgress.currentStep?.instruction || 'Continue straight');
    }
  }, [route, navigationProgress, updateLocation]);

  // Handle navigation progress updates
  const handleProgressUpdate = useCallback((progress: any) => {
    // This callback is not directly used anymore as progress is calculated in handleLocationUpdate
    // It's kept for potential future integration with a more advanced SDK
  }, []);

  // Handle instruction updates
  const handleInstructionUpdate = useCallback((instruction: any) => {
    // This callback is not directly used anymore as instruction is calculated in handleLocationUpdate
    // It's kept for potential future integration with a more advanced SDK
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <LoadingSpinner text="Initializing navigation..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Navigation Map - Pass onUserLocationUpdate to get location from Mapbox */}
      <NavigationMap onUserLocationUpdate={handleLocationUpdate} />
      
      {/* Navigation Instructions - Top overlay */}
      <View style={[styles.instructionsContainer, { top: insets.top + 16 }]}>
        <NavigationInstructions 
          progress={navigationProgress}
          currentInstruction={currentInstruction}
        />
      </View>
      
      {/* Navigation Controls - Bottom overlay */}
      <View style={[
        styles.controlsContainer,
        { paddingBottom: insets.bottom + 16 }
      ]}>
        <NavigationControls 
          onStop={handleStopNavigation}
          progress={navigationProgress}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Background for the map
  },
  instructionsContainer: {
    position: 'absolute',
    top: 16,
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