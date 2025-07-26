import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, ChevronRight, Bell, Shield, CircleHelp as HelpCircle, LogOut, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileScreen() {
  const { user, isAuthenticated, isLoading, signOut } = useAuthStore();
  const insets = useSafeAreaInsets();

  const menuItems = [
    { label: 'Notifications', icon: Bell, hasChevron: true },
    { label: 'Privacy & Security', icon: Shield, hasChevron: true },
    { label: 'Help & Support', icon: HelpCircle, hasChevron: true },
    { label: 'Settings', icon: Settings, hasChevron: true },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSignIn = () => {
    router.push('/signin');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 } // Add bottom safe area padding
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <User size={40} color="#8B5CF6" />
            </View>
          </View>
          
          {isAuthenticated && user ? (
            <>
              <Text style={styles.userName}>{user.name}</Text>
              {user.email && (
                <Text style={styles.userEmail}>{user.email}</Text>
              )}
              <Text style={styles.userJoined}>
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.signInTitle}>Welcome to WeMaps</Text>
              <Text style={styles.signInSubtitle}>
                Sign in to access your profile and rooms
              </Text>
              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleSignIn}
                activeOpacity={0.8}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && styles.lastMenuItem,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <item.icon size={20} color="#757575" />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </View>
                {item.hasChevron && (
                  <ChevronRight size={20} color="#BDBDBD" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign Out Button - Only show when authenticated */}
        {isAuthenticated && (
          <TouchableOpacity 
            style={styles.signOutButton} 
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <LogOut size={20} color="#FFFFFF" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 4,
  },
  userJoined: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  signInTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  signInSubtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  signInButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 32,
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
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#212121',
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 32,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
