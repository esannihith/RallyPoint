import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Navigation } from 'lucide-react-native';

interface DirectionsFabProps {
  onPress: () => void;
}

export const DirectionsFab: React.FC<DirectionsFabProps> = ({ onPress }) => (
  <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.85}>
    <Navigation size={28} color="#fff" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#8B5CF6',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    zIndex: 1000,
  },
});
