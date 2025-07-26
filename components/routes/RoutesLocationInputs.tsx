import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowUpDown, MapPin } from 'lucide-react-native';

interface Location {
  name?: string;
  latitude: number;
  longitude: number;
}

interface Props {
  from: Location | null;
  to: Location | null;
  onFromPress: () => void;
  onToPress: () => void;
  onSwap: () => void;
}

export function RoutesLocationInputs({ from, to, onFromPress, onToPress, onSwap }: Props) {
  return (
    <View style={styles.container}>
      {/* Icon Column */}
      <View style={styles.iconColumn}>
        <View style={styles.iconDot} />
        <View style={styles.verticalLine} />
        <MapPin size={16} color="#EF4444" />
      </View>

      {/* Text Input Column */}
      <View style={styles.inputColumn}>
        <TouchableOpacity onPress={onFromPress} activeOpacity={0.8} style={styles.row}>
          <Text
            style={styles.text}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {from?.name || 'Your location'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity onPress={onToPress} activeOpacity={0.8} style={styles.row}>
          <Text
            style={styles.text}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {to?.name || 'Choose destination'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Swap Button Column */}
      <View style={styles.swapColumn}>
        <TouchableOpacity style={styles.swapButton} onPress={onSwap}>
          <ArrowUpDown size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 340, // slightly reduced
    width: '100%',
  },
  iconColumn: {
    alignItems: 'center',
    marginRight: 8,
  },
  iconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  verticalLine: {
    width: 1.5,
    height: 20,
    backgroundColor: '#D1D5DB',
    marginVertical: 4,
  },
  inputColumn: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8, // prevent text hugging right edge
  },
  row: {
    paddingVertical: 6,
  },
  text: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    flexShrink: 1,        // allow to shrink
    maxWidth: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  swapColumn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  swapButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1,
  },
});
