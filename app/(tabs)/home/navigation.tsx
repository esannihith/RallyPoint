import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Mapbox from '@rnmapbox/maps';
import { useNavigationStore } from '@/stores/navigationStore';
import { getNavigationRoute } from '@/services/mapboxService';
import { NavigationInstructions } from '@/components/navigation/NavigationInstructions';
import { NavigationMap } from '@/components/navigation/NavigationMap';
import { NavigationControls } from '@/components/navigation/NavigationControls';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';
import { LoadingSpinner } from '@/components/ui';

// Set Mapbox access token
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');

export default function NavigationScreen() {
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navigationProgress, setNavigationProgress] = useState<any>(null);
  const [currentInstruction, setCurrentInstruction] = useState<any>(null);
  
  const {
    startNavigation,
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

      // Start navigation with the route
      startNavigation(navigationRoute);

    } catch (error) {
      console.error('Navigation initialization error:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize navigation');
    } finally {
      setIsLoading(false);
    }
  }, [params.originLat, params.originLng, params.destLat, params.destLng, params.travelMode, startNavigation]);

  useEffect(() => {
    initializeNavigation();
    return cleanup;
  }, [initializeNavigation, cleanup]);

  // Handle location updates from Mapbox
  const handleLocationUpdate = useCallback((location: any) => {
    if (location?.coords) {
      updateLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        bearing: location.coords.heading || 0,
        speed: location.coords.speed || 0,
      });
    }
  }, [updateLocation]);

  // Handle navigation progress updates
  const handleProgressUpdate = useCallback((progress: any) => {
    setNavigationProgress(progress);
  }, []);

  // Handle instruction updates
  const handleInstructionUpdate = useCallback((instruction: any) => {
    setCurrentInstruction(instruction);
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
      
      {/* Navigation Map */}
      <NavigationMap />
      
      {/* Navigation Instructions - Top overlay */}
      <View style={styles.instructionsContainer}>
        <NavigationInstructions 
          progress={navigationProgress}
          currentInstruction={currentInstruction}
        />
      </View>
      
      {/* Navigation Controls - Bottom overlay */}
      <View style={styles.controlsContainer}>
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
    backgroundColor: '#000000',
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