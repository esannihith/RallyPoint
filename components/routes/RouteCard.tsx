import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Car, Bike, PersonStanding } from 'lucide-react-native';
import { router } from 'expo-router';
import { ProcessedRoute } from '@/services/directionsService';

interface RouteCardProps {
  route: ProcessedRoute;
  isSelected: boolean;
  onSelect: () => void;
  onStartNavigation: () => void;
  isLoading?: boolean;
  travelMode?: string;
}

export function RouteCard({ 
  route, 
  isSelected, 
  onSelect, 
  onStartNavigation,
  isLoading = false,
  travelMode = 'driving'
}: RouteCardProps) {
  const handleStartNavigation = () => {
    // console.log('LOG: RouteCard: Start Navigation button pressed');
    const coordinates = route.coordinates;
    if (coordinates.length < 2) return;

    const origin = coordinates[0];
    const destination = coordinates[coordinates.length - 1];

    router.push({
      pathname: '/(tabs)/home/navigation',
      params: {
        originLat: origin.latitude.toString(),
        originLng: origin.longitude.toString(),
        destLat: destination.latitude.toString(),
        destLng: destination.longitude.toString(),
        travelMode: travelMode,
      },
    });
  };

  const getTravelModeIcon = () => {
    switch (travelMode) {
      case 'driving':
        return <Car size={16} color="#6B7280" />;
      case 'bicycling':
        return <Bike size={16} color="#6B7280" />;
      case 'walking':
        return <PersonStanding size={16} color="#6B7280" />;
      default:
        return <Car size={16} color="#6B7280" />;
    }
  };

  const fastestWarning = route.route.warnings?.find(w =>
    w.toLowerCase().includes('fastest route')
  );

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        {/* Route Info Block */}
        <View style={styles.routeInfoContainer}>
          <View style={styles.timeContainer}>
            {getTravelModeIcon()}
            <Text style={[styles.routeTime, isSelected && styles.selectedText]}>
              {route.duration}
            </Text>
            <Text style={styles.routeDistance}>{route.distance}</Text>
          </View>
          <Text style={styles.routePath}>via {route.summary}</Text>
          {fastestWarning && (
            <Text style={styles.fastestRouteText}>Fastest route now (traffic considered)</Text>
          )}

          {route.route.warnings?.length > 0 && (
            <View style={styles.warningsContainer}>
              {route.route.warnings.slice(0, 1).map((warning, index) => (
                <Text key={index} style={styles.warningText}>
                  ⚠️ {warning}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Start Button */}
        {isSelected && (
          <View style={styles.startButtonContainer}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartNavigation}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedContainer: {
    backgroundColor: '#EEF2FF',
    borderColor: '#8B5CF6',
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  routeInfoContainer: {
    flex: 1,
    paddingRight: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    marginRight: 8,
  },
  selectedText: {
    color: '#8B5CF6',
  },
  routeDistance: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  routePath: {
    fontSize: 13,
    color: '#6B7280',
  },
  fastestRouteText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 4,
  },
  startButtonContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  startButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  warningsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    lineHeight: 16,
  },
});