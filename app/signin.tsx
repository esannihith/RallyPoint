import React, { useState } from 'react';
import * as Network from 'expo-network';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, User, Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';

export default function SignInScreen() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signIn, signUp } = useAuthStore();

  // Android back handler
  useAndroidBackHandler({
    onBackPress: () => {
      handleBack();
      return true;
    }
  });

  const handleBack = () => {
    router.back();
  };

  const handleSignIn = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Additional validation for sign-up
    if (isSignUp) {
      if (!confirmPassword.trim()) {
        setError('Please confirm your password');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Password strength validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(password)) {
        setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
        return;
      }
    }

    // Network connectivity check
    const netState = await Network.getNetworkStateAsync();
    if (!netState.isConnected) {
      setError('No Internet. Please check your connection and try again.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        await signUp(name.trim(), password);
      } else {
        await signIn(name.trim(), password);
      }
      router.back(); // Go back to previous screen after successful authentication
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setConfirmPassword('');
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
        <Text style={styles.headerTitle}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <User size={64} color="#8B5CF6" />
          </View>

          <Text style={styles.title}>Welcome to WeMaps</Text>
          <Text style={styles.subtitle}>
            {isSignUp 
              ? 'Create your account to get started with group navigation'
              : 'Sign in to continue with group navigation'
            }
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                error && styles.inputError
              ]}
              placeholder="Your name"
              placeholderTextColor="#8B5CF6"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError(null); // Clear error when user starts typing
              }}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={50}
              editable={!isLoading}
              returnKeyType="next"
            />
            
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  error && styles.inputError
                ]}
                placeholder="Password"
                placeholderTextColor="#8B5CF6"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={100}
                editable={!isLoading}
                returnKeyType={isSignUp ? "next" : "done"}
                onSubmitEditing={isSignUp ? undefined : handleSignIn}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <Eye size={20} color="#6B7280" />
                ) : (
                  <EyeOff size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>

            {isSignUp && (
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    error && styles.inputError
                  ]}
                  placeholder="Confirm Password"
                  placeholderTextColor="#8B5CF6"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (error) setError(null);
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={100}
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <Eye size={20} color="#6B7280" />
                  ) : (
                    <EyeOff size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
            )}

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.signInButton,
              ((!name.trim() || !password.trim() || (isSignUp && !confirmPassword.trim())) || isLoading) && styles.signInButtonDisabled
            ]}
            onPress={handleSignIn}
            disabled={(!name.trim() || !password.trim() || (isSignUp && !confirmPassword.trim())) || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.signInButtonText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleMode}
            disabled={isLoading}
          >
            <Text style={styles.toggleButtonText}>
              {isSignUp 
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"
              }
            </Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            {isSignUp 
              ? 'By signing up, you agree to our terms and conditions'
              : 'Welcome back! Sign in to continue your navigation journey'
            }
          </Text>
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
  },
  passwordInput: {
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 18,
    padding: 4,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 8,
    textAlign: 'center',
  },
  signInButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  signInButtonDisabled: {
    backgroundColor: '#D1D5DB',
    elevation: 0,
    shadowOpacity: 0,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toggleButton: {
    marginBottom: 24,
    paddingVertical: 12,
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
    textAlign: 'center',
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});