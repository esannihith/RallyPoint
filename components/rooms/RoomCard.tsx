import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Room } from '@/types/rooms';

interface RoomCardProps {
  room: Room;
  isActive: boolean;
  onPress: (room: Room) => void;
}

export function RoomCard({ room, isActive, onPress }: RoomCardProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={[styles.card, isActive && styles.activeCard]}>
      <View style={styles.content}>
        <Text style={styles.roomName} numberOfLines={1}>
          {room.name}
        </Text>
        <Text style={styles.lastUsed}>
          Last used: {formatDate(room.updatedAt)}
        </Text>
      </View>
      
      <TouchableOpacity
        style={[styles.button, isActive ? styles.activeButton : styles.inactiveButton]}
        onPress={() => onPress(room)}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, isActive ? styles.activeButtonText : styles.inactiveButtonText]}>
          {isActive ? 'Go to Room' : 'Rejoin'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  lastUsed: {
    fontSize: 14,
    color: '#6B7280',
  },
  button: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#10B981',
  },
  inactiveButton: {
    backgroundColor: '#8B5CF6',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
  inactiveButtonText: {
    color: '#FFFFFF',
  },
});