import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Share, MessageCircle, Navigation } from 'lucide-react-native';

interface RoomHeaderProps {
  roomDetails: any;
  userMarkers: any[];
  onBackPress: () => void;
  onSharePress: () => void;
  onDirectionsPress: () => void;
  onMessagesPress: () => void;
  roomStoreLoading: boolean;
}

export function RoomHeader({
  roomDetails,
  userMarkers,
  onBackPress,
  onSharePress,
  onDirectionsPress,
  onMessagesPress,
  roomStoreLoading
}: RoomHeaderProps) {
  const formatDestination = (roomDetails: any) => {
    if (roomDetails?.destination) {
      // Truncate long addresses
      const destination = roomDetails.destination;
      if (destination.length > 30) {
        return destination.substring(0, 30) + '...';
      }
      return destination;
    }
    return 'No destination set';
  };

  return (
    <SafeAreaView style={styles.header} edges={['top', 'left', 'right']}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onBackPress}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <View style={styles.roomTitleRow}>
            <Text style={styles.roomName} numberOfLines={1}>
              {roomDetails?.name || 'Room'}
            </Text>
            {roomDetails?.joinCode && (
              <View style={styles.roomCodeContainer}>
                <Text style={styles.roomCode}>{roomDetails.joinCode}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.memberCount}>
            {userMarkers.length} members • Live
          </Text>
          
          <Text style={styles.destination} numberOfLines={1}>
            📍 {formatDestination(roomDetails)}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onMessagesPress}
            activeOpacity={0.7}
          >
            <MessageCircle size={20} color="#111827" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onDirectionsPress}
            activeOpacity={0.7}
          >
            <Navigation size={20} color="#111827" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.headerButton,
              roomStoreLoading && styles.headerButtonDisabled
            ]}
            onPress={onSharePress}
            activeOpacity={roomStoreLoading ? 1 : 0.7}
            disabled={roomStoreLoading}
          >
            <Share size={20} color={roomStoreLoading ? "#9CA3AF" : "#111827"} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  roomTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  roomCodeContainer: {
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roomCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  memberCount: {
    fontSize: 14,
    color: '#10B981',
    marginBottom: 2,
    fontWeight: '500',
  },
  destination: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
});