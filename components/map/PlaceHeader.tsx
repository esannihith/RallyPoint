import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X, Heart } from 'lucide-react-native';
import { PlaceResult, SavedPlace } from '@/types';
import { savePlaceToStorage, removeSavedPlace, getSavedPlaces } from '@/services/storageService';

interface PlaceHeaderProps {
  place: PlaceResult;
  onClose: () => void;
}

export function PlaceHeader({ place, onClose }: PlaceHeaderProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkIfSaved = useCallback(async () => {
    try {
      const savedPlaces = await getSavedPlaces();
      const isPlaceSaved = savedPlaces.some(savedPlace => savedPlace.id === place.place_id);
      setIsSaved(isPlaceSaved);
    } catch (error) {
      console.error('Error checking if place is saved:', error);
    }
  }, [place.place_id]);

  // Check if place is already saved when component mounts
  useEffect(() => {
    checkIfSaved();
  }, [checkIfSaved]);

  const handleSaveToggle = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (isSaved) {
        // Remove from saved places
        await removeSavedPlace(place.place_id);
        setIsSaved(false);
      } else {
        // Save the place
        const savedPlace: SavedPlace = {
          id: place.place_id,
          name: place.name || 'Unknown Place',
          address: place.formatted_address || place.vicinity || 'Address not available',
          type: 'saved',
          latitude: place.geometry?.location?.lat,
          longitude: place.geometry?.location?.lng,
          placeId: place.place_id,
          createdAt: Date.now(),
        };
        
        await savePlaceToStorage(savedPlace);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.placeName} numberOfLines={1}>
          {place.name}
        </Text>
        
        {/* Rating and Category - Only show in expanded views */}
        {place.rating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>⭐ {place.rating.toFixed(1)}</Text>
            {place.user_ratings_total && (
              <Text style={styles.ratingsCount}>
                ({place.user_ratings_total.toLocaleString()})
              </Text>
            )}
            {place.types && place.types.length > 0 && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.categoryText}>
                  {formatPlaceType(place.types[0])}
                </Text>
              </>
            )}
          </View>
        )}
      </View>
      
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isSaved && styles.savedButton,
            isLoading && styles.loadingButton
          ]}
          onPress={handleSaveToggle}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <Heart 
            size={20} 
            color={isSaved ? "#FFFFFF" : "#8B5CF6"} 
            fill={isSaved ? "#FFFFFF" : "none"}
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <X size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatPlaceType(type: string): string {
  const typeMap: Record<string, string> = {
    'university': 'University',
    'school': 'School',
    'establishment': 'Business',
    'point_of_interest': 'Point of Interest',
    'restaurant': 'Restaurant',
    'store': 'Store',
    'hospital': 'Hospital',
    'park': 'Park',
  };
  
  return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingTop: 4,
  },
  headerContent: {
    flex: 1,
    marginRight: 16,
  },
  placeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 24,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 6,
  },
  ratingsCount: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 6,
  },
  separator: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  savedButton: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  loadingButton: {
    opacity: 0.6,
  },
});