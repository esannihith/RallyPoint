import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
  Text,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRoomStore, useAuthStore, useNavigationStore, useTabNavigationStore } from '@/stores';
import { socketService } from '@/services/socketService';
import { getDeviceInfo } from '@/utils/deviceInfo';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';
import { RoomHeader, RoomMap, BackModal } from '@/components/rooms';
import { FloatingActionButtons } from '@/components/ui';

export default function RoomMapScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [roomDetails, setRoomDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userMarkers, setUserMarkers] = useState<any[]>([]);
  const [showBackModal, setShowBackModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false); // 🔥 NEW: Track map initialization
  const { 
    activeRoom, 
    currentRoomLocations, 
    chatMessages,
    updateUserLocation, 
    removeUserLocation,
    clearRoomLocations,
    addChatMessage,
    setChatMessages,
    clearChatMessages,
    leaveRoom,
    isLoading: roomStoreLoading,
    setChatOpen,
    resetUnreadCount
  } = useRoomStore();
  const { user } = useAuthStore();
  const { setFromLocation, setToLocation, setDirectionsMode } = useNavigationStore();
  const { setLastRoomsRoute, setUserExplicitlyReturnedToIndex } = useTabNavigationStore();

  // Track when user enters room-map screen
  useEffect(() => {
    const roomMapRoute = `/(tabs)/rooms/room-map?roomId=${roomId}`;
    setLastRoomsRoute(roomMapRoute);
    // User is actively in room-map, so clear the explicit return flag
    setUserExplicitlyReturnedToIndex(false);
  }, [roomId, setLastRoomsRoute, setUserExplicitlyReturnedToIndex]);

  // Android back handler
  useAndroidBackHandler({
    onBackPress: () => {
      setShowBackModal(true);
      return true;
    }
  });

  const setupChatListeners = useCallback(() => {
    try {
      // Chat listeners are now handled centrally in roomStore
      // This function can be removed or used for room-specific chat handling
    } catch (error) {
      console.error('Error setting up chat listeners:', error);
    }
  }, [roomId]);

  // Process user markers for display
  useEffect(() => {
    const processUserMarkers = () => {
      const markers = [];
      
      
      // Add current user location with color
      if (currentLocation && user) {
        markers.push({
          id: `current-user-${user.id}`,
          userId: user.id,
          userName: user.name,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          timestamp: new Date().toISOString(),
          isCurrentUser: true,
        });
      }
      
      // Add other room members
      currentRoomLocations.forEach(location => {
        if (location && 
            typeof location.latitude === 'number' && 
            typeof location.longitude === 'number' &&
            !isNaN(location.latitude) && 
            !isNaN(location.longitude) &&
            location.userId !== user?.id) {
          
          markers.push({
            id: `member-${location.userId}`,
            userId: location.userId,
            userName: location.userName,
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: location.timestamp,
            isCurrentUser: false,
          });
        }
      });
      // console.log('Processed user markers:', markers.length);
      setUserMarkers(markers);
    };

    processUserMarkers();
  }, [currentRoomLocations, currentLocation, user]);

  // Auto-fit map to show all users and destination
  useEffect(() => {
    if (!mapInitialized || userMarkers.length === 0 || !mapRef.current) {
      return;
    }

    const allLocations = userMarkers.map(marker => ({
      latitude: marker.latitude,
      longitude: marker.longitude,
    }));

    // Add destination to locations
    const destLat = roomDetails?.destinationLat || roomDetails?.destinationCoords?.latitude;
    const destLng = roomDetails?.destinationLng || roomDetails?.destinationCoords?.longitude;
    
    if (destLat && destLng && !isNaN(Number(destLat)) && !isNaN(Number(destLng))) {
      allLocations.push({
        latitude: Number(destLat),
        longitude: Number(destLng),
      });
    }

    if (allLocations.length > 0) {
      const latitudes = allLocations.map(loc => loc.latitude);
      const longitudes = allLocations.map(loc => loc.longitude);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);

      const latDelta = Math.max((maxLat - minLat) * 1.5, 0.02);
      const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.02);

      const region = {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      };

      setTimeout(() => {
        mapRef.current?.animateToRegion(region, 1500);
      }, 800);
    }
  }, [userMarkers, roomDetails, mapInitialized]);

  const initializeRoom = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (activeRoom && activeRoom.id === roomId) {
        setRoomDetails({
          ...activeRoom,
          maxMembers: activeRoom.maxMembers || 8,
        });
      } else {
        setRoomDetails({
          id: roomId,
          name: 'Room',
          maxMembers: 8,
        });
      }
      
    } catch (error) {
      console.error('Error initializing room:', error);
      if (error instanceof Error && !error.message.includes('timeout')) {
        Alert.alert('Error', error.message);
        router.back();
      } else {
        setRoomDetails({
          id: roomId,
          name: 'Room',
          maxMembers: 8,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [roomId, activeRoom]);

  const setupLocationTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to share your location with room members.'
        );
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setCurrentLocation(newLocation);
        
        if (socketService.isConnected) {
          try {
            const deviceInfo = await getDeviceInfo();
            
            socketService.updateLocation({
              roomId,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy || undefined,
              speed: location.coords.speed || undefined,
              bearing: location.coords.heading || undefined,
              heading: location.coords.heading || undefined,
              altitude: location.coords.altitude || undefined,
              batteryLevel: deviceInfo.batteryLevel || undefined,
              deviceModel: deviceInfo.deviceModel || undefined,
            });
          } catch (socketError) {
            console.error('Error sending initial location update:', socketError);
          }
        }
      } catch (locationError) {
        console.error('Error getting initial location:', locationError);
      }

      try {
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 5000, // Increased to 5 seconds to reduce GPS drift updates
            distanceInterval: 8, // Increased to 8 meters for more significant movement detection
          },
          async (location) => {
            const { latitude, longitude } = location.coords;
            
            // Filter out updates with poor accuracy or when stationary
            const hasGoodAccuracy = !location.coords.accuracy || location.coords.accuracy < 15; // within 15 meters
            const isMoving = !location.coords.speed || location.coords.speed > 0.3; // 0.3 m/s threshold
            
            if (hasGoodAccuracy && isMoving) {
              setCurrentLocation({ latitude, longitude });

              if (socketService.isConnected) {
                try {
                  const deviceInfo = await getDeviceInfo();
                  
                  
                  // console.log('Sending location update:', {
                  //   roomId,
                  //   latitude,
                  //   longitude,
                  //   accuracy: location.coords.accuracy,
                  //   speed: location.coords.speed,
                  //   timestamp: new Date().toISOString(),
                  // });
                  socketService.updateLocation({
                    roomId,
                    latitude,
                    longitude,
                    accuracy: location.coords.accuracy || undefined,
                    speed: location.coords.speed || undefined,
                    bearing: location.coords.heading || undefined,
                    heading: location.coords.heading || undefined,
                    altitude: location.coords.altitude || undefined,
                    batteryLevel: deviceInfo.batteryLevel || undefined,
                    deviceModel: deviceInfo.deviceModel || undefined,
                  });
                } catch (socketError) {
                  console.error('Error sending location update:', socketError);
                }
              }
            }
          }
        );

        (global as any).locationSubscription = subscription;
      } catch (watchError) {
        console.error('Error setting up location watching:', watchError);
      }

    } catch (error) {
      console.error('Error setting up location tracking:', error);
      console.warn('Location tracking setup failed, continuing without it');
    }
  }, [roomId]);

  const setupSocketListeners = useCallback(() => {
    try {
      socketService.onLocationUpdated((locationData) => {
        // console.log('Received location update:', locationData);
        updateUserLocation(locationData);
      // console.log('User joined:', data.userName);
      });

      socketService.onUserJoined((data) => {
      });

      socketService.onUserLeft((data) => {
        // console.log('User left:', data.userName);
        removeUserLocation(data.userId);
      });
      
      socketService.onRoomLocations((data) => {
        // console.log('Received room locations:', data.locations);
        data.locations.forEach(locationData => {
          updateUserLocation(locationData);
        });
      });

      socketService.onError((error) => {
        console.error('Socket error:', error);
      });
    } catch (error) {
      console.error('Error setting up socket listeners:', error);
    }
  }, [updateUserLocation, removeUserLocation]);

  const cleanup = useCallback(() => {
    socketService.offLocationUpdated();
    socketService.offUserJoined();
    socketService.offUserLeft();
    socketService.offRoomLocations();
    socketService.offError();
    socketService.offNewMessage();
    socketService.offChatHistory();

    if ((global as any).locationSubscription) {
      (global as any).locationSubscription.remove();
    }

    clearRoomLocations();
    clearChatMessages();

    if (socketService.isConnected) {
      socketService.leaveRoom(roomId);
    }
  }, [roomId, clearRoomLocations, clearChatMessages]);

  const handleBack = () => {
    // Mark that user explicitly returned to index via back button
    setUserExplicitlyReturnedToIndex(true);
    setLastRoomsRoute('/(tabs)/rooms');
    
    cleanup();
    router.replace('/(tabs)/rooms');
  };

  const handleLeaveRoom = () => {
    if (roomStoreLoading) return;
    
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave this room?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveRoom(roomId);
              cleanup();
              router.replace('/(tabs)/rooms');
            } catch {
              Alert.alert('Error', 'Failed to leave room');
            }
          },
        },
      ]
    );
  };

  const handleShareRoom = () => {
    if (roomDetails?.joinCode) {
      Alert.alert(
        'Share Room',
        `Room Code: ${roomDetails.joinCode}\n\nShare this code with others to let them join "${roomDetails.name}".`,
        [
          { text: 'OK' },
        ]
      );
    }
  };

  const handleDirectionsToRoomDestination = () => {
    // Check if room destination coordinates are available
    const destLat = roomDetails?.destinationLat || roomDetails?.destinationCoords?.latitude;
    const destLng = roomDetails?.destinationLng || roomDetails?.destinationCoords?.longitude;
    
    if (!destLat || !destLng || isNaN(Number(destLat)) || isNaN(Number(destLng))) {
      Alert.alert('Error', 'Room destination coordinates are not available');
      return;
    }

    // Set current location as origin if available
    if (currentLocation) {
      const fromNavigationLocation = {
        id: 'current_location',
        name: 'Your location',
        address: 'Current location',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };
      setFromLocation(fromNavigationLocation);
    }

    // Set room destination as target
    const toNavigationLocation = {
      id: roomDetails?.id || 'room_destination',
      name: roomDetails?.destinationName || roomDetails?.destination || 'Room Destination',
      address: roomDetails?.destination || roomDetails?.destinationName || 'Room Destination',
      latitude: Number(destLat),
      longitude: Number(destLng),
    };
    setToLocation(toNavigationLocation);
    setDirectionsMode(true);

    // Navigate to routes screen
    router.push('/(tabs)/home/routes');
  };

  const handleMyLocationPress = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to center the map on your location.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
    }
  };

  const handleChatPress = () => {
    setChatOpen(true);
    resetUnreadCount();
  };

  const handleSendMessage = (content: string) => {
    socketService.sendMessage(roomId, content);
  };

  const getMapRegion = (): Region => {
    if (currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }

    const destLat = roomDetails?.destinationLat || roomDetails?.destinationCoords?.latitude;
    const destLng = roomDetails?.destinationLng || roomDetails?.destinationCoords?.longitude;
    
    if (destLat && destLng && !isNaN(Number(destLat)) && !isNaN(Number(destLng))) {
      return {
        latitude: Number(destLat),
        longitude: Number(destLng),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    // Default to India center
    return {
      latitude: 20.5937,
      longitude: 78.9629,
      latitudeDelta: 10.0,
      longitudeDelta: 10.0,
    };
  };

  const handleMapReady = () => {
    // console.log('Map is ready!');
    setMapInitialized(true);
  };

  // Initialize room and setup listeners
  useEffect(() => {
    if (!roomId) {
      router.replace('/(tabs)/rooms');
      return;
    }
    
    initializeRoom();
    setupLocationTracking();
    setupSocketListeners();
    
    return () => {
      cleanup();
    };
  }, [roomId, initializeRoom, setupLocationTracking, setupSocketListeners, cleanup]);

  // Guard against missing roomId
  if (!roomId) {
    return null;
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading room...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <RoomHeader
        roomDetails={roomDetails}
        userMarkers={userMarkers}
        onBackPress={() => setShowBackModal(true)}
        onSharePress={handleShareRoom}
        roomStoreLoading={roomStoreLoading}
      />

      <RoomMap
        mapRef={mapRef}
        initialRegion={getMapRegion()}
        userMarkers={userMarkers}
        roomDetails={roomDetails}
        onMapReady={handleMapReady}
      />

      <BackModal
        visible={showBackModal}
        onCancel={() => setShowBackModal(false)}
        onGoBack={() => {
          setShowBackModal(false);
          handleBack();
        }}
        onLeaveRoom={() => {
          setShowBackModal(false);
          handleLeaveRoom();
        }}
      />

      <FloatingActionButtons
        showMyLocation={true}
        showDirections={true}
        onMyLocationPress={handleMyLocationPress}
        onDirectionsPress={handleDirectionsToRoomDestination}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
});
