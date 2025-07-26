import React, { useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Mic, MicOff } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { useNavigationStore } from '@/stores/navigationStore';
import { calculateDistance, getManeuverIcon } from '@/services/mapboxService';

export function NavigationInstructions() {
  const { progress, currentLocation, isMuted, toggleMute } = useNavigationStore();
  const lastInstructionRef = useRef<string>('');
  const speechTimeoutRef = useRef<number | null>(null);

  const navigationData = useMemo(() => {
    if (!progress?.currentStep || !currentLocation) {
      return null;
    }

    const { currentStep, nextStep, upcomingStep } = progress;

    // Determine if current step is non-maneuver straight
    const lower = currentStep.instruction.toLowerCase();
    const isStraight = lower.includes('straight') || lower.includes('travel');
    const isHeadContinue = lower.includes('head') || lower.includes('continue');
    const isDepartArrive = ['depart', 'arrive'].includes(currentStep.maneuver.type);
    const isNonManeuver = (isDepartArrive || isHeadContinue) && !isStraight;

    // Promote nextStep if needed
    const primaryStep = isNonManeuver && nextStep ? nextStep : currentStep;
    const previewStep = isNonManeuver ? upcomingStep : nextStep;

    // Calculate distance
    const [lng, lat] = primaryStep.maneuver.location;
    const { latitude: uLat, longitude: uLng } = currentLocation;
    const dist = calculateDistance(uLat, uLng, lat, lng);
    const roundedDist = dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km`;

    const primaryText = `In ${roundedDist}, ${primaryStep.instruction}`;

    return { primaryStep, previewStep, primaryText };
  }, [progress, currentLocation]);

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
    if (navigationData?.primaryText) {
      debouncedSpeak(navigationData.primaryText);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, [navigationData, debouncedSpeak]);

  if (!navigationData) {
    return null;
  }

  const { primaryStep, previewStep, primaryText } = navigationData;

  return (
    <View style={styles.container}>
      <View style={styles.mainCard}>
        <View style={styles.mainInstruction}>
          <View style={styles.arrowContainer}>
            <Text style={styles.maneuverIcon}>
              {getManeuverIcon(primaryStep.maneuver.type, primaryStep.maneuver.modifier)}
            </Text>
          </View>

          <View style={styles.instructionContent}>
            <Text style={styles.primaryInstructionText}>{primaryText}</Text>
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

      {previewStep && (
        <View style={styles.nextCard}>
          <Text style={styles.nextText}>Then, {previewStep.instruction}</Text>
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
