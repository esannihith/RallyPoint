import { Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useTabNavigationStore } from '@/stores/tabNavigationStore';

export default function RoomsTabLayout() {
  const pathname = usePathname();
  const { setLastRoomsRoute, pushRoomsHistory } = useTabNavigationStore();
  
  // Track route changes within rooms tab
  useEffect(() => {
    if (pathname.startsWith('/(tabs)/rooms')) {
      setLastRoomsRoute(pathname);
      
      // Only push to history if it's a room-map route (to track deeper navigation)
      if (pathname.includes('room-map')) {
        pushRoomsHistory(pathname);
      }
    }
  }, [pathname, setLastRoomsRoute, pushRoomsHistory]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="room-map" />
    </Stack>
  );
}
