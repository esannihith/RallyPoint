declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: string;
      GOOGLE_MAPS_API_KEY: string;
    }
  }
}

// Ensure this file is treated as a module
export {};