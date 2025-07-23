import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import { useRoomStore } from '@/stores/roomStore';
import { Room } from '@/types/rooms';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { RoomCard } from './RoomCard';

interface RoomsSectionProps {
  onRoomPress: (room: Room, isActive: boolean) => void;
  onViewMore?: () => void;
  isLoading?: boolean;
}

export function RoomsSection({ onRoomPress, onViewMore, isLoading = false }: RoomsSectionProps) {
  const { rooms, activeRoom } = useRoomStore();

  // Filter current room and recent rooms
  const currentRoom = activeRoom;
  const recentRooms = rooms.filter(room => room.id !== activeRoom?.id && !room.isActive).slice(0, 3);
  const hasMoreRooms = rooms.filter(room => room.id !== activeRoom?.id && !room.isActive).length > 3;

  // Show loading state when loading and no rooms
  if (isLoading && rooms.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.section}>
          <LoadingSpinner text="Loading rooms..." />
        </View>
      </View>
    );
  }

  // If no rooms at all and not loading, show empty state
  if (rooms.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.section}>
          <EmptyState
            icon={Users}
            title="No rooms yet"
            description="Create a new private room or join an existing one to start group navigation"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Current Room Section */}
      {currentRoom && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Room</Text>
          <RoomCard
            room={currentRoom}
            isActive={true}
            onPress={(room) => onRoomPress(room, true)}
          />
        </View>
      )}

      {/* Recent Rooms Section */}
      {(recentRooms.length > 0 || (isLoading && rooms.length > 0)) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Room History</Text>
              <Text style={styles.sectionSubtitle}>Previously joined rooms</Text>
            </View>
            {isLoading && rooms.length > 0 && (
              <View style={styles.smallLoadingIndicator}>
                <LoadingSpinner size="small" />
              </View>
            )}
          </View>
          
          {recentRooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              isActive={false}
              onPress={(room) => onRoomPress(room, false)}
            />
          ))}

          {hasMoreRooms && onViewMore && (
            <TouchableOpacity
              style={styles.viewMoreButton}
              onPress={onViewMore}
              activeOpacity={0.7}
            >
              <Text style={styles.viewMoreText}>View more recent rooms</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  smallLoadingIndicator: {
    marginTop: 4,
  },
  viewMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '500',
  },
});