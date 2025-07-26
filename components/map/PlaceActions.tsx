import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Navigation, Users, Share } from 'lucide-react-native';
import { router } from 'expo-router';
import { PlaceResult } from '@/types';
import { useNavigationStore } from '@/stores/navigationStore';
import { useLocationStore } from '@/stores/locationStore';
import { useAuthStore } from '@/stores/authStore';

interface PlaceActionsProps {
  place: PlaceResult;
}

export function PlaceActions({ place }: PlaceActionsProps) {
  const { setFromLocation, setToLocation, setDirectionsMode } = useNavigationStore();
  const { getCurrentLocation } = useLocationStore();
  const { isAuthenticated } = useAuthStore();

  const handleDirections = useCallback(() => {
    // Set the selected place as destination and navigate directly to routes screen
    if (place.geometry?.location) {
      // Get current location from store
      const currentLoc = getCurrentLocation();
      
      // Set current location as origin if available
      if (currentLoc) {
        const fromNavigationLocation = {
          id: 'current_location',
          name: 'Your location',
          address: 'Current location',
          latitude: currentLoc.latitude,
          longitude: currentLoc.longitude,
        };
        setFromLocation(fromNavigationLocation);
      }
      
      const navigationLocation = {
        id: place.place_id,
        name: place.name || 'Unknown Place',
        address: place.formatted_address || place.vicinity || 'Address not available',
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        placeId: place.place_id,
      };
      
      setToLocation(navigationLocation);
      setDirectionsMode(true);
      // Navigate directly to routes screen since destination is pre-configured
      router.push('/(tabs)/home/routes');
    }
  }, [place, setFromLocation, setToLocation, setDirectionsMode, getCurrentLocation]);

  const handleCollab = useCallback(() => {
    // Check if user is authenticated first
    if (!isAuthenticated) {
      router.push('/signin');
      return;
    }
    
    // Navigate to create room with pre-filled destination
    if (place.geometry?.location) {
      router.push({
        pathname: '/room-flows/create',
        params: {
          placeName: place.name || 'Unknown Place',
          placeAddress: place.formatted_address || place.vicinity || 'Address not available',
          latitude: place.geometry.location.lat.toString(),
          longitude: place.geometry.location.lng.toString(),
          placeId: place.place_id,
        }
      });
    } else {
      // Fallback without coordinates
      router.push({
        pathname: '/room-flows/create',
        params: {
          placeName: place.name || 'Unknown Place',
          placeAddress: place.formatted_address || place.vicinity || 'Address not available',
          placeId: place.place_id,
        }
      });
    }
  }, [place, isAuthenticated]);

  const handleShare = useCallback(() => {
    if (place.geometry?.location) {
      const { lat, lng } = place.geometry.location;
      const shareUrl = `https://www.google.com/maps/place/${encodeURIComponent(place.name || '')}/@${lat},${lng}`;
      
      if (Platform.OS === 'web' && navigator.share) {
        navigator.share({
          title: place.name,
          text: `Check out ${place.name}`,
          url: shareUrl,
        });
      } else if (Platform.OS === 'web' && navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
        // You could add a toast notification here
      }
    }
  }, [place]);

  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleDirections}
        activeOpacity={0.8}
      >
        <Navigation size={16} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Directions</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleCollab}
        activeOpacity={0.8}
      >
        <Users size={16} color="#8B5CF6" />
        <Text style={styles.secondaryButtonText}>Collab</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleShare}
        activeOpacity={0.8}
      >
        <Share size={16} color="#6B7280" />
        <Text style={styles.secondaryButtonText}>Share</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: 20, // Reduced for better spacing in minimal view
    gap: 10, // Slightly reduced gap
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 20, // Slightly smaller radius
    paddingVertical: 12, // Reduced padding for minimal view
    elevation: 2,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryButtonText: {
    fontSize: 13, // Slightly smaller text
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 20, // Slightly smaller radius
    paddingVertical: 12, // Reduced padding for minimal view
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 13, // Slightly smaller text
    fontWeight: '500',
    color: '#374151',
    marginLeft: 6,
  },
});