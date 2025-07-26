import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { RouteSelectionScreen } from '@/components/routes/RouteSelectionScreen';

export default function RoutesScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  
  return <RouteSelectionScreen initialMode={mode} />;
}
