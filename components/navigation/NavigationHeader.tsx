import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { X, Volume2, VolumeX } from 'lucide-react-native';
import { useNavigationStore } from '@/stores/navigationStore';
import { formatDuration, formatDistance } from '@/services/mapboxService';

export function NavigationHeader({ onStop }: { onStop: () => void }) {
  const { progress, isMuted, toggleMute } = useNavigationStore();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {progress && (
          <View style={styles.routeInfo}>
            <Text style={styles.timeText}>{formatDuration(progress.durationRemaining)}</Text>
            <Text style={styles.distanceText}>{formatDistance(progress.distanceRemaining)}</Text>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleMute}
            activeOpacity={0.7}
          >
            {isMuted ? <VolumeX size={20} color="#FFFFFF" /> : <Volume2 size={20} color="#FFFFFF" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.stopButton}
            onPress={onStop}
            activeOpacity={0.7}
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeInfo: {
    flexDirection: 'column',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  distanceText: {
    color: '#DDDDDD',
    fontSize: 14,
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  }
});


