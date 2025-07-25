import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

interface UseAndroidBackHandlerProps {
  onBackPress: () => boolean; // Return true to prevent default behavior
}

export function useAndroidBackHandler({ onBackPress }: UseAndroidBackHandlerProps) {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => backHandler.remove();
  }, [onBackPress]);
}