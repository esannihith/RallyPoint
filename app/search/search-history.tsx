import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock } from 'lucide-react-native';
import { SavedPlace } from '@/types';
import { getRecentSearches, clearRecentSearches, addToRecentSearches } from '@/services/storageService';
import { getPlaceDetails } from '@/services/googleMapsService';
import { useLocationStore } from '@/stores/locationStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';
import { EmptyState } from '@/components/ui';

// Helper function to get readable date labels
const getDateLabel = (timestamp: number): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const date = new Date(timestamp);
  
  if (date >= today) {
    return 'Today';
  } else if (date >= yesterday) {
    return 'Yesterday';
  } else if (date >= lastWeek) {
    return 'This week';
  } else if (date >= lastMonth) {
    return 'This month';
  } else {
    // Format month and year for older dates
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }
};

// Group places by date sections
const groupPlacesByDate = (places: SavedPlace[]) => {
  const groupedPlaces: { [key: string]: SavedPlace[] } = {};
  
  places.forEach(place => {
    if (place.createdAt) {
      const dateLabel = getDateLabel(place.createdAt);
      if (!groupedPlaces[dateLabel]) {
        groupedPlaces[dateLabel] = [];
      }
      groupedPlaces[dateLabel].push(place);
    }
  });
  
  // Sort the groups by recency
  const datePriority = ['Today', 'Yesterday', 'This week', 'This month'];
  
  return Object.keys(groupedPlaces)
    .sort((a, b) => {
      const aIndex = datePriority.indexOf(a);
      const bIndex = datePriority.indexOf(b);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      } else if (aIndex !== -1) {
        return -1;
      } else if (bIndex !== -1) {
        return 1;
      } else {
        // For custom month/year labels
        const aDate = new Date(groupedPlaces[a][0].createdAt || 0);
        const bDate = new Date(groupedPlaces[b][0].createdAt || 0);
        return bDate.getTime() - aDate.getTime(); // Most recent first
      }
    })
    .reduce((result, key) => {
      result[key] = groupedPlaces[key];
      return result;
    }, {} as { [key: string]: SavedPlace[] });
};

export default function SearchHistoryScreen() {
  const [recentSearches, setRecentSearches] = useState<SavedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPlaceDetails, setIsLoadingPlaceDetails] = useState(false);
  const [groupedSearches, setGroupedSearches] = useState<{ [key: string]: SavedPlace[] }>({});
  
  const params = useLocalSearchParams();
  const isDirectionsMode = params.mode === 'directions';
  const inputType = params.inputType as 'from' | 'to' | undefined;
  
  const { setSelectedPlace, setBottomSheetOpen } = useLocationStore();
  const { setFromLocation, setToLocation } = useNavigationStore();
  
  // Android back handler
  useAndroidBackHandler({
    onBackPress: () => {
      handleBack();
      return true; // Prevent default back behavior
    }
  });

  useEffect(() => {
    loadRecentSearches();
  }, []);
  
  const loadRecentSearches = async () => {
    setIsLoading(true);
    try {
      const recent = await getRecentSearches();
      setRecentSearches(recent);
      
      // Group searches by date
      const grouped = groupPlacesByDate(recent);
      setGroupedSearches(grouped);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBack = () => {
    router.back();
  };
  
  const handleClearAll = async () => {
    try {
      await clearRecentSearches();
      await loadRecentSearches();
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };
  
  const handlePlaceSelect = async (place: SavedPlace) => {
    try {
      setIsLoadingPlaceDetails(true);
      
      // Fetch full place details using placeId or coordinates
      let placeDetails = null;
      
      if (place.placeId) {
        // Try to get fresh details from Google using placeId
        placeDetails = await getPlaceDetails(place.placeId);
      }
      
      if (isDirectionsMode && inputType) {
        // Handle directions mode
        const navigationLocation = {
          id: place.id,
          name: place.name,
          address: place.address,
          latitude: place.latitude || placeDetails?.geometry?.location.lat,
          longitude: place.longitude || placeDetails?.geometry?.location.lng,
          placeId: place.placeId,
        };
        
        if (inputType === 'from') {
          setFromLocation(navigationLocation);
        } else {
          setToLocation(navigationLocation);
        }
        
        router.back(); // Go back to directions screen
      } else {
        // Handle regular search mode
        if (placeDetails) {
          // Use fresh API data
          setSelectedPlace(placeDetails);
          setBottomSheetOpen(true);
        } else if (place.latitude && place.longitude) {
          // Use stored coordinates to create place data
          const placeData = {
            place_id: place.id,
            name: place.name,
            formatted_address: place.address,
            geometry: {
              location: {
                lat: place.latitude,
                lng: place.longitude,
              }
            },
          };
          
          setSelectedPlace(placeData);
          setBottomSheetOpen(true);
        } else {
          // Basic fallback
          const placeData = {
            place_id: place.id,
            name: place.name,
            formatted_address: place.address,
            geometry: undefined,
          };
          setSelectedPlace(placeData);
          setBottomSheetOpen(true);
        }
        
        // Update recent searches order
        const recentPlace: SavedPlace = {
          ...place,
          type: 'recent',
          createdAt: Date.now(),
        };
        await addToRecentSearches(recentPlace);
        
        router.back(); // Go back to search screen
      }
    } catch (error) {
      console.error('Error selecting place:', error);
      router.back();
    } finally {
      setIsLoadingPlaceDetails(false);
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recent Searches</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </SafeAreaView>
    );
  }
  
  if (recentSearches.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recent Searches</Text>
          <View style={styles.headerSpacer} />
        </View>
        <EmptyState
          icon={Clock}
          title="No recent searches"
          description="Your search history will appear here"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recent Searches</Text>
        <TouchableOpacity
          onPress={handleClearAll}
          activeOpacity={0.7}
          style={styles.clearAllButton}
        >
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {Object.entries(groupedSearches).map(([dateLabel, places]) => (
          <View key={dateLabel} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{dateLabel}</Text>
            </View>
            {places.map(place => (
              <TouchableOpacity
                key={place.id}
                style={styles.placeItem}
                onPress={() => handlePlaceSelect(place)}
                activeOpacity={0.7}
              >
                <View style={styles.placeIcon}>
                  <Clock size={20} color="#6B7280" />
                </View>
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                  <Text style={styles.placeAddress} numberOfLines={1}>{place.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Loading overlay for place details */}
      {isLoadingPlaceDetails && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingDetailsContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingDetailsText}>Loading place details...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 60,
  },
  clearAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearAllText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  bottomSpacing: {
    height: 32,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDetailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  loadingDetailsText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginTop: 12,
  },
});
