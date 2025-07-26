import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Hash } from 'lucide-react-native';
import { useRoomStore } from '@/stores/roomStore';
import { useAuthStore } from '@/stores/authStore';
import { JoinRoomRequest } from '@/types/rooms';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';

export default function JoinRoomScreen() {
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { joinRoom } = useRoomStore();
  const { isAuthenticated } = useAuthStore();

  // Android back handler
  useAndroidBackHandler({
    onBackPress: () => {
      handleBack();
      return true;
    }
  });

  const handleBack = () => {
    // Route directly to rooms tab instead of going back through navigation chain
    router.replace('/(tabs)/rooms');
  };

  const handleJoinRoom = async () => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'Please sign in to join a room');
      router.push('/signin');
      return;
    }

    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a join code');
      return;
    }

    if (joinCode.trim().length !== 6) {
      Alert.alert('Error', 'Join code must be exactly 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const request: JoinRoomRequest = {
        joinCode: joinCode.trim().toUpperCase(),
      };

      const room = await joinRoom(request);
      
      Alert.alert(
        'Joined Room',
        `You've successfully joined "${room.name}"!`,
        [
          {
            text: 'Go to Room',
            onPress: () => {
              // Navigate to room-map (socket connection is handled by roomStore)
              router.replace({
                pathname: '/(tabs)/rooms/room-map' as any,
                params: { roomId: room.id }
              });
            },
          },
        ]
      );

    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  const formatJoinCode = (text: string) => {
    // Remove non-alphanumeric characters and convert to uppercase
    const cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return cleaned.slice(0, 6); // Limit to 6 characters
  };

  const handleJoinCodeChange = (text: string) => {
    const formatted = formatJoinCode(text);
    setJoinCode(formatted);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Private Room</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enter Join Code</Text>
            <Text style={styles.sectionDescription}>
              Ask the room owner for the 6-character join code
            </Text>
            
            <View style={styles.inputContainer}>
              <Hash size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon, styles.codeInput]}
                placeholder="ABC123"
                value={joinCode}
                onChangeText={handleJoinCodeChange}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleJoinRoom}
              />
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Join codes are case-insensitive and unique to each room
              </Text>
            </View>

            {/* Demo codes for testing */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Demo Codes (for testing):</Text>
              <TouchableOpacity
                style={styles.demoCode}
                onPress={() => setJoinCode('TEST01')}
                activeOpacity={0.7}
              >
                <Text style={styles.demoCodeText}>TEST01</Text>
                <Text style={styles.demoCodeDesc}>Weekend Trip to Goa</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Join Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.joinButton,
                (!joinCode.trim() || isLoading) && styles.joinButtonDisabled
              ]}
              onPress={handleJoinRoom}
              disabled={!joinCode.trim() || isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.joinButtonText}>
                {isLoading ? 'Joining Room...' : 'Join Private Room'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Help Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpText}>
              • Ask the room owner to share the join code{'\n'}
              • Make sure you&apos;re connected to the internet{'\n'}
              • Check that the room is still active{'\n'}
              • Verify the join code is entered correctly
            </Text>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 32,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputWithIcon: {
    paddingLeft: 48,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  codeInput: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    textAlign: 'center',
    paddingLeft: 16,
  },
  infoBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  demoSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  demoCode: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  demoCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 2,
  },
  demoCodeDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  buttonContainer: {
    marginTop: 32,
  },
  joinButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  joinButtonDisabled: {
    backgroundColor: '#D1D5DB',
    elevation: 0,
    shadowOpacity: 0,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helpSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 32,
  },
});