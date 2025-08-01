import type { NavigationLocation } from './index';
export interface NavigationStep {
  id: string;
  instruction: string;
  distance: number;
  duration: number;
  maneuver: {
    type: string;
    modifier?: string;
    bearing_after: number;
    bearing_before: number;
    location: [number, number];
  };
  geometry: {
    coordinates: [number, number][];
  };
  voiceInstructions: VoiceInstruction[];
  bannerInstructions: BannerInstruction[];
}

export interface VoiceInstruction {
  distanceAlongGeometry: number;
  announcement: string;
  ssmlAnnouncement: string;
}

export interface BannerInstruction {
  distanceAlongGeometry: number;
  primary: {
    text: string;
    components: Array<{
      text: string;
      type: string;
    }>;
  };
  secondary?: {
    text: string;
    components: Array<{
      text: string;
      type: string;
    }>;
  };
}

export interface NavigationRoute {
  distance: number;
  duration: number;
  geometry: string;
  steps: NavigationStep[];
  voiceLocale: string;
}

export interface NavigationProgress {
  distanceRemaining: number;
  durationRemaining: number;
  distanceTraveled: number;
  fractionTraveled: number;
  currentStepIndex: number;
  currentStep: NavigationStep | null;
  nextStep: NavigationStep | null;
  upcomingStep: NavigationStep | null;
}


export interface NavigationState {
  isNavigating: boolean;
  route: NavigationRoute | null;
  currentLocation: {
    latitude: number;
    longitude: number;
    bearing: number;
    speed: number;
  } | null;
  isMuted: boolean;
  
  // Directions mode properties
  fromLocation: NavigationLocation | null;
  toLocation: NavigationLocation | null;
  isDirectionsMode: boolean;
  
  // Navigation actions
  startNavigation: (route: NavigationRoute) => void;
  stopNavigation: () => void;
  updateLocation: (location: {
    latitude: number;
    longitude: number;
    bearing: number;
    speed: number;
  }) => void;
  toggleMute: () => void;
  
  // Directions actions
  setFromLocation: (location: NavigationLocation | null) => void;
  setToLocation: (location: NavigationLocation | null) => void;
  swapLocations: () => void;
  clearNavigation: () => void;
  resetNavigation: () => void;
  setDirectionsMode: (enabled: boolean) => void;
  canGetDirections: () => boolean;
  getFromLocation: () => NavigationLocation | null;
  getToLocation: () => NavigationLocation | null;
  getDirectionsMode: () => boolean;
}

export interface MapboxDirectionsResponse {
  routes: Array<{
    distance: number;
    duration: number;
    geometry: string;
    legs: Array<{
      steps: Array<{
        distance: number;
        duration: number;
        geometry: string;
        maneuver: {
          type: string;
          modifier?: string;
          bearing_after: number;
          bearing_before: number;
          location: [number, number];
          instruction: string;
        };
        name: string;
        voiceInstructions: VoiceInstruction[];
        bannerInstructions: BannerInstruction[];
      }>;
    }>;
  }>;
  waypoints: Array<{
    location: [number, number];
    name: string;
  }>;
  code: string;
  uuid: string;
}

export type ManeuverType = 
  | 'turn'
  | 'new name'
  | 'depart'
  | 'arrive'
  | 'merge'
  | 'on ramp'
  | 'off ramp'
  | 'fork'
  | 'end of road'
  | 'continue'
  | 'roundabout'
  | 'rotary'
  | 'roundabout turn'
  | 'notification'
  | 'exit roundabout'
  | 'exit rotary';

export type ManeuverModifier =
  | 'uturn'
  | 'sharp right'
  | 'right'
  | 'slight right'
  | 'straight'
  | 'slight left'
  | 'left'
  | 'sharp left';