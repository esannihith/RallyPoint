import { Tabs, router } from 'expo-router';
import { Platform } from 'react-native';
import { House as Home, Users, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- (1) Import both stores ---
import { useTabNavigationStore } from '@/stores/tabNavigationStore';
import { useAuthStore } from '@/stores/authStore';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // --- (2) Get the required state from both stores ---
  const { lastRoomsRoute, userExplicitlyReturnedToIndex } = useTabNavigationStore();
  const { isAuthenticated } = useAuthStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1976D2',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: Platform.select({
            ios: 88,
            android: 68 + insets.bottom,
          }),
          paddingBottom: Platform.select({
            ios: 20,
            android: Math.max(8, insets.bottom),
          }),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: 'Rooms',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            // Always go to index if not authenticated
            if (!isAuthenticated) {
              router.push('/(tabs)/rooms');
              return;
            }
            // If authenticated and not explicitly returned to index, go to the last screen
            if (!userExplicitlyReturnedToIndex && lastRoomsRoute !== '/(tabs)/rooms') {
              router.push(lastRoomsRoute as any);
              return;
            }
            // Default: go to index
            router.push('/(tabs)/rooms');
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}