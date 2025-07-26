import polyline from '@mapbox/polyline';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface RouteStep {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
  html_instructions: string;
  polyline: {
    points: string;
  };
  start_location: {
    lat: number;
    lng: number;
  };
  travel_mode: string;
}

export interface RouteLeg {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  end_address: string;
  end_location: {
    lat: number;
    lng: number;
  };
  start_address: string;
  start_location: {
    lat: number;
    lng: number;
  };
  steps: RouteStep[];
}

export interface DirectionsRoute {
  bounds: {
    northeast: {
      lat: number;
      lng: number;
    };
    southwest: {
      lat: number;
      lng: number;
    };
  };
  copyrights: string;
  legs: RouteLeg[];
  overview_polyline: {
    points: string;
  };
  summary: string;
  warnings: string[];
  waypoint_order: number[];
}

export interface DirectionsResponse {
  geocoded_waypoints: any[];
  routes: DirectionsRoute[];
  status: string;
}

export interface ProcessedRoute {
  id: string;
  route: DirectionsRoute;
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  distance: string;
  duration: string;
  summary: string;
  isSelected: boolean;
}

export interface TravelMode {
  id: string;
  name: string;
  googleMode: string;
}

export const TRAVEL_MODES: TravelMode[] = [
  { id: 'driving', name: 'Driving', googleMode: 'driving' },
  { id: 'walking', name: 'Walking', googleMode: 'walking' },
  { id: 'bicycling', name: 'Bike', googleMode: 'bicycling' },
];

/**
 * Fetch directions from Google Directions API with alternatives
 */
export const getDirections = async (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  travelMode: string = 'driving'
): Promise<ProcessedRoute[]> => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is required');
  }

  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;
    
    // Map bicycling to TWO_WHEELER for API call
    const apiTravelMode = travelMode === 'bicycling' ? 'TWO_WHEELER' : travelMode;
    
    const url = `https://maps.googleapis.com/maps/api/directions/json?` +
      `origin=${originStr}&` +
      `destination=${destinationStr}&` +
      `mode=${apiTravelMode}&` +
      `alternatives=true&` +
      `key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: DirectionsResponse = await response.json();
    // console.log(data)
    
    if (data.status !== 'OK') {
      throw new Error(`Directions API error: ${data.status}`);
    }

    // Process routes
    const processedRoutes: ProcessedRoute[] = data.routes.map((route, index) => {
      // Decode polyline to coordinates
      const coordinates = polyline.decode(route.overview_polyline.points).map(([lat, lng]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      }));

      // Get total distance and duration from first leg
      const leg = route.legs[0];
      
      return {
        id: `route-${index}`,
        route,
        coordinates,
        distance: leg.distance.text,
        duration: leg.duration.text,
        summary: route.summary || `Route ${index + 1}`,
        isSelected: index === 0, // First route is selected by default
      };
    });

    return processedRoutes;

  } catch (error) {
    console.error('Error fetching directions:', error);
    throw error;
  }
};

/**
 * Get map region that fits all routes
 */
export const getRoutesBounds = (routes: ProcessedRoute[]) => {
  if (routes.length === 0) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  routes.forEach(route => {
    route.coordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });
  });

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const deltaLat = (maxLat - minLat) * 1.2; // Add padding
  const deltaLng = (maxLng - minLng) * 1.2;

  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: Math.max(deltaLat, 0.01),
    longitudeDelta: Math.max(deltaLng, 0.01),
  };
};

/**
 * Generate Google Maps deep link for navigation
 */
export const generateGoogleMapsLink = (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  travelMode: string = 'driving'
): string => {
  const originStr = `${origin.latitude},${origin.longitude}`;
  const destinationStr = `${destination.latitude},${destination.longitude}`;
  
  // Google Maps URL scheme
  return `https://www.google.com/maps/dir/${originStr}/${destinationStr}/@${destinationStr},15z/data=!3m1!4b1!4m2!4m1!3e${getModeParam(travelMode)}`;
};

/**
 * Get Google Maps mode parameter
 */
const getModeParam = (mode: string): string => {
  switch (mode) {
    case 'driving': return '0';
    case 'walking': return '2';
    case 'bicycling': return '1';
    default: return '0';
  }
};