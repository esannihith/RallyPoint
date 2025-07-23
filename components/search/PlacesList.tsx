import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Clock, Heart, Trash2 } from 'lucide-react-native';
import { SavedPlace } from '@/types';
import { EmptyState } from '@/components/ui';

interface PlacesListProps {
  savedPlaces: SavedPlace[];
  recentSearches: SavedPlace[];
  onPlaceSelect: (place: SavedPlace) => void;
  
  // Optional props for customization
  onSavePlace?: (place: SavedPlace) => void;
  onRemovePlace?: (placeId: string) => void;
  onClearRecentSearches?: () => void;
  onViewMore?: () => void;
  
  // UI customization options
  showHeaders?: boolean;
  showActionButtons?: boolean;
  maxSavedPlaces?: number;
  maxRecentPlaces?: number;
  showMoreHistoryLink?: boolean;
  
  // Empty state customization
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export function PlacesList({
  savedPlaces,
  recentSearches,
  onPlaceSelect,
  onSavePlace,
  onRemovePlace,
  onClearRecentSearches,
  onViewMore,
  showHeaders = true,
  showActionButtons = true,
  maxSavedPlaces = -1, // -1 means show all
  maxRecentPlaces = -1, // -1 means show all
  showMoreHistoryLink = false,
  emptyStateTitle = "No saved places yet",
  emptyStateDescription = "Search for places and save your favorites for quick access"
}: PlacesListProps) {
  
  // Filter places based on max counts if specified
  const filteredSavedPlaces = maxSavedPlaces > 0 
    ? savedPlaces.slice(0, maxSavedPlaces) 
    : savedPlaces;
    
  // Filter out recent places that are already in saved places to avoid duplication
  const uniqueRecentPlaces = recentSearches.filter(
    recentPlace => !savedPlaces.some(savedPlace => savedPlace.id === recentPlace.id)
  );
  
  // Apply max count limit if specified
  const filteredRecentPlaces = maxRecentPlaces > 0 
    ? uniqueRecentPlaces.slice(0, maxRecentPlaces) 
    : uniqueRecentPlaces;
  
  // Check if we have more recent searches to show
  const hasMoreRecentPlaces = 
    maxRecentPlaces > 0 && recentSearches.length >= maxRecentPlaces;

  // Check if a place is already saved
  const isPlaceSaved = (placeId: string) => {
    return savedPlaces.some(savedPlace => savedPlace.id === placeId);
  };

  const renderPlaceItem = (place: SavedPlace, type: 'saved' | 'recent') => (
    <View key={place.id} style={styles.placeItemContainer}>
      <TouchableOpacity
        style={styles.placeItem}
        onPress={() => onPlaceSelect(place)}
        activeOpacity={0.7}
      >
        <View style={styles.placeIcon}>
          {type === 'saved' ? (
            <MapPin size={20} color="#8B5CF6" />
          ) : (
            <Clock size={20} color="#6B7280" />
          )}
        </View>
        <View style={styles.placeInfo}>
          <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
          <Text style={styles.placeAddress} numberOfLines={1}>{place.address}</Text>
        </View>
      </TouchableOpacity>
      
      {/* Action buttons */}
      {showActionButtons && (
        <View style={styles.actionButtons}>
          {type === 'recent' && onSavePlace && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onSavePlace(place)}
              activeOpacity={0.7}
            >
              <Heart 
                size={16} 
                color={isPlaceSaved(place.id) ? "#8B5CF6" : "#6B7280"} 
                fill={isPlaceSaved(place.id) ? "#8B5CF6" : "none"} 
              />
            </TouchableOpacity>
          )}
          
          {type === 'saved' && onRemovePlace && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onRemovePlace(place.id)}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (filteredSavedPlaces.length === 0 && filteredRecentPlaces.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title={emptyStateTitle}
        description={emptyStateDescription}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Saved Places */}
      {filteredSavedPlaces.length > 0 && (
        <View style={styles.section}>
          {showHeaders && (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Saved Places</Text>
              {showHeaders && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{savedPlaces.length}</Text>
                </View>
              )}
            </View>
          )}
          {filteredSavedPlaces.map(place => renderPlaceItem(place, 'saved'))}
        </View>
      )}

      {/* Recent Searches */}
      {filteredRecentPlaces.length > 0 && (
        <View style={[
          styles.section, 
          filteredSavedPlaces.length > 0 && styles.sectionGap
        ]}>
          {showHeaders && (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              {onClearRecentSearches && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={onClearRecentSearches}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {filteredRecentPlaces.map(place => renderPlaceItem(place, 'recent'))}
        </View>
      )}

      {/* More from recent history link */}
      {(showMoreHistoryLink && hasMoreRecentPlaces) && (
        <View style={styles.moreSection}>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={onViewMore}
            activeOpacity={0.7}
          >
            <Text style={styles.moreText}>More from recent history</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
  },
  sectionGap: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  placeItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  placeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  placeInfo: {
    flex: 1,
    marginRight: 12,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  placeAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
  },
  moreSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  moreButton: {
    paddingVertical: 8,
  },
  moreText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
});