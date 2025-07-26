import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, Users } from 'lucide-react-native';

interface RoomActionButtonsProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function RoomActionButtons({ onCreateRoom, onJoinRoom }: RoomActionButtonsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createButton}
        onPress={onCreateRoom}
        activeOpacity={0.8}
      >
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Create Room</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.joinButton}
        onPress={onJoinRoom}
        activeOpacity={0.8}
      >
        <Users size={20} color="#8B5CF6" />
        <Text style={styles.joinButtonText}>Join Room</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    elevation: 2,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 8,
  },
});