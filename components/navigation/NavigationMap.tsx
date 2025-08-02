import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
// Corrected import: Removed OnUserLocationChangeEvent and added Location
import Mapbox, { MapView, Camera, LocationPuck, ShapeSource, LineLayer, UserTrackingMode, Location } from '@rnmapbox/maps';
import { useNavigationStore } from '@/stores/navigationStore';

const { width, height } = Dimensions.get('window');

// Interface for the component's props
interface NavigationMapProps {
  // Corrected type: The event from onUserLocationUpdate is of type 'Location'
  onUserLocationUpdate: (event: Location) => void;
}

export function NavigationMap({ onUserLocationUpdate }: NavigationMapProps) {
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);
  const isMountedRef = useRef(true);
  const { route, currentLocation } = useNavigationStore();
  const [isFollowing, setIsFollowing] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Handle map interactions - disable following when user manually interacts with map
  const handleMapPress = () => {
    if (isMountedRef.current) {
      setIsFollowing(false);
    }
  };

  if (!route) return null;

  // Create GeoJSON for the route
  const routeGeoJSON = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      // Ensure polyline decoding happens only if geometry exists
      coordinates: route.geometry
        ? require('@mapbox/polyline').decode(route.geometry).map(([lat, lng]: [number, number]) => [lng, lat])
        : []
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        styleURL="mapbox://styles/mapbox/navigation-night-v1"
        onPress={handleMapPress}
        onDidFinishLoadingMap={() => setIsMapReady(true)}
        compassEnabled={false}
        scaleBarEnabled={false}
        attributionEnabled={false}
        logoEnabled={false}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
      >
        <Mapbox.UserLocation
          onUpdate={onUserLocationUpdate}
          requestsAlwaysUse={false}
          androidRenderMode="gps"
          visible={true}
        />
        <Camera
          ref={cameraRef}
          followUserLocation={isFollowing}
          followUserMode={UserTrackingMode.FollowWithHeading}
          followZoomLevel={18}
          followPitch={60}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* Location Puck for user position */}
        <LocationPuck
          puckBearingEnabled
          puckBearing="heading"
          visible={true}
        />

        {/* Route Line - only render if route exists and has coordinates */}
        {route && route.geometry && (
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
        )}
      </MapView>
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
});
