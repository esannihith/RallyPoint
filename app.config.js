export default {
  expo: {
    name: "WeMaps - Group Navigation",
    slug: "wemaps-group-navigation",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/Splash-screen.jpg",
    scheme: "wemaps",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    platforms: ["ios", "android"],
    splash: {
      image: "./assets/images/Splash-screen.jpg",
      resizeMode: "cover",
      backgroundColor: "#8B5CF6"
    },
    ios: {
      supportsTablet: true
    },
    android: {},
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
      API_URL: process.env.EXPO_PUBLIC_API_URL
    },
    experiments: {
      typedRoutes: true
    }
  }
};