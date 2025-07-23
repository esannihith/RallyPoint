import { Stack } from 'expo-router';

export default function RoomsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="create" />
      <Stack.Screen name="join" />
    </Stack>
  );
}