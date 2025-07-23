import { PlaceResult, AutocompletePrediction } from '@/types';

// Google Maps Places API service
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('Google Maps API key not found. Please set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.');
}

/**
 * Search for places using Google Places Autocomplete API
 * Focused on India region
 */
export const searchPlaces = async (query: string): Promise<AutocompletePrediction[]> => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key is required');
    return [];
  }

  if (!query.trim() || query.trim().length < 2) {
    return [];
  }

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    // Focus search on India with country restriction and bias
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodedQuery}&key=${GOOGLE_MAPS_API_KEY}&types=establishment|geocode&components=country:in&location=20.5937,78.9629&radius=2000000&strictbounds=false`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK') {
      return data.predictions || [];
    } else if (data.status === 'ZERO_RESULTS') {
      return [];
    } else {
      console.error('Google Places API error:', data.status, data.error_message);
      return [];
    }
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
};

/**
 * Get detailed information about a place using Google Places Details API
 */
export const getPlaceDetails = async (placeId: string): Promise<PlaceResult | null> => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key is required');
    return null;
  }

  if (!placeId) {
    console.error('Place ID is required');
    return null;
  }

  try {
    const fields = [
      'place_id',
      'name',
      'formatted_address',
      'geometry',
      'rating',
      'price_level',
      'photos',
      'opening_hours',
      'types',
      'vicinity',
      'business_status',
      'user_ratings_total',
      'international_phone_number',
      'website',
      'url'
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;
    
    // console.log('Fetching place details for:', placeId);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    // console.log('Place details response:', data);
    
    if (data.status === 'OK') {
      return data.result || null;
    } else {
      console.error('Google Places Details API error:', data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error('Error getting place details:', error);
    return null;
  }
};

/**
 * Get photo URL from Google Places Photo API
 */
export const getPlacePhotoUrl = (photoReference: string, maxWidth: number = 400): string => {
  if (!GOOGLE_MAPS_API_KEY || !photoReference) {
    console.warn('Missing API key or photo reference:', { 
      hasApiKey: !!GOOGLE_MAPS_API_KEY, 
      photoReference 
    });
    return '';
  }
  
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
  // console.log('Generated photo URL:', url);
  return url;
};

/**
 * Utility function to format place types for display
 */
export const formatPlaceTypes = (types: string[]): string[] => {
  const typeMap: Record<string, string> = {
    'restaurant': 'Restaurant',
    'food': 'Food',
    'establishment': 'Business',
    'point_of_interest': 'Point of Interest',
    'store': 'Store',
    'shopping_mall': 'Shopping Mall',
    'gas_station': 'Gas Station',
    'hospital': 'Hospital',
    'pharmacy': 'Pharmacy',
    'bank': 'Bank',
    'atm': 'ATM',
    'lodging': 'Hotel',
    'tourist_attraction': 'Tourist Attraction',
    'park': 'Park',
    'gym': 'Gym',
    'beauty_salon': 'Beauty Salon',
    'car_repair': 'Auto Repair',
    'school': 'School',
    'university': 'University',
    'library': 'Library',
    'church': 'Church',
    'mosque': 'Mosque',
    'synagogue': 'Synagogue',
    'hindu_temple': 'Temple',
    'train_station': 'Train Station',
    'subway_station': 'Metro Station',
    'bus_station': 'Bus Station',
    'airport': 'Airport'
  };

  return types
    .filter(type => typeMap[type])
    .map(type => typeMap[type])
    .slice(0, 3); // Limit to 3 types for display
};

/**
 * Get contextual icon color based on place types
 */
export const getPlaceIconColor = (types: string[]): string => {
  if (types.includes('restaurant') || types.includes('food')) {
    return '#FF5722';
  }
  if (types.includes('gas_station')) {
    return '#4CAF50';
  }
  if (types.includes('hospital') || types.includes('pharmacy')) {
    return '#F44336';
  }
  if (types.includes('shopping_mall') || types.includes('store')) {
    return '#9C27B0';
  }
  if (types.includes('tourist_attraction') || types.includes('park')) {
    return '#4CAF50';
  }
  if (types.includes('train_station') || types.includes('subway_station') || types.includes('bus_station')) {
    return '#2196F3';
  }
  if (types.includes('airport')) {
    return '#607D8B';
  }
  if (types.includes('hindu_temple') || types.includes('mosque') || types.includes('church')) {
    return '#FF9800';
  }
  return '#1976D2';
};