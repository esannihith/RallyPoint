import React, { useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Mic, MicOff } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { useNavigationStore } from '@/stores/navigationStore';
import { getManeuverIcon } from '@/services/mapboxService';

interface NavigationInstructionsProps {
  progress?: any;
  currentInstruction?: any;
}

export function NavigationInstructions({ progress, currentInstruction }: NavigationInstructionsProps) {
  const { isMuted, toggleMute } = useNavigationStore();
  const lastInstructionRef = useRef<string>('');
  const speechTimeoutRef = useRef<number | null>(null);

  // Format instruction text from Mapbox SDK data
  const getInstructionText = () => {
    if (!currentInstruction) return 'Continue straight';
    
    // Extract instruction text from Mapbox SDK format
    if (currentInstruction.primaryText) {
      return currentInstruction.primaryText;
    }
    
    if (currentInstruction.instruction) {
      return currentInstruction.instruction;
    }
    
    return 'Continue straight';
  };

  // Get maneuver type for icon
  const getManeuverType = () => {
    if (!currentInstruction) return 'continue';
    
    return currentInstruction.maneuverType || currentInstruction.type || 'continue';
  };

  // Get maneuver modifier for icon
  const getManeuverModifier = () => {
    if (!currentInstruction) return undefined;
    
    return currentInstruction.maneuverModifier || currentInstruction.modifier;
  };

  // Debounced speech function to prevent rapid repeated instructions
  const debouncedSpeak = useCallback((text: string) => {
    // Clear any existing timeout
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    
    // Only speak if the instruction has changed significantly
    if (text !== lastInstructionRef.current) {
      speechTimeoutRef.current = setTimeout(() => {
        Speech.stop();
        if (!isMuted) {
          Speech.speak(text);
          lastInstructionRef.current = text;
        }
      }, 1000); // 1 second debounce
    }
  }, [isMuted]);

  // Speak instruction if not muted (with debouncing)
  React.useEffect(() => {
    const instructionText = getInstructionText();
    if (instructionText) {
      debouncedSpeak(instructionText);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, [currentInstruction, debouncedSpeak]);

  if (!currentInstruction) {
    return null;
  }

  const instructionText = getInstructionText();

  return (
    <View style={styles.container}>
      <View style={styles.mainCard}>
        <View style={styles.mainInstruction}>
          <View style={styles.arrowContainer}>
            <Text style={styles.maneuverIcon}>
              {getManeuverIcon(getManeuverType(), getManeuverModifier())}
            </Text>
          </View>

          <View style={styles.instructionContent}>
            <Text style={styles.primaryInstructionText}>{instructionText}</Text>
          </View>

          <TouchableOpacity
            style={styles.micButton}
            activeOpacity={0.8}
            onPress={toggleMute}
          >
            {isMuted ? (
              <MicOff size={24} color="#FFFFFF" />
            ) : (
              <Mic size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {currentInstruction?.nextInstruction && (
        <View style={styles.nextCard}>
          <Text style={styles.nextText}>Then, {currentInstruction.nextInstruction}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  mainCard: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowContainer: {
    marginRight: 16,
  },
  maneuverIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  instructionContent: {
    flex: 1,
  },
  primaryInstructionText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 24,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  nextCard: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  nextText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
