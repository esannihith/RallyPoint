import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';

export const getDeviceInfo = async () => {
  try {
    let batteryLevel = null;
    let deviceModel = null;

    // Get battery level (only on native platforms)
    if (Platform.OS !== 'web') {
      try {
        const level = await Battery.getBatteryLevelAsync();
        batteryLevel = Math.round(level * 100);
      } catch (error) {
        console.warn('Could not get battery level:', error);
      }
    }

    // Get device model
    if (Device.modelName) {
      deviceModel = Device.modelName;
    } else if (Platform.OS === 'web') {
      deviceModel = navigator.userAgent.split(' ')[0] || 'Web Browser';
    } else {
      deviceModel = `${Platform.OS} Device`;
    }

    return {
      batteryLevel,
      deviceModel,
      platform: Platform.OS,
    };
  } catch (error) {
    console.error('Error getting device info:', error);
    return {
      batteryLevel: null,
      deviceModel: Platform.OS === 'web' ? 'Web Browser' : `${Platform.OS} Device`,
      platform: Platform.OS,
    };
  }
};