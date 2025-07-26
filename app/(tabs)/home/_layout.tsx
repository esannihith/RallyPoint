import { Stack } from 'expo-router';

export default function HomeStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="directions" options={{ title: "Directions" }} />
      <Stack.Screen name="routes" options={{ title: "Routes" }} />
      <Stack.Screen name="navigation" options={{ title: "Navigation" }} />
    </Stack>
  );
}
