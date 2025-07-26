export interface Location {
  latitude: number;
  longitude: number;
}

export interface PlaceResult {
  place_id: string;
  name?: string;
  formatted_address?: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  price_level?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  types?: string[];
  vicinity?: string;
  business_status?: string;
  user_ratings_total?: number;
  international_phone_number?: string;
  website?: string;
}

export interface AutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings?: Array<{
      offset: number;
      length: number;
    }>;
  };
  types: string[];
  terms: Array<{
    offset: number;
    value: string;
  }>;
}

export interface SavedPlace {
  id: string;
  name: string;
  address: string;
  type: 'saved' | 'recent' | 'home';
  latitude?: number;
  longitude?: number;
  placeId?: string;
  createdAt?: number;
}

export interface LocationStore {
  currentLocation: Location | null;
  selectedPlace: PlaceResult | null;
  isBottomSheetOpen: boolean;
  isLocationLoading: boolean;
  setCurrentLocation: (location: Location) => void;
  setSelectedPlace: (place: PlaceResult | null) => void;
  setBottomSheetOpen: (isOpen: boolean) => void;
  setLocationLoading: (isLoading: boolean) => void;
  getCurrentLocation: () => Location | null;
  getSelectedPlace: () => PlaceResult | null;
  getLocationLoadingState: () => boolean;
}

export interface NavigationLocation {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

export interface NavigationStore {
  fromLocation: NavigationLocation | null;
  toLocation: NavigationLocation | null;
  isDirectionsMode: boolean;
  setFromLocation: (location: NavigationLocation | null) => void;
  setToLocation: (location: NavigationLocation | null) => void;
  swapLocations: () => void;
  clearNavigation: () => void;
  setDirectionsMode: (isActive: boolean) => void;
  getFromLocation: () => NavigationLocation | null;
  getToLocation: () => NavigationLocation | null;
  getDirectionsMode: () => boolean;
  canGetDirections: () => boolean;
}

// Re-export auth, room, and navigation types
export * from './auth';
export * from './rooms';
export * from './navigation';