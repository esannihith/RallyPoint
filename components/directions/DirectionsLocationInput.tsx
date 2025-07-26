import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { NavigationLocation } from '@/types';

interface DirectionsLocationInputProps {
  type: 'from' | 'to';
  location: NavigationLocation | null;
  onPress: () => void;
  placeholder: string;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
}

export function DirectionsLocationInput({
  type,
  location,
  onPress,
  placeholder,
  containerStyle,
  inputStyle,
}: DirectionsLocationInputProps) {
  const isFrom = type === 'from';

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Route Indicator */}
      <View style={styles.routeIndicator}>
        <View style={[
          styles.routeDot,
          isFrom ? styles.fromDot : styles.toDot
        ]} />
        {!isFrom && <View style={styles.routeLine} />}
      </View>

      {/* Input Container */}
      <TouchableOpacity
        style={[
          styles.inputContainer,
          location && styles.filledInput,
          inputStyle,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.inputContent}>
          {location ? (
            <View style={styles.locationInfo}>
              <Text style={styles.locationName} numberOfLines={1}>
                {location.name}
              </Text>
            </View>
          ) : (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeIndicator: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 2,
  },
  fromDot: { 
    backgroundColor: '#34D399' 
  },
  toDot: { 
    backgroundColor: '#EF4444' 
  },
  routeLine: {
    position: 'absolute',
    top: -20,
    width: 2,
    height: 32,
    backgroundColor: '#D1D5DB',
    zIndex: 1,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 48,
  },
  filledInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  inputContent: {
    flex: 1,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  placeholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});