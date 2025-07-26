import polyline from '@mapbox/polyline';
import { NavigationRoute, NavigationStep, MapboxDirectionsResponse } from '@/types/navigation';

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

if (!MAPBOX_ACCESS_TOKEN) {
  console.warn('Mapbox access token not found. Please set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables.');
}

/**
 * Get navigation route from Mapbox Directions API
 */
export const getNavigationRoute = async (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<NavigationRoute | null> => {
  if (!MAPBOX_ACCESS_TOKEN) {
    throw new Error('Mapbox access token is required');
  }

  try {
    const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}` +
      `?alternatives=false` +
      `&geometries=polyline` +
      `&language=en` +
      `&overview=full` +
      `&steps=true` +
      `&continue_straight=true` +
      `&waypoint_names=;` +
      `&voice_instructions=true` +
      `&banner_instructions=true` +
      `&voice_units=metric` +
      `&access_token=${MAPBOX_ACCESS_TOKEN}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: MapboxDirectionsResponse = await response.json();
    
    if (data.code !== 'Ok' || !data.routes.length) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // Process steps
    const steps: NavigationStep[] = leg.steps.map((step, index) => ({
      id: `step-${index}`,
      instruction: step.maneuver.instruction,
      distance: step.distance,
      duration: step.duration,
      maneuver: {
        type: step.maneuver.type,
        modifier: step.maneuver.modifier,
        bearing_after: step.maneuver.bearing_after,
        bearing_before: step.maneuver.bearing_before,
        location: step.maneuver.location,
      },
      geometry: {
        coordinates: polyline.decode(step.geometry).map(([lat, lng]: [number, number]) => [lng, lat]),
      },
      voiceInstructions: step.voiceInstructions || [],
      bannerInstructions: step.bannerInstructions || [],
    }));

    return {
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      steps,
      voiceLocale: 'en-US',
    };

  } catch (error) {
    console.error('Error fetching navigation route:', error);
    throw error;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

/**
 * Calculate bearing between two coordinates
 */
export const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);

  return (θ * 180 / Math.PI + 360) % 360;
};

/**
 * Format distance for display
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
};

/**
 * Format duration for display
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Get maneuver icon based on type and modifier
 */
export const getManeuverIcon = (type: string, modifier?: string): string => {
  switch (type) {
    case 'turn':
      switch (modifier) {
        case 'left': return '↰';
        case 'right': return '↱';
        case 'sharp left': return '↺';
        case 'sharp right': return '↻';
        case 'slight left': return '↖';
        case 'slight right': return '↗';
        case 'uturn': return '↶';
        default: return '↑';
      }
    case 'depart': return '🚗';
    case 'arrive': return '🏁';
    case 'merge': return '⤴';
    case 'on ramp': return '↗';
    case 'off ramp': return '↘';
    case 'fork': return '⑂';
    case 'roundabout': return '⭕';
    case 'continue':
    case 'new name':
    default: return '↑';
  }
};