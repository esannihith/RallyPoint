import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Car, Bike, PersonStanding } from 'lucide-react-native';
import { TravelMode } from '@/services/directionsService';

interface TravelModeSelectorProps {
  modes: TravelMode[];
  selectedMode: string;
  onModeSelect: (mode: string) => void;
}

export function TravelModeSelector({ modes, selectedMode, onModeSelect }: TravelModeSelectorProps) {
  // Filter out transit mode
  const filteredModes = modes.filter(mode => mode.id !== 'transit');

  const getIcon = (modeId: string, isSelected: boolean) => {
    const color = isSelected ? "#8B5CF6" : "#6B7280";
    const size = 20;
    
    switch (modeId) {
      case 'driving':
        return <Car size={size} color={color} />;
      case 'bicycling':
        return <Bike size={size} color={color} />;
      case 'walking':
        return <PersonStanding size={size} color={color} />;
      default:
        return <Car size={size} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredModes.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={[
              styles.modeButton,
              selectedMode === mode.id && styles.selectedModeButton
            ]}
            onPress={() => onModeSelect(mode.id)}
            activeOpacity={0.7}
          >
            <View style={styles.modeIcon}>
              {getIcon(mode.id, selectedMode === mode.id)}
            </View>

          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  modeButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  selectedModeButton: {
    backgroundColor: '#EEF2FF',
    borderColor: '#8B5CF6',
  },
  modeIcon: {
    marginBottom: 4,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

});