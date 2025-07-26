import { DestinationLocation } from '@/types/rooms';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('Google Maps API key not found. Please set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.');
}

/**
 * Reverse geocode coordinates to get address information
 */
export const reverseGeocode = async (
  latitude: number, 
  longitude: number
): Promise<DestinationLocation | null> => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key is required for reverse geocoding');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      
      // Extract place name from address components
      const addressComponents = result.address_components || [];
      let placeName = '';
      
      // Try to find a good place name from components
      for (const component of addressComponents) {
        if (component.types.includes('establishment') || 
            component.types.includes('point_of_interest')) {
          placeName = component.long_name;
          break;
        }
      }
      
      // Fallback to locality or sublocality
      if (!placeName) {
        for (const component of addressComponents) {
          if (component.types.includes('locality') || 
              component.types.includes('sublocality')) {
            placeName = component.long_name;
            break;
          }
        }
      }
      
      // Final fallback to first component
      if (!placeName && addressComponents.length > 0) {
        placeName = addressComponents[0].long_name;
      }
      
      return {
        name: placeName || 'Selected Location',
        address: result.formatted_address,
        latitude,
        longitude,
        placeId: result.place_id,
      };
    } else {
      console.error('Reverse geocoding failed:', data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return null;
  }
};

/**
 * Get formatted address from coordinates
 */
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  const location = await reverseGeocode(latitude, longitude);
  return location?.address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};