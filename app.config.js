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
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "AIzaSyAR8Sxn_UmTfySxL4DT1RefR8j-QYGntpA"
      }
    },
    android: {
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || "AIzaSyAR8Sxn_UmTfySxL4DT1RefR8j-QYGntpA"
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
    experiments: {
      typedRoutes: true
    }
  }
};