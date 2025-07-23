import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { getUserColor } from '@/utils/userColors';

interface UserMarker {
  id: string;
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  isCurrentUser: boolean;
}

interface RoomMapProps {
  mapRef: React.RefObject<MapView | null>;
  initialRegion: Region;
  userMarkers: UserMarker[];
  roomDetails: any;
  onMapReady: () => void;
}

// Utility to generate initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2) // Take first 2 initials
    .join('');
};

// Get formatted destination address
const getDestinationTitle = (roomDetails: any): string => {
  if (roomDetails?.destination) {
    return roomDetails.destination;
  }
  if (roomDetails?.destinationName) {
    return roomDetails.destinationName;
  }
  return 'Destination';
};

export function RoomMap({
  mapRef,
  initialRegion,
  userMarkers,
  roomDetails,
  onMapReady,
}: RoomMapProps) {
  // Create consistent color mapping for users
  const userIds = userMarkers.map(marker => marker.userId);
  
  // Get destination coordinates
  const destLat = roomDetails?.destinationLat || roomDetails?.destinationCoords?.latitude;
  const destLng = roomDetails?.destinationLng || roomDetails?.destinationCoords?.longitude;
  const hasDestination = destLat && destLng && !isNaN(Number(destLat)) && !isNaN(Number(destLng));

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion}
      onMapReady={onMapReady}
      showsUserLocation={false}
      showsMyLocationButton={false}
      showsCompass={true}
      mapType="standard"
      loadingEnabled={true}
      loadingIndicatorColor="#8B5CF6"
    >
      {/* User Location Markers */}
      {userMarkers.map((marker, index) => {
        const userColor = getUserColor(userIds.indexOf(marker.userId));
        const initials = getInitials(marker.userName);
        
        return (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.isCurrentUser ? 'You' : marker.userName}
            description={marker.isCurrentUser ? 'Your current location' : `Last seen: ${new Date(marker.timestamp).toLocaleTimeString()}`}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={marker.isCurrentUser ? 1000 : 100}
          >
            <View style={styles.markerContainer}>
              {/* WhatsApp-style marker background */}
              <View 
                style={[
                  styles.markerBackground,
                  { backgroundColor: userColor },
                  marker.isCurrentUser && styles.currentUserMarker
                ]}
              >
                <Text style={styles.markerText}>{initials}</Text>
              </View>
              
              {/* Marker pointer/tail */}
              <View 
                style={[
                  styles.markerTail,
                  { borderTopColor: userColor },
                  marker.isCurrentUser && styles.currentUserTail
                ]}
              />
            </View>
          </Marker>
        );
      })}

      {/* Destination Marker */}
      {hasDestination && (
        <Marker
          coordinate={{
            latitude: Number(destLat),
            longitude: Number(destLng),
          }}
          title={getDestinationTitle(roomDetails)}
          description="Group destination"
          pinColor="#8B5CF6"
          zIndex={500}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  currentUserMarker: {
    borderWidth: 4,
    borderColor: '#FFFFFF',
    elevation: 6,
    shadowOpacity: 0.3,
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  currentUserTail: {
    borderTopWidth: 10,
    borderLeftWidth: 7,
    borderRightWidth: 7,
  },
});

export default RoomMap;