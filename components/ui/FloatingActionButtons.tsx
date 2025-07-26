import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocateFixed, Navigation, MessageCircle } from 'lucide-react-native';
import { useRoomStore } from '@/stores/roomStore';

interface FloatingActionButtonsProps {
  // Button visibility
  showMyLocation?: boolean;
  showDirections?: boolean;
  // Button handlers
  onMyLocationPress?: () => void;
  onDirectionsPress?: () => void;
  // Loading states
  isMyLocationLoading?: boolean;
  // Custom positioning
  bottomOffset?: number;
}

export function FloatingActionButtons({
  showMyLocation = false,
  showDirections = false,
  onMyLocationPress,
  onDirectionsPress,
  isMyLocationLoading = false,
  bottomOffset = 0,
}: FloatingActionButtonsProps) {
  const insets = useSafeAreaInsets();
  // const { activeRoom, unreadCount, isChatOpen } = useRoomStore();

  // Calculate dynamic bottom padding based on tab bar height and safe area
  const tabBarHeight = Platform.select({
    ios: 88,
    android: 68 + insets.bottom,
    default: 68,
  });

  const dynamicBottomPadding = tabBarHeight + 16 + bottomOffset;

  // If no buttons should be shown, return null
  if (!showMyLocation && !showDirections) {
    return null;
  }

  return (
    <View style={[
      styles.container,
      { paddingBottom: dynamicBottomPadding }
    ]}>
      {/* My Location Button */}
      {showMyLocation && (
        <TouchableOpacity
          style={styles.fab}
          onPress={onMyLocationPress}
          disabled={isMyLocationLoading}
          activeOpacity={0.7}
        >
          {isMyLocationLoading ? (
            <ActivityIndicator size="small" color="#8B5CF6" />
          ) : (
            <LocateFixed size={22} color="#374151" />
          )}
        </TouchableOpacity>
      )}

      {/* Directions Button */}
      {showDirections && (
        <TouchableOpacity
          style={[styles.fab, styles.directionsButton]}
          onPress={onDirectionsPress}
          activeOpacity={0.7}
        >
          <Navigation size={22} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Chat Button removed */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 0,
    alignItems: 'flex-end',
    gap: 12,
    zIndex: 1000,
  },
  fab: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  directionsButton: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
  },
  chatButton: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
    position: 'relative',
  },
  chatButtonActive: {
    backgroundColor: '#059669',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});