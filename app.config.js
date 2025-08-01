export default {
  expo: {
    name: "WeMaps",
    slug: "wemaps-group-navigation",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "wemaps",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    platforms: ["ios", "android"],

    splash: {
      image: "./assets/images/Splash-screen.jpg",
      resizeMode: "cover",
    },

    ios: {
      supportsTablet: true,
      icon: "./assets/images/App-icon.png",
      bundleIdentifier: "com.wemaps.groupnavigation",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_NATIVE_KEY // Fixed prefix
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
          apiKey: process.env.GOOGLE_MAPS_NATIVE_KEY // Fixed prefix
        }
      }
    },

    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      // Fixed: Removed duplicate expo-location plugin
      [
        "expo-location"
      ],
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsImpl: "mapbox",
          RNMapboxMapsDownloadToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
        }
      ]
    ],

    extra: {
      "eas": {
        "projectId": "f7fd7692-9e75-45e3-9d87-95022a4bbf09"
      }
    },
    updates: {
      url: "https://u.expo.dev/f7fd7692-9e75-45e3-9d87-95022a4bbf09",
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0
    },
    runtimeVersion: "1.0.0",
    experiments: {
      typedRoutes: true
    }
  }
};