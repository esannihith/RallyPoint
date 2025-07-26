import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Clock, Users } from 'lucide-react-native';
import { useRoomStore } from '@/stores/roomStore';
import { Room } from '@/types/rooms';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';
import { EmptyState } from '@/components/ui';

// Helper function to get readable date labels
const getDateLabel = (timestamp: number): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const date = new Date(timestamp);
  
  if (date >= today) {
    return 'Today';
  } else if (date >= yesterday) {
    return 'Yesterday';
  } else if (date >= lastWeek) {
    return 'This week';
  } else if (date >= lastMonth) {
    return 'This month';
  } else {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }
};

// Group rooms by date sections
const groupRoomsByDate = (rooms: Room[]) => {
  const groupedRooms: { [key: string]: Room[] } = {};
  
  rooms.forEach(room => {
    const dateLabel = getDateLabel(new Date(room.updatedAt).getTime());
    if (!groupedRooms[dateLabel]) {
      groupedRooms[dateLabel] = [];
    }
    groupedRooms[dateLabel].push(room);
  });
  
  // Sort the groups by recency
  const datePriority = ['Today', 'Yesterday', 'This week', 'This month'];
  
  return Object.keys(groupedRooms)
    .sort((a, b) => {
      const aIndex = datePriority.indexOf(a);
      const bIndex = datePriority.indexOf(b);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      } else if (aIndex !== -1) {
        return -1;
      } else if (bIndex !== -1) {
        return 1;
      } else {
        const aDate = new Date(groupedRooms[a][0].updatedAt);
        const bDate = new Date(groupedRooms[b][0].updatedAt);
        return bDate.getTime() - aDate.getTime();
      }
    })
    .reduce((result, key) => {
      result[key] = groupedRooms[key];
      return result;
    }, {} as { [key: string]: Room[] });
};

export default function RoomHistoryScreen() {
  const [groupedRooms, setGroupedRooms] = useState<{ [key: string]: Room[] }>({});
  
  const { getRecentRooms } = useRoomStore();
  
  // Android back handler
  useAndroidBackHandler({
    onBackPress: () => {
      handleBack();
      return true;
    }
  });

  useEffect(() => {
    const recentRooms = getRecentRooms();
    const grouped = groupRoomsByDate(recentRooms);
    setGroupedRooms(grouped);
  }, [getRecentRooms]);
  
  const handleBack = () => {
    router.back();
  };
  
  const handleRoomSelect = (room: Room) => {
    // Placeholder for rejoin functionality
    // console.log('Rejoin room:', room.name);
  };

  const recentRooms = getRecentRooms();
  
  if (recentRooms.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Room History</Text>
          <View style={styles.headerSpacer} />
        </View>
        <EmptyState
          icon={Clock}
          title="No room history"
          description="Your room history will appear here"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Room History</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content}>
        {Object.entries(groupedRooms).map(([dateLabel, rooms]) => (
          <View key={dateLabel} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{dateLabel}</Text>
            </View>
            {rooms.map(room => (
              <TouchableOpacity
                key={room.id}
                style={styles.roomItem}
                onPress={() => handleRoomSelect(room)}
                activeOpacity={0.7}
              >
                <View style={styles.roomIcon}>
                  <Users size={20} color="#8B5CF6" />
                </View>
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName} numberOfLines={1}>{room.name}</Text>
                  <Text style={styles.roomDestination} numberOfLines={1}>{room.destination}</Text>
                  <Text style={styles.roomMeta}>
                    {room.members.length}/{room.maxMembers} members
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  roomIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  roomDestination: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  roomMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  bottomSpacing: {
    height: 32,
  },
});