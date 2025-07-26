import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { X, Navigation, Leaf } from 'lucide-react-native';
import { useNavigationStore } from '@/stores/navigationStore';
import { formatDuration, formatDistance } from '@/services/mapboxService';

interface NavigationControlsProps {
  onStop: () => void;
}

export function NavigationControls({ onStop }: NavigationControlsProps) {
  const { progress } = useNavigationStore();

  // Calculate arrival time
  const getArrivalTime = () => {
    if (!progress) return '';
    
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + (progress.durationRemaining * 1000));
    return arrivalTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <View style={styles.container}>
      {/* Drag indicator */}
      <View style={styles.dragIndicator} />
      
      <View style={styles.content}>
        {/* Cancel button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onStop}
          activeOpacity={0.8}
        >
          <X size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Route info */}
        <View style={styles.routeInfo}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {progress ? formatDuration(progress.durationRemaining) : '-- min'}
            </Text>
            <View style={styles.ecoContainer}>
              <Leaf size={16} color="#10B981" />
            </View>
          </View>
          
          <View style={styles.detailsContainer}>
            <Text style={styles.distanceText}>
              {progress ? formatDistance(progress.distanceRemaining) : '-- km'}
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.arrivalText}>
              {getArrivalTime()}
            </Text>
          </View>
        </View>

        {/* Alternative routes button */}
        <TouchableOpacity
          style={styles.routesButton}
          activeOpacity={0.8}
        >
          <Navigation size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    paddingTop: 8,
    paddingBottom: 16, // Reduced padding since SafeAreaView handles safe area
    paddingHorizontal: 16,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FCD34D', // Yellow like Google Maps
    marginRight: 8,
  },
  ecoContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  separator: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 8,
  },
  arrivalText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  routesButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});