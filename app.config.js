export default {
  expo: {
    name: "WeMaps - Group Navigation",
    slug: "wemaps-group-navigation",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "wemaps",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    platforms: ["ios", "android"],

    // Shared app icon for iOS


    splash: {
      image: "./assets/images/Splash-screen.jpg",
      resizeMode: "cover",
    },

    ios: {
      supportsTablet: true,
      icon: "./assets/images/App-icon.png",
      bundleIdentifier: "com.wemaps.groupnavigation",
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    },

    android: {
      package: "com.wemaps.groupnavigation",
      adaptiveIcon: {
        foregroundImage: "./assets/images/App-icon.png",
        backgroundColor: "#FFFFFF"
      },
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      }
    },

    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      "expo-location",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow WeMaps to use your location to show your position on the map and enable navigation features."
        }
      ]
    ],

    extra: {
      GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
      API_URL: process.env.EXPO_PUBLIC_API_URL,
      eas: {
        projectId: "5c3659a1-6ac0-4cbb-ab66-7bf0123cc431"
      }
    },
    updates: {
      url: "https://u.expo.dev/5c3659a1-6ac0-4cbb-ab66-7bf0123cc431",
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    experiments: {
      typedRoutes: true
    }
  }
};
