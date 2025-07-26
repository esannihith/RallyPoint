import React, { useRef, useEffect } from 'react';
import { StyleSheet, Dimensions, View, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import polyline from '@mapbox/polyline';
import { useNavigationStore } from '@/stores/navigationStore';
import { Compass } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export function NavigationMap() {
  const mapRef = useRef<MapView>(null);
  const { route, currentLocation } = useNavigationStore();

  // Follow user location and bearing
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          heading: currentLocation.bearing,
          pitch: 60,
          zoom: 18,
        },
        { duration: 1000 }
      );
    }
  }, [currentLocation]);

  if (!route) return null;

  // Decode route geometry
  const routeCoordinates = polyline.decode(route.geometry).map(([lat, lng]: [number, number]) => ({ latitude: lat, longitude: lng }));

  // Recenter & reorient map
  const handleRecenter = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          heading: currentLocation.bearing,
          pitch: 60,
          zoom: 18,
        },
        { duration: 500 }
      );
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType="standard"
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsBuildings={true}
        showsTraffic={false}
        followsUserLocation={false}
        rotateEnabled={true}
        pitchEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        loadingEnabled={true}
        loadingIndicatorColor="#3B82F6"
        customMapStyle={navigationMapStyle}
      >
        <Polyline coordinates={routeCoordinates} strokeColor="#FFFFFF" strokeWidth={12} lineCap="round" lineJoin="round" />
        <Polyline coordinates={routeCoordinates} strokeColor="#1E40AF" strokeWidth={8} lineCap="round" lineJoin="round" />

        {currentLocation && (
          <Marker
            coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            rotation={currentLocation.bearing}
          >
            <View style={styles.userLocationContainer}>
              <View style={styles.userLocationPulse} />
              <View style={styles.userLocationDot} />
            </View>
          </Marker>
        )}

        {routeCoordinates.length > 0 && (
          <Marker coordinate={routeCoordinates[routeCoordinates.length - 1]} title="Destination">
            <View style={styles.destinationMarker}>
              <View style={styles.destinationPin} />
            </View>
          </Marker>
        )}
      </MapView>

      <TouchableOpacity style={styles.compassButton} onPress={handleRecenter} activeOpacity={0.8}>
        <Compass size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const navigationMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#1a1a1a' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#4b6878' }],
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64779e' }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#4b6878' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry',
    stylers: [{ color: '#2d2d2d' }],
  },
  {
    featureType: 'landscape.natural',
    stylers: [{ color: '#2d2d2d' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#3a3a3a' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d4d4d4' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ color: '#4a4a4a' }], // Changed from green to gray
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d4d4d4' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#4a4a4a' }], // Gray roads instead of green
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#6b6b6b' }], // Lighter gray for highways
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#5a5a5a' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#5a5a5a' }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [{ color: '#4a4a4a' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d4d4d4' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'transit.line',
    elementType: 'geometry.fill',
    stylers: [{ color: '#3a3a3a' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'geometry',
    stylers: [{ color: '#3a3a3a' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#1e3a8a' }], // Dark blue water
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffff' }],
  },
];

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
  userLocationContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  userLocationDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  destinationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  compassButton: {
    position: 'absolute',
    bottom: 180, // Further increased to account for tab bar + controls + safe area
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
