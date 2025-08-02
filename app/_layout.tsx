import React, { useEffect, useState, useCallback } from 'react';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatModal } from '@/components/chat/ChatModal';
import { ChatMessage } from '@/types/socket';
import { useRoomStore } from '@/stores/roomStore';
import { useAuthStore } from '@/stores/authStore';
import { socketService } from '@/services/socketService';
import { Stack } from 'expo-router';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import Mapbox from '@rnmapbox/maps';

// Initialize Mapbox
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');

// Disable Reanimated strict mode warnings globally
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

// Suppress NativeEventEmitter warnings for native modules
import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  'new NativeEventEmitter()', // Hide warnings about NativeEventEmitter
  '`new NativeEventEmitter()` was called with a non-null argument without the required `addListener` method.',
  '`new NativeEventEmitter()` was called with a non-null argument without the required `removeListeners` method.',
  'ViewTagResolver', // Hide Mapbox ViewTagResolver warnings
  'Mapbox [error] ViewTagResolver', // Hide specific Mapbox errors
]);

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const isChatOpen = useRoomStore((s) => s.isChatOpen);
  const setChatOpen = useRoomStore((s) => s.setChatOpen);
  const resetUnreadCount = useRoomStore((s) => s.resetUnreadCount);
  const activeRoom = useRoomStore((s) => s.activeRoom);
  const messages = useRoomStore((s) => s.chatMessages);
  const addChatMessage = useRoomStore((s) => s.addChatMessage);
  const isChatHistoryLoading = useRoomStore((s) => s.isChatHistoryLoading);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loadRooms = useRoomStore((s) => s.loadRooms);

  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function prepareApp() {
      try {
        // Check for and apply updates
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          // Only reload if update is available, then exit early
          await Updates.reloadAsync();
          return;
        }
      } catch (e) {
        console.warn(e);
      } finally {
        if (isMounted) setAppIsReady(true);
      }
    }
    prepareApp();
    return () => { isMounted = false; };
  }, []);

   // Global room loading logic: load rooms on app start if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadRooms();
    }
  }, [isAuthenticated, user, loadRooms]);

  

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <ChatBubble onPress={() => { setChatOpen(true); resetUnreadCount(); }} isChatOpen={isChatOpen} />
        {isChatOpen && activeRoom && user && (
          <ChatModal
            visible={isChatOpen}
            onClose={() => setChatOpen(false)}
            roomId={activeRoom.id}
            roomName={activeRoom.name}
            messages={messages}
            isChatHistoryLoading={isChatHistoryLoading}
            onSendMessage={(content) => {
              // Create optimistic message
              const clientTempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const optimisticMessage: ChatMessage = {
                id: clientTempId, // Temporary ID
                clientTempId,
                roomId: activeRoom.id,
                userId: user.id,
                userName: user.name,
                content,
                timestamp: new Date().toISOString(),
                status: 'sending',
              };
              
              // Add optimistic message to local state
              addChatMessage(optimisticMessage);
              
              // Send message to server with clientTempId
              socketService.sendMessage(activeRoom.id, content, clientTempId);
            }}
            currentUserId={user.id}
          />
        )}
        <StatusBar style="dark" />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}