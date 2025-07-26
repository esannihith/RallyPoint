import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
 TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRoomStore } from '@/stores/roomStore';
import { useAuthStore } from '@/stores/authStore';
import { useTabNavigationStore } from '@/stores/tabNavigationStore';
import { Room } from '@/types/rooms';
import { RoomActionButtons, RoomsSection, SignInPrompt } from '@/components/rooms';

export default function RoomsScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const insets = useSafeAreaInsets();

  const { 
    isLoading, 
    error, 
    loadRooms, 
    clearError,
  } = useRoomStore();

  const { user, isAuthenticated, loadUser } = useAuthStore();
  const { setLastRoomsRoute, setUserExplicitlyReturnedToIndex } = useTabNavigationStore();

  // Track when user enters room index screen
  useEffect(() => {
    setLastRoomsRoute('/(tabs)/rooms');
    // Reset the explicit return flag when user is in index
    setUserExplicitlyReturnedToIndex(false);
  }, [setLastRoomsRoute, setUserExplicitlyReturnedToIndex]);

  useEffect(() => {
    const initializeRooms = async () => {
      try {
        await loadUser();
        if (isAuthenticated && user) {
          await loadRooms();
        }
      } catch (error) {
        console.error('Error initializing rooms:', error);
      }
    };
    
    initializeRooms();
  }, [loadUser, isAuthenticated, user, loadRooms]);

  // Only load rooms after authentication, do not auto-redirect
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      loadRooms().catch(error => {
        console.error('Error loading rooms after auth:', error);
      });
    }
  }, [isAuthenticated, user, loadRooms]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (isAuthenticated) {
        await loadRooms();
      }
    } catch (error) {
      console.error('Error refreshing rooms:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateRoom = () => {
    if (!isAuthenticated) {
      router.push('/signin');
      return;
    }
    router.push('/room-flows/create');
  };

  const handleJoinRoom = () => {
    if (!isAuthenticated) {
      router.push('/signin');
      return;
    }
    router.push('/room-flows/join');
  };

  const handleGoToRoom = (room: Room) => {
    // Clear the explicit return flag when user actively navigates to room-map
    setUserExplicitlyReturnedToIndex(false);
    
    router.push({
      pathname: '/(tabs)/rooms/room-map' as any,
      params: { roomId: room.id }
    });
  };

  const handleRejoinRoom = (room: Room) => {
    // Clear the explicit return flag when user actively navigates to room-map
    setUserExplicitlyReturnedToIndex(false);
    
    // Navigate to room map for rejoining
    router.push({
      pathname: '/(tabs)/rooms/room-map' as any,
      params: { roomId: room.id }
    });
  };

  const handleRoomPress = (room: Room, isActive: boolean) => {
    if (isActive) {
      handleGoToRoom(room);
    } else {
      handleRejoinRoom(room);
    }
  };

  const handleViewMoreRecentRooms = () => {
    router.push('/room-flows/history');
  };

  const handleClearError = () => {
    clearError();
  };
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Action Buttons */}
      <RoomActionButtons 
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={handleClearError}
            activeOpacity={0.7}
          >
            <Text style={styles.errorButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 } // Add bottom safe area padding
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!isAuthenticated ? (
          <SignInPrompt />
        ) : (
          <>
            {/* Rooms Section - handles both current and recent rooms */}
            <RoomsSection
              onRoomPress={handleRoomPress}
              onViewMore={handleViewMoreRecentRooms}
              isLoading={isLoading}
            />

          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    marginRight: 12,
  },
  errorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  errorButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});