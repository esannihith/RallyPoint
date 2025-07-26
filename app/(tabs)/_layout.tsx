import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { House as Home, Users, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTabNavigationStore } from '@/stores/tabNavigationStore';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { getPreferredRoomsRoute } = useTabNavigationStore();
  
  const handleTabPress = (routeName: string) => {
    if (routeName === 'rooms') {
      const preferredRoute = getPreferredRoomsRoute();
      
      // If the preferred route is different from the default, navigate to it
      if (preferredRoute !== '/(tabs)/rooms') {
        router.push(preferredRoute as any);
        return { defaultPrevented: true };
      }
    }
    
    // For other tabs or default rooms behavior, allow normal navigation
    return { defaultPrevented: false };
  };
  
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
            android: 68 + insets.bottom, // Add bottom inset for Android
            default: 68,
          }),
          paddingBottom: Platform.select({
            ios: 20,
            android: Math.max(8, insets.bottom), // Use safe area bottom or minimum 8
            default: 8,
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
            const result = handleTabPress('rooms');
            if (!result.defaultPrevented) {
              router.push('/(tabs)/rooms');
            }
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