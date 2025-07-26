import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { User, LogIn } from 'lucide-react-native';
import { router } from 'expo-router';

export function SignInPrompt() {
  const handleSignIn = () => {
    router.push('/signin');
  };

  return (
    <View style={styles.container}>
      <User size={64} color="#D1D5DB" />
      <Text style={styles.title}>Sign in to view rooms</Text>
      <Text style={styles.subtitle}>
        Create and join private navigation rooms with friends
      </Text>
      <TouchableOpacity
        style={styles.signInButton}
        onPress={handleSignIn}
        activeOpacity={0.8}
      >
        <LogIn size={20} color="#FFFFFF" />
        <Text style={styles.signInButtonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});