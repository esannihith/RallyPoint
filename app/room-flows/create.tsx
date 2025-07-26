import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Users, Search, Map } from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRoomStore } from '@/stores/roomStore';
import { useAuthStore } from '@/stores/authStore';
import { useCallbackStore } from '@/stores/callbackStore';
import { CreateRoomRequest, DestinationLocation } from '@/types/rooms';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';
import { reverseGeocode } from '@/services/reverseGeocodingService';

const { width } = Dimensions.get('window');

export default function CreateRoomScreen() {
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  
  const [formData, setFormData] = useState<CreateRoomRequest>({
    name: '',
    destination: '',
    maxMembers: '',
    isPrivate: true,
  });
  const [destinationLocation, setDestinationLocation] = useState<DestinationLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 20.5937, // India center
    longitude: 78.9629,
    latitudeDelta: 15.0,
    longitudeDelta: 15.0,
  });
  const [showMap, setShowMap] = useState(false);
  
  const { createRoom } = useRoomStore();
  const { isAuthenticated } = useAuthStore();
  const { setCallback, removeCallback } = useCallbackStore();

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/signin');
      return;
    }
  }, [isAuthenticated]);

  // Handle pre-filled destination from URL params
  useEffect(() => {
    const { placeName, placeAddress, latitude, longitude, placeId } = params;
    
    if (placeName && placeAddress) {
      const lat = latitude ? parseFloat(latitude as string) : undefined;
      const lng = longitude ? parseFloat(longitude as string) : undefined;
      
      const destinationData: DestinationLocation = {
        name: placeName as string,
        address: placeAddress as string,
        latitude: lat || 0,
        longitude: lng || 0,
        placeId: placeId as string,
      };
      
      setDestinationLocation(destinationData);
      setFormData(prev => ({
        ...prev,
        destination: placeAddress as string,
        destinationCoords: lat && lng ? {
          latitude: lat,
          longitude: lng,
        } : undefined,
      }));
      
      // Update map region if coordinates are available
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        setMapRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setShowMap(true);
      }
    }
  }, [params]);

  // Set up callback for destination selection
  useEffect(() => {
    setCallback('create-room-destination', (selectedPlace: DestinationLocation) => {
      setDestinationLocation(selectedPlace);
      setFormData(prev => ({
        ...prev, // Preserve existing form data
        destination: selectedPlace.address,
        destinationCoords: {
          latitude: selectedPlace.latitude,
          longitude: selectedPlace.longitude,
        },
      }));
      
      // Update map region to show the selected place
      setMapRegion({
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      
      setShowMap(true);
    });

    // Cleanup callback on unmount
    return () => {
      removeCallback('create-room-destination');
    };
  }, []); // Empty dependency array since Zustand store methods are stable

  // Android back handler
  useAndroidBackHandler({
    onBackPress: () => {
      handleBack();
      return true;
    }
  });

  const handleBack = () => {
    // Route directly to rooms tab instead of going back through search screen
    router.replace('/(tabs)/rooms');
  };

  const handleDestinationSearch = () => {
    router.push({
      pathname: '/search',
      params: { 
        mode: 'room_destination',
        returnTo: 'room-flows/create',
        callbackId: 'create-room-destination'
      }
    });
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    try {
      const location = await reverseGeocode(latitude, longitude);
      
      if (location) {
        setDestinationLocation(location);
        setFormData(prev => {
          const updated = {
            ...prev,
            destination: location.address,
            destinationCoords: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
          };
          return updated;
        });
        
        // Update map region
        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      Alert.alert('Error', 'Failed to get location details');
    }
  };

  const updateFormData = (key: keyof CreateRoomRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCreateRoom = async () => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'Please sign in to create a room');
      router.push('/signin');
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Room name is required');
      return;
    }

    if (formData.name.trim().length < 3) {
      Alert.alert('Error', 'Room name must be at least 3 characters long');
      return;
    }

    if (!formData.destination.trim()) {
      Alert.alert('Error', 'Destination is required');
      return;
    }

    const maxMembersNum = parseInt(formData.maxMembers.toString()) || 8;
    if (maxMembersNum < 2 || maxMembersNum > 50) {
      Alert.alert('Error', 'Maximum members must be between 2 and 50');
      return;
    }

    setIsLoading(true);

    try {
      const roomData: CreateRoomRequest = {
        name: formData.name.trim(),
        destination: formData.destination.trim(),
        destinationCoords: destinationLocation ? {
          latitude: destinationLocation.latitude,
          longitude: destinationLocation.longitude,
        } : undefined,
        maxMembers: maxMembersNum,
        isPrivate: true, // All rooms are private
      };

      const newRoom = await createRoom(roomData);
      
      // Navigate to room-map (socket connection is handled by roomStore)
      router.replace({
        pathname: '/(tabs)/rooms/room-map' as any,
        params: { roomId: newRoom.id }
      });
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Error', 'Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMapView = () => {
    setShowMap(!showMap);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Private Room</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Room Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Room Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter room name"
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              maxLength={50}
              autoCapitalize="words"
              returnKeyType="next"
            />
            <Text style={styles.helperText}>
              Choose a descriptive name for your navigation room
            </Text>
          </View>

          {/* Destination */}
          <View style={styles.section}>
            <Text style={styles.label}>Destination *</Text>
            <TouchableOpacity
              style={styles.destinationButton}
              onPress={handleDestinationSearch}
              activeOpacity={0.7}
            >
              <View style={styles.destinationContent}>
                <MapPin size={20} color="#6B7280" />
                <Text style={[
                  styles.destinationText,
                  !formData.destination && styles.destinationPlaceholder
                ]}>
                  {formData.destination || 'Search for destination'}
                </Text>
              </View>
              <Search size={20} color="#8B5CF6" />
            </TouchableOpacity>
            
            {/* Map Toggle Button */}
            <TouchableOpacity
              style={styles.mapToggleButton}
              onPress={toggleMapView}
              activeOpacity={0.7}
            >
              <Map size={16} color="#8B5CF6" />
              <Text style={styles.mapToggleText}>
                {showMap ? 'Hide Map' : 'Select on Map'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.helperText}>
              Search for a destination or select directly on the map
            </Text>
          </View>

          {/* Map View */}
          {showMap && (
            <View style={styles.mapSection}>
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  region={mapRegion}
                  onPress={handleMapPress}
                  showsUserLocation={false}
                  showsMyLocationButton={false}
                  mapType="standard"
                >
                  {destinationLocation && (
                    <Marker
                      coordinate={{
                        latitude: destinationLocation.latitude,
                        longitude: destinationLocation.longitude,
                      }}
                      title={destinationLocation.name}
                      description={destinationLocation.address}
                      pinColor="#8B5CF6"
                    />
                  )}
                </MapView>
                
                {/* Map Instructions */}
                <View style={styles.mapInstructions}>
                  <Text style={styles.mapInstructionsText}>
                    Tap on the map to select destination
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Max Members */}
          <View style={styles.section}>
            <Text style={styles.label}>Maximum Members</Text>
            <View style={styles.inputContainer}>
              <Users size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="Enter max members (2-50)"
                value={formData.maxMembers === '' ? '' : formData.maxMembers.toString()}
                onChangeText={(text) => {
                  if (text === '') {
                    updateFormData('maxMembers', '');
                  } else if (/^\d+$/.test(text)) {
                    const num = Math.min(Math.max(parseInt(text), 2), 50);
                    updateFormData('maxMembers', num.toString());
                  }
                }}
                keyboardType="numeric"
                maxLength={3}
                returnKeyType="done"
              />
            </View>
            <Text style={styles.helperText}>
              Set the maximum number of members (2-50)
            </Text>
          </View>

          {/* Privacy Notice */}
          <View style={styles.privacyNotice}>
            <Text style={styles.privacyTitle}>🔒 Private Room</Text>
            <Text style={styles.privacyText}>
              Your room will be private and only accessible with a join code. You&apos;ll receive a unique code after creation.
            </Text>
          </View>

          {/* Create Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.createButton,
                (!formData.name.trim() || !formData.destination.trim() || !formData.maxMembers || isLoading) && 
                styles.createButtonDisabled
              ]}
              onPress={handleCreateRoom}
              disabled={!formData.name.trim() || !formData.destination.trim() || !formData.maxMembers || isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.createButtonText}>
                {isLoading ? 'Creating Room...' : 'Create Private Room'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 32,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputContainer: {
    position: 'relative',
  },
  inputWithIcon: {
    paddingLeft: 48,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 17,
    zIndex: 1,
  },
  destinationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  destinationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  destinationText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  destinationPlaceholder: {
    color: '#9CA3AF',
  },
  mapToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'flex-start',
  },
  mapToggleText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
    marginLeft: 6,
  },
  mapSection: {
    marginTop: 16,
  },
  mapContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  map: {
    width: width - 32,
    height: 200,
  },
  mapInstructions: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapInstructionsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    lineHeight: 20,
  },
  privacyNotice: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 32,
  },
  createButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#D1D5DB',
    elevation: 0,
    shadowOpacity: 0,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 32,
  },
});