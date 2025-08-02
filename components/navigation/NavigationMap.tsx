import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, Dimensions, View, TouchableOpacity } from 'react-native';
import Mapbox, { MapView, Camera, LocationPuck, ShapeSource, LineLayer, UserTrackingMode, OnUserLocationChangeEvent } from '@rnmapbox/maps';
import { useNavigationStore } from '@/stores/navigationStore';
import { Compass } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Set Mapbox access token
interface NavigationMapProps {
  onUserLocationUpdate: (event: OnUserLocationChangeEvent) => void;
}

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');

export function NavigationMap({ onUserLocationUpdate }: NavigationMapProps) {
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);
  const { route, currentLocation } = useNavigationStore();
  const [isFollowing, setIsFollowing] = useState(true);

  // Follow user location and bearing
  useEffect(() => {
    if (currentLocation && cameraRef.current && isFollowing) {
      cameraRef.current.setCamera({
        centerCoordinate: [currentLocation.longitude, currentLocation.latitude],
        heading: currentLocation.bearing,
        pitch: 60,
        zoomLevel: 18,
        animationDuration: 1000,
      });
    }
  }, [currentLocation, isFollowing]);

  if (!route) return null;

  // Create GeoJSON for the route
  const routeGeoJSON = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: route.geometry ? 
        require('@mapbox/polyline').decode(route.geometry).map(([lat, lng]: [number, number]) => [lng, lat]) :
        []
    }
  };

  // Recenter & reorient map
  const handleRecenter = () => {
    if (currentLocation && cameraRef.current) {
      setIsFollowing(true);
      cameraRef.current.setCamera({
        centerCoordinate: [currentLocation.longitude, currentLocation.latitude],
        heading: currentLocation.bearing,
        pitch: 60,
        zoomLevel: 18,
        animationDuration: 500,
      });
    }
  };

  const handleMapPress = () => {
    setIsFollowing(false);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        styleURL="mapbox://styles/mapbox/navigation-night-v1"
        onPress={handleMapPress}
        compassEnabled={false}
        scaleBarEnabled={false}
        attributionEnabled={false}
        logoEnabled={false}
      >
        <Mapbox.UserLocation onUpdate={onUserLocationUpdate} />
        <Camera
          ref={cameraRef}
          followUserLocation={isFollowing}
          followUserMode={UserTrackingMode.FollowWithHeading}
          followZoomLevel={18}
          followPitch={60}
        />

        {/* Location Puck for user position */}
        <LocationPuck
          puckBearingEnabled
          puckBearing="heading"
          visible={true}
        />

        {/* Route Line */}
        <ShapeSource id="routeSource" shape={routeGeoJSON}>
          <LineLayer
            id="routeLine"
            style={{
              lineColor: '#1E40AF',
              lineWidth: 8,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          <LineLayer
            id="routeLineOutline"
            style={{
              lineColor: '#FFFFFF',
              lineWidth: 12,
              lineCap: 'round',
              lineJoin: 'round',
            }}
            belowLayerID="routeLine"
          />
        </ShapeSource>
      </MapView>

      <TouchableOpacity 
        style={styles.compassButton} 
        onPress={handleRecenter} 
        activeOpacity={0.8}
      >
        <Compass size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
  },
  map: {
    width,
    height,
  },
  compassButton: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});