import React from 'react';
import { Polyline } from 'react-native-maps';
import { ProcessedRoute } from '@/services/directionsService';

interface RoutePolylineProps {
  route: ProcessedRoute;
  onPress: () => void;
}

export function RoutePolyline({ route, onPress }: RoutePolylineProps) {
  const isSelected = route.isSelected;

  return (
    <Polyline
      coordinates={route.coordinates}
      strokeColor={isSelected ? '#8B5CF6' : 'rgba(189,189,189,0.6)'}

      strokeWidth={isSelected ? 6 : 4}
      lineCap="round"
      lineJoin="round"
      tappable
      onPress={onPress}
      zIndex={isSelected ? 2 : 1}
    />
  );
}
